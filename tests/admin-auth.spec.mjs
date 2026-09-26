import { test, expect } from '@playwright/test'

// Isolated API fixtures only; never seed or mutate the live backend.
const admin = {
  id: 'test-admin',
  firstName: 'Alex',
  lastName: 'Morgan',
  email: 'admin@example.test',
  role: 'ADMIN',
  isActive: true,
}
const customer = { ...admin, id: 'test-customer', role: 'CUSTOMER' }
const jwt = (seconds = 3600) =>
  `${Buffer.from(JSON.stringify({ alg: 'HS256' })).toString('base64url')}.${Buffer.from(JSON.stringify({ sub: admin.id, exp: Math.floor(Date.now() / 1000) + seconds })).toString('base64url')}.test-signature`
const fulfill = (route, body, status = 200) =>
  route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })
const seed = (page, token) =>
  page.addInitScript((token) => {
    if (!sessionStorage.getItem('test-seeded')) {
      localStorage.setItem(
        'persist:#VORAE-2',
        JSON.stringify({
          auth: JSON.stringify({ token, is_authenticated: true, user_data: { role: 'ADMIN' } }),
          _persist: JSON.stringify({ version: -1, rehydrated: true }),
        }),
      )
      sessionStorage.setItem('test-seeded', 'yes')
    }
  }, token)
const signIn = async (page) => {
  await page.goto('/#/login')
  await page.getByLabel('Email address', { exact: true }).fill(admin.email)
  await page.getByLabel('Password', { exact: true }).fill('not-a-real-password')
  await page.getByRole('button', { name: 'Sign in to HomeMade' }).click()
}
const expectLoggedOut = async (page) => {
  await expect(page.getByRole('heading', { name: 'Welcome back', exact: true })).toBeVisible()
  await expect(page).toHaveURL(/#\/login$/)
  await expect
    .poll(() =>
      page.evaluate(() => {
        const saved = JSON.parse(localStorage.getItem('persist:#VORAE-2') || '{}')
        return saved.auth ? JSON.parse(saved.auth).token : null
      }),
    )
    .toBeNull()
}

test.beforeEach(async ({ page }) => {
  await page.route('http://localhost:3000/api/v1/**', (route) =>
    fulfill(route, { message: 'Unexpected API request in test' }, 500),
  )
})

test('all admin routes redirect unauthenticated visitors to login', async ({ page }) => {
  for (const path of [
    '/',
    '/dashboard',
    '/users',
    '/categories',
    '/sub-categories',
    '/products',
    '/components',
    '/designs',
    '/orders',
  ]) {
    await page.goto(`/#${path}`)
    await expectLoggedOut(page)
  }
})

test('admin login uses the actual contract, verifies me, attaches bearer, and logs out', async ({
  page,
}) => {
  const token = jwt()
  let loginBody
  let authHeader
  await page.route('**/api/v1/auth/login', (route) => {
    loginBody = route.request().postDataJSON()
    expect(route.request().headers().authorization).toBeUndefined()
    return fulfill(route, { accessToken: token, expiresIn: 3600, user: admin })
  })
  await page.route('**/api/v1/auth/me', (route) => {
    authHeader = route.request().headers().authorization
    return fulfill(route, admin)
  })
  await signIn(page)
  await expect(page.getByRole('heading', { name: 'Welcome back, Alex' })).toBeVisible()
  expect(loginBody).toEqual({ email: admin.email, password: 'not-a-real-password' })
  expect(authHeader).toBe(`Bearer ${token}`)
  await page.getByRole('button', { name: 'Sign out', exact: true }).click()
  await expectLoggedOut(page)
  await page.reload()
  await expectLoggedOut(page)
})

test('customer role from me overrides the login payload and persisted admin claims', async ({
  page,
}) => {
  const token = jwt()
  await page.route('**/api/v1/auth/login', (route) =>
    fulfill(route, { accessToken: token, expiresIn: 3600, user: admin }),
  )
  await page.route('**/api/v1/auth/me', (route) => fulfill(route, customer))
  await signIn(page)
  await expect(page.getByRole('alert')).toContainText('Access denied')
  await expectLoggedOut(page)
  await seed(page, token)
  await page.reload()
  await expectLoggedOut(page)
  await expect(page.getByRole('alert')).toContainText('Access denied')
})

test('bad credentials show the backend message', async ({ page }) => {
  await page.route('**/api/v1/auth/login', (route) =>
    fulfill(route, { message: 'Invalid email or password' }, 401),
  )
  await signIn(page)
  await expect(page.getByRole('alert')).toContainText('Invalid email or password')
  await expectLoggedOut(page)
})

test('restored token shows loading, validates me and keeps the deep link', async ({ page }) => {
  await seed(page, jwt())
  let release
  const gate = new Promise((resolve) => {
    release = resolve
  })
  await page.route('**/api/v1/auth/me', async (route) => {
    await gate
    await fulfill(route, admin)
  })
  await page.goto('/#/categories')
  await expect(page.getByRole('status')).toContainText('Checking your session')
  await expect(page.getByRole('heading', { name: 'Categories', exact: true })).toHaveCount(0)
  release()
  await expect(page.getByRole('heading', { name: 'Categories', exact: true })).toBeVisible()
  await expect(page).toHaveURL(/#\/categories$/)
})

for (const [name, token] of [
  ['expired', jwt(-60)],
  ['malformed', 'not-a-jwt'],
]) {
  test(`${name} persisted token is cleared without calling me`, async ({ page }) => {
    let requests = 0
    await seed(page, token)
    await page.route('**/api/v1/auth/me', (route) => {
      requests++
      return fulfill(route, admin)
    })
    await page.goto('/#/dashboard')
    await expectLoggedOut(page)
    await expect(page.getByRole('alert')).toContainText('expired')
    expect(requests).toBe(0)
  })
}

test('server-rejected token is cleared', async ({ page }) => {
  await seed(page, jwt())
  await page.route('**/api/v1/auth/me', (route) => fulfill(route, { message: 'Unauthorized' }, 401))
  await page.goto('/#/dashboard')
  await expectLoggedOut(page)
})

test('session check network failure blocks access and can be retried', async ({ page }) => {
  await seed(page, jwt())
  let fail = true
  await page.route('**/api/v1/auth/me', (route) =>
    fail ? route.abort('failed') : fulfill(route, admin),
  )
  await page.goto('/#/dashboard')
  await expect(page.getByRole('heading', { name: 'We couldn’t verify your session' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Welcome back, Alex' })).toHaveCount(0)
  fail = false
  await page.getByRole('button', { name: 'Try again' }).click()
  await expect(page.getByRole('heading', { name: 'Welcome back, Alex' })).toBeVisible()
})

test('idle session expires without another request', async ({ page }) => {
  await page.clock.install()
  await seed(page, jwt(60))
  await page.route('**/api/v1/auth/me', (route) => fulfill(route, admin))
  await page.goto('/#/dashboard')
  await expect(page.getByRole('heading', { name: 'Welcome back, Alex' })).toBeVisible()
  await page.clock.fastForward(61000)
  await expectLoggedOut(page)
})

test('users uses the array contract, filters, and handles a protected API 401', async ({
  page,
}) => {
  const token = jwt()
  await seed(page, token)
  await page.route('**/api/v1/auth/me', (route) => fulfill(route, admin))
  let fail = false
  await page.route('**/api/v1/users', (route) => {
    expect(route.request().headers().authorization).toBe(`Bearer ${token}`)
    return fail
      ? fulfill(route, { message: 'Unauthorized' }, 401)
      : fulfill(route, [
          admin,
          { ...customer, firstName: 'Jordan', email: 'customer@example.test' },
        ])
  })
  await page.goto('/#/users')
  await expect(page.getByRole('cell', { name: admin.email })).toBeVisible()
  await page.getByRole('searchbox', { name: 'Search users' }).fill('Jordan')
  await expect(page.getByRole('cell', { name: admin.email })).toHaveCount(0)
  await expect(page.getByRole('cell', { name: 'customer@example.test' })).toBeVisible()
  fail = true
  await page.getByRole('button', { name: 'Refresh users' }).click()
  await expectLoggedOut(page)
})

test('dashboard and placeholders request no invented endpoints, unknown route is safe', async ({
  page,
}) => {
  const requests = []
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('request', (request) => {
    if (request.url().includes('/api/v1/')) requests.push(request.url())
  })
  await seed(page, jwt())
  await page.route('**/api/v1/auth/me', (route) => fulfill(route, admin))
  await page.setViewportSize({ width: 1440, height: 1080 })
  await page.goto('/#/dashboard')
  await expect(page.getByRole('heading', { name: 'Welcome back, Alex' })).toBeVisible()
  await page.screenshot({ path: 'test-results/homemade-dashboard.png', fullPage: true })
  for (const name of ['Products', 'Components', 'Designs', 'Orders']) {
    await page.getByRole('link', { name, exact: true }).click()
    await expect(page.getByRole('heading', { name: `${name} will live here` })).toBeVisible()
  }
  await page.goto('/#/missing')
  await expect(page.getByRole('heading', { name: 'This page couldn’t be found' })).toBeVisible()
  expect(requests.every((url) => url.endsWith('/auth/me'))).toBe(true)
  expect(errors).toEqual([])
})

test('mobile login and dashboard fit the viewport with working navigation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/#/login')
  await expect(page.getByRole('button', { name: 'Sign in to HomeMade' })).toBeVisible()
  await page.screenshot({ path: 'test-results/homemade-login-mobile.png', fullPage: true })
  await seed(page, jwt())
  await page.route('**/api/v1/auth/me', (route) => fulfill(route, admin))
  await page.goto('/#/dashboard')
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Welcome back, Alex' })).toBeVisible()
  const sidebar = page.locator('.hm-sidebar')
  // Persisted UI may start open; close it for the content screenshot.
  if (await sidebar.evaluate((element) => element.getBoundingClientRect().right > 1)) {
    await sidebar.getByRole('button', { name: 'Close navigation' }).click()
  }
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    .toBe(true)
  await page.screenshot({ path: 'test-results/homemade-dashboard-mobile.png', fullPage: true })
  await page.getByRole('button', { name: 'Toggle navigation' }).click()
  await expect(page.getByRole('link', { name: 'Products', exact: true })).toBeInViewport()
  await page.getByRole('link', { name: 'Products', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Products', exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Products', exact: true })).not.toBeInViewport()
})
