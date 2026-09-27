# Users management

The Users dashboard supports Add, Edit and confirmed Delete with JWT authentication. Successful changes refresh the directory; API failures retain the form and offer retry. Pending writes disable submission and dismissal.

Add includes first/last name, email, password (12-128 characters), and optional username, phone, country, address and postal code. The existing API creates active CUSTOMER accounts. Edit supports the same profile fields and the Active toggle; password and role changes are not exposed. Optional fields can be cleared. Editing your own account updates the admin session profile; deleting or deactivating your own account warns first and signs you out on success.

Backend: all `/api/v1/users` routes now require JWT and a current ADMIN role, including list and detail. Unauthenticated requests return 401; CUSTOMER requests return 403. **POST /users is now admin-only and cannot be used for public/mobile signup.** Linked-record deletion returns 409 with guidance to deactivate instead. Passwords are hashed server-side and never returned.

Frontend files: `src/views/base/users/Users.js`, `UserDialog.js`, `tests/users.spec.mjs`.
Backend files: `src/common/guards/admin.guard.ts`, `src/modules/users/users.controller.ts`, `users.module.ts`, `users.service.ts`, `dto/update-user.dto.ts`, `test/users/users.e2e-spec.ts`.

Tests use isolated mocks and do not modify live accounts. Browser tests include successful CRUD, null optional fields, confirmation cancellation, input validation, duplicate-email/403/401 errors, detail retry, linked-record errors, CUSTOMER rejection, mobile layout and duplicate-submission prevention.

Validation: 44 browser regressions passed on the full run; the remaining existing test passed after its email-cell selector was made exact for the new action column. Backend: 227 HTTP and 28 unit tests passed; 16 opt-in inventory database tests were skipped. Both builds, backend lint, targeted frontend ESLint and whitespace checks passed. The live backend was restarted and GET /api/v1/users without a token returned 401. No live users were modified.
