# Category and SubCategory management

Protected admin routes: `#/categories` and `#/sub-categories`. Both appear under Management in the existing sidebar.

The screens use the existing shared Axios client and `VITE_APP_API` (`http://localhost:3000/api/v1`). No second client, Redux architecture change, or backend change was introduced.

| Operation | Category | SubCategory |
| --- | --- | --- |
| List | GET /categories | GET /sub-categories |
| Details and edit initialization | GET /categories/:id | GET /sub-categories/:id |
| Create | POST /categories | POST /sub-categories |
| Update | PATCH /categories/:id | PATCH /sub-categories/:id |
| Confirmed deletion | DELETE /categories/:id | DELETE /sub-categories/:id |

Contracts were checked against the adjacent NestJS controllers, services, DTOs and Prisma schema. Lists return arrays, detail/create/update return objects, and deletion returns 204 with no body.

Category fields: name, description, imageUrl, isActive, sortOrder.

SubCategory fields: categoryId, name, description, imageUrl, color, type, price, stock, isActive, sortOrder. The Category dropdown fetches GET /categories every time a create/edit form opens, displays category names and uses category IDs as option values. Editing preserves the assigned category. Both active and inactive parent categories remain selectable, matching the current backend contract. Missing parent options must be replaced by an available category before saving.

Price is an integer amount in cents, as defined by the backend (1500 represents 15.00). Price, stock and sortOrder are nonnegative 32-bit integers; active status is boolean. Optional empty text/image fields are submitted as null so existing values can be cleared. Names are trimmed, required and limited to 200 characters; image URLs must use HTTP or HTTPS.

All screens include loading, retryable error and empty states, local search, refresh and mutation success feedback. Save failures retain entered values. A failed dropdown request blocks saving and offers retry; an empty category list links to Categories and prevents creating an orphan subcategory. Save/delete controls prevent duplicate submission, and dismissal is blocked during a mutation.

Deletion requires a confirmation dialog. Because the actual Prisma relation uses onDelete: Cascade, category confirmation explicitly warns that all child subcategories will also be deleted. The dialog fetches current details before allowing deletion. Failed deletion leaves the record and dialog in place with the backend message.

Implementation files:

- src/views/management/CatalogPage.js: shared searchable directory and dialog lifecycle.
- src/views/management/CatalogDialog.js: detail view, validated create/edit forms, dropdown loading and delete confirmation.
- src/views/management/catalogFields.js: resource configuration and exact request payload mapping.
- src/navigation.js and src/components/AppContent.js: protected route integration.
- src/scss/_homemade.scss: table actions, responsive controls and modal styling.
- tests/catalog.spec.mjs: isolated browser tests for both CRUD flows, payload types, dropdown behavior, error recovery, validation, cancellation and mobile layout.
- tests/admin-auth.spec.mjs: includes SubCategories in protected route checks and no longer treats Categories as an unfinished page.

Verification uses isolated API fixtures; no live catalog data is created or deleted. Existing backend authentication/authorization is unchanged.

Validation: production build and targeted ESLint checks pass. All 13 existing authentication/navigation scenarios pass; the six catalog browser scenarios cover CRUD, error handling, validation and mobile layout. Vite retains its existing large-bundle advisory.
