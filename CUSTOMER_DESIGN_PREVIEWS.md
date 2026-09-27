# Customer design previews

Products and Orders tables have a separate Design thumbnail column. Product details show Customer design with a large uncropped preview, followed by the existing Catalog image and product information. Order details show the order summary, large customer design, materials with saved component pricing, historical order total, product/notes, payment, delivery and workflow controls. The design remains present at every workflow status.

`DesignPreview.js` displays `product.designPreviewUrl`; Orders use `order.product.designPreviewUrl`. It accepts complete HTTP(S) URLs returned by NestJS, preserves aspect ratio with object-fit: contain, and uses the existing bundled catalog-placeholder.svg for missing, invalid or failed URLs. It never substitutes imageUrl or exposes storage keys. Successful large previews link to the full-size image in a new tab with noopener/noreferrer. The dashboard does not generate/edit the customer's canvas or send designPreviewUrl in writes.

`ComponentTable` continues to display component imageUrl, name, color, type, quantity, position, saved item.unitPrice and line total. Component thumbnails now use contain to preserve transparent beads. The historical total is always order.totalPrice; current SubCategory prices are never used in saved breakdowns. Existing normal image uploads and order workflow/payment logic remain intact.

## Backend verification

Live GET /api/v1/products returned HTTP 200 with six products and the expected designPreviewUrl, items[].unitPrice and items[].subCategory.imageUrl fields. Order response structure was confirmed in orders.service.ts and the recursive ImageResponseInterceptor: order.product selects designPreviewKey and productItemsSelect, which become designPreviewUrl and component imageUrl. A live authenticated Order response was not requested because no admin credentials were provided. No backend changes or extra product requests are needed.

For now previews are read from the current Product referenced by the Order. No immutable Order image/items snapshot, storage SDK, R2 configuration or credentials were added.

## Files

- src/views/products/DesignPreview.js (new reusable viewer)
- src/views/products/Products.js and ProductDialog.js
- src/views/orders/Orders.js and OrderDetails.js
- src/scss/_homemade.scss
- tests/products.spec.mjs and tests/orders.spec.mjs

Browser regressions use isolated fixtures and never mutate real orders/products. Coverage includes null/broken images, thumbnail/catalog separation, full-size links, uncropped transparent components, saved pricing versus catalog pricing, historical order total, all workflow steps, payment updates and mobile layout. Existing upload/category/auth tests also run.

Validation: production build, targeted ESLint and whitespace checks passed. 52 browser tests passed in the full run; the other three passed on recheck after correcting inlined-SVG assertions and rerunning a cold-start timeout. All 55 scenarios are verified, including the existing image-upload/auth/workflow/payment regressions. Desktop/mobile screenshots were inspected. No live records or backend files were changed.
