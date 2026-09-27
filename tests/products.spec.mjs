import { test, expect } from '@playwright/test'
import { requestBody, pngFile } from './multipart.mjs'

const cat1 = '11111111-1111-4111-8111-111111111111'
const cat2 = '22222222-2222-4222-8222-222222222222'
const sub1 = '33333333-3333-4333-8333-333333333333'
const sub2 = '44444444-4444-4444-8444-444444444444'
const productId = '55555555-5555-4555-8555-555555555555'
const admin = {
  id: 'admin',
  firstName: 'Alex',
  lastName: 'Morgan',
  role: 'ADMIN',
  email: 'admin@example.test',
}
const categories = [
  { id: cat1, name: 'Necklaces' },
  { id: cat2, name: 'Bracelets' },
]
const subs = {
  [cat1]: [
    {
      id: sub1,
      categoryId: cat1,
      name: 'Pendants',
      isActive: true,
      price: 75,
      stock: 50,
      color: 'Gold',
      type: 'Bead',
      imageUrl: 'https://images.example.test/bead.png',
    },
  ],
  [cat2]: [
    {
      id: sub2,
      categoryId: cat2,
      name: 'Beads',
      isActive: true,
      price: 250,
      stock: 2,
      color: 'Red',
      type: 'Bead',
      imageUrl: 'https://images.example.test/bead.png',
    },
  ],
}
const product = {
  id: productId,
  name: 'Pearl necklace',
  description: 'Handmade pearl necklace',
  imageUrl: 'https://images.example.test/pearl.png',
  designPreviewUrl: 'https://images.example.test/design.png',
  categoryId: cat1,
  items: [{ subCategoryId: sub1, quantity: 20, position: 0, unitPrice: 75 }],
  itemCount: 20,
  price: 1500,
  isActive: true,
}
const fulfill = (route, body, status = 200) =>
  route.fulfill({
    status,
    contentType: 'application/json',
    body: status === 204 ? '' : JSON.stringify(body),
  })
const dialog = (page) => page.getByRole('dialog')

async function setup(page, overrides = {}) {
  const state = {
    products: [{ ...product }],
    role: 'ADMIN',
    requests: [],
    failList: false,
    failDetails: false,
    failSubs: false,
    writeStatus: 200,
    emptySubs: false,
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
  await page.route('https://images.example.test/**', (route) =>
    route.fulfill({
      contentType: 'image/png',
      body: Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1sAAAAASUVORK5CYII=',
        'base64',
      ),
    }),
  )
  await page.route('http://localhost:3000/api/v1/**', async (route) => {
    const request = route.request()
    const path = new URL(request.url()).pathname.replace('/api/v1', '')
    const method = request.method()
    state.requests.push({
      path,
      method,
      body: await requestBody(request),
      authorization: request.headers().authorization,
    })
    expect(request.headers().authorization).toBe(`Bearer ${token}`)
    if (path === '/auth/me') return fulfill(route, { ...admin, role: state.role })
    if (path === '/categories') return fulfill(route, categories)
    if (/^\/categories\/[^/]+\/sub-categories$/.test(path))
      return state.failSubs
        ? fulfill(route, { message: 'Subcategories unavailable' }, 503)
        : fulfill(route, state.emptySubs ? [] : subs[path.split('/')[2]])
    const decorate = (record) => ({
      ...record,
      category: categories.find((category) => category.id === record.categoryId),
      items: record.items.map((item) => ({
        ...item,
        subCategory: Object.values(subs)
          .flat()
          .find((sub) => sub.id === item.subCategoryId),
      })),
      createdBy: admin,
    })
    if (path === '/products' && method === 'GET')
      return state.failList
        ? fulfill(route, { message: 'Products unavailable' }, 503)
        : fulfill(route, state.products.map(decorate))
    if (path.startsWith('/products/') && method === 'GET') {
      if (state.failDetails) return fulfill(route, { message: 'Product not found' }, 404)
      const record = state.products.find((record) => record.id === path.split('/')[2])
      return record
        ? fulfill(route, decorate(record))
        : fulfill(route, { message: 'Product not found' }, 404)
    }
    if (['POST', 'PATCH', 'DELETE'].includes(method)) {
      if (state.writeStatus !== 200)
        return fulfill(
          route,
          {
            message:
              state.writeStatus === 403
                ? 'Only admins can edit or delete products'
                : state.writeStatus === 409
                  ? 'Ordered products cannot change components'
                  : 'Invalid or expired session',
          },
          state.writeStatus,
        )
      const body = await requestBody(request)
      for (const field of ['price', 'unitPrice', 'itemCount', 'createdById', 'subCategoryId'])
        expect(body?.[field]).toBeUndefined()
      if (body?.items) {
        body.items.forEach((item) =>
          expect(Object.keys(item).sort()).toEqual(
            item.position === undefined
              ? ['quantity', 'subCategoryId']
              : ['position', 'quantity', 'subCategoryId'],
          ),
        )
      }
      const totals = (payload) => {
        const items = payload.items.map((item) => ({
          ...item,
          unitPrice: Object.values(subs)
            .flat()
            .find((sub) => sub.id === item.subCategoryId).price,
        }))
        return {
          items,
          itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
          price: items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
        }
      }
      expect(body?.createdById).toBeUndefined()
      expect(body?.createdBy).toBeUndefined()
      if (method === 'POST') {
        const created = {
          id: '66666666-6666-4666-8666-666666666666',
          ...body,
          ...totals(body),
        }
        state.products.push(created)
        return fulfill(route, decorate(created), 201)
      }
      const id = path.split('/')[2]
      if (method === 'PATCH') {
        state.products = state.products.map((record) =>
          record.id === id ? { ...record, ...body, ...(body.items ? totals(body) : {}) } : record,
        )
        return fulfill(route, decorate(state.products.find((record) => record.id === id)))
      }
      state.products = state.products.filter((record) => record.id !== id)
      return fulfill(route, null, 204)
    }
    return fulfill(route, { message: 'Unexpected request' }, 404)
  })
  return state
}

const choose = async (page, index, name) => {
  await dialog(page).locator('summary').nth(index).click()
  await dialog(page)
    .getByRole('button', { name: new RegExp(name) })
    .click()
}
const fillNew = async (page) => {
  await page.getByRole('button', { name: 'Add Product', exact: true }).click()
  await dialog(page).getByLabel('Name', { exact: true }).fill('Gold bracelet')
  await dialog(page).getByLabel('Category', { exact: true }).selectOption(cat2)
  await dialog(page).getByRole('button', { name: 'Add Component' }).click()
  await choose(page, 0, 'Beads')
  await dialog(page).getByLabel('Quantity 1', { exact: true }).fill('8')
}

test('multiple component CRUD sends complete arrays and displays server totals and saved prices', async ({
  page,
}) => {
  const state = await setup(page)
  await page.goto('/#/products')
  await expect(page.getByRole('columnheader', { name: 'Components', exact: true })).toBeVisible()
  await expect(page.getByRole('row').filter({ hasText: 'Pearl necklace' })).toContainText(
    'Pendants \u00d720',
  )
  await fillNew(page)
  await dialog(page).getByRole('button', { name: 'Add Component' }).click()
  await choose(page, 1, 'Beads')
  await dialog(page).getByLabel('Quantity 2', { exact: true }).fill('2')
  await dialog(page).getByLabel('Position 1', { exact: true }).fill('0')
  await expect(dialog(page).getByRole('status')).toContainText('10 items')
  await expect(dialog(page).getByRole('status')).toContainText('\u20ac25.00')
  await dialog(page).getByRole('button', { name: 'Save Product' }).click()
  await expect(dialog(page)).toHaveCount(0)
  expect(state.requests.find((r) => r.method === 'POST').body).toEqual({
    name: 'Gold bracelet',
    description: '',
    categoryId: cat2,
    isActive: true,
    items: [
      { subCategoryId: sub2, quantity: 8, position: 0 },
      { subCategoryId: sub2, quantity: 2 },
    ],
  })
  await expect(page.getByRole('row').filter({ hasText: 'Gold bracelet' })).toContainText(
    '\u20ac25.00',
  )
  await page.getByRole('button', { name: 'Edit Gold bracelet' }).click()
  await dialog(page).getByRole('button', { name: 'Remove component 1' }).click()
  await dialog(page).getByRole('button', { name: 'Save Product' }).click()
  await expect(dialog(page)).toHaveCount(0)
  expect(state.requests.find((r) => r.method === 'PATCH').body.items).toEqual([
    { subCategoryId: sub2, quantity: 2 },
  ])
  state.products.find((p) => p.name === 'Gold bracelet').items[0].unitPrice = 100
  await page.getByRole('button', { name: 'View Gold bracelet' }).click()
  const row = dialog(page).getByRole('row').filter({ hasText: 'Beads' })
  await expect(row).toContainText('Red')
  await expect(row).toContainText('\u20ac1.00')
  await expect(row).toContainText('\u20ac2.00')
  await expect(row).not.toContainText('\u20ac2.50')
  await dialog(page).getByRole('button', { name: 'Close', exact: true }).last().click()
  await expect(dialog(page)).toHaveCount(0)
  await page.getByRole('button', { name: 'Delete Gold bracelet' }).click()
  await dialog(page).getByRole('button', { name: 'Cancel' }).click()
  expect(state.requests.some((r) => r.method === 'DELETE')).toBe(false)
  await expect(dialog(page)).toHaveCount(0)
  await page.getByRole('button', { name: 'Delete Gold bracelet' }).click()
  await dialog(page).getByRole('button', { name: 'Delete Product', exact: true }).click()
  await expect(dialog(page)).toHaveCount(0)
  await expect(page.getByRole('cell', { name: 'Gold bracelet', exact: true })).toHaveCount(0)
})

test('category resets all rows, ignores late responses and only offers active matching components', async ({
  page,
}) => {
  await setup(page)
  await page.route(`**/api/v1/categories/${cat2}/sub-categories`, (route) =>
    fulfill(route, [
      ...subs[cat2],
      {
        ...subs[cat2][0],
        id: 'inactive',
        name: 'Inactive bead',
        isActive: false,
      },
      { ...subs[cat1][0], name: 'Wrong category' },
    ]),
  )
  await page.goto('/#/products')
  await fillNew(page)
  await dialog(page).locator('summary').click()
  await expect(
    dialog(page).getByRole('button', { name: /Inactive bead|Wrong category/ }),
  ).toHaveCount(0)
  await dialog(page).getByLabel('Category', { exact: true }).selectOption(cat1)
  await expect(dialog(page).locator('summary')).toHaveCount(0)
  await dialog(page).getByRole('button', { name: 'Add Component' }).click()
  await choose(page, 0, 'Pendants')
  await dialog(page).getByLabel('Category', { exact: true }).selectOption('')
  await expect(dialog(page).locator('summary')).toHaveCount(0)
  await expect(dialog(page).getByRole('button', { name: 'Add Component' })).toBeDisabled()
})

test('invalid quantity and position block saving; empty and failed component lists retry', async ({
  page,
}) => {
  const state = await setup(page)
  await page.goto('/#/products')
  await fillNew(page)
  for (const value of ['0', '-1', '1.5']) {
    await dialog(page).getByLabel('Quantity 1').fill(value)
    await dialog(page).getByRole('button', { name: 'Save Product' }).click()
    expect(state.requests.some((r) => r.method === 'POST')).toBe(false)
  }
  await dialog(page).getByLabel('Quantity 1').fill('1')
  await dialog(page).getByLabel('Position 1').fill('-1')
  await dialog(page).getByRole('button', { name: 'Save Product' }).click()
  expect(state.requests.some((r) => r.method === 'POST')).toBe(false)
  state.failSubs = true
  await dialog(page).getByLabel('Category', { exact: true }).selectOption(cat1)
  await expect(dialog(page).getByRole('alert')).toContainText('Subcategories unavailable')
  state.failSubs = false
  state.emptySubs = true
  await dialog(page).getByRole('button', { name: 'Retry subcategories' }).click()
  await expect(dialog(page)).toContainText('no active components')
  await expect(dialog(page).getByRole('button', { name: 'Save Product' })).toBeDisabled()
})

test('metadata updates omit items; ordered design conflict preserves rows with new-design guidance', async ({
  page,
}) => {
  const state = await setup(page)
  await page.goto('/#/products')
  await page.getByRole('button', { name: 'Edit Pearl necklace' }).click()
  await dialog(page).getByLabel('Name', { exact: true }).fill('Renamed')
  await dialog(page).getByRole('button', { name: 'Save Product' }).click()
  await expect(dialog(page)).toHaveCount(0)
  const body = state.requests.find((r) => r.method === 'PATCH').body
  expect(body.items).toBeUndefined()
  expect(body.categoryId).toBeUndefined()
  await page.getByRole('button', { name: 'Edit Renamed' }).click()
  await dialog(page).getByLabel('Quantity 1').fill('30')
  state.writeStatus = 409
  await dialog(page).getByRole('button', { name: 'Save Product' }).click()
  await expect(dialog(page).getByRole('alert')).toContainText(
    'Ordered products cannot change components',
  )
  await expect(dialog(page).getByRole('alert')).toContainText('Create a new design')
  await expect(dialog(page).getByLabel('Quantity 1')).toHaveValue('30')
})

test('CUSTOMER cannot enter Products or issue product requests', async ({ page }) => {
  const state = await setup(page, { role: 'CUSTOMER' })
  await page.goto('/#/products')
  await expect(page.getByRole('alert')).toContainText('Access denied')
  expect(state.requests.some((r) => r.path === '/products')).toBe(false)
})

test('mobile component editor fits viewport with image options and read-only totals', async ({
  page,
}) => {
  await setup(page)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/#/products')
  await fillNew(page)
  await dialog(page).locator('summary').click()
  await expect(dialog(page).getByRole('button', { name: /Beads/ }).getByRole('img')).toBeVisible()
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    .toBe(true)
  await page.screenshot({ path: 'test-results/components-mobile.png' })
})

test('list and detail retry, forbidden writes retain drafts and expired writes return to login', async ({
  page,
}) => {
  const state = await setup(page, { failList: true })
  await page.goto('/#/products')
  await expect(page.getByRole('alert')).toContainText('Products unavailable')
  state.failList = false
  await page.getByRole('button', { name: 'Try again' }).click()
  state.failDetails = true
  await page.getByRole('button', { name: 'Edit Pearl necklace' }).click()
  await expect(dialog(page).getByRole('alert')).toContainText('Product not found')
  state.failDetails = false
  await dialog(page).getByRole('button', { name: 'Try again' }).click()
  await dialog(page).getByLabel('Name', { exact: true }).fill('Preserved draft')
  state.writeStatus = 403
  await dialog(page).getByRole('button', { name: 'Save Product' }).click()
  await expect(dialog(page).getByRole('alert')).toContainText('Only admins')
  await expect(dialog(page).getByLabel('Name', { exact: true })).toHaveValue('Preserved draft')
  state.writeStatus = 401
  await dialog(page).getByRole('button', { name: 'Save Product' }).click()
  await expect(page).toHaveURL(/#\/login$/)
})

test('late category response cannot replace the new component options', async ({ page }) => {
  await setup(page)
  let release
  const held = new Promise((resolve) => {
    release = resolve
  })
  let started
  const requested = new Promise((resolve) => {
    started = resolve
  })
  await page.route(`**/api/v1/categories/${cat1}/sub-categories`, async (route) => {
    started()
    await held
    await fulfill(route, subs[cat1])
  })
  await page.goto('/#/products')
  await page.getByRole('button', { name: 'Add Product' }).click()
  await dialog(page).getByLabel('Category', { exact: true }).selectOption(cat1)
  await requested
  await expect(dialog(page).getByRole('button', { name: 'Add Component' })).toBeDisabled()
  await dialog(page).getByLabel('Category', { exact: true }).selectOption(cat2)
  await dialog(page).getByRole('button', { name: 'Add Component' }).click()
  release()
  await choose(page, 0, 'Beads')
  await expect(dialog(page).locator('summary')).toContainText('Beads')
  await dialog(page).locator('summary').click()
  await expect(dialog(page).getByRole('button', { name: /Pendants/ })).toHaveCount(0)
})

test('product image upload keeps items and supports metadata-only replacement', async ({
  page,
}) => {
  const state = await setup(page)
  await page.goto('/#/products')
  await fillNew(page)
  await dialog(page).getByLabel('Image (optional)').setInputFiles(pngFile)
  await expect(dialog(page).getByRole('img', { name: 'Gold bracelet preview' })).toHaveAttribute(
    'src',
    /^blob:/,
  )
  await dialog(page).getByRole('button', { name: 'Save Product', exact: true }).click()
  await expect(dialog(page)).toHaveCount(0)
  const created = state.requests.find((r) => r.method === 'POST').body
  expect(created.file.name).toBe('bead.png')
  expect(created.items).toEqual([{ subCategoryId: sub2, quantity: 8 }])
  await page.getByRole('button', { name: 'Edit Gold bracelet', exact: true }).click()
  await dialog(page).getByLabel('Image (optional)').setInputFiles(pngFile)
  await dialog(page).getByRole('button', { name: 'Save Product', exact: true }).click()
  await expect(dialog(page)).toHaveCount(0)
  const changed = state.requests.filter((r) => r.method === 'PATCH').at(-1).body
  expect(changed.file.name).toBe('bead.png')
  expect(changed).not.toHaveProperty('items')
  await page.getByRole('button', { name: 'Edit Gold bracelet', exact: true }).click()
  await dialog(page).getByRole('button', { name: 'Save Product', exact: true }).click()
  await expect(dialog(page)).toHaveCount(0)
  expect(state.requests.filter((r) => r.method === 'PATCH').at(-1).body).not.toHaveProperty('file')
})

test('product design is separate from catalog image, contains the whole preview and falls back for null or broken URLs', async ({
  page,
}) => {
  const state = await setup(page)
  await page.goto('/#/products')
  const row = page.getByRole('row').filter({ hasText: 'Pearl necklace' })
  await expect(row.locator('.hm-design-preview img')).toHaveAttribute(
    'src',
    product.designPreviewUrl,
  )
  await expect(row.locator('.hm-product-image img')).toHaveAttribute('src', product.imageUrl)
  await page.getByRole('button', { name: 'View Pearl necklace' }).click()
  await expect(dialog(page).getByRole('heading', { name: 'Customer design' })).toBeVisible()
  const preview = dialog(page).locator('.hm-design-preview-large img')
  await expect(preview).toHaveCSS('object-fit', 'contain')
  await expect(
    dialog(page).getByRole('link', { name: 'Open full-size customer design' }),
  ).toHaveAttribute('href', product.designPreviewUrl)
  await dialog(page).getByRole('button', { name: 'Close', exact: true }).last().click()
  await expect(dialog(page)).toHaveCount(0)
  for (const url of [null, 'https://images.example.test/broken.png']) {
    state.products[0].designPreviewUrl = url
    await page.route('https://images.example.test/broken.png', (route) => route.abort())
    await page.getByRole('button', { name: 'Refresh', exact: true }).click()
    await expect(row.locator('.hm-design-preview img')).toHaveAttribute(
      'src',
      /(?:catalog-placeholder|^data:image\/svg\+xml)/,
    )
    await page.getByRole('button', { name: 'View Pearl necklace' }).click()
    await expect(dialog(page).locator('.hm-design-preview-large img')).toHaveAttribute(
      'src',
      /(?:catalog-placeholder|^data:image\/svg\+xml)/,
    )
    await expect(dialog(page)).toContainText('Design preview unavailable')
    await expect(
      dialog(page).getByRole('link', { name: 'Open full-size customer design' }),
    ).toHaveCount(0)
    await dialog(page).getByRole('button', { name: 'Close', exact: true }).last().click()
    await expect(dialog(page)).toHaveCount(0)
  }
})
