import { test, expect } from '@playwright/test'
import { requestBody, pngFile } from './multipart.mjs'

const categoryId = '11111111-1111-4111-8111-111111111111'
const secondId = '22222222-2222-4222-8222-222222222222'
const subId = '33333333-3333-4333-8333-333333333333'
const baseCategory = {
  id: categoryId,
  name: 'Necklaces',
  description: 'Handmade necklaces',
  imageUrl: 'https://example.com/necklaces.jpg',
  builderType: 'JEWELRY',
  sizes: [],
  options: null,
  isActive: true,
  sortOrder: 2,
}
const secondCategory = {
  ...baseCategory,
  id: secondId,
  name: 'Bracelets',
  isActive: false,
}
const baseSub = {
  id: subId,
  categoryId,
  name: 'Pearl pendant',
  description: 'Freshwater pearl',
  imageUrl: null,
  color: 'Ivory',
  type: 'Pendant',
  price: 1500,
  stock: 12,
  isActive: true,
  sortOrder: 3,
}
const fulfill = (route, body, status = 200) =>
  route.fulfill({
    status,
    contentType: 'application/json',
    body: status === 204 ? '' : JSON.stringify(body),
  })

async function setup(page, overrides = {}) {
  const state = {
    categories: [{ ...baseCategory }, { ...secondCategory }],
    subs: [{ ...baseSub }],
    requests: [],
    failList: false,
    failOptions: false,
    failWrite: false,
    failDelete: false,
    failDetails: false,
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
    const path = new URL(request.url()).pathname.replace('/api/v1', '')
    const method = request.method()
    state.requests.push({ path, method, body: await requestBody(request) })
    expect(request.headers().authorization).toBe(`Bearer ${token}`)
    if (path === '/auth/me')
      return fulfill(route, {
        id: 'admin',
        firstName: 'Alex',
        lastName: 'Morgan',
        role: 'ADMIN',
        email: 'admin@example.test',
      })
    const [resource, id] = path.slice(1).split('/')
    if (!['categories', 'sub-categories'].includes(resource))
      return fulfill(route, { message: 'Unexpected endpoint' }, 404)
    const collection = resource === 'categories' ? 'categories' : 'subs'
    const decorate = (record) =>
      resource === 'categories'
        ? {
            ...record,
            ...(id
              ? {
                  subCategories: state.subs.filter((sub) => sub.categoryId === id),
                }
              : {}),
          }
        : {
            ...record,
            category: state.categories.find((category) => category.id === record.categoryId),
          }
    if (method === 'GET' && !id) {
      if (state.failList || (resource === 'categories' && state.failOptions))
        return fulfill(route, { message: 'Catalog temporarily unavailable' }, 503)
      return fulfill(route, state[collection].map(decorate))
    }
    if (method === 'GET') {
      if (state.failDetails)
        return fulfill(route, { message: 'Details temporarily unavailable' }, 503)
      const record = state[collection].find((record) => record.id === id)
      return record
        ? fulfill(route, decorate(record))
        : fulfill(route, { message: 'Record not found' }, 404)
    }
    if (method === 'POST' || method === 'PATCH') {
      if (state.failWrite) return fulfill(route, { message: ['Name is already in use'] }, 409)
      const payload = await requestBody(request)
      if (payload.file) {
        payload.imageUrl = 'https://example.com/uploaded.png'
        delete payload.file
      }
      if (method === 'POST')
        state[collection].push({
          id: '44444444-4444-4444-8444-444444444444',
          ...payload,
        })
      else
        state[collection] = state[collection].map((record) =>
          record.id === id ? { ...record, ...payload } : record,
        )
      return fulfill(
        route,
        decorate(
          method === 'POST'
            ? state[collection].at(-1)
            : state[collection].find((record) => record.id === id),
        ),
        method === 'POST' ? 201 : 200,
      )
    }
    if (method === 'DELETE') {
      if (state.failDelete) return fulfill(route, { message: 'Category is still referenced' }, 409)
      state[collection] = state[collection].filter((record) => record.id !== id)
      return fulfill(route, null, 204)
    }
    return fulfill(route, { message: 'Unexpected method' }, 405)
  })
  return state
}

const dialog = (page) => page.getByRole('dialog')

test('Category create, detail, edit and confirmed delete use exact API contracts', async ({
  page,
}) => {
  const state = await setup(page)
  await page.goto('/#/categories')
  await expect(page.getByRole('cell', { name: 'Necklaces', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Create Category', exact: true }).click()
  await dialog(page).getByLabel('Name', { exact: true }).fill('Rings')
  await dialog(page).getByLabel('Description', { exact: true }).fill('Handmade rings')
  await dialog(page).getByLabel('Image (optional)').setInputFiles(pngFile)
  await dialog(page).getByLabel('Sort order').fill('4')
  await dialog(page).getByLabel('Active', { exact: true }).uncheck()
  await dialog(page).getByRole('button', { name: 'Save Category', exact: true }).click()
  await expect(dialog(page)).toHaveCount(0)
  expect(state.requests.find((r) => r.method === 'POST').body).toEqual({
    name: 'Rings',
    description: 'Handmade rings',
    file: {
      name: pngFile.name,
      type: pngFile.mimeType,
      size: pngFile.buffer.length,
    },
    isActive: false,
    sortOrder: 4,
    builderType: '',
    designCategoryId: '',
    sizes: null,
    options: null,
  })
  await expect(page.getByRole('cell', { name: 'Rings', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'View Rings', exact: true }).click()
  await expect(dialog(page)).toContainText('Handmade rings')
  await expect(dialog(page)).toContainText('Inactive')
  await dialog(page).getByRole('button', { name: 'Close', exact: true }).last().click()
  await page.getByRole('button', { name: 'Edit Rings', exact: true }).click()
  await expect(dialog(page).getByLabel('Name', { exact: true })).toHaveValue('Rings')
  await dialog(page).getByLabel('Name', { exact: true }).fill('Gold rings')
  await dialog(page).getByLabel('Description', { exact: true }).fill('')
  await dialog(page).getByRole('button', { name: 'Save Category', exact: true }).click()
  await expect(page.getByRole('cell', { name: 'Gold rings', exact: true })).toBeVisible()
  expect(state.requests.find((r) => r.method === 'PATCH').body).toMatchObject({
    name: 'Gold rings',
    description: '',
  })
  await page.getByRole('button', { name: 'Delete Gold rings', exact: true }).click()
  await expect(dialog(page)).toContainText('permanently deletes all of its subcategories')
  await dialog(page).getByRole('button', { name: 'Cancel', exact: true }).click()
  expect(state.requests.filter((r) => r.method === 'DELETE')).toHaveLength(0)
  await page.getByRole('button', { name: 'Delete Gold rings', exact: true }).click()
  await dialog(page).getByRole('button', { name: 'Delete Category', exact: true }).click()
  await expect(page.getByRole('cell', { name: 'Gold rings', exact: true })).toHaveCount(0)
  await expect(
    page.getByRole('status').filter({ hasText: 'Category deleted successfully' }),
  ).toBeVisible()
  expect(
    state.requests.filter((r) => r.method === 'GET' && r.path.includes('/categories/')).length,
  ).toBeGreaterThanOrEqual(4)
})

const fillSize = async (page, index, name, measurement, maxItems) => {
  await dialog(page).getByRole('button', { name: '+ Add Size', exact: true }).click()
  await dialog(page).getByLabel(`Size ${index} Name`, { exact: true }).fill(name)
  await dialog(page)
    .getByLabel(`Size ${index} Measurement`, { exact: true })
    .fill(String(measurement))
  await dialog(page).getByLabel(`Size ${index} Max Items`, { exact: true }).fill(String(maxItems))
}

test('category sizes support create, edit, add, remove, empty and null with image preservation', async ({
  page,
}) => {
  const state = await setup(page, { categories: [{ ...baseCategory, sizes: null }] })
  await page.goto('/#/categories')
  await expect(page.getByRole('row').filter({ hasText: baseCategory.name })).toContainText(
    'Not configured',
  )
  await page.getByRole('button', { name: 'Create Category', exact: true }).click()
  await dialog(page).getByLabel('Name', { exact: true }).fill('Sized bracelets')
  await dialog(page).getByLabel('Builder Type').selectOption('JEWELRY')
  await dialog(page).getByLabel('Image (optional)').setInputFiles(pngFile)
  await fillSize(page, 1, 'Small', 16.5, 16)
  await dialog(page).getByRole('button', { name: 'Save Category', exact: true }).click()
  await expect(dialog(page)).toHaveCount(0)
  expect(state.requests.find((r) => r.method === 'POST').body.sizes).toEqual([
    { id: 'small', name: 'Small', measurement: 16.5, unit: 'cm', maxItems: 16 },
  ])
  const row = page.getByRole('row').filter({ hasText: 'Sized bracelets' })
  await expect(row).toContainText('1 size')
  await page.getByRole('button', { name: 'Edit Sized bracelets', exact: true }).click()
  await expect(dialog(page).getByLabel('Size 1 Measurement', { exact: true })).toHaveValue('16.5')
  await dialog(page).getByLabel('Size 1 Name', { exact: true }).fill('Extra Small')
  await dialog(page).getByLabel('Size 1 Unit', { exact: true }).fill('mm')
  await fillSize(page, 2, 'Medium', 18, 18)
  await dialog(page).getByRole('button', { name: 'Save Category', exact: true }).click()
  await expect(dialog(page)).toHaveCount(0)
  const updated = state.requests.filter((r) => r.method === 'PATCH').at(-1).body
  expect(updated.sizes).toEqual([
    { id: 'extra-small', name: 'Extra Small', measurement: 16.5, unit: 'mm', maxItems: 16 },
    { id: 'medium', name: 'Medium', measurement: 18, unit: 'cm', maxItems: 18 },
  ])
  expect(updated).not.toHaveProperty('file')
  await expect(row).toContainText('2 sizes')
  await page.getByRole('button', { name: 'View Sized bracelets', exact: true }).click()
  await expect(dialog(page)).toContainText('Extra Small')
  await dialog(page).getByRole('button', { name: 'Close', exact: true }).last().click()
  await page.getByRole('button', { name: 'Edit Sized bracelets', exact: true }).click()
  await dialog(page).getByRole('button', { name: 'Remove size 1' }).click()
  await dialog(page).getByRole('button', { name: 'Remove size 1' }).click()
  expect(state.requests.filter((r) => r.method === 'PATCH')).toHaveLength(1)
  await dialog(page).getByRole('button', { name: 'Save Category', exact: true }).click()
  await expect(dialog(page)).toHaveCount(0)
  expect(state.requests.filter((r) => r.method === 'PATCH').at(-1).body.sizes).toEqual([])
  expect(state.categories.find((c) => c.name === 'Sized bracelets').imageUrl).toBe(
    'https://example.com/uploaded.png',
  )
  await expect(row).toContainText('Not configured')
})

test('multiple sizes block duplicate generated IDs and invalid limits before sending requests', async ({
  page,
}) => {
  const state = await setup(page)
  await page.goto('/#/categories')
  await page.getByRole('button', { name: 'Create Category', exact: true }).click()
  await dialog(page).getByLabel('Name', { exact: true }).fill('Custom sizes')
  await dialog(page).getByLabel('Builder Type').selectOption('JEWELRY')
  await fillSize(page, 1, 'Extra Large', 20, 20)
  await fillSize(page, 2, 'Extra-Large', 22, 22)
  await dialog(page).getByRole('button', { name: 'Save Category', exact: true }).click()
  await expect(dialog(page).getByRole('alert')).toContainText('unique IDs')
  expect(state.requests.some((r) => r.method === 'POST')).toBe(false)
  await dialog(page).getByLabel('Size 2 Name', { exact: true }).fill('Medium')
  for (const value of ['0', '-1', '1.5']) {
    await dialog(page).getByLabel('Size 2 Max Items', { exact: true }).fill(value)
    await dialog(page).getByRole('button', { name: 'Save Category', exact: true }).click()
    expect(state.requests.some((r) => r.method === 'POST')).toBe(false)
  }
  await dialog(page).getByLabel('Size 2 Max Items', { exact: true }).fill('22')
  await dialog(page).getByLabel('Size 2 Measurement', { exact: true }).fill('0')
  await dialog(page).getByRole('button', { name: 'Save Category', exact: true }).click()
  await expect(dialog(page).getByRole('alert')).toContainText(
    'measurement must be greater than zero',
  )
  await dialog(page).getByLabel('Size 2 Measurement', { exact: true }).fill('22')
  await dialog(page).getByRole('button', { name: 'Save Category', exact: true }).click()
  await expect(dialog(page)).toHaveCount(0)
  expect(state.requests.find((r) => r.method === 'POST').body.sizes.map((s) => s.id)).toEqual([
    'extra-large',
    'medium',
  ])
})

test('apparel categories pick a design library, keep only extra options and link to garments', async ({
  page,
}) => {
  const libraryId = '55555555-5555-4555-8555-555555555555'
  const state = await setup(page, {
    categories: [
      { ...baseCategory },
      { ...baseCategory, id: libraryId, name: 'Apparel Designs', builderType: 'GIFT', options: [] },
    ],
  })
  await page.goto('/#/categories')
  await page.getByRole('button', { name: 'Create Category', exact: true }).click()
  await dialog(page).getByLabel('Name', { exact: true }).fill('Hoodies')
  await dialog(page).getByLabel('Builder Type').selectOption('APPAREL')
  // Price and stock moved to garments; size and colour moved to variants.
  await expect(dialog(page).getByLabel('Base Price (€)')).toHaveCount(0)
  await expect(dialog(page).getByLabel('Stock', { exact: true })).toHaveCount(0)
  await expect(dialog(page).getByRole('button', { name: '+ Add Size' })).toHaveCount(0)
  await expect(dialog(page)).toContainText('shared Apparel Designs category for Hoodies and T-Shirts')
  await dialog(page).getByLabel('Design library').selectOption(libraryId)
  await dialog(page).getByLabel('Enabled', { exact: true }).check()
  await dialog(page).getByRole('button', { name: 'Save Category' }).click()
  await expect(dialog(page)).toHaveCount(0)
  const created = state.requests.find((request) => request.method === 'POST').body
  expect(created).toMatchObject({ builderType: 'APPAREL', designCategoryId: libraryId, sizes: null })
  expect(created).not.toHaveProperty('basePrice')
  expect(created).not.toHaveProperty('stock')
  expect(created.options).toEqual([
    { key: 'giftMessage', name: 'Gift Message', type: 'text', required: false, maxLength: 200 },
  ])
  const row = page.getByRole('row').filter({ hasText: 'Hoodies' })
  await expect(row).toContainText('Garments · 1 extra option')
  await expect(row.getByRole('link', { name: 'Garments of Hoodies' })).toHaveAttribute(
    'href',
    /#\/categories\/.+\/garments$/,
  )
  page.once('dialog', (confirmation) => confirmation.accept())
  await page.getByRole('button', { name: 'Edit Hoodies' }).click()
  await expect(dialog(page).getByLabel('Design library')).toHaveValue(libraryId)
  await dialog(page).getByLabel('Builder Type').selectOption('GIFT')
  await dialog(page).getByRole('button', { name: 'Save Category' }).click()
  // Leaving APPAREL clears the library (multipart "" is null on the API).
  expect(state.requests.filter((request) => request.method === 'PATCH').at(-1).body).toMatchObject({
    builderType: 'GIFT',
    designCategoryId: '',
  })
})

test('legacy apparel size and colour options show a warning and can be removed', async ({ page }) => {
  const state = await setup(page, {
    categories: [
      {
        ...baseCategory,
        name: 'Old Hoodies',
        builderType: 'APPAREL',
        sizes: null,
        options: [
          { key: 'size', name: 'Size', type: 'select', required: true, values: ['S'] },
          { key: 'color', name: 'Color', type: 'color', required: true, values: [{ name: 'Red', value: '#C0392B' }] },
          { key: 'giftMessage', name: 'Gift Message', type: 'text', required: false, maxLength: 80 },
        ],
      },
    ],
  })
  await page.goto('/#/categories')
  await expect(page.getByRole('row').filter({ hasText: 'Old Hoodies' })).toContainText(
    'old size/colour options',
  )
  await page.getByRole('button', { name: 'Edit Old Hoodies' }).click()
  await expect(dialog(page).getByRole('alert')).toContainText('size and color options')
  await dialog(page).getByRole('button', { name: 'Remove size and colour options' }).click()
  await expect(dialog(page).getByRole('alert')).toHaveCount(0)
  await dialog(page).getByRole('button', { name: 'Save Category' }).click()
  expect(state.requests.find((request) => request.method === 'PATCH').body.options).toEqual([
    { key: 'giftMessage', name: 'Gift Message', type: 'text', required: false, maxLength: 80 },
  ])
})

test('designs support typed or free-text types, unlimited stock and background options', async ({
  page,
}) => {
  const state = await setup(page, {
    subs: [
      {
        ...baseSub,
        name: 'Star logo',
        type: 'LOGO',
        trackStock: false,
        originalImageUrl: 'https://example.com/star-original.png',
      },
    ],
  })
  await page.goto('/#/sub-categories')
  await expect(page.getByRole('row').filter({ hasText: 'Star logo' })).toContainText('Unlimited')
  await page.getByRole('button', { name: 'Edit Star logo', exact: true }).click()
  await expect(dialog(page).getByLabel('Type', { exact: true })).toHaveValue('LOGO')
  await expect(dialog(page).getByLabel('Unlimited (printed design)')).toBeChecked()
  await expect(dialog(page).getByLabel('Stock', { exact: true })).toHaveCount(0)
  await expect(dialog(page).getByRole('link', { name: 'Download original upload' })).toHaveAttribute(
    'href',
    'https://example.com/star-original.png',
  )
  await dialog(page).getByLabel('Image (optional)').setInputFiles(pngFile)
  await expect(dialog(page)).toContainText('Background will be removed automatically.')
  await dialog(page).getByLabel(/Remove background/).uncheck()
  await expect(dialog(page)).not.toContainText('Background will be removed automatically.')
  await dialog(page).getByLabel('Type', { exact: true }).selectOption('LETTERING')
  await dialog(page).getByRole('button', { name: 'Save SubCategory', exact: true }).click()
  await expect(dialog(page)).toHaveCount(0)
  expect(state.requests.find((r) => r.method === 'PATCH').body).toMatchObject({
    type: 'LETTERING',
    trackStock: false,
    removeBackground: false,
    stock: 12,
  })
})

test('bouquet controls generate select, number and optional color options', async ({ page }) => {
  const state = await setup(page, { categories: [] })
  await page.goto('/#/categories')
  await page.getByRole('button', { name: 'Create Category' }).click()
  await dialog(page).getByLabel('Name', { exact: true }).fill('Flowers')
  await dialog(page).getByLabel('Builder Type').selectOption('BOUQUET')
  await dialog(page).getByRole('button', { name: '+ Add Value' }).click()
  await dialog(page).getByLabel('Bouquet Sizes 1').fill('Small')
  await dialog(page).getByLabel('Enabled', { exact: true }).check()
  await dialog(page).getByLabel('Minimum').fill('5')
  await dialog(page).getByLabel('Maximum').fill('50')
  await dialog(page).getByLabel('Wrapper Colors enabled').check()
  await dialog(page).getByRole('button', { name: '+ Add Color' }).click()
  await dialog(page).getByLabel('Wrapper Colors 1 Name').fill('Kraft')
  await dialog(page).getByLabel('Wrapper Colors 1 Color value').fill('#A67C52')
  await dialog(page).getByRole('button', { name: 'Save Category' }).click()
  expect(state.requests.find((request) => request.method === 'POST').body.options).toEqual([
    {
      key: 'bouquetSize',
      name: 'Bouquet Size',
      type: 'select',
      required: true,
      values: ['Small'],
    },
    {
      key: 'flowerCount',
      name: 'Number of Flowers',
      type: 'number',
      required: false,
      min: 5,
      max: 50,
    },
    {
      key: 'wrapperColor',
      name: 'Wrapper Color',
      type: 'color',
      required: false,
      values: [{ name: 'Kraft', value: '#A67C52' }],
    },
  ])
})

test('catalog image processing uses returned images and preserves drafts on upload errors', async ({
  page,
}) => {
  const state = await setup(page)
  await page.route('https://example.com/uploaded.png', (route) =>
    route.fulfill({ contentType: 'image/png', body: pngFile.buffer }),
  )
  await page.goto('/#/sub-categories')
  await page.getByRole('button', { name: 'Edit Pearl pendant', exact: true }).click()
  await dialog(page).getByLabel('Image (optional)').setInputFiles(pngFile)
  await expect(dialog(page)).toContainText('Background will be removed automatically.')
  const preview = dialog(page).getByRole('img', { name: 'Pearl pendant preview', exact: true })
  await expect(preview).toHaveAttribute('src', /^blob:/)
  await expect(preview).toHaveCSS('object-fit', 'contain')
  const failure = (route) =>
    fulfill(route, { message: 'Image processing service unavailable' }, 500)
  await page.route(`**/api/v1/sub-categories/${subId}`, failure)
  await dialog(page).getByRole('button', { name: 'Save SubCategory', exact: true }).click()
  await expect(dialog(page).getByRole('alert')).toContainText(
    'Image processing service unavailable',
  )
  await expect(preview).toHaveAttribute('src', /^blob:/)
  await page.unroute(`**/api/v1/sub-categories/${subId}`, failure)
  await dialog(page).getByRole('button', { name: 'Save SubCategory', exact: true }).click()
  await expect(dialog(page)).toHaveCount(0)
  const thumbnail = page
    .getByRole('row')
    .filter({ hasText: 'Pearl pendant' })
    .locator('.hm-product-image img')
  await expect(thumbnail).toHaveAttribute('src', 'https://example.com/uploaded.png')
  await expect(thumbnail).toHaveCSS('object-fit', 'contain')
  expect(state.requests.filter((r) => r.method === 'PATCH')).toHaveLength(1)
  await page.goto('/#/categories')
  await page.getByRole('button', { name: 'Edit Necklaces', exact: true }).click()
  await dialog(page).getByLabel('Image (optional)').setInputFiles(pngFile)
  await expect(dialog(page)).toContainText('Background will be removed automatically.')
  await expect(dialog(page).locator('.hm-product-image-transparent')).toHaveCount(1)
})

test('SubCategory dropdown displays category names, submits IDs, and supports full CRUD', async ({
  page,
}) => {
  const state = await setup(page)
  await page.goto('/#/sub-categories')
  await expect(page.getByRole('cell', { name: 'Pearl pendant', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Create SubCategory', exact: true }).click()
  const select = dialog(page).getByLabel('Category', { exact: true })
  await expect(select.getByRole('option', { name: 'Necklaces', exact: true })).toHaveAttribute(
    'value',
    categoryId,
  )
  await expect(select.getByRole('option', { name: 'Bracelets', exact: true })).toHaveAttribute(
    'value',
    secondId,
  )
  await select.selectOption(categoryId)
  await dialog(page).getByLabel('Name', { exact: true }).fill('Silver charm')
  await dialog(page).getByLabel('Description', { exact: true }).fill('Small charm')
  await dialog(page).getByLabel('Image (optional)').setInputFiles(pngFile)
  await dialog(page).getByLabel('Color', { exact: true }).fill('Silver')
  await dialog(page).getByLabel('Type', { exact: true }).selectOption('__custom')
  await dialog(page).getByLabel('Custom type').fill('Charm')
  await dialog(page).getByLabel('Price (cents)', { exact: true }).fill('1250')
  await dialog(page).getByLabel('Stock', { exact: true }).fill('7')
  await dialog(page).getByLabel('Sort order').fill('1')
  await dialog(page).getByRole('button', { name: 'Save SubCategory', exact: true }).click()
  await expect(dialog(page)).toHaveCount(0)
  expect(state.requests.find((r) => r.method === 'POST').body).toEqual({
    categoryId,
    name: 'Silver charm',
    description: 'Small charm',
    file: {
      name: pngFile.name,
      type: pngFile.mimeType,
      size: pngFile.buffer.length,
    },
    color: 'Silver',
    type: 'Charm',
    price: 1250,
    stock: 7,
    trackStock: true,
    removeBackground: true,
    isActive: true,
    sortOrder: 1,
  })
  await page.getByRole('button', { name: 'View Silver charm', exact: true }).click()
  await expect(dialog(page)).toContainText('1250')
  await expect(dialog(page)).toContainText('Necklaces')
  await dialog(page).getByRole('button', { name: 'Close', exact: true }).last().click()
  await page.getByRole('button', { name: 'Edit Silver charm', exact: true }).click()
  await expect(dialog(page).getByLabel('Category', { exact: true })).toHaveValue(categoryId)
  await dialog(page).getByLabel('Category', { exact: true }).selectOption(secondId)
  await dialog(page).getByLabel('Stock', { exact: true }).fill('0')
  await dialog(page).getByLabel('Active', { exact: true }).uncheck()
  await dialog(page).getByRole('button', { name: 'Save SubCategory', exact: true }).click()
  await expect(dialog(page)).toHaveCount(0)
  expect(state.requests.find((r) => r.method === 'PATCH').body).toMatchObject({
    categoryId: secondId,
    stock: 0,
    isActive: false,
  })
  await expect(page.getByRole('row').filter({ hasText: 'Silver charm' })).toContainText('Bracelets')
  await page.getByRole('button', { name: 'Delete Silver charm', exact: true }).click()
  await dialog(page).getByRole('button', { name: 'Delete SubCategory', exact: true }).click()
  await expect(
    page.getByRole('status').filter({ hasText: 'SubCategory deleted successfully' }),
  ).toBeVisible()
  await expect(page.getByRole('cell', { name: 'Silver charm', exact: true })).toHaveCount(0)
})

test('failed save keeps entered values and supports retry; invalid numbers do not submit', async ({
  page,
}) => {
  const state = await setup(page, { failWrite: true })
  await page.goto('/#/sub-categories')
  await page.getByRole('button', { name: 'Create SubCategory', exact: true }).click()
  await dialog(page).getByLabel('Category', { exact: true }).selectOption(categoryId)
  await dialog(page).getByLabel('Name', { exact: true }).fill('Retained name')
  await dialog(page).getByLabel('Stock', { exact: true }).fill('-1')
  await dialog(page).getByRole('button', { name: 'Save SubCategory', exact: true }).click()
  expect(state.requests.some((r) => r.method === 'POST')).toBe(false)
  await dialog(page).getByLabel('Stock', { exact: true }).fill('2')
  await dialog(page).getByRole('button', { name: 'Save SubCategory', exact: true }).click()
  await expect(dialog(page).getByRole('alert')).toContainText('Name is already in use')
  await expect(dialog(page).getByLabel('Name', { exact: true })).toHaveValue('Retained name')
  state.failWrite = false
  await dialog(page).getByRole('button', { name: 'Save SubCategory', exact: true }).click()
  await expect(dialog(page)).toHaveCount(0)
  await expect(page.getByRole('cell', { name: 'Retained name', exact: true })).toBeVisible()
})

test('category option errors can be retried and empty categories prevent subcategory creation', async ({
  page,
}) => {
  const state = await setup(page, { failOptions: true, categories: [] })
  await page.goto('/#/sub-categories')
  await page.getByRole('button', { name: 'Create SubCategory', exact: true }).click()
  await expect(dialog(page).getByRole('alert')).toContainText('Catalog temporarily unavailable')
  await expect(
    dialog(page).getByRole('button', { name: 'Save SubCategory', exact: true }),
  ).toBeDisabled()
  state.failOptions = false
  await dialog(page).getByRole('button', { name: 'Try again' }).click()
  await expect(dialog(page)).toContainText('Create a category before adding a subcategory')
  await expect(dialog(page).getByLabel('Category', { exact: true })).toBeDisabled()
  await expect(
    dialog(page).getByRole('button', { name: 'Save SubCategory', exact: true }),
  ).toBeDisabled()
  await dialog(page).getByRole('link', { name: 'Go to Categories' }).click()
  await expect(page.getByRole('heading', { name: 'Categories', exact: true })).toBeVisible()
})

test('list and details errors are visible, retryable, and deletion failure keeps the record', async ({
  page,
}) => {
  const state = await setup(page, { failList: true })
  await page.goto('/#/categories')
  await expect(page.getByRole('alert')).toContainText('Catalog temporarily unavailable')
  state.failList = false
  await page.getByRole('button', { name: 'Try again' }).click()
  await expect(page.getByRole('cell', { name: 'Necklaces', exact: true })).toBeVisible()
  state.failDetails = true
  await page.getByRole('button', { name: 'Edit Necklaces', exact: true }).click()
  await expect(dialog(page).getByRole('alert')).toContainText('Details temporarily unavailable')
  await expect(
    dialog(page).getByRole('button', { name: 'Save Category', exact: true }),
  ).toBeDisabled()
  state.failDetails = false
  await dialog(page).getByRole('button', { name: 'Try again' }).click()
  await expect(dialog(page).getByLabel('Name', { exact: true })).toHaveValue('Necklaces')
  await dialog(page).getByRole('button', { name: 'Cancel' }).click()
  state.failDelete = true
  await page.getByRole('button', { name: 'Delete Necklaces', exact: true }).click()
  await dialog(page).getByRole('button', { name: 'Delete Category', exact: true }).click()
  await expect(
    dialog(page).getByRole('alert').filter({ hasText: 'Category is still referenced' }),
  ).toBeVisible()
  await dialog(page).getByRole('button', { name: 'Cancel' }).click()
  await expect(page.getByRole('cell', { name: 'Necklaces', exact: true })).toBeVisible()
})

test('mobile catalog and form fit the viewport and search shows an empty state', async ({
  page,
}) => {
  await setup(page)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/#/sub-categories')
  await page.getByRole('searchbox', { name: 'Search SubCategories' }).fill('No such collection')
  await expect(page.getByRole('heading', { name: 'No matching results' })).toBeVisible()
  await page.getByRole('button', { name: 'Create SubCategory', exact: true }).click()
  await expect(dialog(page).getByLabel('Category', { exact: true })).toBeEnabled()
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    .toBe(true)
  await page.screenshot({
    path: 'test-results/subcategory-mobile.png',
    fullPage: true,
  })
  await dialog(page).getByRole('button', { name: 'Cancel' }).click()
})

for (const [path, label, name] of [
  ['categories', 'Category', 'Necklaces'],
  ['sub-categories', 'SubCategory', 'Pearl pendant'],
]) {
  test(`${label} validates images, retains failed uploads, and preserves unchanged images`, async ({
    page,
  }) => {
    const state = await setup(page)
    await page.route('https://example.com/**', (route) =>
      route.fulfill({ contentType: 'image/png', body: pngFile.buffer }),
    )
    await page.goto(`/#/${path}`)
    await page.getByRole('button', { name: `Edit ${name}`, exact: true }).click()
    const picker = dialog(page).getByLabel('Image (optional)')
    const preview = dialog(page).getByRole('img')
    await expect(preview).toHaveAttribute(
      'src',
      path === 'categories' ? baseCategory.imageUrl : /catalog-placeholder|^data:image\/svg\+xml/,
    )
    await picker.setInputFiles({
      name: 'bad.gif',
      mimeType: 'image/gif',
      buffer: Buffer.from('bad'),
    })
    await expect(dialog(page).getByRole('alert')).toContainText('JPEG, PNG, or WebP')
    await picker.setInputFiles({
      ...pngFile,
      buffer: Buffer.alloc(5 * 1024 * 1024 + 1),
    })
    await expect(dialog(page).getByRole('alert')).toContainText('5 MB')
    await picker.setInputFiles(pngFile)
    await expect(preview).toHaveAttribute('src', /^blob:/)
    state.failWrite = true
    await dialog(page)
      .getByRole('button', { name: `Save ${label}`, exact: true })
      .click()
    await expect(dialog(page).getByRole('alert')).toContainText('Name is already in use')
    await expect(preview).toHaveAttribute('src', /^blob:/)
    expect(await picker.evaluate((input) => input.files[0]?.name)).toBe('bead.png')
    state.failWrite = false
    await dialog(page)
      .getByRole('button', { name: `Save ${label}`, exact: true })
      .click()
    await expect(dialog(page)).toHaveCount(0)
    expect(state.requests.filter((r) => r.method === 'PATCH').at(-1).body.file.name).toBe(
      'bead.png',
    )
    await page.getByRole('button', { name: `Edit ${name}`, exact: true }).click()
    await dialog(page)
      .getByRole('button', { name: `Save ${label}`, exact: true })
      .click()
    await expect(dialog(page)).toHaveCount(0)
    expect(state.requests.filter((r) => r.method === 'PATCH').at(-1).body).not.toHaveProperty(
      'file',
    )
  })
}

test('broken category image uses the bundled placeholder', async ({ page }) => {
  await setup(page)
  await page.route('https://example.com/**', (route) => route.abort())
  await page.goto('/#/categories')
  await expect(page.getByRole('img', { name: 'Necklaces preview' })).toHaveAttribute(
    'src',
    /catalog-placeholder|^data:image\/svg\+xml/,
  )
})
