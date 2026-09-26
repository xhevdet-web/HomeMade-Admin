import { test, expect } from '@playwright/test'

const categoryId = '11111111-1111-4111-8111-111111111111'
const secondId = '22222222-2222-4222-8222-222222222222'
const subId = '33333333-3333-4333-8333-333333333333'
const baseCategory = {
  id: categoryId,
  name: 'Necklaces',
  description: 'Handmade necklaces',
  imageUrl: 'https://example.com/necklaces.jpg',
  isActive: true,
  sortOrder: 2,
}
const secondCategory = { ...baseCategory, id: secondId, name: 'Bracelets', isActive: false }
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
    state.requests.push({ path, method, body: request.postDataJSON() })
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
            ...(id ? { subCategories: state.subs.filter((sub) => sub.categoryId === id) } : {}),
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
      const payload = request.postDataJSON()
      if (method === 'POST')
        state[collection].push({ id: '44444444-4444-4444-8444-444444444444', ...payload })
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
  await dialog(page).getByLabel('Image URL').fill('https://example.com/rings.jpg')
  await dialog(page).getByLabel('Sort order').fill('4')
  await dialog(page).getByLabel('Active', { exact: true }).uncheck()
  await dialog(page).getByRole('button', { name: 'Save Category', exact: true }).click()
  await expect(dialog(page)).toHaveCount(0)
  expect(state.requests.find((r) => r.method === 'POST').body).toEqual({
    name: 'Rings',
    description: 'Handmade rings',
    imageUrl: 'https://example.com/rings.jpg',
    isActive: false,
    sortOrder: 4,
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
  await dialog(page).getByLabel('Image URL').fill('')
  await dialog(page).getByRole('button', { name: 'Save Category', exact: true }).click()
  await expect(page.getByRole('cell', { name: 'Gold rings', exact: true })).toBeVisible()
  expect(state.requests.find((r) => r.method === 'PATCH').body).toMatchObject({
    name: 'Gold rings',
    description: null,
    imageUrl: null,
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
  await dialog(page).getByLabel('Image URL').fill('https://example.com/charm.jpg')
  await dialog(page).getByLabel('Color', { exact: true }).fill('Silver')
  await dialog(page).getByLabel('Type', { exact: true }).fill('Charm')
  await dialog(page).getByLabel('Price (cents)', { exact: true }).fill('1250')
  await dialog(page).getByLabel('Stock', { exact: true }).fill('7')
  await dialog(page).getByLabel('Sort order').fill('1')
  await dialog(page).getByRole('button', { name: 'Save SubCategory', exact: true }).click()
  await expect(dialog(page)).toHaveCount(0)
  expect(state.requests.find((r) => r.method === 'POST').body).toEqual({
    categoryId,
    name: 'Silver charm',
    description: 'Small charm',
    imageUrl: 'https://example.com/charm.jpg',
    color: 'Silver',
    type: 'Charm',
    price: 1250,
    stock: 7,
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
  await page.screenshot({ path: 'test-results/subcategory-mobile.png', fullPage: true })
  await dialog(page).getByRole('button', { name: 'Cancel' }).click()
})
