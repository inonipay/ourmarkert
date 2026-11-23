# ILPhotoX Shop

Rwanda marketplace built with Next.js, Tailwind CSS, PostgreSQL, Prisma, and Upstash Redis.

## Local setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env` and set `DATABASE_URL`, `NEXTAUTH_URL`, and a random `NEXTAUTH_SECRET`.
3. Create the database schema and load the starter catalog:

   ```bash
   npx prisma migrate dev --name init
   npm run db:seed
   ```

4. Start Next.js with `npm run dev`, then open http://localhost:3000.

The storefront reads only published products from PostgreSQL through the server-only data access layer. The product API is `GET /api/products`; it accepts `q`, `category`, `sort`, `limit`, and `offset`. Inputs are validated with Zod. Upstash rate limiting is bypassed only in development when its credentials are absent; production returns `503` until both Upstash environment variables are configured for catalog, authentication, seller, and order limits.

Use `npx prisma migrate deploy` when applying committed migrations in production. The public catalog API does not expose product writes or uploads.

## Accounts and access

- `POST /api/auth/register` creates customer accounts; passwords must be at least 12 characters and are hashed with bcrypt before storage.
- The `/register` and `/login` pages use the registration endpoint and Auth.js Credentials flow; sessions use JWTs with an eight-hour lifetime.
- Login, registration, seller product, order, and dashboard role-change requests are rate limited through Upstash. Configure both Redis REST variables before deploying; protected writes fail closed if rate limiting is not configured in production.
- New accounts always receive the `customer` role. Only a signed-in super admin can change customer, seller, or admin roles in the protected dashboard. Changes require confirmation and are recorded in the role audit log. Super-admin provisioning and recovery remain local-only; no public endpoint can grant or change a `super_admin` role.
- Super admins can suspend or reactivate seller accounts with a recorded reason. Suspension blocks login and protected API access, hides the seller's published products, and does not change existing orders or delete data. Reactivation leaves products unpublished for admin review.
- Customers and active sellers can submit a merchant application at `/apply-to-sell`. The application requires an owner name, business name/address, a business-registration document, and an owner identity document; TIN is optional. Documents are stored as private PostgreSQL `BYTEA` data, limited to 2 MB each, and restricted to PDF/JPEG/PNG signatures. Only super admins can download or review them.
- Use `getAuthenticatedUser`, `requireAuthenticatedUser`, and `requireUserRole` from `lib/authorization.ts` in protected server routes/actions. For initial setup or recovery, use the local super-admin provisioning tools below rather than dashboard role assignment.
- To provision the initial super admin, set a unique 12–72 character `SUPER_ADMIN_PASSWORD` in the ignored `.env` file and run `npm run db:create-super-admin -- user@example.com 0790000000`. The password is bcrypt-hashed; the command never accepts it as a command-line argument.
- Email verification and password recovery are not enabled yet; do not use unverified email addresses as proof of identity.

Generate a secret locally with `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` and set the result as `NEXTAUTH_SECRET`.

## Super admin workspace

- Sign in with a provisioned `super_admin` account and open `/super-admin/dashboard`. The workspace and its data require the `super_admin` role; regular admins are not granted access.
- The responsive, collapsible sidebar follows the dashboard/module hierarchy. User, merchant, product, and order lists support search and pagination; product rows include their catalog image. Records have protected detail pages with PDF export and QR-based sharing. Super admins can publish/hide products and advance orders through the supported status workflow.
- User lists show account IDs, contact details, roles, and account-access status; their CSV export includes the same fields. The Suspended Users view filters suspended accounts and supports the existing audited merchant reactivation workflow. Product Categories shows live product counts for the fixed catalog categories and links to filtered product lists. Category creation and renaming are not supported.
- User records include confirmed role changes for customer, seller, and admin accounts. The Security & Audit section lists role changes and provides protected detail pages with PDF export and QR-based sharing. Super-admin roles cannot be managed through that UI.
- Merchant records include audited suspend/reactivate actions. Suspended sellers cannot log in or use the merchant workspace/APIs; published products are hidden, order history is preserved, and reactivation does not automatically republish listings. Merchant access audit entries include the actor, reason, and timestamp.
- Business Information lists searchable pending and approved KYC business records, including owner, submitted address, and tax ID, with pagination and page CSV export. Rejected applicant data remains erased.
- Merchant Locations groups the submitted KYC address text with business counts, search, pagination, and page CSV export. Addresses are not normalized, geocoded, or sent to a third-party map provider.
- Pending KYC applications can be approved or declined in Merchant Management. Approval grants the seller role and records the role change; declining deletes the application and documents while retaining a decision audit without applicant identity. Existing sellers remain active unless separately suspended. A super admin can manually erase KYC and anonymize a suspended merchant while preserving orders and audit history. No automatic one-year cleanup scheduler is configured.
- Pending, approved, and rejected KYC lists support search and pagination. Rejected-list search uses decision reasons only because applicant identity and business details are removed after rejection.
- Analytics reports use existing order, catalog, seller, and customer records. Order subtotals are not treated as verified revenue because payment processing is not integrated.
- Super admins can configure and activate/deactivate bank and mobile-money destination accounts through separate filtered views. Active destinations are shown only to customers viewing their own pending orders. These settings do not process or verify payments. Apply the `super_admin_payment_accounts` and `order_payment_proofs` migrations before using payment accounts or receipts.
- Payment Overview reports receipt-proof counts, manually approved receipt amounts grouped by currency, and customer-selected methods. It does not claim gateway transactions, failed payments, collected revenue, or payouts.
- Finance Overview reports order subtotals and receipt-proof amounts separately by currency and current status for a validated date range. It does not represent collected revenue, commissions, tax, refunds, settlements, or payouts.
- Gross Sales reports order subtotals by currency and current status for a validated date range; it does not represent verified or collected payment.
- Announcements are in-app only. Super admins can target all users, merchants, customers, administrators, or up to 100 specific active accounts, set a UTC schedule and priority, and cancel a live or scheduled announcement. Eligible signed-in users can dismiss messages; the Notifications page reports those dismissals but does not claim delivery or reads. No email or SMS is sent. The `in_app_announcements` migration must be applied before using the feature.
- Payment Reports provide a validated date range (up to 366 days), status and method totals, approved-proof amounts by currency, and paginated PDF, Excel, and CSV exports of receipt submissions. Exports contain the visible 50-row page plus its summary, not all matching receipts at once.
- Analytics & Reports includes a generated-reports hub for the supported sales, merchant, customer, product, best-selling, and category reports. Authorized super admins can download each report as PDF, Excel workbook, or CSV with the selected date range; exports contain the report summary and the records shown in the report. Revenue analytics remains unavailable until verified payment-provider data is integrated.
- The Payment Methods page shows whether bank transfer and mobile money are available, based on their active destination-account counts; there is no separate gateway or method toggle.
- Security & Audit records successful, failed, and rate-limited logins; tracks revocable JWT-backed sessions; groups repeated failures into alerts; and provides account-level TOTP enrollment, device blocking, IP activity, and 30-day reports. Set `SECURITY_TOTP_ENCRYPTION_KEY` to a stable, separately generated base64-encoded 32-byte key before enabling TOTP; protect and back it up because existing TOTP secrets cannot be decrypted if it is lost. Set `AUTH_TRUST_PROXY_HEADERS=true` only when the app is behind a trusted proxy that overwrites the forwarded IP headers. Without that setting, login IP is recorded as `unknown`. Device matching uses the user-agent string, not a hardware identifier. Login rate limiting requires configured Upstash Redis in production.
- Apply the `security_sessions_2fa` and `security_totp_encryption` migrations before using the security workflows. TOTP is opt-in per account; super admins can see enrollment status but cannot read or reset user secrets. Disabling TOTP revokes the account's existing sessions.
- Super admins can feature or unfeature published products. Featured products appear in the storefront highlight; when none are selected, the existing popularity-based fallback remains. Products are automatically unfeatured when unpublished or edited by their merchant. Apply the `featured_products` migration before using the feature.
- Database Monitoring checks PostgreSQL connectivity and response time, database size, server version, and aggregate record counts. Slow-query history and connection-pool metrics are not collected.
- Redis Monitoring performs an authorized live Upstash Redis ping and shows response latency. Redis memory usage and historical latency are not collected by the application.
- Server Performance displays an authorized point-in-time snapshot of the current Node.js process, including memory, uptime, CPU time, and runtime details. It is not host-wide or historical monitoring.
- Storage Usage reports PostgreSQL database size and the largest public relations. External object storage and provider-level file usage are not included.
- Analytics reports support a selected date range of up to 366 days; time-based order, registration, and best-selling metrics use that range, while current catalog totals remain current-state counts.
- Dashboard totals and recent activity come from PostgreSQL. Pending payment-proof counts and the latest review requests are shown; revenue and payout metrics remain omitted until payment processing is integrated. Modules without supporting data models or workflows are explicitly marked as not yet available.

## Seller product management

- `GET` and `POST /api/seller/products` list managed products and create seller-owned drafts.
- `PATCH` and `DELETE /api/seller/products/:id` only affect products owned by the signed-in seller. Updating a published listing unpublishes it for review.
- `PATCH /api/admin/products/:id/publish` requires the `admin` or `super_admin` role and is the only API that can publish a listing.
- Creation and update payloads are validated with Zod; ownership, seller name, publish state, and review counts are server-controlled. Product images currently accept HTTPS URLs from `images.unsplash.com` only; uploads are not implemented.
- Sellers can use the protected `/merchant` workspace to review catalog and order activity, search/filter products, create/edit/delete their own listings, and see order items belonging only to their shop. Product and order detail pages provide branded PDF export, QR codes, and sharing. Editing a listing sends it back to unpublished review.
- Merchant order views do not show customer delivery/contact details or allow order status changes. Orders are marketplace-wide, and payment, payouts, and per-seller fulfillment workflows are not implemented.

Self-registration always creates customer accounts; only super admins can change customer, seller, or admin roles through the dashboard. Super-admin identities remain provisioned locally.

## Orders

- `POST /api/orders` requires a signed-in customer and an `Idempotency-Key` header (16–128 characters). The server rechecks published products, calculates the subtotal from database prices, and reserves available stock in a serializable transaction.
- Order requests include distinct product IDs with quantities plus `deliveryName`, `deliveryPhone`, and `deliveryAddress`. Prices and totals supplied by the browser are never trusted.
- Repeating the same key and payload returns the original order; reusing the key with a different payload returns `409`.
- Customers can use `GET /api/orders`, `GET /api/orders/:id`, and `POST /api/orders/:id/cancel`. Only a pending order can be cancelled; cancellation restores reserved stock. Orders with pending or approved payment proofs cannot be cancelled until review or a refund workflow exists.
- Admins can use `GET /api/admin/orders` and `PATCH /api/admin/orders/:id/status`. Allowed transitions are `pending` → `confirmed` or `cancelled`, then `confirmed` → `fulfilled`. Cancelling a pending order restores stock.
- Order Management's Pending Payments view lists pending orders with no approved receipt proof, distinguishes missing, pending, and rejected proofs, and supports search, pagination, and page CSV export. An approved receipt still does not automatically confirm an order.
- Creating an order does not charge the customer. On a pending order, customers can submit a transaction reference and a PDF/JPEG/PNG receipt up to 2 MB through `POST /api/orders/:id/payment-proofs`; the endpoint is rate limited and checks order ownership, payment method availability, and file signatures. Super admins review proofs at `/super-admin/payments/payment-proofs` through `PATCH /api/super-admin/payments/payment-proofs/:id`; document downloads require the super-admin role. A proof approval does not automatically confirm an order: an administrator must confirm it after verifying the payment. Orders cannot be cancelled while a proof is pending/approved, and cannot be confirmed while a proof is pending. No payment provider, delivery fee, tax calculation, or refund workflow is configured.
- Order item names, images, seller names, and prices are snapshots so product edits or deletion do not rewrite order history. Delivery contact details are returned only to the owning customer or administrators.
- Apply the new committed migration with `npx prisma migrate deploy` in production.
