import { test, expect } from '@playwright/test'
const admin = {
  id: 'admin',
  firstName: 'Alex',
  lastName: 'Morgan',
  email: 'admin@example.test',
  role: 'ADMIN',
  isActive: true,
}
const customer = {
  id: 'customer',
  firstName: 'Maya',
  lastName: 'Stone',
  email: 'maya@example.test',
  role: 'CUSTOMER',
  isActive: true,
  phone: '123456',
  address: 'Main Street',
  userName: 'maya',
  country: 'Poland',
  postalCode: '00-001',
}
const dialog = (page) => page.getByRole('dialog')
async function setup(page, options = {}) {
  const state = {
    users: [{ ...customer }],
    requests: [],
    error: null,
    detailError: false,
    role: 'ADMIN',
    ...options,
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
  await page.route('**/api/v1/**', async (route) => {
    const req = route.request(),
      method = req.method(),
      path = new URL(req.url()).pathname.replace('/api/v1', ''),
      body = req.postDataJSON()
    state.requests.push({ method, path, body })
    expect(req.headers().authorization).toBe(`Bearer ${token}`)
    const reply = (data, status = 200) =>
      route.fulfill({
        status,
        contentType: 'application/json',
        body: status === 204 ? '' : JSON.stringify(data),
      })
    if (path === '/auth/me') return reply({ ...admin, role: state.role })
    if (method === 'GET' && path === '/users') return reply(state.users)
    if (method === 'GET')
      return state.detailError
        ? reply({ message: 'User details unavailable' }, 503)
        : reply(state.users.find((user) => path === `/users/${user.id}`))
    if (state.error) return reply({ message: state.error.message }, state.error.status)
    if (method === 'POST') {
      const user = { ...body, id: 'new', role: 'CUSTOMER', isActive: true }
      delete user.password
      state.users.push(user)
      return reply(user, 201)
    }
    const user = state.users.find((user) => path === `/users/${user.id}`)
    if (method === 'PATCH') {
      Object.assign(user, body)
      return reply(user)
    }
    state.users = state.users.filter((item) => item !== user)
    return reply(null, 204)
  })
  return state
}
const fillNew = async (page) => {
  await page.getByRole('button', { name: 'Add User' }).click()
  await dialog(page).getByLabel('First name').fill('Jane')
  await dialog(page).getByLabel('Last name').fill('Doe')
  await dialog(page).getByLabel('Email', { exact: true }).fill('jane@example.test')
  await dialog(page).getByLabel('Password', { exact: true }).fill('StrongPassword123!')
}
test('admin creates, edits, clears optional fields and confirms deletion using JWT and narrow payloads', async ({
  page,
}) => {
  const state = await setup(page)
  await page.goto('/#/users')
  await fillNew(page)
  await dialog(page).getByRole('button', { name: 'Save User' }).click()
  await expect(dialog(page)).toHaveCount(0)
  expect(state.requests.find((r) => r.method === 'POST').body).toEqual({
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane@example.test',
    password: 'StrongPassword123!',
  })
  await expect(page.getByRole('cell', { name: 'jane@example.test', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Edit maya@example.test' }).click()
  await expect(dialog(page).getByLabel('Phone')).toHaveValue('123456')
  await expect(dialog(page).getByLabel('Password', { exact: true })).toHaveCount(0)
  await dialog(page).getByLabel('Phone').fill('')
  await dialog(page).getByLabel('Active', { exact: true }).uncheck()
  await dialog(page).getByRole('button', { name: 'Save User' }).click()
  await expect(dialog(page)).toHaveCount(0)
  const payload = state.requests.find((r) => r.method === 'PATCH').body
  expect(payload.phone).toBeNull()
  expect(payload.isActive).toBe(false)
  expect(payload.role).toBeUndefined()
  expect(payload.password).toBeUndefined()
  await expect(page.getByRole('row').filter({ hasText: 'maya@example.test' })).toContainText(
    'Inactive',
  )
  await page.getByRole('button', { name: 'Delete maya@example.test' }).click()
  await expect(dialog(page)).toContainText('cannot be undone')
  await dialog(page).getByRole('button', { name: 'Cancel' }).click()
  await expect(dialog(page)).toHaveCount(0)
  expect(state.requests.some((r) => r.method === 'DELETE')).toBe(false)
  await page.getByRole('button', { name: 'Delete maya@example.test' }).click()
  await dialog(page).getByRole('button', { name: 'Delete User', exact: true }).click()
  await expect(dialog(page)).toHaveCount(0)
  await expect(page.getByRole('cell', { name: 'maya@example.test', exact: true })).toHaveCount(0)
})
test('validation blocks bad passwords; duplicate and forbidden errors retain drafts; expired sessions sign out', async ({
  page,
}) => {
  const state = await setup(page)
  await page.goto('/#/users')
  await fillNew(page)
  await dialog(page).getByLabel('Password', { exact: true }).fill('short')
  await dialog(page).getByRole('button', { name: 'Save User' }).click()
  expect(state.requests.some((r) => r.method === 'POST')).toBe(false)
  await dialog(page).getByLabel('Password', { exact: true }).fill('StrongPassword123!')
  for (const error of [
    { status: 409, message: 'Email is already in use' },
    { status: 403, message: 'Only administrators can manage users' },
  ]) {
    state.error = error
    await dialog(page).getByRole('button', { name: 'Save User' }).click()
    await expect(dialog(page).getByRole('alert')).toContainText(error.message)
    await expect(dialog(page).getByLabel('First name')).toHaveValue('Jane')
  }
  state.error = { status: 401, message: 'Session expired' }
  await dialog(page).getByRole('button', { name: 'Save User' }).click()
  await expect(page).toHaveURL(/#\/login$/)
})
test('detail retry and linked-record deletion errors keep the user intact', async ({ page }) => {
  const state = await setup(page, { detailError: true })
  await page.goto('/#/users')
  await page.getByRole('button', { name: 'Delete maya@example.test' }).click()
  await expect(dialog(page).getByRole('alert')).toContainText('User details unavailable')
  await expect(
    dialog(page).getByRole('button', { name: 'Delete User', exact: true }),
  ).toBeDisabled()
  state.detailError = false
  await dialog(page).getByRole('button', { name: 'Try again' }).click()
  state.error = {
    status: 409,
    message: 'This user has linked records. Deactivate the account instead.',
  }
  await dialog(page).getByRole('button', { name: 'Delete User', exact: true }).click()
  await expect(dialog(page).getByRole('alert')).toContainText('Deactivate')
  expect(state.users).toHaveLength(1)
})
test('customer cannot access users or mutation actions', async ({ page }) => {
  const state = await setup(page, { role: 'CUSTOMER' })
  await page.goto('/#/users')
  await expect(page).toHaveURL(/#\/login$/)
  expect(state.requests.some((r) => r.path === '/users')).toBe(false)
  await expect(page.getByRole('button', { name: 'Add User' })).toHaveCount(0)
})
test('mobile user form fits and prevents duplicate submissions while pending', async ({ page }) => {
  const state = await setup(page)
  let release
  const held = new Promise((resolve) => {
    release = resolve
  })
  await page.route('**/api/v1/users', async (route) => {
    if (route.request().method() === 'POST') await held
    await route.fallback()
  })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/#/users')
  await fillNew(page)
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    .toBe(true)
  await page.screenshot({ path: 'test-results/users-mobile.png' })
  await dialog(page).getByRole('button', { name: 'Save User' }).click()
  await expect(dialog(page).getByRole('button', { name: 'Saving...' })).toBeDisabled()
  await dialog(page)
    .locator('form')
    .evaluate((form) =>
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })),
    )
  release()
  await expect(dialog(page)).toHaveCount(0)
  expect(state.requests.filter((r) => r.method === 'POST')).toHaveLength(1)
})
