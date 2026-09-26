# HomeMade Admin implementation report

Category management update: Categories and SubCategories now have full list, detail, create, edit and confirmed delete screens. See [Category management](CATEGORY_MANAGEMENT.md) for the current API integration. References below to Categories being a placeholder describe the initial dashboard shell and are superseded by that update.

## 1. Existing architecture discovered

Inspected the frontend entrypoints, both navigation files, layouts, Login screen, Redux actions/middleware/reducers/selectors/store, HTTP helpers, Sass entrypoint, package scripts, and the adjacent `homeMadeApi` backend before editing.

- React 18 + Vite 6 with CoreUI components and Sass modules.
- Classic Redux `createStore`, `combineReducers`, actions and middleware; Redux Persist stores state in localStorage under `persist:#VORAE-2`.
- HashRouter in `App.js`, route content in `AppContent`, and the existing `DefaultLayout`, sidebar, header, footer and route synchronization hook.
- `navigation.js` already supplied local navigation following the earlier login-removal change. `_nav.js` was an unused older menu.
- The old login expected `access_token` and a `status` wrapper and decoded `user_data` from the JWT. Neither matches this NestJS backend. It also contained client-side JWT signing using a Vite secret variable.
- The old Axios instance used a different fallback API URL and a `privilageid` header. The backend only permits Content-Type and Authorization in its CORS configuration.
- The prior Sass migration is preserved. No Redux Toolkit/RTK Query migration, replacement state system, or backend changes were made.

## 2. Files modified in this task

| Area | Files |
| --- | --- |
| Configuration and documentation | `.env` (local/ignored), `.gitignore`, `package.json`, `package-lock.json` (already ignored), `eslint.config.js`, `vite.config.js`, `index.html`, `README.md` |
| Entry and routing | `src/App.js`, `src/main.js`, `src/navigation.js`, `src/_nav.js`, `src/layout/DefaultLayout.js` |
| Existing layout components | `src/components/AppContent.js`, `AppHeader.js`, `AppSidebar.js`, `AppSidebarNav.js`, `AppFooter.js`, `header/AppHeaderDropdown.js` |
| Auth helpers and HTTP compatibility | `src/_helpers/HandleLogOut.js`, `IsTokenExpired.js`, `src/utils/axiosInstance.js`, `useAxios.js` |
| Redux | `src/redux/actions/authActionTypes.js`, `middleware/authMiddleware.js`, `reducers/authReducer.js`, `reducers/sidebarReducer.js`, `selectors/authSelectors.js`, `store.js` |
| Existing pages | `src/views/pages/login/Login.js`, `pages/page404/Page404.js`, `base/users/Users.js`, `dashboard/Dashboard.js` |
| Styling | `src/scss/style.scss` |

Other working-tree changes from the earlier login bypass and Sass migration were retained. In particular, `_theme.scss`, `examples.scss`, `sidebarSelector.js`, and the null-safety changes in older list/role/navigation pages were not rolled back.

## 3. Files created

- `.env.example`
- `public/homemade.svg`
- `src/_helpers/api.js`
- `src/hooks/useAdminSession.js`
- `src/components/EmptyState.js`
- `src/views/management/ManagementPage.js`
- `src/scss/_homemade.scss`
- `playwright.config.mjs`
- `tests/admin-auth.spec.mjs`
- `HOMEMADE_IMPLEMENTATION.md` (this report)

`navigation.js` existed at the start of this task from the preceding work, although Git still shows it as an untracked new file.

## 4. Authentication changes

1. Login sends exactly `{ email, password }` to `POST /auth/login`, with no Authorization header and no client-side signing or secret.
2. Reads the confirmed response `{ accessToken, expiresIn, user }` and stores `accessToken` in the existing Redux auth token field.
3. Requests `GET /auth/me`; the role is checked from this response, not from the login payload, decoded JWT profile, or cached Redux user.
4. Only `role === 'ADMIN'` enters the layout. CUSTOMER or any other role clears the token and displays an access-denied message.
5. PersistGate waits for storage rehydration. Every restored token is revalidated with `/auth/me`, with a visible loading state and no protected-content flash.
6. Malformed or expired tokens are cleared; an idle-session timer also expires the session. JWT decoding is used only for the expiry hint; signature verification remains the backend's job.
7. A network/server failure during session verification blocks access and offers Retry or Back to sign in. It is not treated as a valid session.
8. Logout clears Redux auth/sidebar state and the persisted token. There is no backend logout or token revocation handler to call.

The backend's Users controller currently has **no JWT or ADMIN guard**. Frontend restrictions do not secure that API. Backend authorization remains required and was not changed by this task.

## 5. API helper changes

`src/_helpers/api.js` is the only `axios.create` call. Its base URL is `import.meta.env.VITE_APP_API`, with a 15-second timeout. The previous `src/utils/axiosInstance.js` re-exports that same instance, so older imports do not create a second client.

The request interceptor adds `Authorization: Bearer <token>`. The response interceptor clears the current session on authenticated 401s and ignores late 401s belonging to another token. Login 401s retain the credentials error instead of producing a session-expiry redirect. The legacy `useAxios` hook delegates session handling to this interceptor.

Local `.env` and `.env.example` contain:

```dotenv
VITE_APP_API=http://localhost:3000/api/v1
VITE_IMAGES_API=http://localhost:3000/
VITE_ENV=development
SASS_QUIET_DEPS=true
```

No real secrets are included. Vite reads `SASS_QUIET_DEPS` explicitly for dependency warnings; the application's previous Sass module migration remains intact.

Frontend Vite now runs on **8081**, leaving **3000** to NestJS. The backend's default development CORS origins already allow localhost and 127.0.0.1 on 8081. `strictPort` prevents silently switching to a disallowed origin. Custom backend CORS environment settings must also allow the frontend origin.

## 6. Routes and layout

| Hash route | Behavior |
| --- | --- |
| `#/login` | Public login; an already verified admin goes to the dashboard |
| `#/` | Protected; redirects to `#/dashboard` |
| `#/dashboard` | Protected HomeMade dashboard shell |
| `#/users` | Protected, read-only live user directory with local search, refresh, loading/error/empty states |
| `#/categories` | Protected integration placeholder |
| `#/products` | Protected integration placeholder |
| `#/components` | Protected integration placeholder |
| `#/designs` | Protected integration placeholder |
| `#/orders` | Protected integration placeholder |
| Unknown paths | Login for unauthenticated visitors; a safe 404 inside the admin layout for admins |

Navigation groups are Dashboard, Management, and Sales, with verified admin information and Sign out at the bottom. There was no functional Settings route to retain, so no fake Settings entry was added. Old role/list/navigation-management screens remain in the source but are not exposed as HomeMade routes.

The dashboard includes Total Orders, Revenue, Customers and Designs cards plus Sales Overview, Order Status and Recent Orders. Unavailable data is represented by dashes and explicit pending-feature states, never fabricated counts, revenue, trends, orders or charts. There are no calls to hypothetical statistics endpoints.

The visual treatment extends CoreUI with deep navy, steel blue, off-white, warm beige, gold details, serif headings, rounded cards and responsive spacing. The sidebar closes after selecting a route on mobile. Existing Redux-driven layout behavior is retained.

## 7. Redux changes

Classic Redux is retained. Existing token/user/clear actions are reused, with `SET_AUTH_STATUS` added for session checking and errors. The auth reducer marks authentication ready only after an ADMIN user is returned. Middleware safely rejects malformed/expired token assignments rather than assuming JWTs contain `user_data`.

A Redux Persist transform stores only the token for auth, discarding stale cached identity/role/status on rehydration. Existing UI and sidebar state architecture is retained. An unreachable `types.CLEAR` case that referenced a missing export was removed from the sidebar reducer.

## 8. Existing backend endpoints connected

Contracts were verified against `homeMadeApi/src/modules/auth/auth.controller.ts`, `auth.service.ts`, `common/types/authenticated-user.type.ts`, and `modules/users/users.controller.ts` / `users.service.ts`.

| Endpoint | Integration and verification |
| --- | --- |
| `POST /auth/login` | Login form wired to the actual accessToken contract; browser-tested with isolated fixtures |
| `GET /auth/me` | Session restoration and ADMIN authorization wired; browser-tested with fixtures; live unauthenticated request confirmed HTTP 401 and correct CORS origin |
| `GET /users` | User directory wired to the actual direct array response and camelCase fields; browser-tested with isolated fixtures |

The live API root responded HTTP 200. A real authenticated login and live user-directory response were **not** tested because no admin credentials were provided. Browser fixtures are confined to the test file and do not enter production code or write to the backend.

## 9. Backend endpoints still missing

| Feature | Inspected backend status |
| --- | --- |
| Dashboard | No statistics, revenue, sales overview, order status or recent-orders handlers |
| Users | List/detail/create/update/delete handlers exist. This task connects listing only. ADMIN guards, pagination and search contracts are absent; directory search is local. No mutations are exposed in this shell. |
| Categories | `CategoriesController` declares the categories prefix but has no handlers |
| Products | `ProductsController` declares the products prefix but has no handlers |
| Components | The existing customization-items controller has no handlers; no component management contract is defined |
| Designs | `DesignsController` declares the designs prefix but has no handlers |
| Orders | No Orders controller/module found |

DTO or service stub files alone are not treated as working endpoints. The unfinished screens issue no requests and show no pretend management actions.

## 10. Validation

- Production build: passed; no Sass import warnings. Vite still reports the existing large-bundle advisory.
- Browser tests: **13 passed** (final complete run). Scenarios cover protected routes, ADMIN login, CUSTOMER rejection, wrong credentials, restored-session loading/deep links, malformed/expired/server-rejected tokens, network retry, idle expiry, user response mapping/filtering/401 handling, placeholder routes, 404 and mobile layout/navigation.
- Targeted ESLint check of all HomeMade changes: passed with zero errors and zero warnings. Git diff whitespace check: passed.
- Desktop and mobile screenshots were inspected. Test screenshots use clearly isolated fixture accounts.
- Lint initially could not start because the existing config imported the uninstalled `eslint-plugin-react-refresh`. The config now uses the already installed React plugin, recognizes JSX references and Node tooling, and excludes generated build/test output.
- Full lint now runs and reports **21 existing errors and 11 warnings** in legacy template files. Every error was compared with the original Git HEAD source using the repaired config: **21 pre-existing errors, zero new errors**. The new HomeMade modules have no lint errors or warnings. Legacy issues include unused variables, unsafe optional chaining in NavPrivilage, and an undefined handler in the old RolePrivilege screen.
- No backend source files or real accounts were modified.

Run locally:

```powershell
npm.cmd install
npm.cmd run dev
# http://localhost:8081/#/login
npm.cmd run build
npm.cmd run test:e2e
npm.cmd run lint
```

Browser tests use installed Microsoft Edge on Windows. Other platforms use Playwright Chromium (`npx playwright install chromium` once). Tests start an isolated local Vite server on port 8081; stop an existing server on that port before running them.
