# Architecture

## Repository Assessment

The workspace was empty apart from `implementation_plan.md` and `IMG_1174.JPG`. There was no existing framework, package manager metadata, database setup, environment file, style system, component library, test setup, or application state to reuse. The app was scaffolded as a new Next.js App Router TypeScript project.

## System Shape

The app is organized around typed domain services:

- `src/types/domain.ts` defines customers, orders, payments, measurements, statuses, settings, and receipts.
- `src/lib/calculations/*` contains deterministic business logic for totals, GST, balances, receipt numbers, measurement snapshots, and status transitions.
- `src/services/*` is the data boundary. It currently serves typed seed data for local builds and is the intended Supabase integration layer.
- `src/app/*` contains route-level screens and API endpoints.
- `src/components/*` contains reusable UI, layout, order, customer, measurement, dashboard, and receipt components.

## Visual System

`src/app/globals.css` defines the palette as Tailwind v4 theme tokens (`text-wine`, `bg-surface`, `border-line`, `text-muted`, and so on) plus a soft neumorphic elevation scale: `shadow-raised-sm`, `shadow-raised`, `shadow-raised-lg` for lifted surfaces, `shadow-pressed` for inputs and selected states, and `shadow-brand`/`shadow-danger` for Material-style primary actions. Use tokens instead of raw hex classes. Shared primitives live in `src/components/ui/*` (`Button`, `ButtonLink`, `Card`, `Input`, `Select`, `Textarea`, badges). Element defaults sit in `@layer base` so utilities can override them. Receipt components keep their own print styling.

Layout is responsive: laptops (`lg`+) get the collapsible sidebar; phones and tablets get a fixed bottom tab bar (`Mobile navigation`) with a raised New Order action, and sticky page action bars sit above it. List cards and table rows open their record when clicked anywhere (`src/lib/ui/card-navigation.ts`); checkboxes, buttons, and links inside them keep their own behaviour.

## Quality-of-life features

- Header search (`src/components/layout/global-search.tsx`) queries `/api/search` for up to six orders and six customers; Ctrl/Cmd+K or `/` focuses it, Enter without a highlighted result searches the Orders page.
- `ContactActions` renders Call (`tel:`) and WhatsApp (`wa.me`, Indian numbers prefixed with 91) links; the order page adds Ready-for-pickup and Balance-reminder messages.
- `/orders/new?customer=<id>` prefills the customer and saved measurements; the customer page's Create New Order uses it.
- `src/app/manifest.ts` plus `public/icons/*` make the app installable to a tablet or phone home screen.
- New-order and edit forms warn before the tab is closed with unsaved edits (in-app links are not blocked).

## Performance

- Cloth-sample photos are uploaded to the public `cloth-samples` Storage bucket (`src/services/orders/cloth-sample-storage.ts`) and the order row stores the public URL. If the upload fails the data URL is kept inline, so saving never breaks; legacy inline rows are moved with `scripts/migrate-cloth-samples.mjs`.
- List queries in `src/services/orders/order-service.ts` select explicit columns and skip `cloth_sample_image_url`, `order_measurements`, and `order_status_history`. `getOrderById` loads everything; customer-scoped lookups load measurements and history but not the photo.
- The returning-customer search builds all matched profiles with one orders query and one profile query (`getCustomerMeasurementProfiles`).
- Pagination is not implemented yet. A list row is roughly 4 KB, so this only matters after several hundred orders; at that point move dashboard aggregates and the collections chart to SQL and paginate the Completed tab.
- Customer profile and measurement lookups filter orders by `customer_id` in SQL and run their independent queries in parallel.
- Every operational route has a `loading.tsx` that renders the app shell with a skeleton, so navigation responds immediately while server data loads.
- `vercel.json` runs functions in `sin1`, next to the Supabase project (`ap-southeast-1`).

## Authentication

Supabase Auth is the planned authentication provider. `src/lib/supabase/server.ts` and `src/lib/supabase/client.ts` use current `@supabase/ssr` patterns. RLS policies in the migration distinguish `admin` and `staff` through the `profiles.role` column.

## Data Flow

Operational screens call service functions, not raw data. In production, those services should read and mutate Supabase tables inside server actions or route handlers. Calculation values are produced by shared utilities and should be persisted as order snapshots so old receipts remain stable.

## Receipt Numbering

The default format is `SJD-YYYY-000001`. The migration includes `receipt_sequence` plus `next_receipt_number(prefix, year, starting_serial)` with `insert ... on conflict do update ... returning`, which is safe under concurrent database writes.

## PDF and Print Design

Receipts (`receipt-pdf.tsx` for downloads, `receipt-html.tsx` for the on-screen/print preview) share one layout: wine header band, info strip, compact item rows, payment card that lists optional charges only when non-zero, and a Balance due / Paid in full box. Keep the two in sync and keep receipts to one A4 page; the store copy shows the delivery date minus three days as "Ready by".

Receipt previews are HTML pages with print CSS. PDF downloads are generated from stored order data with `@react-pdf/renderer`:

- Customer copy excludes measurements and internal notes.
- Store copy includes measurements and internal notes.
- Combined copy uses A4 landscape with a 2:1 store/customer split and dashed divider.
