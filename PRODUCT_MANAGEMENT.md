# Products and components

The protected `#/products` page uses the existing CoreUI layout, classic Redux authentication and shared JWT Axios client. No backend source was changed.

## Form

Product create/edit includes name, description, image URL with preview, category, active status, and a Components section. Each row offers image/name choices, positive integer quantity, optional nonnegative position, read-only current unit price, and Remove. Add Component adds another row; repeated component IDs are supported. Empty designs cannot be submitted when creating or replacing components.

Category choices come from GET /categories. Components come from GET /categories/:id/sub-categories, filtered to active components with the selected categoryId. Category changes clear every row, cancel the old request, and ignore stale responses. Loading/error/empty states and retry controls are provided.

Estimated totals use current catalog prices in cents and the sum of quantities. Saving never reserves stock. Server-returned products are reloaded after saving, and the table uses their authoritative itemCount and price.

## Writes

All endpoints use `/api/v1` and `Authorization: Bearer <accessToken>`.

POST /products sends name, description, imageUrl, categoryId, isActive and items. Each item sends only subCategoryId, quantity, and position when provided. PATCH /products/:id sends the complete resulting items array when components or category change. Metadata-only edits omit items/categoryId so ordered designs can still have their metadata updated.

Never submit price, unitPrice, itemCount or createdById. Empty optional description/image values are sent as null. Position is omitted when blank.

HTTP 409 preserves the draft, shows the backend message and directs the admin to create a new design for different components. Delete requires confirmation. Admin-only editing/deletion and existing centralized 401/session handling remain in place.

## Display

The table shows a component summary (for example Gold bead x10, Red bead x15), backend item count and EUR total. Product details and Order details share a component table showing image, name, color, type, quantity, position, saved unitPrice and quantity * unitPrice. The table never substitutes the current catalog price for a saved price.

## Orders and inventory

POST /orders still sends only productId, paymentType and customerNotes. The logged-in admin is the customer. Selecting CARD does not process a payment.

The create dialog loads current component stock and aggregates required quantities for repeated component IDs. Stock deduction stays entirely on the backend. Insufficient-inventory 400 responses display subCategoryName, requestedQuantity and availableQuantity, retain the draft, and reload stock. Successful ordering refetches category stock before displaying the new order. A stock-refresh failure is reported as a refresh failure after a successful order, preventing accidental duplicate submission. Reopening Create order or the component editor fetches fresh stock.

Order workflow, payment controls, immutable delivery snapshots/prices and status-conflict recovery remain unchanged.

## Files and checks

- `src/views/products/ComponentEditor.js`: responsive image picker and row editor.
- `src/views/products/ComponentTable.js`: shared saved-price breakdown.
- `src/views/products/ProductDialog.js`, `Products.js`, `productHelpers.js`: payloads, form and directory.
- `src/views/orders/CreateOrderDialog.js`, `OrderDetails.js`, `Orders.js`: inventory feedback and multi-component details.
- `tests/products.spec.mjs`, `tests/orders.spec.mjs`: isolated API-fixture regressions.

Run `npm.cmd run test:e2e`, `npm.cmd run build`, and targeted ESLint. Tests do not modify live products, orders or inventory.

Validation: 36-test full regression passed, followed by all 19 updated Product/Order tests (including two additional regressions) and the additional stock-refresh failure test. Production build, targeted ESLint and whitespace checks passed. The existing Vite large-chunk advisory remains. Mobile component picker screenshots were reviewed.
