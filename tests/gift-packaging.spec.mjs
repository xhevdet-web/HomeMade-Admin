import { test, expect } from '@playwright/test'
import { requestBody } from './multipart.mjs'

// Packaging decides what fits in a gift: capacity, accepted item types and suggested bundles.
const giftCategory = { id: '44444444-4444-4444-8444-444444444444', name: 'Gifts', builderType: 'GIFT' }
const item = (id, name, type, price) => ({ id, categoryId: giftCategory.id, name, type, price, isActive: true })
const chocolate = item('55555555-5555-4555-8555-555555555551', 'Dark chocolate', 'Treats', 450)
const tea = item('55555555-5555-4555-8555-555555555552', 'Herbal tea', 'Drinks', 500)
const deletedId = '55555555-5555-4555-8555-555555555559'
const box = {
  id: '66666666-6666-4666-8666-666666666666',
  name: 'Classic Box',
  description: null,
  type: 'TRANSPARENT',
  shape: 'SQUARE',
  imageUrl: null,
  price: 200,
  stock: 10,
  capacity: 6,
  allowedTypes: [],
  suggestedBundles: [
    {
      name: 'Cozy',
      items: [
        { subCategoryId: tea.id, quantity: 1 },
        { subCategoryId: deletedId, quantity: 1 },
      ],
    },
  ],
  isActive: true,
  sortOrder: 0,
  colors: [],
}

async function setup(page) {
  const state = { requests: [] }
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
  const json = (route, body, status = 200) =>
    route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })
  await page.route('http://localhost:3000/api/v1/**', async (route) => {
    const request = route.request()
    const path = new URL(request.url()).pathname.replace('/api/v1', '')
    const method = request.method()
    if (method !== 'GET') state.requests.push({ path, method, body: await requestBody(request) })
    if (path === '/auth/me')
      return json(route, { id: 'admin', firstName: 'Alex', lastName: 'Morgan', role: 'ADMIN', email: 'admin@example.test' })
    if (path === '/categories') return json(route, [giftCategory, { id: 'other', name: 'Mugs', builderType: 'MUG' }])
    if (path === `/categories/${giftCategory.id}/sub-categories`) return json(route, [chocolate, tea])
    if (path === '/gift-packaging') return json(route, [box])
    if (path === `/gift-packaging/${box.id}` && method === 'GET') return json(route, box)
    if (path === `/gift-packaging/${box.id}` && method === 'PATCH') return json(route, box)
    return json(route, [])
  })
  return state
}

test('capacity, accepted types and bundles are saved with the packaging', async ({ page }) => {
  const state = await setup(page)
  await page.goto('/#/gift-packaging')
  await expect(page.getByText('Holds 6 items · 1 bundle')).toBeVisible()
  await page.getByRole('button', { name: 'Edit Classic Box' }).click()
  const dialog = page.getByRole('dialog')

  await expect(dialog.getByLabel('Capacity (items)')).toHaveValue('6')
  await expect(dialog.getByText('This item no longer exists; it is removed when you save.')).toBeVisible()
  await dialog.getByLabel('Capacity (items)').fill('4')
  await dialog.getByRole('checkbox', { name: 'Treats' }).check()
  await dialog.getByRole('checkbox', { name: 'Drinks' }).check()

  await dialog.getByRole('button', { name: 'Add bundle' }).click()
  await dialog.getByLabel('Bundle name').nth(1).fill('Sweet tooth')
  await dialog.getByRole('combobox', { name: /Item 1 of Sweet tooth/ }).selectOption(chocolate.id)
  await dialog.getByRole('spinbutton', { name: 'Quantity' }).last().fill('2')
  await expect(dialog.getByText('2 items of 4')).toBeVisible()

  await dialog.getByRole('button', { name: 'Save packaging' }).click()
  await expect(dialog).toBeHidden()
  const patch = state.requests.find((r) => r.method === 'PATCH')
  expect(patch.body.capacity).toBe('4')
  expect(JSON.parse(patch.body.allowedTypes)).toEqual(['Treats', 'Drinks'])
  // The deleted item is dropped; everything else is sent as typed.
  expect(JSON.parse(patch.body.suggestedBundles)).toEqual([
    { name: 'Cozy', items: [{ subCategoryId: tea.id, quantity: 1 }] },
    { name: 'Sweet tooth', items: [{ subCategoryId: chocolate.id, quantity: 2 }] },
  ])
})

test('a bundle larger than the box is explained and never sent; an empty capacity means no limit', async ({
  page,
}) => {
  const state = await setup(page)
  await page.goto('/#/gift-packaging')
  await page.getByRole('button', { name: 'Edit Classic Box' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Capacity (items)').fill('1')
  await dialog.getByRole('spinbutton', { name: 'Quantity' }).first().fill('3')
  await dialog.getByRole('button', { name: 'Save packaging' }).click()
  await expect(dialog.getByRole('alert')).toContainText('"Cozy" has more items than the box holds (1).')
  expect(state.requests.filter((r) => r.method === 'PATCH')).toHaveLength(0)

  await dialog.getByLabel('Capacity (items)').fill('')
  await dialog.getByRole('button', { name: 'Save packaging' }).click()
  await expect(dialog).toBeHidden()
  const patch = state.requests.find((r) => r.method === 'PATCH')
  expect(patch.body.capacity).toBe('')
})
