import { deflateSync } from 'node:zlib'
import { test, expect } from '@playwright/test'
import { requestBody } from './multipart.mjs'

/*
 * The phone case template editor: drag / resize / type the printable area and camera, set
 * corners, bleed and the safe area, and preview test artwork that is never saved.
 */

/** A plain RGBA PNG (w × h), so the template has a real 1:2 shape. */
function png(w, h) {
  const table = Array.from({ length: 256 }, (_, n) => {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    return c >>> 0
  })
  const crc = (buf) => {
    let c = 0xffffffff
    for (const b of buf) c = table[(c ^ b) & 0xff] ^ (c >>> 8)
    return (c ^ 0xffffffff) >>> 0
  }
  const chunk = (type, data) => {
    const len = Buffer.alloc(4)
    len.writeUInt32BE(data.length)
    const body = Buffer.concat([Buffer.from(type), data])
    const sum = Buffer.alloc(4)
    sum.writeUInt32BE(crc(body))
    return Buffer.concat([len, body, sum])
  }
  const raw = Buffer.alloc((w * 4 + 1) * h, 0xee)
  for (let y = 0; y < h; y++) raw[y * (w * 4 + 1)] = 0
  const head = Buffer.alloc(13)
  head.writeUInt32BE(w, 0)
  head.writeUInt32BE(h, 4)
  head.set([8, 6, 0, 0, 0], 8)
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', head),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}
const TEMPLATE = png(200, 400)

const caseCategory = {
  id: 'c1111111-1111-4111-8111-111111111111',
  name: 'Cases',
  builderType: 'CASE',
}
const admin = { id: 'admin', firstName: 'Alex', lastName: 'Morgan', role: 'ADMIN' }
const LEGACY = {
  front: { x: 0.04, y: 0.02, width: 0.92, height: 0.96, radius: 0.14 },
  camera: { x: 0.1, y: 0.03, width: 0.4, height: 0.15, radius: 0.2 },
}
// Same as legacyPrintable in tests/case-geometry.spec.mjs and the web studio's test.
const LEGACY_PATH =
  'M16.88 4H83.12A12.88 12.88 0 0 1 96 16.88V183.12A12.88 12.88 0 0 1 83.12 196H16.88A12.88 12.88 0 0 1 4 183.12V16.88A12.88 12.88 0 0 1 16.88 4Z'
const phoneModel = {
  id: 'm1111111-1111-4111-8111-111111111111',
  origin: 'COMPANY',
  name: 'iPhone 15',
  categoryId: caseCategory.id,
  deviceBrand: 'APPLE',
  sortOrder: 1,
  imageUrl: 'https://images.example.test/template.png',
  printAreas: LEGACY,
  items: [],
  itemCount: 0,
  price: 1500,
  stock: 5,
  isActive: true,
  createdBy: admin,
  createdAt: '2026-11-01T10:00:00.000Z',
}
const json = (route, body, status = 200) =>
  route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })

async function setup(page) {
  const state = { product: structuredClone(phoneModel), writes: [], requests: [] }
  const token = `header.${Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url')}.signature`
  await page.addInitScript(
    (token) =>
      localStorage.setItem(
        'persist:#VORAE-2',
        JSON.stringify({
          auth: JSON.stringify({ token }),
          _persist: JSON.stringify({ version: -1, rehydrated: true }),
        }),
      ),
    token,
  )
  await page.route('https://images.example.test/**', (route) =>
    route.fulfill({ contentType: 'image/png', body: TEMPLATE }),
  )
  await page.route('http://localhost:3000/api/v1/**', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const path = url.pathname.replace('/api/v1', '')
    const method = request.method()
    state.requests.push({ method, path })
    const decorate = (p) => ({ ...p, category: caseCategory })
    if (path === '/auth/me') return json(route, admin)
    if (path === '/categories') return json(route, [caseCategory])
    if (path === '/products' && method === 'GET') return json(route, [decorate(state.product)])
    if (path === `/products/${phoneModel.id}` && method === 'GET')
      return json(route, decorate(state.product))
    if (path === `/products/${phoneModel.id}` && method === 'PATCH') {
      const body = await requestBody(request)
      state.writes.push(body)
      state.product = { ...state.product, ...body }
      return json(route, decorate(state.product))
    }
    if (method === 'GET') return json(route, [])
    return json(route, { message: 'Unexpected request' }, 404)
  })
  return state
}

const dialog = (page) => page.getByRole('dialog')
async function openEditor(page) {
  const state = await setup(page)
  await page.goto(`/#/products?categoryId=${caseCategory.id}`)
  await page.getByRole('button', { name: `Edit ${phoneModel.name}`, exact: true }).click()
  await expect(dialog(page).getByText('Case template', { exact: true })).toBeVisible()
  const mockup = dialog(page).locator('.hm-case-mockup .hm-mockup')
  await expect(mockup.locator('img').first()).toBeVisible()
  // The template's real 1:2 shape is known once it has loaded.
  await expect(mockup.locator('[data-guide="printable"]')).toHaveAttribute('d', LEGACY_PATH)
  await mockup.scrollIntoViewIfNeeded()
  return { state, mockup }
}
const save = async (page) => {
  await dialog(page).getByRole('button', { name: 'Save Product', exact: true }).click()
  await expect(dialog(page)).toHaveCount(0)
}
const value = (page, label) => dialog(page).getByLabel(label, { exact: true })

test('an existing single-radius template opens unchanged and saves exactly as it was', async ({
  page,
}) => {
  const { state } = await openEditor(page)
  await expect(dialog(page).getByLabel('Same radius for all corners')).toBeChecked()
  await expect(value(page, 'Corner radius (% of width)')).toHaveValue('14')
  await expect(value(page, 'Bleed (% of width)')).toHaveValue('0')
  await save(page)
  expect(state.writes[0].printAreas).toEqual(LEGACY)
})

test('dragging and resizing the printable area updates its percentages, and typing moves the outline', async ({
  page,
}) => {
  const { mockup } = await openEditor(page)
  const box = await mockup.locator('img').first().boundingBox()
  const area = dialog(page).getByRole('slider', { name: /printable print area/ })
  const start = await area.boundingBox()
  // Drag by 10% of the width and 5% of the height.
  await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2)
  await page.mouse.down()
  await page.mouse.move(
    start.x + start.width / 2 - box.width * 0.02,
    start.y + start.height / 2 + box.height * 0.01,
    { steps: 5 },
  )
  await page.mouse.up()
  expect(Number(await value(page, 'X (%)').inputValue())).toBeCloseTo(2, 0)
  expect(Number(await value(page, 'Y (%)').inputValue())).toBeCloseTo(3, 0)

  // Resize from the bottom-right handle: the size changes, the top-left corner stays.
  const handle = area.locator('.hm-print-handle-se')
  const h = await handle.boundingBox()
  await page.mouse.move(h.x + h.width / 2, h.y + h.height / 2)
  await page.mouse.down()
  await page.mouse.move(
    h.x + h.width / 2 - box.width * 0.1,
    h.y + h.height / 2 - box.height * 0.1,
    { steps: 5 },
  )
  await page.mouse.up()
  expect(Number(await value(page, 'Width (%)').inputValue())).toBeCloseTo(82, 0)
  expect(Number(await value(page, 'Height (%)').inputValue())).toBeCloseTo(86, 0)
  expect(Number(await value(page, 'X (%)').inputValue())).toBeCloseTo(2, 0)

  // Numbers drive the preview immediately.
  await value(page, 'X (%)').fill('10')
  await value(page, 'Y (%)').fill('5')
  const moved = await area.boundingBox()
  expect((moved.x - box.x) / box.width).toBeCloseTo(0.1, 2)
  expect((moved.y - box.y) / box.height).toBeCloseTo(0.05, 2)
  // The outline follows (template units: 100 wide).
  const guide = await mockup.locator('[data-guide="printable"]').evaluate((p) => p.getBBox().x)
  expect(guide / 100).toBeCloseTo(0.1, 3)
})

test('advanced corners, bleed and a uniform safe area are drawn and saved', async ({ page }) => {
  const { state, mockup } = await openEditor(page)
  await dialog(page).getByLabel('Same radius for all corners').uncheck()
  await expect(value(page, 'Top left (%)')).toHaveValue('14')
  await value(page, 'Bottom left (%)').fill('6')
  await value(page, 'Bottom right (%)').fill('6')
  // Bottom corners: 6% of the 92-wide area = 5.52 units, top corners stay 12.88.
  await expect(mockup.locator('[data-guide="printable"]')).toHaveAttribute(
    'd',
    'M16.88 4H83.12A12.88 12.88 0 0 1 96 16.88V190.48A5.52 5.52 0 0 1 90.48 196H9.52A5.52 5.52 0 0 1 4 190.48V16.88A12.88 12.88 0 0 1 16.88 4Z',
  )
  await value(page, 'Bleed (% of width)').fill('3')
  await expect(mockup.locator('[data-guide="bleed"]')).toHaveCount(1)
  await dialog(page).getByRole('button', { name: 'Safe area', exact: true }).click()
  await dialog(page).getByLabel('Show a safe area to customers').check()
  await value(page, 'Inset (%)').fill('5')
  await expect(mockup.locator('[data-guide="safe"]')).toHaveCount(1)
  await expect(dialog(page).getByRole('list', { name: 'Preview legend' })).toContainText(
    'Safe area',
  )
  await save(page)
  expect(state.writes[0].printAreas.front).toEqual({
    ...LEGACY.front,
    radius: 0.14,
    radii: { tl: 0.14, tr: 0.14, br: 0.06, bl: 0.06 },
    bleed: 0.03,
    safe: { top: 0.05, right: 0.05, bottom: 0.05, left: 0.05 },
  })
  expect(state.writes[0].printAreas.camera).toEqual(LEGACY.camera)
})

test('the camera outline sits on its saved percentages and can be dragged over the camera', async ({
  page,
}) => {
  const { state, mockup } = await openEditor(page)
  await dialog(page).getByRole('button', { name: 'Camera opening', exact: true }).click()
  await mockup.scrollIntoViewIfNeeded()
  const box = await mockup.locator('img').first().boundingBox()
  const camera = dialog(page).getByRole('slider', { name: /camera print area/ })
  const at = await camera.boundingBox()
  expect((at.x - box.x) / box.width).toBeCloseTo(LEGACY.camera.x, 2)
  expect((at.y - box.y) / box.height).toBeCloseTo(LEGACY.camera.y, 2)
  expect(at.width / box.width).toBeCloseTo(LEGACY.camera.width, 2)
  expect(at.height / box.height).toBeCloseTo(LEGACY.camera.height, 2)
  // Its outline: template units, 100 wide and 200 high; the SVG covers the template exactly.
  const guide = await mockup.locator('[data-guide="camera"]').evaluate((p) => {
    const b = p.getBBox()
    return { x: b.x / 100, y: b.y / 200, width: b.width / 100, height: b.height / 200 }
  })
  for (const key of ['x', 'y', 'width', 'height'])
    expect(guide[key]).toBeCloseTo(LEGACY.camera[key], 4)
  const svg = await mockup.getByTestId('case-guides').boundingBox()
  expect(svg).toEqual(box)

  await page.mouse.move(at.x + at.width / 2, at.y + at.height / 2)
  await page.mouse.down()
  await page.mouse.move(
    at.x + at.width / 2 + box.width * 0.1,
    at.y + at.height / 2 + box.height * 0.02,
    { steps: 5 },
  )
  await page.mouse.up()
  // A whole-pixel mouse can land a tenth of a percent off.
  expect(Number(await value(page, 'X (%)').inputValue())).toBeCloseTo(20, 0)
  expect(Number(await value(page, 'Y (%)').inputValue())).toBeCloseTo(5, 0)
  await dialog(page).getByLabel('Same radius for all corners').uncheck()
  await value(page, 'Top left (%)').fill('30')
  await save(page)
  const saved = state.writes[0].printAreas.camera
  expect(saved.x).toBeCloseTo(0.2, 2)
  expect(saved.y).toBeCloseTo(0.05, 2)
  expect(saved).toMatchObject({
    width: 0.4,
    height: 0.15,
    radius: 0.3,
    radii: { tl: 0.3, tr: 0.2, br: 0.2, bl: 0.2 },
  })
})

test('test artwork previews the clipping but is never saved or uploaded', async ({ page }) => {
  const { state, mockup } = await openEditor(page)
  await expect(mockup.getByTestId('case-test-artwork')).toHaveCount(0)
  await dialog(page).getByRole('button', { name: 'Test artwork', exact: true }).click()
  const artwork = mockup.getByTestId('case-test-artwork')
  await expect(artwork).toBeVisible()
  await expect(artwork.getByText('5', { exact: true }).first()).toBeAttached()
  // The camera is cut out of the pattern and it sits under the template's overlay.
  await expect(artwork.locator('clipPath')).toHaveCount(3)
  await save(page)
  const body = state.writes[0]
  expect(Object.keys(body).sort()).toEqual(
    [
      'categoryId',
      'name',
      'description',
      'price',
      'isActive',
      'stock',
      'sizes',
      'sortOrder',
      'deviceBrand',
      'printAreas',
    ].sort(),
  )
  expect(body.printAreas).toEqual(LEGACY)
  expect(state.requests.filter((r) => r.method !== 'GET')).toEqual([
    { method: 'PATCH', path: `/products/${phoneModel.id}` },
  ])
})

test('a camera opening away from the printable area is caught before saving', async ({ page }) => {
  const { state } = await openEditor(page)
  await value(page, 'Width (%)').fill('40')
  await value(page, 'X (%)').fill('55')
  await save(page).catch(() => {})
  await expect(
    dialog(page).getByText('Place the camera opening over the printable area'),
  ).toBeVisible()
  expect(state.writes).toHaveLength(0)
})
