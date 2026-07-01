# Feminine Designer by Sajida

A tailoring-shop web app for customer records, garment orders, measurements, payments, delivery tracking, and printable receipts.

The app currently runs with local typed seed data, so you can open it and test the screens immediately. Supabase is prepared for real database/auth storage through the migration files in `supabase/`.

## What You Need To Install

Install these on your machine:

1. **Node.js**
   - Use Node.js 22 or newer.
   - Check it with:

```bash
node -v
npm -v
```

2. **Project dependencies**
   - You do not install React, Next.js, Tailwind, Supabase libraries, etc. one by one.
   - They are already listed in `package.json`.
   - Install all of them with:

```bash
npm install
```

This installs:

- `next` - the web framework
- `react` and `react-dom` - the UI runtime
- `tailwindcss` - styling
- `@supabase/supabase-js` and `@supabase/ssr` - Supabase database/auth client
- `@react-pdf/renderer` - PDF generation
- `zod`, `react-hook-form`, `@hookform/resolvers` - validation and forms
- `lucide-react` - icons
- `vitest` - tests
- TypeScript, ESLint, Prettier, and other development tools

3. **Supabase CLI** only if you want to run/apply migrations from terminal.

```bash
npm install -g supabase
```

You can also paste the SQL manually in the Supabase dashboard if you do not want to use the CLI.

## Run The App Locally

From this folder:

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

Useful pages:

- `http://localhost:3000/dashboard`
- `http://localhost:3000/orders`
- `http://localhost:3000/orders/new`
- `http://localhost:3000/customers`
- `http://localhost:3000/settings`
- `http://localhost:3000/receipts/order-1/combined`

## Build And Check The App

Use these before deployment:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Start the production build locally:

```bash
npm run start -- -p 3000
```

## Supabase Setup

Supabase provides the real backend:

- PostgreSQL database
- Login/authentication
- Row-level security
- API keys for the web app

### 1. Create A Supabase Project

1. Go to `https://supabase.com`.
2. Sign in.
3. Click **New project**.
4. Choose an organization.
5. Enter a project name, for example `feminine-designer`.
6. Set a strong database password and save it somewhere safe.
7. Choose the nearest region.
8. Create the project.

### 2. Get Your Supabase Environment Values

In the Supabase dashboard:

1. Open your project.
2. Go to **Project Settings**.
3. Go to **API**.
4. Copy the required values.

You need these:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-public-anon-key
SUPABASE_SERVICE_ROLE_KEY=server-only-service-role-key-do-not-expose
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### What Each Environment Variable Means

#### `NEXT_PUBLIC_SUPABASE_URL`

This is your Supabase project URL.

It looks like:

```text
https://abcdefghijklm.supabase.co
```

Where to get it:

- Supabase dashboard
- Project Settings
- API
- Project URL

Why it has `NEXT_PUBLIC_`:

- Next.js exposes variables beginning with `NEXT_PUBLIC_` to browser-side code.
- This URL is safe to be public.

#### `NEXT_PUBLIC_SUPABASE_ANON_KEY`

This is the public anonymous Supabase key.

Where to get it:

- Supabase dashboard
- Project Settings
- API
- Project API keys
- Copy the `anon` / `public` key

What it does:

- Lets the browser app talk to Supabase.
- It is public by design.
- It is still protected by Supabase Row Level Security policies.

Important:

- This is not the same as the service-role key.
- It is okay that this key starts with `NEXT_PUBLIC_`.

#### `SUPABASE_SERVICE_ROLE_KEY`

This is the private admin-level Supabase key.

Where to get it:

- Supabase dashboard
- Project Settings
- API
- Project API keys
- Copy the `service_role` / `secret` key

What it does:

- Bypasses Row Level Security.
- Should only be used on the server for trusted admin/backend tasks.

Important:

- Never put `NEXT_PUBLIC_` in front of this key.
- Never paste it into frontend code.
- Never commit it to Git.
- Never share it publicly.

#### `NEXT_PUBLIC_APP_URL`

This is the public URL where the app runs.

For local development:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

For production on Vercel, it might look like:

```env
NEXT_PUBLIC_APP_URL=https://your-vercel-app.vercel.app
```

Use it for links, redirects, emails, or future WhatsApp/reminder workflows.

## Create `.env.local`

Copy the example file:

```bash
cp .env.example .env.local
```

Then edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-public-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

After changing `.env.local`, restart the dev server:

```bash
npm run dev
```

## Apply The Database Schema

The database files are:

- `supabase/setup_full_database.sql` for a brand-new empty Supabase project.
- `supabase/migrations/202607010001_initial_schema.sql`
- `supabase/migrations/202607010002_order_save_rpc_and_cloth_sample.sql`
- `supabase/migrations/202607010003_settings_driven_templates_and_garments.sql`
- `supabase/migrations/202607010004_reload_postgrest_schema.sql`
- `supabase/seed.sql`

### Option A: Use Supabase SQL Editor

For a brand-new empty Supabase project, use the single setup file:

1. Open Supabase dashboard.
2. Open your project.
3. Go to **SQL Editor**.
4. Create a new query.
5. Paste the full contents of `supabase/setup_full_database.sql`.
6. Run it.
7. Confirm the final result shows `create_order_from_payload(jsonb)`.

If you prefer to run the files one by one:

1. Open Supabase dashboard.
2. Open your project.
3. Go to **SQL Editor**.
4. Create a new query.
5. Paste the full contents of `supabase/migrations/202607010001_initial_schema.sql`.
6. Run it.
7. Create another query.
8. Paste the full contents of `supabase/migrations/202607010002_order_save_rpc_and_cloth_sample.sql`.
9. Run it.
10. Create another query.
11. Paste the full contents of `supabase/migrations/202607010003_settings_driven_templates_and_garments.sql`.
12. Run it.
13. Create another query.
14. Paste the full contents of `supabase/migrations/202607010004_reload_postgrest_schema.sql`.
15. Run it.
16. Create another query.
17. Paste the full contents of `supabase/seed.sql`.
18. Run it.

To verify the save-order RPC exists, run this in SQL Editor:

```sql
select to_regprocedure('public.create_order_from_payload(jsonb)') as save_order_function;
```

The result should show `create_order_from_payload(jsonb)`. If it is blank, run `supabase/migrations/202607010002_order_save_rpc_and_cloth_sample.sql` again, then run:

```sql
notify pgrst, 'reload schema';
```

### Option B: Use Supabase CLI

Login:

```bash
supabase login
```

Link the project:

```bash
supabase link --project-ref your-project-ref
```

Push migrations:

```bash
supabase db push
```

If needed, run seed SQL manually from the dashboard SQL Editor.

## Create Staff Login Users

The schema uses Supabase Auth plus a `profiles` table.

1. In Supabase dashboard, go to **Authentication**.
2. Create a user for the shop owner/admin.
3. Copy that user ID.
4. Insert a matching profile row in SQL Editor:

```sql
insert into profiles (id, full_name, email, role, active)
values (
  'PASTE_AUTH_USER_ID_HERE',
  'Sajida',
  'owner@example.com',
  'admin',
  true
);
```

For staff:

```sql
insert into profiles (id, full_name, email, role, active)
values (
  'PASTE_AUTH_USER_ID_HERE',
  'Staff Name',
  'staff@example.com',
  'staff',
  true
);
```

Roles:

- `admin`: settings, receipt configuration, staff/admin management.
- `staff`: customer/order/payment/status/receipt work.

## How To Use The App

### Dashboard

Open:

```text
/dashboard
```

Use it for:

- Today’s deliveries
- Upcoming deliveries
- Pending orders
- Overdue orders
- Outstanding balances
- Recent orders

### Create New Order

Open:

```text
/orders/new
```

Workflow:

1. Search or enter customer name and phone.
2. Reuse latest measurements if the customer already exists.
3. Set **Number of cloth / garments**.
4. Open each dress section and choose garment type, quantity, rate, fabric length, fabric/color, design reference, stitching notes, and measurements.
5. Use **Take Cloth Photo** on a tablet to capture the customer fabric sample.
6. Add global bill values: order discount, accessories cost, stitching cost, advance payment, and payment mode.
7. Choose **Save Draft**, **Save Order**, or **Save and Print**.

Each dress section is saved under the same order number. Discounts are bill-level only; they are not stored per dress item.

The save buttons require Supabase to be configured in `.env.local` and the migrations to be applied. If Supabase is not configured, the form will show an error instead of silently pretending to save.

### View Orders

Open:

```text
/orders
```

Search by:

- Receipt number
- Customer name
- Phone number
- Status

The Orders page has two tabs:

- **Current Orders**: orders that are not delivered/cancelled and whose delivery date has not passed.
- **Past Orders**: delivered orders, cancelled orders, and any order whose delivery date is before today.

Use the **Complete** checkbox in the order row to mark the full order as delivered. This sets the order status to `Delivered`, marks all garment items delivered, and moves the order to **Past Orders**. If you uncheck a future-delivery completed order, it returns to `Ready` and can appear under **Current Orders** again. Orders with delivery dates already in the past remain under **Past Orders** by date.

### Order Detail

Example:

```text
/orders/order-1
```

Use it for:

- Payment summary
- Garment details
- Per-dress delivered tracking
- Customer cloth sample photo
- Measurements
- Status timeline
- Customer copy
- Store copy
- Combined print copy

### Customer List

Open:

```text
/customers
```

Use it for:

- Customer search
- Customer history
- Outstanding balance
- Latest measurements

### Settings

Open:

```text
/settings
```

Use it for:

- Store name
- GSTIN
- Address
- Phone numbers
- Email
- Logo path
- Receipt settings
- Garment types
- Measurement templates
- Measurement fields inside each template

Garment types, templates, and measurement fields are database-driven. To add a new garment type, open `/settings`, enter the type name in **Add garment type**, and submit it. It will then appear in the new-order garment selector.

To add a new measurement template, enter a template name and comma-separated garment categories, for example:

```text
Sharara measurements
Sharara, Suit
```

To add a new measurement field, choose the template, then enter:

- `Field key`: stable database key, for example `ankle_round`.
- `Display code`: short code shown in the measurement grid, for example `AR`.
- `Display label`: short label shown on forms and receipts.
- `Long label`: readable internal name, for example `Ankle Round`.
- `Input type`: number, text, multi-line note, or checkbox.
- `Unit`: inches, text, or boolean.
- `Required field`: enable only when the measurement must be filled for that template.

After saving a new field, the new-order form reads the updated template from Supabase and saves the new measurement with the order without code changes.

The required logo path is:

```text
public/Logo.PNG
```

## Receipt And PDF Routes

Preview in browser:

```text
/receipts/order-1/customer
/receipts/order-1/store
/receipts/order-1/combined
```

The combined route renders store copy and customer copy on one A4 landscape page with a separating line, so it can be printed once and torn by hand.

Download PDF:

```text
/api/receipts/order-1/customer
/api/receipts/order-1/store
/api/receipts/order-1/combined
```

PDF file names follow:

```text
Customer_Copy_<receipt-number>.pdf
Store_Copy_<receipt-number>.pdf
Combined_Print_<receipt-number>.pdf
```

The cloth sample photo appears on the web order detail page, the store copy, and the store side of the combined print. It is intentionally excluded from the customer copy. Tablet camera photos are compressed in the browser before saving so Server Action requests stay below the configured upload limit.

## Deployment To Vercel

1. Push the project to GitHub.
2. Import the GitHub repo in Vercel.
3. In Vercel project settings, add environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_APP_URL=https://your-production-domain.com
```

4. Deploy.
5. In Supabase, make sure the database migration and seed have been applied.
6. Create admin/staff Auth users and matching `profiles` rows.

## Current Important Note

The UI and receipt/PDF workflow are implemented and runnable. Order creation uses a Next.js server action and Supabase RPC when the Supabase environment variables are configured. Without Supabase variables, existing demo screens still load from local seed data, but new orders cannot be permanently saved.
