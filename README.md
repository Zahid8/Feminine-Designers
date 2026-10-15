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

#### `STAFF_PASSWORD` and `STAFF_SESSION_SECRET`

These control the staff login at `/login` (username `saif`).

```env
STAFF_PASSWORD=choose-a-strong-staff-password
STAFF_SESSION_SECRET=long-random-session-secret
```

- `STAFF_PASSWORD` is the password staff type on the login screen.
- `STAFF_SESSION_SECRET` is the value stored in the `fd_staff_session` cookie. Generate it with `openssl rand -hex 32`. Changing it logs everyone out.

Both are server-only. If they are missing, the app falls back to the old built-in values, which are visible in this public repository's history, so always set both in production.

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
STAFF_PASSWORD=choose-a-strong-staff-password
STAFF_SESSION_SECRET=long-random-session-secret
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
- `supabase/migrations/202607010005_order_delete_profile_fk.sql`
- `supabase/migrations/202607010006_item_stitching_cost.sql`
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

If you prefer to run the files one by one, open **SQL Editor** and run each file below in order, one query per file:

1. `supabase/migrations/202607010001_initial_schema.sql`
2. `supabase/migrations/202607010002_order_save_rpc_and_cloth_sample.sql`
3. `supabase/migrations/202607010003_settings_driven_templates_and_garments.sql`
4. `supabase/migrations/202607010004_reload_postgrest_schema.sql`
5. `supabase/migrations/202607010005_order_delete_profile_fk.sql`
6. `supabase/migrations/202607010006_item_stitching_cost.sql`
7. `supabase/migrations/202607020001_item_fabric_dye_cost.sql`
8. `supabase/migrations/202607020002_order_item_extra_costs.sql`
9. `supabase/migrations/202610150001_cloth_sample_storage_bucket.sql`
10. `supabase/seed.sql`

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

### Getting around

- **Laptop**: the sidebar on the left (hide it with the ☰ button). **Phone/tablet**: the tab bar at the bottom; the raised middle button starts a new order.
- **Search anything**: type in the search box at the top (or press `Ctrl/⌘ + K` or `/`). Matching orders and customers appear as you type; use ↑ ↓ and Enter, or click a result. Pressing Enter without picking a result searches the Orders page.
- **Open by clicking anywhere**: click any order or customer card/row to open it. Checkboxes and buttons inside a card still do their own job.
- Delivery countdown badges (**Due today**, **Tomorrow**, **Overdue 5d**) appear on open orders.

- **Keyboard** (laptop): `?` shows all shortcuts, `N` new order, `B` workshop board, `D` dashboard.
- Actions such as **Done**, **Paid**, and board moves show a small notification with **Undo** for a few seconds.
- On phones and tablets, **Settings** is the gear button at the top right; the bottom bar is Dashboard, Orders, New Order, Customers, Reports.

### Workshop Board (on the Dashboard)

The dashboard's work area opens on the **Board** tab. Orders are grouped by stage: **New → In Stitching → Ready → Delivered** (delivered orders stay visible for 7 days). Tap **Start stitching**, **Mark ready**, or **Delivered** to move an order on, or the ← button to move it back; each move can be undone from the notification. If tailors are assigned, filter the board by tailor. Swipe sideways between columns on a phone. Tap a card to open the order. The **List** tab is the classic work queue, and tapping any summary card switches to it. The old `/board` link redirects here.

### Payments

Customers pay at the counter in cash or UPI; the app only records what was received. On an order, **Payments → Record money received** takes the amount and Cash/UPI and updates the balance (part payments are fine). Each payment is listed with a delete button, and **Undo** appears right after adding one. Payment mode choices are Cash and UPI.

### Reports

Open **Reports** (sidebar on a laptop, bottom bar on phones/tablets). Pick a period (Today, Last 7 days, This month, Last month, This year, All time) to see money collected (split by Cash/UPI), orders taken, billed value, average order, outstanding balance, a collections chart, the garment mix, and top customers. **Export CSV** downloads the period's orders for Excel or Google Sheets.

### Install on a tablet or phone

The app can be added to the home screen and opens full-screen like an app:

- **Android / Chrome**: open the site, tap ⋮ → **Add to Home screen** (or **Install app**).
- **iPad / iPhone Safari**: tap Share → **Add to Home Screen**. The installed app keeps its own login, so sign in once inside it.

It still needs an internet connection.

### Dashboard

Open:

```text
/dashboard
```

The heading greets you by the time of day. **Next 7 days** shows how many deliveries are due each day (plus an **Overdue** chip); tap a day to list its orders. Tap a card (Pending, Overdue, Collected Today, …) to list the matching orders below it; each order row has Call and WhatsApp buttons.

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

Starting from a customer profile with **Create New Order** fills in the customer’s name, phone, and saved measurements automatically.

If you try to close or reload the tab with unsaved changes, the browser asks you to confirm first.

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

The top of the page has **View Bill / Receipt** (one button; the Customer / Store / Combined switcher is inside the receipt page), **Edit Order**, and **Delete Order**. The page shows a progress tracker (Received → Stitching → Ready → Delivered) and buttons to **Call** the customer or send a WhatsApp message: **Ready for pickup** and, when money is due, **Balance reminder**. Messages open WhatsApp with the text filled in, ready to send.

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

Each customer shows initials, last order date, number of orders, and the amount due (or **Settled**). Use **Remove customers** to switch on delete buttons. A customer’s profile shows lifetime value, outstanding balance, contact details, Call/WhatsApp buttons, and **Create New Order** (prefilled).

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

### Sharing a bill link with the customer

Every receipt page shows a **Customer bill link** panel with **Copy bill link** and **Send on WhatsApp**. The link looks like `https://<your-site>/bill/<order-id>/<code>`. When the customer taps it, their customer-copy PDF opens directly. There's no login, and they never see the store copy, measurements, or notes. The WhatsApp **Order confirmation** and **Ready for pickup** messages on the order page include the link too.

The code at the end is a signature made from a server secret, so links can't be guessed or edited to open someone else's bill; a wrong code shows "Not found". The secret is `BILL_LINK_SECRET` if set, otherwise it is derived from `SUPABASE_SERVICE_ROLE_KEY`. Changing that secret disables every link shared before. Links do not expire, and the PDF always shows the bill's current state (for example, updated payments).

Receipts have a wine header with the logo, the receipt number, a compact list of garments, and a payment summary ending in **Balance due** (or **Paid in full**). The payment summary reads as a running calculation: the parts of the item amounts (Garments at rate × qty, plus Stitching, Fabric, Dyeing, named extras such as Lace price, and Accessories) add up to the **Subtotal**; then **+ CGST / + SGST** give the **Grand total**, **− Paid** is taken off, and the box shows **Balance due** or **Paid in full**. Zero charges are left out, and if garments are the only part the breakdown is skipped. The same summary appears on the order page and in New Order live totals. The store copy labels its date **Ready by** (three days before the customer’s delivery date). The receipt page has a Customer / Store / Combined switcher, **Download PDF**, and **Print**; each copy fits on one A4 page.

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
STAFF_PASSWORD=...
STAFF_SESSION_SECRET=...
```

4. Deploy.
5. In Supabase, make sure the database migration and seed have been applied.
6. Create admin/staff Auth users and matching `profiles` rows.

### Cloth-sample photo storage

Cloth-sample photos are uploaded to the public Supabase Storage bucket `cloth-samples` and the order stores the photo URL. Create the bucket once by running `supabase/migrations/202610150001_cloth_sample_storage_bucket.sql` in the SQL Editor (it is already included in `setup_full_database.sql`). Until the bucket exists, new photos are still saved inline in the order row, so nothing breaks.

Orders saved before this change keep their photo inline. Move them into Storage with the one-time script (dry run first, then apply):

```bash
node --env-file=.env.local scripts/migrate-cloth-samples.mjs          # read-only preview
node --env-file=.env.local scripts/migrate-cloth-samples.mjs --apply  # uploads and updates rows
```

`--apply` writes a backup of the original values to `.migration-backups/` (git-ignored) before changing anything.

### Function region

`vercel.json` pins server functions to `sin1` (Singapore) because the Supabase project runs in AWS `ap-southeast-1`. Keeping functions next to the database avoids a cross-Pacific round trip on every query. If the Supabase project ever moves, update `regions` in `vercel.json` to the closest Vercel region.

## Current Important Note

The UI and receipt/PDF workflow are implemented and runnable. Order creation uses a Next.js server action and Supabase RPC when the Supabase environment variables are configured. Without Supabase variables, existing demo screens still load from local seed data, but new orders cannot be permanently saved.
