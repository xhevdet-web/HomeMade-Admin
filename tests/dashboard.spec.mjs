import { test, expect } from '@playwright/test'
const admin = { id: 'admin', firstName: 'Alex', lastName: 'Morgan', role: 'ADMIN', isActive: true }
async function setup(page, options = {}) {
  const state = { failed: false, empty: false, total: 321, requests: [], ...options }
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
  await page.route('**/api/v1/**', async (route) => {
    const req = route.request(),
      url = new URL(req.url()),
      path = url.pathname
    expect(req.headers().authorization).toBe(`Bearer ${token}`)
    state.requests.push({ path, method: req.method(), query: Object.fromEntries(url.searchParams) })
    const reply = (data, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) })
    if (path.endsWith('/auth/me')) return reply(admin)
    if (path.endsWith('/users'))
      return state.failed
        ? reply({ message: 'Users unavailable' }, 503)
        : reply(state.empty ? [] : [admin, { id: 'customer' }])
    if (path.endsWith('/products'))
      return reply(state.empty ? [] : [{ id: 'p1' }, { id: 'p2' }, { id: 'p3' }])
    if (path.endsWith('/orders')) {
      const status = url.searchParams.get('status'),
        payment = url.searchParams.get('paymentStatus')
      const count = state.empty
        ? 0
        : status
          ? {
              ORDERED: 100,
              CREATING: 50,
              CREATED: 40,
              READY_FOR_COURIER: 30,
              PICKED_UP_BY_COURIER: 20,
              COMPLETED: 81,
            }[status]
          : payment
            ? { UNPAID: 200, PAID: 100, FAILED: 20, REFUNDED: 1 }[payment]
            : state.total
      return reply({
        data:
          state.empty || status || payment
            ? []
            : [
                {
                  id: 'o1',
                  orderNumber: 'HM-2026-123',
                  user: { firstName: 'Maya', lastName: 'Stone' },
                  createdAt: '2026-09-27T10:00:00Z',
                  totalPrice: 2999,
                  status: 'COMPLETED',
                  paymentStatus: 'UNPAID',
                },
              ],
        meta: {
          page: 1,
          limit: Number(url.searchParams.get('limit')),
          total: count,
          totalPages: Math.ceil(count / 5),
        },
      })
    }
    return reply({ message: 'Unexpected endpoint' }, 404)
  })
  return state
}
const metric = (page, name) =>
  page
    .locator('.hm-metric')
    .filter({ has: page.getByText(name, { exact: true }) })
    .locator('.hm-dashboard-value')
test('dashboard uses live paginated totals, independent statuses, recent order currency and read-only requests', async ({
  page,
}) => {
  const state = await setup(page)
  await page.goto('/#/dashboard')
  for (const [name, count] of [
    ['Users', '2'],
    ['Products', '3'],
    ['Total Orders', '321'],
    ['Completed Orders', '81'],
    ['Unpaid Orders', '200'],
    ['Paid Orders', '100'],
  ])
    await expect(metric(page, name)).toHaveText(count)
  await expect(page.getByRole('row').filter({ hasText: 'HM-2026-123' })).toContainText(
    '\u20ac29.99',
  )
  expect(state.requests.every((r) => r.method === 'GET')).toBe(true)
  expect(state.requests.some((r) => r.query.status === 'COMPLETED' && r.query.limit === '1')).toBe(
    true,
  )
  expect(state.requests.some((r) => r.query.paymentStatus === 'UNPAID')).toBe(true)
  state.total = 322
  await page.getByRole('button', { name: 'Refresh stats' }).click()
  await expect(metric(page, 'Total Orders')).toHaveText('322')
  await page.setViewportSize({ width: 1440, height: 1080 })
  await page.screenshot({ path: 'test-results/dashboard-live.png', fullPage: true })
})
test('partial failures keep working stats and retry; empty data displays zero', async ({
  page,
}) => {
  const state = await setup(page, { failed: true })
  await page.goto('/#/dashboard')
  await expect(metric(page, 'Users')).toHaveText('Unavailable')
  await expect(metric(page, 'Products')).toHaveText('3')
  await expect(page.getByRole('alert')).toContainText('Some statistics')
  state.failed = false
  state.empty = true
  await page.getByRole('button', { name: 'Retry statistics' }).click()
  await expect(metric(page, 'Users')).toHaveText('0')
  await expect(metric(page, 'Total Orders')).toHaveText('0')
  await expect(page.getByRole('heading', { name: 'No orders yet' })).toBeVisible()
})
test('mobile dashboard fits viewport and links to management pages', async ({ page }) => {
  await setup(page)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/#/dashboard')
  await expect(metric(page, 'Unpaid Orders')).toHaveText('200')
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    .toBe(true)
  await page.getByRole('link', { name: 'Open users', exact: true }).click()
  await expect(page).toHaveURL(/#\/users$/)
})
