# Orders management

Multi-component update: Product details now show `product.items[]` with saved component unit prices and line totals. Creation shows current stock, handles structured inventory 400 responses, and refreshes stock after success. See [Products and components](PRODUCT_MANAGEMENT.md).

Open **Sales > Orders** (`#/orders`). The page uses the existing JWT-enabled Axios client with `/api/v1` as its base URL.

- Server-side order-number search, workflow/payment/customer filters, and pagination (20, 50 or 100 rows).
- Table includes customer, product preview, euro totals converted from cents, payment/workflow badges and date.
- Details open in a responsive side panel. Delivery snapshots and the original order total remain read-only and separate from current customer contacts and product information.
- Admin notes and an optional HTTP(S) final image URL can be saved with a preview. Unsaved drafts survive status changes; closing warns before discarding changes.
- Workflow advances exactly one step through ORDERED, CREATING, CREATED, READY_FOR_COURIER, PICKED_UP_BY_COURIER and COMPLETED. Completion disables advancement.
- HTTP 409 reloads the latest order before a manual retry. If reloading fails, advancement stays blocked until a successful reload.
- Payment status updates only record status; they do not charge or refund payments.
- Deletion requires confirmation. Lists refresh after mutations, including returning to a valid page after deleting the last item on a page.
- Creating an order uses the logged-in administrator and their delivery profile. No customer override is sent. Selecting CARD does not process payment.

## API requests

All requests send `Authorization: Bearer <accessToken>`.

| Action | Request |
| --- | --- |
| List | GET /orders with page, limit and nonempty orderNumber/status/paymentStatus/paymentType/userId filters |
| Detail | GET /orders/:id |
| Save notes/image | PATCH /orders/:id with adminNotes and finalImageUrl only |
| Advance | PATCH /orders/:id/status with the next status only |
| Payment | PATCH /orders/:id/payment-status with paymentStatus only |
| Delete | DELETE /orders/:id |
| Create | POST /orders with productId, paymentType and customerNotes only |
| Customer choices | GET /users |
| Product choices | GET /products |

List responses use `{ data, meta: { page, limit, total, totalPages } }`. API errors are displayed with retry options; successful mutations show feedback.

## Verification

Production build and targeted ESLint passed. The full browser suite passed all 37 tests, including 10 Orders tests covering request payloads and JWT, pagination/filtering, immutable snapshot/price, workflow completion, conflict recovery, deletion, creation constraints, error recovery, unsaved drafts and mobile layout. Browser tests use isolated API fixtures; no live orders were modified. The existing Vite large-chunk advisory remains.

Files: `src/views/orders/`, routing in `src/components/AppContent.js`, styles in `src/scss/_homemade.scss`, browser coverage in `tests/orders.spec.mjs`.

Order placement now refetches GET /sub-categories and the selected category components after success. HTTP 400 inventory errors display the component name, requested quantity and available quantity; workflow conflicts remain HTTP 409. Place Order is disabled during placement and refresh, with a synchronous guard against duplicate submissions. No frontend stock writes are performed.
