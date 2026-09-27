# Live dashboard statistics

Dashboard cards show all Users (including admins), Products (including inactive products), Total Orders, Completed Orders, Unpaid Orders and Paid Orders. Completed and payment statuses are counted independently; a completed order can still be unpaid.

The existing JWT Axios client requests GET /users and GET /products (array lengths), GET /orders?page=1&limit=5 (meta.total and recent orders), plus GET /orders?page=1&limit=1 for each workflow status and paymentStatus. Counts use meta.total, not the size of a paginated response. No invented reporting endpoints, stock writes, or client-derived revenue figures are used.

The workflow and payment panels show counts with proportional bars. Recent Orders shows the latest five returned by the backend, with customer, creation date, EUR total from cents, workflow and payment badges. Refresh stats reloads all counts; navigation back to Dashboard also fetches current data. Requests run concurrently and are cancelled on unmount. Empty results show zero; unavailable results show an error state while successful stats remain visible. Statistics reflect separate API queries and are not an atomic reporting snapshot.

Source: src/views/dashboard/Dashboard.js and src/scss/_homemade.scss. Tests: tests/dashboard.spec.mjs, plus updated dashboard fixtures in tests/admin-auth.spec.mjs. No backend changes are required.

Validation: production build, targeted ESLint, whitespace check and all 16 dashboard/auth browser tests passed. Desktop screenshot and mobile viewport checks passed. Tests used isolated API fixtures; no live records were changed.
