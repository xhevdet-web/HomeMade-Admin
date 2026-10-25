import { test, expect } from '@playwright/test'
import { requestBody, pngFile } from './multipart.mjs'

const cat1 = '11111111-1111-4111-8111-111111111111'
const cat2 = '22222222-2222-4222-8222-222222222222'
const hoodies = '77777777-7777-4777-8777-777777777777'
const sub1 = '33333333-3333-4333-8333-333333333333'
const designId = '55555555-5555-4555-8555-555555555555'
const companyId = '88888888-8888-4888-8888-888888888888'
const hoodieId = '99999999-9999-4999-8999-999999999999'
const admin = {
  id: 'admin',
  firstName: 'Alex',
  lastName: 'Morgan',
  role: 'ADMIN',
  email: 'admin@example.test',
}
const customer = { id: 'customer', firstName: 'Anna', lastName: 'Berisha' }
const categories = [
  { id: cat1, name: 'Necklaces', builderType: 'JEWELRY' },
  { id: cat2, name: 'Bracelets', builderType: 'JEWELRY' },
  { id: hoodies, name: 'Hoodies', builderType: 'APPAREL', builderConfig: { silhouette: 'HOODIE' } },
]
const pendant = {
  id: sub1,
  categoryId: cat1,
  name: 'Pendants',
  price: 75,
  color: 'Gold',
  type: 'Bead',
  imageUrl: 'https://images.example.test/bead.png',
}
// A customer design saved from the app, and two company catalog products.
const design = {
  id: designId,
  origin: 'CUSTOMER',
  name: 'Custom Necklace #123',
  description: 'Made in the studio',
  imageUrl: null,
  designPreviewUrl: 'https://images.example.test/design.png',
  categoryId: cat1,
  items: [{ id: 'item-1', subCategoryId: sub1, quantity: 20, position: 0, unitPrice: 75 }],
  itemCount: 20,
  price: 1500,
  isActive: true,
  createdBy: customer,
  createdAt: '2026-10-20T10:00:00.000Z',
}
const gold = {
  id: companyId,
  origin: 'COMPANY',
  name: 'Gold Necklace',
  imageUrl: 'https://images.example.test/gold.png',
  categoryId: cat1,
  items: [],
  itemCount: 0,
  price: 2500,
  stock: 4,
  isActive: true,
  createdBy: admin,
  createdAt: '2026-10-19T10:00:00.000Z',
}
const blackHoodie = {
  id: hoodieId,
  origin: 'COMPANY',
  name: 'Black Essential Hoodie',
  imageUrl: 'https://images.example.test/hoodie.png',
  categoryId: hoodies,
  color: 'Black',
  colorHex: '#111111',
  sizes: [
    { size: 'S', stock: 20 },
    { size: 'M', stock: 28 },
  ],
  stock: 0,
  printAreas: { front: { x: 0.3, y: 0.28, width: 0.4, height: 0.42, widthCm: 30, heightCm: 40 } },
  items: [],
  itemCount: 0,
  price: 3500,
  isActive: true,
  createdBy: admin,
  createdAt: '2026-10-18T10:00:00.000Z',
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
    products: [{ ...design }, { ...gold }, { ...blackHoodie }],
    role: 'ADMIN',
    requests: [],
    failList: false,
    failDetails: false,
    writeStatus: 200,
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
    route.fulfill({ contentType: 'image/png', body: pngFile.buffer }),
  )
  await page.route('http://localhost:3000/api/v1/**', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const path = url.pathname.replace('/api/v1', '')
    const method = request.method()
    state.requests.push({
      path,
      method,
      query: Object.fromEntries(url.searchParams),
      body: await requestBody(request),
    })
    expect(request.headers().authorization).toBe(`Bearer ${token}`)
    if (path === '/auth/me') return fulfill(route, { ...admin, role: state.role })
    if (path === '/categories') return fulfill(route, categories)
    const decorate = (record) => ({
      ...record,
      category: categories.find((category) => category.id === record.categoryId),
      items: (record.items || []).map((item) => ({ ...item, subCategory: pendant })),
    })
    if (path === '/products' && method === 'GET') {
      if (state.failList) return fulfill(route, { message: 'Products unavailable' }, 503)
      // The API filters by category, origin and search; the page never filters locally.
      const { categoryId, origin, search } = Object.fromEntries(url.searchParams)
      return fulfill(
        route,
        state.products
          .filter((record) => !categoryId || record.categoryId === categoryId)
          .filter((record) => !origin || record.origin === origin)
          .filter((record) => !search || record.name.toLowerCase().includes(search.toLowerCase()))
          .map(decorate),
      )
    }
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
                : 'Invalid or expired session',
          },
          state.writeStatus,
        )
      const body = await requestBody(request)
      for (const field of ['unitPrice', 'itemCount', 'createdById', 'items', 'baseProductId'])
        expect(body?.[field]).toBeUndefined()
      if (body?.file) body.imageUrl = 'https://images.example.test/processed-product.png'
      delete body?.file
      delete body?.backImage
      if (method === 'POST') {
        const created = {
          id: '66666666-6666-4666-8666-666666666666',
          ...body,
          items: [],
          itemCount: 0,
          createdBy: admin,
        }
        state.products.push(created)
        return fulfill(route, decorate(created), 201)
      }
      const id = path.split('/')[2]
      if (method === 'PATCH') {
        state.products = state.products.map((record) =>
          record.id === id ? { ...record, ...body } : record,
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
const productLists = (state) =>
  state.requests.filter((r) => r.path === '/products' && r.method === 'GET').map((r) => r.query)

test('products are organised by category and filtered by the API', async ({ page }) => {
  const state = await setup(page)
  await page.goto('/#/products')
  // The first category is selected; only its products are requested and listed.
  await expect(page.getByLabel('Category', { exact: true })).toHaveValue(cat1)
  await expect(page.getByRole('heading', { name: 'Necklaces' })).toBeVisible()
  await expect(page.getByRole('row').filter({ hasText: 'Gold Necklace' })).toContainText('Company')
  await expect(page.getByRole('row').filter({ hasText: 'Custom Necklace #123' })).toContainText(
    'Customer',
  )
  await expect(page.getByRole('cell', { name: /Black Essential Hoodie/ })).toHaveCount(0)
  expect(productLists(state).at(-1)).toEqual({ categoryId: cat1 })

  await page.getByLabel('Category', { exact: true }).selectOption(hoodies)
  await expect(page).toHaveURL(new RegExp(`categoryId=${hoodies}`))
  const hoodieRow = page.getByRole('row').filter({ hasText: 'Black Essential Hoodie' })
  await expect(hoodieRow).toContainText('Black · 2 sizes')
  await expect(hoodieRow).toContainText('S 20 · M 28')
  await expect(page.getByRole('cell', { name: /Gold Necklace/ })).toHaveCount(0)

  await page.getByLabel('Category', { exact: true }).selectOption(cat1)
  await page.getByLabel('Origin', { exact: true }).selectOption('CUSTOMER')
  await expect(page.getByRole('cell', { name: /Gold Necklace/ })).toHaveCount(0)
  await expect(page.getByRole('row').filter({ hasText: 'Custom Necklace #123' })).toBeVisible()
  expect(productLists(state).at(-1)).toEqual({ categoryId: cat1, origin: 'CUSTOMER' })

  await page.getByLabel('Origin', { exact: true }).selectOption('')
  await page.getByLabel('Search', { exact: true }).fill('gold')
  await expect.poll(() => productLists(state).at(-1)).toEqual({ categoryId: cat1, search: 'gold' })
  await expect(page.getByRole('cell', { name: /Custom Necklace/ })).toHaveCount(0)

  // Category pages link straight to their products.
  await page.getByLabel('Search', { exact: true }).fill('')
  await page.goto(`/#/products?categoryId=${cat2}`)
  await expect(page.getByLabel('Category', { exact: true })).toHaveValue(cat2)
  await expect(page.getByText('No products in this category yet')).toBeVisible()
})

test('company creation starts from the category, requires an image and sends price in cents', async ({
  page,
}) => {
  const state = await setup(page)
  await page.goto(`/#/products?categoryId=${cat2}`)
  await page.getByRole('button', { name: 'Add Product', exact: true }).click()
  await expect(dialog(page).getByLabel('Category', { exact: true })).toHaveValue(cat2)
  // Jewelry is not sold in sizes by default, and has no apparel fields.
  await expect(dialog(page).getByLabel('Sold in sizes (stock per size)')).not.toBeChecked()
  await expect(dialog(page).getByLabel('Colour', { exact: true })).toHaveCount(0)
  await dialog(page).getByLabel('Name', { exact: true }).fill('Ready bracelet')
  await dialog(page).getByLabel('Description', { exact: true }).fill('Handmade and ready to ship')
  await dialog(page).getByLabel('Price (€)', { exact: true }).fill('32.99')
  await dialog(page).getByLabel('Available stock', { exact: true }).fill('7')
  await dialog(page).getByRole('button', { name: 'Save Product', exact: true }).click()
  await expect(dialog(page).getByRole('alert')).toContainText('Choose an image')
  expect(state.requests.some((r) => r.method === 'POST')).toBe(false)
  await dialog(page).getByLabel('Image (required)').setInputFiles(pngFile)
  await dialog(page).getByRole('button', { name: 'Save Product', exact: true }).click()
  await expect(dialog(page)).toHaveCount(0)
  const body = state.requests.find((r) => r.method === 'POST').body
  expect(body).toMatchObject({
    origin: 'COMPANY',
    categoryId: cat2,
    name: 'Ready bracelet',
    price: 3299,
    stock: 7,
    sizes: null,
  })
  expect(body.file.name).toBe('bead.png')
  expect(body).not.toHaveProperty('color')
  const row = page.getByRole('row').filter({ hasText: 'Ready bracelet' })
  await expect(row).toContainText('Company')
  await expect(row).toContainText('€32.99')

  await page.getByRole('button', { name: 'Edit Ready bracelet', exact: true }).click()
  await expect(dialog(page).getByLabel('Price (€)', { exact: true })).toHaveValue('32.99')
  await dialog(page).getByLabel('Available stock', { exact: true }).fill('0')
  await dialog(page).getByLabel('Price (€)', { exact: true }).fill('0.29')
  await dialog(page).getByRole('button', { name: 'Save Product', exact: true }).click()
  await expect(dialog(page)).toHaveCount(0)
  const updated = state.requests.find((r) => r.method === 'PATCH').body
  expect(updated).toMatchObject({ price: 29, stock: 0, sizes: null })
  expect(updated).not.toHaveProperty('origin')
  expect(updated).not.toHaveProperty('file')
})

test('an apparel product is one colour with stock per size, a price and print areas', async ({
  page,
}) => {
  const state = await setup(page)
  await page.goto(`/#/products?categoryId=${hoodies}`)
  await page.getByRole('button', { name: 'Add Product', exact: true }).click()
  await expect(dialog(page).getByLabel('Sold in sizes (stock per size)')).toBeChecked()
  await dialog(page).getByLabel('Name', { exact: true }).fill('White Essential Hoodie')
  await dialog(page).getByLabel('Colour', { exact: true }).fill('White')
  await dialog(page).getByLabel('Colour swatch').fill('#fafafa')
  await dialog(page).getByLabel('Price (€)', { exact: true }).fill('35')
  await dialog(page).getByLabel('Stock for size M').fill('15')
  await dialog(page).getByRole('button', { name: '+ Add size' }).click()
  await dialog(page).getByLabel('Size 2', { exact: true }).fill('L')
  await dialog(page).getByLabel('Stock for size L').fill('8')
  await expect(dialog(page).getByText('Front print area', { exact: true })).toBeVisible()
  // A global stock is never offered for a sized product.
  await expect(dialog(page).getByLabel('Available stock', { exact: true })).toHaveCount(0)
  await dialog(page).getByLabel('Product image (front)').setInputFiles(pngFile)
  await dialog(page).getByLabel('Back image (optional)').setInputFiles(pngFile)
  await dialog(page).getByRole('button', { name: 'Save Product', exact: true }).click()
  await expect(dialog(page)).toHaveCount(0)
  const body = state.requests.find((r) => r.method === 'POST').body
  expect(body).toMatchObject({
    origin: 'COMPANY',
    categoryId: hoodies,
    name: 'White Essential Hoodie',
    color: 'White',
    colorHex: '#FAFAFA',
    price: 3500,
    sizes: [
      { size: 'M', stock: 15 },
      { size: 'L', stock: 8 },
    ],
    printAreas: { front: { x: 0.3, y: 0.28, width: 0.4, height: 0.42, widthCm: 30, heightCm: 40 } },
  })
  expect(body).not.toHaveProperty('stock')
  expect(body.backImage.name).toBe('bead.png')

  // Editing restock one size; the rest of the inventory is sent unchanged.
  await page.getByRole('button', { name: 'Edit Black Essential Hoodie', exact: true }).click()
  await expect(dialog(page).getByLabel('Colour', { exact: true })).toHaveValue('Black')
  await dialog(page).getByLabel('Stock for size M').fill('30')
  await dialog(page).getByRole('button', { name: 'Remove size S' }).click()
  await dialog(page).getByRole('button', { name: 'Save Product', exact: true }).click()
  await expect(dialog(page)).toHaveCount(0)
  expect(state.requests.find((r) => r.method === 'PATCH').body).toMatchObject({
    sizes: [{ size: 'M', stock: 30 }],
    color: 'Black',
  })
})

test('duplicate, empty or invalid sizes block saving', async ({ page }) => {
  const state = await setup(page)
  await page.goto(`/#/products?categoryId=${hoodies}`)
  await page.getByRole('button', { name: 'Edit Black Essential Hoodie', exact: true }).click()
  await dialog(page).getByLabel('Size 2', { exact: true }).fill('s')
  await dialog(page).getByRole('button', { name: 'Save Product', exact: true }).click()
  await expect(dialog(page).getByRole('alert')).toContainText('listed twice')
  await dialog(page).getByLabel('Size 2', { exact: true }).fill('M')
  // The browser's own number validation already stops a negative stock.
  await dialog(page).getByLabel('Stock for size M').fill('-1')
  await dialog(page).getByRole('button', { name: 'Save Product', exact: true }).click()
  await dialog(page).getByLabel('Stock for size M').fill('28')
  await dialog(page).getByRole('button', { name: 'Remove size S' }).click()
  await dialog(page).getByRole('button', { name: 'Remove size M' }).click()
  await dialog(page).getByRole('button', { name: 'Save Product', exact: true }).click()
  await expect(dialog(page).getByRole('alert')).toContainText('Add at least one size')
  expect(state.requests.some((r) => r.method === 'PATCH')).toBe(false)
})

test('customer designs show who made them and only their name, description and status can change', async ({
  page,
}) => {
  const state = await setup(page)
  state.products[0] = {
    ...design,
    baseProduct: { id: hoodieId, name: 'Black Essential Hoodie' },
    selectedSize: { id: 'L', name: 'L' },
    basePrice: 3500,
    price: 5000,
  }
  await page.goto('/#/products')
  await page.getByRole('button', { name: 'View Custom Necklace #123' }).click()
  await expect(dialog(page).getByRole('heading', { name: 'Customer design' })).toBeVisible()
  for (const text of [
    'Anna Berisha',
    'Made on',
    'Black Essential Hoodie',
    'Size',
    '€50.00 (€35.00 base + components)',
    'Pendants',
  ])
    await expect(dialog(page)).toContainText(text)
  await dialog(page).getByRole('button', { name: 'Close', exact: true }).last().click()

  await page.getByRole('button', { name: 'Edit Custom Necklace #123' }).click()
  await expect(dialog(page).getByRole('heading', { name: 'Edit customer design' })).toBeVisible()
  for (const label of ['Price (€)', 'Category', 'Available stock', 'Colour'])
    await expect(dialog(page).getByLabel(label, { exact: true })).toHaveCount(0)
  await dialog(page).getByLabel('Name', { exact: true }).fill('Renamed design')
  await dialog(page).getByLabel('Active').uncheck()
  await dialog(page).getByRole('button', { name: 'Save Product', exact: true }).click()
  await expect(dialog(page)).toHaveCount(0)
  expect(state.requests.find((r) => r.method === 'PATCH').body).toEqual({
    name: 'Renamed design',
    description: 'Made in the studio',
    isActive: false,
  })
})

test('product image processing preserves drafts on backend errors and shows processed response after save', async ({
  page,
}) => {
  const state = await setup(page)
  await page.goto('/#/products')
  await page.getByRole('button', { name: 'Edit Gold Necklace', exact: true }).click()
  await dialog(page).getByLabel('Name', { exact: true }).fill('Processed necklace')
  await dialog(page).getByLabel('Image (optional)').setInputFiles(pngFile)
  await expect(dialog(page)).toContainText('Background will be removed automatically.')
  const preview = dialog(page).getByRole('img', { name: 'Processed necklace preview', exact: true })
  await expect(preview).toHaveAttribute('src', /^blob:/)
  for (const status of [400, 413, 500]) {
    const failure = (route) => fulfill(route, { message: `Processing failed (${status})` }, status)
    await page.route(`**/api/v1/products/${companyId}`, failure)
    await dialog(page).getByRole('button', { name: 'Save Product', exact: true }).click()
    await expect(dialog(page).getByRole('alert')).toContainText(`Processing failed (${status})`)
    await expect(dialog(page).getByLabel('Name', { exact: true })).toHaveValue('Processed necklace')
    await expect(preview).toHaveAttribute('src', /^blob:/)
    await page.unroute(`**/api/v1/products/${companyId}`, failure)
  }
  await dialog(page).getByRole('button', { name: 'Save Product', exact: true }).click()
  await expect(dialog(page)).toHaveCount(0)
  expect(state.requests.filter((r) => r.method === 'PATCH')).toHaveLength(1)
  await expect(
    page.getByRole('row').filter({ hasText: 'Processed necklace' }).locator('.hm-product-image img'),
  ).toHaveAttribute('src', 'https://images.example.test/processed-product.png')
})

test('CUSTOMER cannot enter Products or issue product requests', async ({ page }) => {
  const state = await setup(page, { role: 'CUSTOMER' })
  await page.goto('/#/products')
  await expect(page.getByRole('alert')).toContainText('Access denied')
  expect(state.requests.some((r) => r.path === '/products')).toBe(false)
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
  await page.getByRole('button', { name: 'Edit Gold Necklace' }).click()
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

test('deleting asks for confirmation and removes the product', async ({ page }) => {
  const state = await setup(page)
  await page.goto('/#/products')
  await page.getByRole('button', { name: 'Delete Gold Necklace' }).click()
  await dialog(page).getByRole('button', { name: 'Cancel' }).click()
  expect(state.requests.some((r) => r.method === 'DELETE')).toBe(false)
  await page.getByRole('button', { name: 'Delete Gold Necklace' }).click()
  await expect(dialog(page)).toContainText('deactivate them instead')
  await dialog(page).getByRole('button', { name: 'Delete Product', exact: true }).click()
  await expect(dialog(page)).toHaveCount(0)
  await expect(page.getByRole('cell', { name: /Gold Necklace/ })).toHaveCount(0)
})

test('customer design previews contain the whole design and fall back for null or broken URLs', async ({
  page,
}) => {
  const state = await setup(page)
  await page.goto('/#/products')
  const row = page.getByRole('row').filter({ hasText: 'Custom Necklace #123' })
  await expect(row.locator('.hm-product-image img')).toHaveAttribute('src', design.designPreviewUrl)
  await page.getByRole('button', { name: 'View Custom Necklace #123' }).click()
  const preview = dialog(page).locator('.hm-design-preview-large img')
  await expect(preview).toHaveCSS('object-fit', 'contain')
  await expect(
    dialog(page).getByRole('link', { name: 'Open full-size customer design' }),
  ).toHaveAttribute('href', design.designPreviewUrl)
  await dialog(page).getByRole('button', { name: 'Close', exact: true }).last().click()
  for (const url of [null, 'https://images.example.test/broken.png']) {
    state.products[0].designPreviewUrl = url
    await page.route('https://images.example.test/broken.png', (route) => route.abort())
    await page.getByRole('button', { name: 'View Custom Necklace #123' }).click()
    await expect(dialog(page).locator('.hm-design-preview-large img')).toHaveAttribute(
      'src',
      /(?:catalog-placeholder|^data:image\/svg\+xml)/,
    )
    await expect(dialog(page)).toContainText('Design preview unavailable')
    await dialog(page).getByRole('button', { name: 'Close', exact: true }).last().click()
    await expect(dialog(page)).toHaveCount(0)
  }
})

test('the product form fits a phone viewport', async ({ page }) => {
  await setup(page)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`/#/products?categoryId=${hoodies}`)
  await page.getByRole('button', { name: 'Edit Black Essential Hoodie', exact: true }).click()
  await expect(dialog(page).getByLabel('Stock for size S')).toBeVisible()
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    .toBe(true)
  await page.screenshot({ path: 'test-results/products-mobile.png' })
})
