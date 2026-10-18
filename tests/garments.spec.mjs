import { test, expect } from '@playwright/test'
import { requestBody, pngFile } from './multipart.mjs'

const categoryId = '11111111-1111-4111-8111-111111111111'
const hoodieId = '66666666-6666-4666-8666-666666666666'
const newId = '77777777-7777-4777-8777-777777777777'
const category = { id: categoryId, name: 'Hoodies', builderType: 'APPAREL', options: [] }
const variant = (size, colorName, colorValue, stock, extra = {}) => ({
  id: `${size}-${colorValue}`,
  size,
  colorName,
  colorValue,
  sku: null,
  stock,
  price: null,
  isActive: true,
  sortOrder: 0,
  ...extra,
})
const hoodie = {
  id: hoodieId,
  categoryId,
  name: 'Classic Hoodie',
  description: 'Heavy cotton',
  basePrice: 3500,
  silhouette: 'HOODIE',
  isActive: true,
  sortOrder: 1,
  imageUrl: null,
  frontImageUrl: null,
  backImageUrl: null,
  frontPrintArea: { x: 0.3, y: 0.28, width: 0.4, height: 0.42, widthCm: 30, heightCm: 40 },
  backPrintArea: null,
  variants: [
    variant('S', 'Red', '#C0392B', 5),
    variant('M', 'Red', '#C0392B', 0),
    variant('S', 'White', '#FFFFFF', 3, { isActive: false }),
  ],
}
const fulfill = (route, body, status = 200) =>
  route.fulfill({
    status,
    contentType: 'application/json',
    body: status === 204 ? '' : JSON.stringify(body),
  })
const drawer = (page) => page.getByRole('dialog')

async function setup(page, overrides = {}) {
  const state = {
    garments: [structuredClone(hoodie), { ...structuredClone(hoodie), id: 'tee', name: 'Basic Tee', isActive: false, sortOrder: 2, basePrice: 1999, variants: [] }],
    requests: [],
    failToggle: false,
    deleteConflict: false,
    variantError: null,
    ...overrides,
  }
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
  await page.route('http://localhost:3000/api/v1/**', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const path = url.pathname.replace('/api/v1', '')
    const method = request.method()
    const multipart = /^multipart/.test(request.headers()['content-type'] || '')
    const body = multipart ? await requestBody(request) : request.postDataJSON()
    state.requests.push({ path, method, body, query: Object.fromEntries(url.searchParams), multipart })
    expect(request.headers().authorization).toBe(`Bearer ${token}`)
    if (path === '/auth/me')
      return fulfill(route, { id: 'admin', firstName: 'Alex', lastName: 'Morgan', role: 'ADMIN' })
    if (path === `/categories/${categoryId}`) return fulfill(route, category)
    if (path === '/garments' && method === 'GET') {
      expect(url.searchParams.get('categoryId')).toBe(categoryId)
      return fulfill(route, state.garments)
    }
    if (path === '/garments' && method === 'POST') {
      const created = { ...hoodie, ...body, id: newId, variants: [], frontImageUrl: 'https://example.com/front.png' }
      delete created.frontImage
      delete created.image
      delete created.backImage
      state.garments.push(created)
      return fulfill(route, created, 201)
    }
    const [, , id, action] = path.split('/')
    const garment = state.garments.find((item) => item.id === id)
    if (!garment) return fulfill(route, { message: 'Garment not found' }, 404)
    if (action === 'variants' && method === 'PUT') {
      if (state.variantError) return fulfill(route, { message: state.variantError }, 400)
      garment.variants = body.variants.map((row, index) => ({ id: `v${index}`, ...row }))
      return fulfill(route, garment)
    }
    if (method === 'GET') return fulfill(route, garment)
    if (method === 'PATCH') {
      if (state.failToggle) return fulfill(route, { message: 'Garment is locked' }, 503)
      Object.assign(garment, body)
      return fulfill(route, garment)
    }
    if (method === 'DELETE') {
      if (state.deleteConflict)
        return fulfill(route, { message: 'Customers have designs on this garment' }, 409)
      state.garments = state.garments.filter((item) => item.id !== id)
      return fulfill(route, null, 204)
    }
    return fulfill(route, { message: 'Unexpected endpoint' }, 404)
  })
  return state
}

test('garment table lists inactive garments with euro prices, variants and stock', async ({ page }) => {
  await setup(page)
  await page.goto(`/#/categories/${categoryId}/garments`)
  await expect(page.getByRole('heading', { name: 'Garments', exact: true })).toBeVisible()
  const hoodieRow = page.getByRole('row').filter({ hasText: 'Classic Hoodie' })
  await expect(hoodieRow).toContainText('€35.00')
  await expect(hoodieRow).toContainText('2 of 3 active')
  // Total stock counts active variants only.
  await expect(hoodieRow.getByRole('cell').nth(4)).toHaveText('5')
  const teeRow = page.getByRole('row').filter({ hasText: 'Basic Tee' })
  await expect(teeRow).toContainText('€19.99')
  await expect(teeRow.getByRole('checkbox', { name: 'Basic Tee active' })).not.toBeChecked()
})

test('active toggle is optimistic and rolls back when the API refuses', async ({ page }) => {
  const state = await setup(page, { failToggle: true })
  await page.goto(`/#/categories/${categoryId}/garments`)
  const toggle = page.getByRole('checkbox', { name: 'Classic Hoodie active' })
  await expect(toggle).toBeChecked()
  await toggle.click()
  await expect(page.getByText('Garment is locked')).toBeVisible()
  await expect(toggle).toBeChecked()
  expect(state.requests.find((r) => r.method === 'PATCH').body).toEqual({ isActive: false })
  state.failToggle = false
  await toggle.click()
  await expect(toggle).not.toBeChecked()
  await expect(page.getByText('Classic Hoodie deactivated.')).toBeVisible()
})

test('creating a garment uploads mockups and print areas, then saves the whole variant matrix', async ({
  page,
}) => {
  const state = await setup(page, { garments: [] })
  await page.goto(`/#/categories/${categoryId}/garments`)
  await expect(page.getByText('No garments yet')).toBeVisible()
  await page.getByRole('button', { name: 'New garment' }).click()
  await drawer(page).getByLabel('Name', { exact: true }).fill('Zip Hoodie')
  await drawer(page).getByLabel('Base price (€)').fill('35')
  await drawer(page).getByLabel('Front mockup').setInputFiles(pngFile)
  // Numeric edits are clamped so the area never leaves the mockup.
  await drawer(page).locator('#print-front-width').fill('90')
  await expect(drawer(page).locator('#print-front-x')).toHaveValue('10')
  await drawer(page).getByLabel('Define back print area').uncheck()

  await drawer(page).getByRole('button', { name: '+ S', exact: true }).click()
  await drawer(page).getByRole('button', { name: '+ M', exact: true }).click()
  await drawer(page).getByRole('button', { name: 'Move M left' }).click()
  await drawer(page).getByRole('button', { name: '+ Add colour' }).click()
  await drawer(page).getByLabel('Colour 1 name').fill('Red')
  await drawer(page).getByLabel('Hex value').fill('#C0392B')
  await drawer(page).getByRole('button', { name: 'Generate all combinations' }).click()
  await drawer(page).getByLabel('Stock', { exact: true }).fill('10')
  await drawer(page).getByRole('button', { name: 'Set stock' }).click()
  await drawer(page).getByLabel('Red S stock').fill('2')
  await expect(drawer(page).locator('.hm-variant-cell.is-low')).toHaveCount(1)
  await drawer(page).getByLabel('Red M price override in euros').fill('39.5')
  await drawer(page).getByRole('button', { name: 'Generate SKUs' }).click()
  await expect(drawer(page).getByLabel('Red M SKU')).toHaveValue('ZIPH-RED-M')
  await drawer(page).getByRole('button', { name: 'Save garment' }).click()
  await expect(drawer(page)).toHaveCount(0)

  const post = state.requests.find((r) => r.method === 'POST')
  expect(post.multipart).toBe(true)
  expect(post.body).toMatchObject({
    categoryId,
    name: 'Zip Hoodie',
    basePrice: 3500,
    silhouette: 'HOODIE',
    isActive: true,
    sortOrder: 0,
    frontPrintArea: { x: 0.1, y: 0.28, width: 0.9, height: 0.42, widthCm: 30, heightCm: 40 },
    backPrintArea: null,
    frontImage: { name: pngFile.name, type: pngFile.mimeType },
  })
  expect(post.body).not.toHaveProperty('description')
  const put = state.requests.find((r) => r.method === 'PUT')
  expect(put.path).toBe(`/garments/${newId}/variants`)
  expect(put.body.variants).toEqual([
    { size: 'M', colorName: 'Red', colorValue: '#C0392B', sku: 'ZIPH-RED-M', stock: 10, price: 3950, isActive: true, sortOrder: 0 },
    { size: 'S', colorName: 'Red', colorValue: '#C0392B', sku: 'ZIPH-RED-S', stock: 2, price: null, isActive: true, sortOrder: 1 },
  ])
  await expect(page.getByRole('row').filter({ hasText: 'Zip Hoodie' })).toContainText('12')
})

test('matrix validation blocks duplicate SKUs and shows backend 400s inline', async ({ page }) => {
  const state = await setup(page, { variantError: 'Variant SKUs must be unique' })
  await page.goto(`/#/categories/${categoryId}/garments`)
  await page.getByRole('button', { name: 'Edit Classic Hoodie' }).click()
  await expect(drawer(page).getByLabel('Red S stock')).toHaveValue('5')
  await expect(drawer(page).locator('.hm-variant-cell.is-sold-out')).toHaveCount(1)
  await drawer(page).getByLabel('Red S SKU').fill('HOOD-1')
  await drawer(page).getByLabel('Red M SKU').fill('HOOD-1')
  await drawer(page).getByRole('button', { name: 'Save garment' }).click()
  await expect(drawer(page).getByRole('alert')).toContainText('SKU HOOD-1 is used by both')
  expect(state.requests.some((r) => r.method === 'PUT')).toBe(false)
  await drawer(page).getByLabel('Red M SKU').fill('HOOD-2')
  await drawer(page).getByRole('button', { name: 'Save garment' }).click()
  await expect(drawer(page).getByRole('alert')).toContainText(
    'variants were not saved: Variant SKUs must be unique',
  )
  // Details were untouched, so only the matrix was sent.
  expect(state.requests.some((r) => r.method === 'PATCH')).toBe(false)
  await expect(drawer(page)).toBeVisible()
})

test('removing a saved size warns that used variants are deactivated', async ({ page }) => {
  const state = await setup(page)
  await page.goto(`/#/categories/${categoryId}/garments`)
  await page.getByRole('button', { name: 'Edit Classic Hoodie' }).click()
  let message = ''
  page.once('dialog', (confirmation) => {
    message = confirmation.message()
    confirmation.accept()
  })
  await drawer(page).getByRole('button', { name: 'Remove size M' }).click()
  expect(message).toContain('will be deactivated instead of deleted')
  await drawer(page).getByRole('button', { name: 'Save garment' }).click()
  await expect(drawer(page)).toHaveCount(0)
  expect(state.requests.find((r) => r.method === 'PUT').body.variants.map((v) => `${v.colorName}/${v.size}`)).toEqual([
    'Red/S',
    'White/S',
  ])
})

test('print area can be dragged and resized but never leaves the mockup', async ({ page }) => {
  const state = await setup(page)
  await page.goto(`/#/categories/${categoryId}/garments`)
  await page.getByRole('button', { name: 'Edit Classic Hoodie' }).click()
  const area = drawer(page).getByRole('slider', { name: /front print area/ })
  await area.scrollIntoViewIfNeeded()
  const box = await area.boundingBox()
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + 2000, box.y + 2000, { steps: 4 })
  await page.mouse.up()
  await expect(drawer(page).locator('#print-front-x')).toHaveValue('60')
  await expect(drawer(page).locator('#print-front-y')).toHaveValue('58')
  await area.focus()
  await page.keyboard.press('ArrowLeft')
  await expect(drawer(page).locator('#print-front-x')).toHaveValue('59')
  await page.keyboard.press('Shift+ArrowRight')
  await expect(drawer(page).locator('#print-front-width')).toHaveValue('41')
  await drawer(page).getByRole('button', { name: 'Save garment' }).click()
  await expect(drawer(page)).toHaveCount(0)
  const patch = state.requests.find((r) => r.method === 'PATCH')
  expect(patch.multipart).toBe(false)
  expect(patch.body.frontPrintArea).toEqual({ x: 0.59, y: 0.58, width: 0.41, height: 0.42, widthCm: 30, heightCm: 40 })
  expect(patch.body.backPrintArea).toBeNull()
})

test('delete conflict explains why and offers deactivation', async ({ page }) => {
  const state = await setup(page, { deleteConflict: true })
  await page.goto(`/#/categories/${categoryId}/garments`)
  await page.getByRole('button', { name: 'Delete Classic Hoodie' }).click()
  await drawer(page).getByRole('button', { name: 'Delete garment' }).click()
  await expect(drawer(page).getByRole('alert')).toContainText('Deactivate it instead')
  await drawer(page).getByRole('button', { name: 'Deactivate' }).click()
  await expect(drawer(page)).toHaveCount(0)
  expect(state.requests.filter((r) => r.method === 'PATCH').at(-1).body).toEqual({ isActive: false })
  await expect(page.getByRole('checkbox', { name: 'Classic Hoodie active' })).not.toBeChecked()
  await expect(page.getByRole('row').filter({ hasText: 'Classic Hoodie' })).toHaveCount(1)
})

test('garments page and drawer fit a phone viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await setup(page)
  await page.goto(`/#/categories/${categoryId}/garments`)
  await page.getByRole('button', { name: 'Edit Classic Hoodie' }).click()
  await expect(drawer(page).getByLabel('Red S stock')).toBeVisible()
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBeLessThanOrEqual(0)
})

test('the back side reuses the front mockup unless a separate back mockup is added', async ({
  page,
}) => {
  const state = await setup(page, { garments: [] })
  await page.goto(`/#/categories/${categoryId}/garments`)
  await page.getByRole('button', { name: 'New garment' }).click()
  await drawer(page).getByLabel('Name', { exact: true }).fill('Tee')
  await drawer(page).getByLabel('Base price (€)').fill('20')
  await expect(drawer(page).getByLabel('Back mockup', { exact: true })).toHaveCount(0)
  await drawer(page).getByLabel('Front mockup').setInputFiles(pngFile)
  const front = await drawer(page).getByRole('img', { name: 'front mockup', exact: true }).getAttribute('src')
  expect(front).toMatch(/^blob:/)
  await expect(drawer(page).getByRole('img', { name: 'back mockup', exact: true })).toHaveAttribute('src', front)
  await drawer(page).getByLabel('Use a different back mockup').check()
  await drawer(page).getByLabel('Back mockup', { exact: true }).setInputFiles({ ...pngFile, name: 'back.png' })
  await expect(drawer(page).getByRole('img', { name: 'back mockup', exact: true })).not.toHaveAttribute('src', front)
  // Turning it off again drops the selected back file.
  await drawer(page).getByLabel('Use a different back mockup').uncheck()
  await drawer(page).getByRole('button', { name: 'Save garment' }).click()
  await expect(drawer(page)).toHaveCount(0)
  const post = state.requests.find((r) => r.method === 'POST').body
  expect(post.frontImage).toMatchObject({ name: pngFile.name })
  expect(post).not.toHaveProperty('backImage')
})
