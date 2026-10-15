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

## Performance

- List queries in `src/services/orders/order-service.ts` select explicit columns and exclude `cloth_sample_image_url`, because cloth-sample photos are stored inline as data URLs and dominated payload size. Only `getOrderById` (detail, receipts, edits) loads the photo.
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

Receipt previews are HTML pages with print CSS. PDF downloads are generated from stored order data with `@react-pdf/renderer`:

- Customer copy excludes measurements and internal notes.
- Store copy includes measurements and internal notes.
- Combined copy uses A4 landscape with a 2:1 store/customer split and dashed divider.
