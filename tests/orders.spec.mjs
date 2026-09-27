import { test, expect } from '@playwright/test'
const userId = '11111111-1111-4111-8111-111111111111'
const adminId = '22222222-2222-4222-8222-222222222222'
const productId = '33333333-3333-4333-8333-333333333333'
const admin = {
  id: adminId,
  firstName: 'Alex',
  lastName: 'Morgan',
  role: 'ADMIN',
  email: 'admin@example.test',
  phone: '+48123456789',
  country: 'Poland',
  address: '10 Studio Street',
  postalCode: '00-001',
}
const customer = {
  id: userId,
  firstName: 'Maya',
  lastName: 'Stone',
  email: 'maya@example.test',
  phone: '+48999999999',
  role: 'CUSTOMER',
}
const product = {
  id: productId,
  name: 'Pearl necklace',
  description: 'A handmade freshwater pearl necklace.',
  imageUrl: 'https://images.example.test/pearl.png',
  itemCount: 24,
  price: 4999,
  category: {
    id: 'category',
    name: 'Necklaces',
    description: 'Everyday keepsakes',
    imageUrl: null,
  },
  categoryId: 'category',
  items: [
    {
      id: 'item',
      subCategoryId: 'sub',
      quantity: 24,
      position: 0,
      unitPrice: 100,
      subCategory: {
        id: 'sub',
        name: 'Pearls',
        color: 'Ivory',
        type: 'Freshwater',
        price: 150,
        imageUrl: 'https://images.example.test/pearl.png',
      },
    },
  ],
}
const makeOrder = (index) => ({
  id: `order-${index}`,
  orderNumber: `HM-2026-${String(index + 1).padStart(6, '0')}`,
  userId,
  productId,
  user: customer,
  product,
  status: 'ORDERED',
  paymentType: 'CARD',
  paymentStatus: 'UNPAID',
  totalPrice: 2999,
  firstName: 'Maya',
  lastName: 'River',
  phone: '+48111111111',
  country: 'Poland',
  address: '22 Original Address',
  postalCode: '00-222',
  customerNotes: 'Please use gift wrapping.',
  adminNotes: 'Handle with care',
  finalImageUrl: null,
  createdAt: '2026-09-20T10:00:00Z',
})
const fulfill = (route, body, status = 200) =>
  route.fulfill({
    status,
    contentType: 'application/json',
    body: status === 204 ? '' : JSON.stringify(body),
  })
const dialog = (page) => page.getByRole('dialog')
async function setup(page, overrides = {}) {
  const state = {
    orders: Array.from({ length: 21 }, (_, index) => makeOrder(index)),
    requests: [],
    listError: false,
    userError: false,
    detailError: false,
    writeStatus: 200,
    conflict: false,
    conflictReloadFails: false,
    missingProfile: false,
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
    const url = new URL(request.url())
    const path = url.pathname.replace('/api/v1', '')
    const method = request.method()
    const body = request.postDataJSON()
    state.requests.push({ path, method, body, query: Object.fromEntries(url.searchParams) })
    expect(request.headers().authorization).toBe(`Bearer ${token}`)
    if (path === '/auth/me')
      return fulfill(route, { ...admin, ...(state.missingProfile ? { address: '' } : {}) })
    if (path === '/users')
      return state.userError
        ? fulfill(route, { message: 'Customer lookup unavailable' }, 503)
        : fulfill(route, [customer, admin])
    if (path === '/products') return fulfill(route, [product])
    if (path === '/sub-categories')
      return fulfill(route, [{ id: 'sub', name: 'Pearls', stock: 26 }])
    if (path === '/categories/category/sub-categories')
      return fulfill(route, [
        { id: 'sub', name: 'Pearls', stock: state.orders.length > 21 ? 26 : 50 },
      ])
    if (path === '/orders' && method === 'GET') {
      if (state.listError) return fulfill(route, { message: 'Orders temporarily unavailable' }, 503)
      const q = Object.fromEntries(url.searchParams)
      const filtered = state.orders.filter(
        (order) =>
          ['status', 'paymentStatus', 'paymentType', 'userId'].every(
            (key) => !q[key] || order[key] === q[key],
          ) &&
          (!q.orderNumber || order.orderNumber.toLowerCase().includes(q.orderNumber.toLowerCase())),
      )
      const page = Number(q.page || 1),
        limit = Number(q.limit || 20)
      return fulfill(route, {
        data: filtered.slice((page - 1) * limit, page * limit),
        meta: {
          page,
          limit,
          total: filtered.length,
          totalPages: Math.ceil(filtered.length / limit),
        },
      })
    }
    if (path === '/orders' && method === 'POST') {
      if (state.inventoryConflict)
        return fulfill(
          route,
          {
            message: 'Insufficient inventory',
            subCategoryName: 'Pearls',
            requestedQuantity: 24,
            availableQuantity: 4,
          },
          400,
        )
      if (state.writeStatus !== 200)
        return fulfill(route, { message: 'Unable to create order' }, state.writeStatus)
      const order = {
        ...makeOrder(99),
        ...body,
        userId: adminId,
        user: admin,
        firstName: admin.firstName,
        lastName: admin.lastName,
        phone: admin.phone,
        address: admin.address,
        country: admin.country,
        postalCode: admin.postalCode,
        totalPrice: product.price,
      }
      state.orders.unshift(order)
      return fulfill(route, order, 201)
    }
    const [, , id, action] = path.split('/')
    const order = state.orders.find((order) => order.id === id)
    if (!order) return fulfill(route, { message: 'Order not found' }, 404)
    if (method === 'GET')
      return state.detailError
        ? fulfill(route, { message: 'Order details unavailable' }, 503)
        : fulfill(route, order)
    if (state.writeStatus !== 200)
      return fulfill(
        route,
        {
          message:
            state.writeStatus === 403 ? 'Only admins can manage orders' : 'Unable to update order',
        },
        state.writeStatus,
      )
    if (method === 'DELETE') {
      state.orders = state.orders.filter((order) => order.id !== id)
      return fulfill(route, null, 204)
    }
    if (method === 'PATCH') {
      if (action === 'status' && state.conflict) {
        state.conflict = false
        order.status = 'CREATED'
        state.detailError = state.conflictReloadFails
        return fulfill(route, { message: 'Order changed; reload before updating' }, 409)
      }
      Object.assign(order, body)
      return fulfill(route, order)
    }
    return fulfill(route, { message: 'Unexpected endpoint' }, 404)
  })
  return state
}
const openFirst = async (page) =>
  page.getByRole('button', { name: 'View details HM-2026-000001', exact: true }).click()

test('order table shows currency, badges, customers and server-side filters with pagination', async ({
  page,
}) => {
  const state = await setup(page)
  await page.goto('/#/orders')
  for (const column of [
    'Order number',
    'Customer',
    'Product',
    'Total',
    'Payment type',
    'Payment status',
    'Order status',
    'Created',
    'Actions',
  ])
    await expect(page.getByRole('columnheader', { name: column, exact: true })).toBeVisible()
  await expect(page.getByRole('row').filter({ hasText: 'HM-2026-000001' })).toContainText(
    'Maya Stone',
  )
  await expect(page.getByRole('row').filter({ hasText: 'HM-2026-000001' })).toContainText('€29.99')
  await expect(page.getByRole('navigation', { name: 'Order pagination' })).toContainText(
    'Page 1 of 2',
  )
  await page.getByRole('button', { name: 'Next', exact: true }).click()
  await expect(page.getByRole('navigation', { name: 'Order pagination' })).toContainText(
    'Page 2 of 2',
  )
  await expect(page.getByRole('button', { name: 'Next', exact: true })).toBeDisabled()
  await page.getByLabel('Order number', { exact: true }).fill('HM-2026-000001')
  await page.getByLabel('Order status', { exact: true }).selectOption('ORDERED')
  await page.getByLabel('Payment status', { exact: true }).selectOption('UNPAID')
  await page.getByLabel('Payment type', { exact: true }).selectOption('CARD')
  await page.getByLabel('Customer', { exact: true }).selectOption(userId)
  await page.getByRole('button', { name: 'Apply filters' }).click()
  await expect(page.getByRole('navigation', { name: 'Order pagination' })).toContainText(
    'Page 1 of 1',
  )
  expect(
    state.requests.filter((r) => r.path === '/orders' && r.method === 'GET').at(-1).query,
  ).toEqual({
    page: '1',
    limit: '20',
    orderNumber: 'HM-2026-000001',
    status: 'ORDERED',
    paymentStatus: 'UNPAID',
    paymentType: 'CARD',
    userId,
  })
  await page.getByRole('button', { name: 'Clear filters' }).click()
  await expect(page.getByRole('navigation', { name: 'Order pagination' })).toContainText(
    'Page 1 of 2',
  )
  await page.getByLabel('Orders per page').selectOption('50')
  await expect(page.getByRole('navigation', { name: 'Order pagination' })).toContainText(
    'Page 1 of 1',
  )
  await page.getByLabel('Order number', { exact: true }).fill('missing')
  await page.getByRole('button', { name: 'Apply filters' }).click()
  await expect(page.getByRole('heading', { name: 'No orders match your filters' })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Order pagination' })).toContainText(
    'Page 0 of 0',
  )
})

test('details separate snapshot and current contact; notes and payments use narrow payloads', async ({
  page,
}) => {
  const state = await setup(page)
  await page.goto('/#/orders')
  await openFirst(page)
  await expect(dialog(page)).toContainText('Maya River')
  await expect(dialog(page)).toContainText('Maya Stone')
  for (const text of [
    '22 Original Address',
    '+48111111111',
    '+48999999999',
    '00-222',
    'maya@example.test',
    'Please use gift wrapping.',
    '24 items',
    'Freshwater',
    'Ivory',
    'Everyday keepsakes',
  ])
    await expect(dialog(page)).toContainText(text)
  await expect(dialog(page).getByRole('textbox')).toHaveCount(2)
  await dialog(page).getByLabel('Admin notes').fill('Unsaved wrapping note')
  await dialog(page).getByRole('button', { name: 'Move to next status' }).click()
  await expect(dialog(page).getByRole('status')).toContainText('Order moved to Creating')
  await expect(dialog(page).getByLabel('Admin notes')).toHaveValue('Unsaved wrapping note')
  await dialog(page)
    .getByLabel('Final image URL (optional)')
    .fill('https://images.example.test/final.png')
  await expect(dialog(page).getByRole('img', { name: 'Finished piece preview' })).toBeVisible()
  await dialog(page).getByRole('button', { name: 'Save notes and image' }).click()
  await expect(dialog(page).getByRole('status')).toContainText('Notes and image saved')
  expect(
    state.requests.find((r) => r.method === 'PATCH' && r.path === '/orders/order-0').body,
  ).toEqual({
    adminNotes: 'Unsaved wrapping note',
    finalImageUrl: 'https://images.example.test/final.png',
  })
  await dialog(page).getByLabel('Payment status', { exact: true }).selectOption('PAID')
  await dialog(page).getByRole('button', { name: 'Update payment status' }).click()
  await expect(dialog(page).getByRole('status')).toContainText('Payment status updated')
  expect(state.requests.find((r) => r.path.endsWith('/payment-status')).body).toEqual({
    paymentStatus: 'PAID',
  })
  expect(state.orders[0].totalPrice).toBe(2999)
  expect(state.orders[0].address).toBe('22 Original Address')
})

test('workflow advances exactly one step and stops at completed', async ({ page }) => {
  const state = await setup(page)
  await page.goto('/#/orders')
  await openFirst(page)
  for (const [value, label] of [
    ['CREATING', 'Creating'],
    ['CREATED', 'Created'],
    ['READY_FOR_COURIER', 'Ready for courier'],
    ['PICKED_UP_BY_COURIER', 'Picked up by courier'],
    ['COMPLETED', 'Completed'],
  ]) {
    await dialog(page).getByRole('button', { name: 'Move to next status' }).click()
    await expect(dialog(page).getByRole('status')).toContainText(`Order moved to ${label}`)
    expect(
      state.requests.filter((r) => r.path.endsWith('/status') && r.method === 'PATCH').at(-1).body,
    ).toEqual({ status: value })
  }
  await expect(
    dialog(page).getByRole('button', { name: 'Order completed', exact: true }),
  ).toBeDisabled()
  expect(
    state.requests.filter((r) => r.path.endsWith('/status') && r.method === 'PATCH'),
  ).toHaveLength(5)
})

test('409 reloads current order before allowing a manual retry and preserves notes', async ({
  page,
}) => {
  const state = await setup(page, { conflict: true })
  await page.goto('/#/orders')
  await openFirst(page)
  await dialog(page).getByLabel('Admin notes').fill('Keep this draft')
  await dialog(page).getByRole('button', { name: 'Move to next status' }).click()
  await expect(dialog(page).getByRole('status')).toContainText('latest version is loaded')
  await expect(dialog(page)).toContainText('Next: Ready for courier')
  await expect(dialog(page).getByLabel('Admin notes')).toHaveValue('Keep this draft')
  expect(
    state.requests.filter((r) => r.method === 'PATCH' && r.path.endsWith('/status')),
  ).toHaveLength(1)
  const firstPatch = state.requests.findIndex((r) => r.method === 'PATCH')
  expect(
    state.requests
      .slice(firstPatch + 1)
      .some((r) => r.path === '/orders/order-0' && r.method === 'GET'),
  ).toBe(true)
  await dialog(page).getByRole('button', { name: 'Move to next status' }).click()
  await expect(dialog(page).getByRole('status')).toContainText('Order moved to Ready for courier')
  expect(state.requests.filter((r) => r.method === 'PATCH').at(-1).body).toEqual({
    status: 'READY_FOR_COURIER',
  })
})

test('failed 409 reload blocks advancement until a successful reload', async ({ page }) => {
  const state = await setup(page, { conflict: true, conflictReloadFails: true })
  await page.goto('/#/orders')
  await openFirst(page)
  await dialog(page).getByRole('button', { name: 'Move to next status' }).click()
  await expect(dialog(page).getByRole('alert')).toContainText('Order details unavailable')
  await expect(dialog(page).getByRole('button', { name: 'Move to next status' })).toBeDisabled()
  state.detailError = false
  await dialog(page).getByRole('button', { name: 'Reload latest order' }).click()
  await expect(dialog(page).getByRole('button', { name: 'Move to next status' })).toBeEnabled()
  await expect(dialog(page)).toContainText('Next: Ready for courier')
})

test('delete requires confirmation and returns from an emptied last page', async ({ page }) => {
  const state = await setup(page)
  await page.goto('/#/orders')
  await page.getByRole('button', { name: 'Next', exact: true }).click()
  await page.getByRole('button', { name: 'Delete HM-2026-000021', exact: true }).click()
  await expect(dialog(page)).toContainText('Delete HM-2026-000021?')
  await dialog(page).getByRole('button', { name: 'Cancel deletion' }).click()
  expect(state.requests.some((r) => r.method === 'DELETE')).toBe(false)
  await dialog(page).getByRole('button', { name: 'Delete order', exact: true }).click()
  await dialog(page).getByRole('button', { name: 'Confirm deletion' }).click()
  await expect(dialog(page)).toHaveCount(0)
  await expect(page.getByRole('navigation', { name: 'Order pagination' })).toContainText(
    'Page 1 of 1',
  )
  await expect(page.getByRole('status').filter({ hasText: 'HM-2026-000021 deleted' })).toBeVisible()
})

test('create uses logged-in admin, no customer override, and CARD does not process payment', async ({
  page,
}) => {
  const state = await setup(page)
  await page.goto('/#/orders')
  await page.getByRole('button', { name: 'Create order', exact: true }).click()
  await expect(dialog(page)).toContainText('This order is for Alex Morgan')
  await expect(dialog(page)).toContainText("cannot place an order on another customer's behalf")
  await dialog(page).getByLabel('Product', { exact: true }).selectOption(productId)
  await dialog(page).getByLabel('Payment type', { exact: true }).selectOption('CARD')
  await expect(dialog(page)).toContainText('No card payment will be processed')
  await dialog(page).getByLabel('Customer notes (optional)').fill('A gift for a friend')
  await dialog(page).getByRole('button', { name: 'Place Order', exact: true }).click()
  await expect(dialog(page).getByRole('heading', { name: 'HM-2026-000100' })).toBeVisible()
  expect(state.requests.find((r) => r.method === 'POST').body).toEqual({
    productId,
    paymentType: 'CARD',
    customerNotes: 'A gift for a friend',
  })
  expect(state.orders[0].userId).toBe(adminId)
  await expect(dialog(page)).toContainText('10 Studio Street')
})

test('missing delivery profile prevents create and errors retain drafts with close confirmation', async ({
  page,
}) => {
  const state = await setup(page, { missingProfile: true })
  await page.goto('/#/orders')
  await page.getByRole('button', { name: 'Create order', exact: true }).click()
  await dialog(page).getByLabel('Product', { exact: true }).selectOption(productId)
  await expect(dialog(page)).toContainText('Your profile needs')
  await expect(
    dialog(page).getByRole('button', { name: 'Place Order', exact: true }),
  ).toBeDisabled()
  await dialog(page).getByRole('button', { name: 'Cancel' }).click()
  await openFirst(page)
  await dialog(page).getByLabel('Admin notes').fill('Preserve my notes')
  state.writeStatus = 403
  await dialog(page).getByRole('button', { name: 'Save notes and image' }).click()
  await expect(dialog(page).getByRole('alert')).toContainText('Only admins can manage orders')
  await expect(dialog(page).getByLabel('Admin notes')).toHaveValue('Preserve my notes')
  await dialog(page).getByRole('button', { name: 'Close details' }).click()
  await expect(dialog(page)).toContainText('You have unsaved changes')
  await dialog(page).getByRole('button', { name: 'Keep editing' }).click()
  await expect(dialog(page).getByLabel('Admin notes')).toHaveValue('Preserve my notes')
  await dialog(page).getByRole('button', { name: 'Close details' }).click()
  await dialog(page).getByRole('button', { name: 'Discard changes' }).click()
  await expect(dialog(page)).toHaveCount(0)
})

test('list, customer filter and detail failures have independent retry states', async ({
  page,
}) => {
  const state = await setup(page, { listError: true, userError: true })
  await page.goto('/#/orders')
  await expect(
    page.getByRole('alert').filter({ hasText: 'Orders temporarily unavailable' }),
  ).toBeVisible()
  await expect(
    page.getByRole('alert').filter({ hasText: 'Customer filter unavailable' }),
  ).toBeVisible()
  state.listError = false
  await page.getByRole('button', { name: 'Try again' }).click()
  await expect(page.getByRole('button', { name: 'View details HM-2026-000001' })).toBeVisible()
  state.userError = false
  await page.getByRole('button', { name: 'Retry customers' }).click()
  await expect(page.getByLabel('Customer', { exact: true })).toBeEnabled()
  state.detailError = true
  await openFirst(page)
  await expect(dialog(page).getByRole('alert')).toContainText('Order details unavailable')
  state.detailError = false
  await dialog(page).getByRole('button', { name: 'Try again' }).click()
  await expect(dialog(page).getByLabel('Admin notes')).toHaveValue('Handle with care')
})

test('Orders layout and side panel remain usable on desktop and mobile', async ({ page }) => {
  await setup(page, {
    orders: [
      makeOrder(0),
      {
        ...makeOrder(1),
        status: 'CREATING',
        paymentStatus: 'PAID',
        paymentType: 'CASH_ON_DELIVERY',
      },
      {
        ...makeOrder(2),
        status: 'COMPLETED',
        paymentStatus: 'REFUNDED',
        paymentType: 'CASH_ON_PICKUP',
      },
    ],
  })
  await page.setViewportSize({ width: 1600, height: 1050 })
  await page.goto('/#/orders')
  await expect(page.getByRole('button', { name: 'View details HM-2026-000001' })).toBeVisible()
  await page.screenshot({ path: 'test-results/orders-desktop.png', fullPage: true })
  await openFirst(page)
  await expect(dialog(page).getByRole('button', { name: 'Move to next status' })).toBeVisible()
  await page.screenshot({ path: 'test-results/order-details-desktop.png', fullPage: true })
  await dialog(page).getByRole('button', { name: 'Close details' }).click()
  await expect(dialog(page)).toHaveCount(0)
  await page.setViewportSize({ width: 390, height: 844 })
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    .toBe(true)
  await openFirst(page)
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    .toBe(true)
  await dialog(page).getByLabel('Admin notes').fill('Mobile draft')
  await dialog(page).getByRole('button', { name: 'Save notes and image' }).click()
  await expect(dialog(page).getByRole('status')).toContainText('Notes and image saved')
  await page.screenshot({ path: 'test-results/order-details-mobile.png', fullPage: false })
})

test('order component pricing uses saved unit prices; inventory conflicts preserve the draft and successful orders refresh stock', async ({
  page,
}) => {
  const state = await setup(page, { inventoryConflict: true })
  await page.goto('/#/orders')
  await openFirst(page)
  const row = dialog(page).getByRole('row').filter({ hasText: 'Pearls' })
  await expect(row).toContainText('\u20ac1.00')
  await expect(row).toContainText('\u20ac24.00')
  await expect(row).not.toContainText('\u20ac1.50')
  await dialog(page).getByRole('button', { name: 'Close details' }).click()
  await expect(dialog(page)).toHaveCount(0)
  await page.getByRole('button', { name: 'Create order', exact: true }).click()
  await dialog(page).getByLabel('Product', { exact: true }).selectOption(productId)
  await expect(dialog(page)).toContainText('24 required / 50 available')
  await dialog(page).getByLabel('Customer notes (optional)').fill('Keep this note')
  await dialog(page).getByRole('button', { name: 'Place Order', exact: true }).click()
  await expect(dialog(page).getByRole('alert')).toContainText('Pearls: requested 24, available 4')
  await expect(dialog(page).getByLabel('Customer notes (optional)')).toHaveValue('Keep this note')
  state.inventoryConflict = false
  await dialog(page).getByRole('button', { name: 'Place Order', exact: true }).click()
  await expect(
    page.getByRole('status').filter({ hasText: 'Component stock refreshed' }),
  ).toBeVisible()
  const lastPost = state.requests.findLastIndex((r) => r.path === '/orders' && r.method === 'POST')
  expect(
    state.requests
      .slice(lastPost + 1)
      .some((r) => r.path === '/categories/category/sub-categories'),
  ).toBe(true)
})

test('a failed stock refresh after creation reports success without offering to resubmit the order', async ({
  page,
}) => {
  const state = await setup(page)
  await page.goto('/#/orders')
  await page.getByRole('button', { name: 'Create order', exact: true }).click()
  await dialog(page).getByLabel('Product', { exact: true }).selectOption(productId)
  await expect(dialog(page)).toContainText('50 available')
  await page.route('**/categories/category/sub-categories', (route) =>
    fulfill(route, { message: 'Stock unavailable' }, 503),
  )
  await dialog(page).getByRole('button', { name: 'Place Order', exact: true }).click()
  await expect(
    page.getByRole('status').filter({ hasText: 'Order saved, but stock could not be refreshed' }),
  ).toBeVisible()
  await expect(dialog(page).getByRole('heading', { name: 'HM-2026-000100' })).toBeVisible()
  expect(state.requests.filter((r) => r.path === '/orders' && r.method === 'POST')).toHaveLength(1)
})

test('pending placement disables submission and refreshes subcategories without client stock writes', async ({
  page,
}) => {
  const state = await setup(page)
  let release
  const pending = new Promise((resolve) => {
    release = resolve
  })
  await page.route('**/api/v1/orders', async (route) => {
    if (route.request().method() === 'POST') await pending
    await route.fallback()
  })
  await page.goto('/#/orders')
  await page.getByRole('button', { name: 'Create order', exact: true }).click()
  await dialog(page).getByLabel('Product', { exact: true }).selectOption(productId)
  await dialog(page).getByRole('button', { name: 'Place Order', exact: true }).click()
  await expect(dialog(page).getByRole('button', { name: 'Placing order...' })).toBeDisabled()
  await dialog(page)
    .locator('form')
    .evaluate((form) => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    })
  release()
  await expect(
    page.getByRole('status').filter({ hasText: 'Component stock refreshed' }),
  ).toBeVisible()
  expect(state.requests.filter((r) => r.path === '/orders' && r.method === 'POST')).toHaveLength(1)
  expect(state.requests.some((r) => r.path === '/sub-categories' && r.method === 'GET')).toBe(true)
  expect(state.requests.some((r) => r.path.includes('sub-categories') && r.method !== 'GET')).toBe(
    false,
  )
})
