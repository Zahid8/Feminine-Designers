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
