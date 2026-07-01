# Feminine Designer by Sajida — Web App Implementation Plan

## 1. Mission and Delivery Expectations

You are the lead full-stack engineer and product designer responsible for building a production-quality web application for a bespoke women’s tailoring store named:

**Feminine Designer by Sajida**

The store currently uses handwritten receipt books. The goal is to replace that workflow with a modern web application that stores customers, garment orders, tailoring measurements, payments, delivery dates, and printable receipts.

The application must preserve the practical structure of the existing handwritten bill while significantly improving usability, searchability, data safety, and print quality.

### Non-Negotiable Engineering Rules

- Do not make assumptions silently.
- Before writing implementation code, inspect the repository and report the existing project structure, framework, package manager, environment setup, database setup, and current app state.
- If the repository is empty, scaffold the project according to the architecture below.
- Build incrementally in logical phases.
- After each major phase, run linting, type checking, tests, and production build.
- Do not leave placeholder implementations for core functionality.
- Do not use fake data in production screens except development seed data.
- Keep all code strongly typed.
- Use clean reusable components and avoid giant files.
- Make the app easy for non-technical store staff to use daily.
- Prioritize desktop usage, but make every screen responsive for tablet and mobile.
- Use the existing paper bill only as a visual workflow reference. Preserve the two-part receipt concept and measurement-field layout, but do not attempt a pixel-perfect copy. Build a cleaner, more modern version that remains familiar to store staff.

---

## 2. Product Goal

Build a modern tailor-shop order-management and billing web application.

The application must allow the owner and staff to:

1. Create customers.
2. Search existing customers by name, phone number, receipt number, or order number.
3. Create garment orders for customers.
4. Record tailoring measurements using the store’s existing measurement codes.
5. Add multiple garment items to a single order.
6. Record pricing, GST, discount, advance payment, and remaining balance.
7. Track delivery dates and order statuses.
8. Generate a unique receipt/order serial number automatically.
9. Generate:
   - Customer Copy PDF
   - Store Copy PDF
   - Combined Print PDF
10. Print the customer copy immediately.
11. Print or download the store copy later.
12. View customer history and reuse prior measurements.
13. Search, filter, update, and manage old orders.
14. Mark orders as ready, delivered, cancelled, or in stitching.
15. Show a dashboard with due deliveries, pending balances, and order activity.
16. Be structured so WhatsApp reminders can be added later without redesigning the core system.

---

## 3. Existing Paper Bill Requirements

The current receipt book has two side-by-side sections:

1. **Store Copy**
   - Approximately two-thirds of the page width.
   - Contains customer and order information.
   - Contains full internal measurements.
   - Contains garment notes and tailoring notes.
   - Can be printed later if needed.

2. **Customer Copy**
   - Approximately one-third of the page width.
   - Contains customer, order, payment, and delivery details.
   - Must not expose detailed internal measurements.
   - Intended to be handed to the customer.

The application must support both of the following workflows.

### A. Separate PDFs

- Customer Copy PDF
- Store Copy PDF

### B. Combined Printable A4 PDF

- Store Copy on the left, roughly two-thirds width.
- Customer Copy on the right, roughly one-third width.
- Clear vertical divider between the copies.
- Designed to resemble the physical bill-book workflow.
- Must print cleanly on A4 paper in landscape orientation.

### Logo Requirement

The store logo must initially be referenced as:

```text
public/Logo.PNG
```

Do not generate or design a logo. Use `Logo.PNG` as the logo asset placeholder and gracefully fall back to a text-based brand mark if the image is unavailable.

### Brand Text

```text
Feminine Designer
By Sajida
```

### Initial Business Details

Prepopulate these values in app settings:

```text
Store Name:
Feminine Designer by Sajida

GSTIN:
06AYWPB8525D1ZB

Shop Address:
Shop No. 222, 2nd Floor,
City Centre Mall,
MG Road Metro Station,
Gurugram-122002

Contact Numbers:
9718926185
8447371925

Email:
bsajida77@gmail.com
```

These values must be editable through a secure Settings page. Do not hard-code them throughout the app.

---

## 4. Recommended Technical Architecture

Use this stack unless the existing repository already uses a well-structured equivalent.

### Frontend

- Next.js, current stable App Router.
- TypeScript.
- React.
- Tailwind CSS.

### UI Components

- shadcn/ui.
- Radix primitives where appropriate.
- Lucide icons.

### Forms and Validation

- React Hook Form.
- Zod.
- `@hookform/resolvers`.

### Database and Backend

- Supabase PostgreSQL.
- Supabase Auth.
- Supabase Storage if needed for logo/uploads.

### Data Access

- Supabase client/server helpers.
- Server Actions or API route handlers where appropriate.
- Strongly typed database models.

### PDF Generation

Use a browser-quality HTML-to-PDF approach suitable for accurate receipt printing.

Preferred approach:

1. Generate print-friendly HTML receipt templates.
2. Render PDFs through a server-side browser renderer such as Puppeteer or Playwright if deployment supports it.
3. Use `@react-pdf/renderer` only if it can accurately reproduce the required two-column A4 layout.

The final solution must produce stable printable PDFs with no broken typography, clipping, or page overflow. The combined bill must support landscape A4 formatting.

### Testing

- Vitest for unit tests where practical.
- Playwright for critical end-to-end workflows if the environment permits.
- At minimum, include tested utility functions for:
  - Receipt number generation
  - GST calculation
  - Balance calculation
  - Order total calculation
  - Measurement reuse logic
  - Date and status handling

### Code Quality

- ESLint.
- Prettier.
- Strict TypeScript.
- No `any` unless justified and tightly localized.
- No unhandled loading or error states.
- Use accessible labels, keyboard navigation, and meaningful empty states.

### Deployment

- Make the app deployable to Vercel.
- Include an `.env.example`.
- Document all required Supabase environment variables.
- Do not commit secrets.

---

## 5. Product Design Requirements

The visual direction must feel elegant, premium, feminine, and modern.

### Design Principles

- Warm ivory/off-white page backgrounds.
- Deep maroon/burgundy as the main accent.
- Soft neutral borders.
- Clean visual hierarchy.
- Spacious layouts.
- Premium boutique aesthetic.
- Avoid excessive gradients, neon colors, cartoon styling, or generic admin-dashboard appearance.
- Use subtle shadows only.
- Use rounded cards carefully, but do not over-round every element.
- Maintain high contrast and accessibility.

### Typography

- Use a refined serif font for primary headings and the brand name.
- Use a highly readable sans-serif font for forms, tables, metadata, and navigation.
- Ensure print templates use print-safe font fallbacks.

### Suggested Visual Direction

- Deep burgundy/wine-red accent.
- Ivory/cream background.
- Charcoal text.
- Soft beige neutral surfaces.
- Green for delivered/paid/ready states.
- Amber for pending/in-progress states.
- Red for overdue/cancelled statuses.
- Use semantic status colors consistently.

### Counter-Workflow Usability

The UI should be optimized for a busy boutique counter:

- Important actions must be obvious.
- **New Order** must be prominent.
- Forms must be easy to complete quickly.
- The returning-customer workflow must be extremely fast.
- Minimize unnecessary navigation steps.
- Use visible success feedback after saving an order.
- Ensure receipt printing is no more than one or two clicks after order creation.

---

## 6. Core User Flows

### 6.1 Create a New Customer

Staff should be able to create a customer with the following fields.

#### Required

- Full name
- Phone number

#### Optional

- Alternate phone number
- Email
- Address
- Date of birth
- Notes
- Preferred communication method
- Tags, such as VIP, regular, alteration-only, etc.

#### Validation

- Phone number should support Indian mobile numbers.
- Prevent obvious duplicates.
- If a matching phone number exists, offer:
  - **Use existing customer**
  - **Create anyway**
- Do not block legitimate family or shared-phone-number situations.

#### Customer Page Requirements

Show:

- Basic profile
- Number of orders
- Last order date
- Pending balance
- Stored measurements
- Order history
- Notes

---

### 6.2 Create a New Order

The new-order workflow should include a multi-section form. Do not force a multi-step wizard unless usability testing strongly supports it.

#### Section A: Customer

- Search existing customer by phone or name.
- Create a new customer inline if none is found.
- Display customer summary when selected.
- Offer **Reuse latest measurements**.

#### Section B: Order Details

- Receipt number, automatically generated and read-only by default.
- Order date, defaulting to today.
- Delivery date.
- Priority:
  - Normal
  - Urgent
  - Express
- Order status, default **New**.
- Assigned tailor, optional.
- Internal notes.
- Customer-facing notes.

#### Section C: Garment Items

Support multiple garment items in a single order.

Each item should have:

- Garment type
- Custom garment-type option
- Quantity
- Rate
- Discount, optional
- Item total
- Fabric/color, optional
- Design reference/notes, optional
- Stitching instructions
- Item-level status if feasible; otherwise use the overall order status initially

Initial garment type presets:

- Blouse
- Suit
- Salwar Suit
- Kurti
- Lehenga
- Gown
- Saree Fall/Pico
- Petticoat
- Alteration
- Dupatta
- Skirt
- Top
- Custom

#### Section D: Measurements

- Measurement grid based on the existing bill format.
- Inputs should be fast to enter.
- Support decimals such as `34.5`.
- Default unit: inches.
- Optional unit conversion is acceptable, but do not overcomplicate the primary workflow.
- Allow **Copy from previous order**.
- Preserve a measurement snapshot at the order level, even if customer-level measurements later change.

#### Section E: Payment and Tax

- Subtotal
- Item-level discounts
- Order-level discount
- Taxable amount
- CGST rate, default `2.5%`
- SGST rate, default `2.5%`
- CGST amount
- SGST amount
- Grand total
- Advance paid
- Balance due
- Payment mode:
  - Cash
  - UPI
  - Card
  - Bank Transfer
  - Mixed
- Payment notes/reference, optional

#### Section F: Actions

- Save Draft
- Save Order
- Save and Print Customer Copy
- Save and Open Combined Print Preview

#### Important Behaviour

- Saving must be transactional.
- Receipt number must be unique.
- Failed PDF generation must never lose a successfully saved order.
- PDF generation must be repeatable later from the order page.
- Totals must update immediately as staff changes quantity, rates, discounts, taxes, or advance payment.

---

### 6.3 Order Status Workflow

Implement these order statuses:

- Draft
- New
- In Stitching
- Ready
- Delivered
- Cancelled

Recommended transition rules:

- Draft → New
- New → In Stitching
- In Stitching → Ready
- Ready → Delivered
- New/In Stitching/Ready → Cancelled
- Delivered should generally not return to earlier states without explicit confirmation.
- Keep a status history/audit record.

The order page should show:

- Current status badge
- Status timeline
- Delivery date
- Overdue indicator if delivery date has passed and status is not Delivered or Cancelled
- Payment summary
- Quick action buttons:
  - Mark In Stitching
  - Mark Ready
  - Mark Delivered
  - Record Payment
  - Print Customer Copy
  - Print Store Copy
  - Print Combined Copy
  - Edit Order

---

### 6.4 Customer History and Measurement Reuse

This is a major feature.

When staff select a returning customer:

- Show prior orders sorted newest first.
- Show latest stored measurements.
- Show measurements used in recent garment orders.
- Allow copying all measurements into the new order.
- Allow copying selected measurement groups only.
- After copying, measurements must remain editable.

#### Important Data Design Principle

Measurements belong both to the customer and to a specific order snapshot.

A future measurement change must not alter the historical record on old bills. The printed store copy must always reproduce the order snapshot from that specific order.

---

## 7. Measurement System

The existing paper bill contains abbreviated tailoring measurement labels. The exact semantic meaning of all abbreviations may vary by garment and by store workflow.

Do **not** hard-code assumptions that could permanently lock the business into incorrect measurement names.

Build a configurable measurement-template system.

### Initial Default Measurement Code List

Include the codes visible or inferred from the current bill:

- L
- C
- K
- H
- D
- SH
- R
- SL
- N
- C2
- L2
- P
- B
- A
- H2
- T
- AK
- O

Important:

- Avoid duplicate database keys such as two generic `C` or `L` fields.
- Use stable internal keys such as:
  - `length`
  - `chest`
  - `waist`
  - `hip`
  - `shoulder`
  - `sleeve_length`
  - `armhole`
  - `measurement_c_2`
  - `measurement_l_2`
- Display labels can initially remain abbreviated:
  - L
  - C
  - K
  - H
  - D
  - SH
  - etc.
- The store owner must be able to rename a displayed label later in Settings.

### Build Measurement Templates by Garment Category

Examples:

- Blouse measurements
- Suit/Kurti measurements
- Gown/Lehenga measurements
- Alteration measurements
- General/custom measurements

Each template should have:

- Template name
- Garment categories it applies to
- Ordered list of fields
- Field code
- Display label
- Optional long label
- Unit
- Input type:
  - Number
  - Text
  - Checkbox
  - Multi-line note
- Required/optional setting
- Sort order
- Active/inactive flag

### Measurement UI

- Use a compact two- or three-column measurement grid on desktop.
- Collapse gracefully to one or two columns on mobile.
- Let staff add optional measurement notes.
- Support garment-specific **Special Notes** separately.

### Store Copy PDF

Render measurements in a layout visually similar to the paper bill:

- Compact columnar arrangement.
- Codes and values visually aligned.
- Do not make it look like a generic long form.
- Preserve enough space for handwritten additions after printing, if desired.

---

## 8. Receipt Number / Serial Number System

Every saved non-draft order must receive a unique serial/receipt number.

Implement a configurable receipt-numbering strategy.

### Default Format

```text
SJD-YYYY-000001
```

Examples:

```text
SJD-2026-000001
SJD-2026-000002
SJD-2027-000001
```

### Requirements

- Sequential numbering should reset yearly by default.
- Must be generated safely in the database or through a transaction to avoid duplicates.
- Must remain immutable once assigned.
- Draft orders may temporarily use a separate draft identifier or no final receipt number.
- Ensure concurrent order creation cannot create duplicate receipt numbers.
- Store receipt number in a searchable, indexed database column.
- Allow administrators to configure:
  - Prefix
  - Starting serial number
  - Reset frequency
  - Format
- Do not allow casual edits to final receipt numbers.

Implement database-side protection wherever possible.

---

## 9. Database Design

Use a normalized PostgreSQL schema with clear foreign keys, indexes, timestamps, and auditability.

### 9.1 `profiles`

Purpose: Store staff/admin user profile information.

Fields:

- `id`
- `full_name`
- `email`
- `role`
- `active`
- `created_at`
- `updated_at`

Roles:

- `admin`
- `staff`

---

### 9.2 `store_settings`

Purpose: Centralized editable business/store settings.

Fields:

- `id`
- `store_name`
- `brand_subtitle`
- `gstin`
- `phone_primary`
- `phone_secondary`
- `email`
- `address_line_1`
- `address_line_2`
- `city`
- `state`
- `postal_code`
- `logo_path`
- `default_cgst_rate`
- `default_sgst_rate`
- `receipt_prefix`
- `receipt_reset_frequency`
- `currency_code`
- `measurement_unit_default`
- `terms_and_conditions`
- `created_at`
- `updated_at`

---

### 9.3 `customers`

Fields:

- `id UUID PRIMARY KEY`
- `customer_code` optional unique human-readable ID
- `full_name`
- `phone_primary`
- `phone_secondary`
- `email`
- `address`
- `birth_date`
- `notes`
- `tags JSONB` or normalized tag table if needed
- `created_at`
- `updated_at`
- `archived_at` nullable

Indexes:

- `phone_primary`
- `full_name`
- `created_at`

---

### 9.4 `orders`

Fields:

- `id UUID PRIMARY KEY`
- `receipt_number` unique, nullable for drafts
- `customer_id` foreign key
- `status`
- `priority`
- `order_date`
- `delivery_date`
- `assigned_tailor_id` nullable
- `subtotal`
- `item_discount_total`
- `order_discount_amount`
- `taxable_amount`
- `cgst_rate`
- `cgst_amount`
- `sgst_rate`
- `sgst_amount`
- `grand_total`
- `advance_paid`
- `balance_due`
- `payment_status`
- `internal_notes`
- `customer_notes`
- `created_by`
- `created_at`
- `updated_at`
- `delivered_at` nullable
- `cancelled_at` nullable
- `archived_at` nullable

Indexes:

- Unique `receipt_number`
- `customer_id`
- `delivery_date`
- `status`
- `created_at`
- `order_date`

---

### 9.5 `order_items`

Fields:

- `id`
- `order_id`
- `garment_type`
- `custom_garment_type`
- `quantity`
- `rate`
- `discount_amount`
- `line_total`
- `fabric_color`
- `design_reference`
- `stitching_instructions`
- `sort_order`
- `created_at`
- `updated_at`

---

### 9.6 `measurement_templates`

Fields:

- `id`
- `name`
- `garment_category`
- `is_active`
- `description`
- `created_at`
- `updated_at`

---

### 9.7 `measurement_template_fields`

Fields:

- `id`
- `template_id`
- `field_key`
- `display_code`
- `display_label`
- `long_label`
- `input_type`
- `unit`
- `is_required`
- `sort_order`
- `created_at`
- `updated_at`

---

### 9.8 `order_measurements`

This must be an immutable-per-order measurement snapshot after the order is finalized.

Fields:

- `id`
- `order_id`
- `order_item_id` nullable if item-specific
- `template_id` nullable
- `field_key`
- `display_code`
- `display_label`
- `value`
- `unit`
- `notes`
- `sort_order`
- `created_at`
- `updated_at`

---

### 9.9 `customer_measurement_profiles`

Purpose: Store latest reusable customer measurements.

Fields:

- `id`
- `customer_id`
- `template_id`
- `field_key`
- `value`
- `unit`
- `source_order_id` nullable
- `updated_by`
- `created_at`
- `updated_at`

---

### 9.10 `payments`

Fields:

- `id`
- `order_id`
- `amount`
- `payment_method`
- `payment_reference`
- `paid_at`
- `notes`
- `created_by`
- `created_at`

---

### 9.11 `order_status_history`

Fields:

- `id`
- `order_id`
- `from_status` nullable
- `to_status`
- `changed_by`
- `notes`
- `created_at`

---

### 9.12 `receipt_sequence`

Purpose: Safely maintain yearly/order-sequence counters.

Fields:

- `id`
- `sequence_key`
- `current_value`
- `year`
- `prefix`
- `updated_at`

Implement safe sequence-increment logic through a PostgreSQL function, database transaction, or equivalent concurrency-safe mechanism.

---

### 9.13 `audit_log`

Purpose: Track meaningful business changes.

Fields:

- `id`
- `entity_type`
- `entity_id`
- `action`
- `actor_id`
- `before_data JSONB` nullable
- `after_data JSONB` nullable
- `created_at`

At minimum, audit:

- Order creation
- Order update
- Status change
- Payment added
- Receipt generated
- Customer update
- Measurement profile update

---

## 10. Security and Access Control

Implement authentication using Supabase Auth.

### Admin

- Full access.
- Store settings.
- User management, if included.
- Delete/restore/archive where applicable.
- Receipt configuration.
- Measurement-template configuration.

### Staff

- Create/edit customers.
- Create/edit orders.
- Add payments.
- Change operational order statuses.
- Print receipts.
- Cannot edit core business settings.
- Cannot permanently delete records.

### Requirements

- Use row-level security where applicable.
- Protect server-side actions.
- Validate all input on the server, not only client side.
- Do not expose sensitive Supabase service-role keys in browser code.
- Avoid destructive deletion; use archive/soft delete unless explicit delete behavior is required.
- Document access-control assumptions.

---

## 11. Dashboard Requirements

Create a useful, visually polished dashboard.

### Summary Cards

- Orders today
- Deliveries today
- Pending orders
- Overdue orders
- Amount collected today
- Total outstanding balance

### Main Dashboard Sections

1. **Today’s Deliveries**
   - Customer
   - Receipt number
   - Garments
   - Status
   - Balance
   - Quick action

2. **Upcoming Deliveries**
   - Next 7 days
   - Group by date if visually appropriate

3. **Overdue Orders**
   - Clearly highlighted
   - Customer
   - Delivery date
   - Days overdue
   - Current status
   - Balance due

4. **Recent Orders**
   - Receipt number
   - Customer
   - Date
   - Status
   - Total
   - Quick link

5. **Payment Summary**
   - Add a simple chart only if it provides real value.
   - Do not clutter the first version with unnecessary analytics.

### Dashboard Quality Requirements

- Good empty states
- Loading skeletons
- Error states
- Useful quick links
- Prominent **New Order** button

---

## 12. Order List Page

Create a searchable, filterable order list.

### Columns

- Receipt No.
- Customer
- Phone
- Garments
- Order Date
- Delivery Date
- Status
- Grand Total
- Balance Due
- Actions

### Filters

- Search by receipt number, customer name, or phone number
- Status
- Delivery-date range
- Order-date range
- Payment status
- Priority
- Garment type, if feasible

### Features

- Pagination
- URL-synced filters if feasible
- Export filtered data to CSV
- Clear empty state
- Responsive mobile cards instead of unreadable tables
- Clicking a row opens the order detail page

---

## 13. Customer List and Customer Detail Page

### Customer List Columns

- Customer name
- Primary phone
- Total orders
- Last order date
- Outstanding balance
- Actions

### Customer Detail Page Sections

- Customer header and contact details
- Customer tags/notes
- Current outstanding balance
- Latest reusable measurements
- Recent orders
- All orders
- Payment history, if feasible
- **Create New Order for This Customer** action
- **Use Latest Measurements** action

---

## 14. Order Detail Page

The order-detail page should be one of the strongest screens in the product.

### Header

- Receipt number
- Customer name
- Status badge
- Delivery date
- Primary actions

### Primary Actions

- Edit Order
- Add Payment
- Change Status
- Customer Copy PDF
- Store Copy PDF
- Combined Print PDF

### Sections

1. Customer Details
2. Garment Items
3. Measurements
4. Payment Summary
5. Payment History
6. Status Timeline
7. Internal Notes
8. Customer-facing Notes
9. Generated Documents / Print history, if implemented

Use a clear layout that makes the most operationally important information visible without excessive scrolling.

---

## 15. PDF and Print Requirements

This is a high-priority requirement.

Implement three receipt templates.

### 15.1 Customer Copy PDF

Format:

- Compact receipt.
- Printable as standalone A4 portrait or a compact defined page size.

Must contain:

- Logo
- Store name
- Store contact/address
- GSTIN
- Receipt number
- Customer name
- Contact number
- Order date
- Delivery date
- Garment item list
- Quantity
- Rate
- Amount
- Subtotal
- CGST
- SGST
- Grand total
- Advance paid
- Balance due
- Terms and conditions
- Thank-you message
- Optional signature/authorized-signatory area

Must not contain:

- Internal measurement details
- Internal tailor notes
- Internal status history
- Private staff information

---

### 15.2 Store Copy PDF

Format:

- Larger detailed receipt.
- Printable independently.

Contains all customer-copy data plus:

- Full measurements
- Measurement template name
- Garment-specific instructions
- Internal notes
- Assigned tailor, if appropriate
- Status
- Space for handwritten notes if printed
- Proprietor area/signature area

---

### 15.3 Combined A4 Landscape PDF

This must mimic the existing paper-bill concept.

Layout:

- A4 landscape.
- Store copy on the left side.
- Customer copy on the right side.
- Store side approximately 66.67% width.
- Customer side approximately 33.33% width.
- Vertical perforation-style divider line.
- Both copies share a consistent visual identity.
- Customer side must remain legible despite the smaller width.
- Ensure margins are printer-safe.
- Ensure no content overflows or gets cut off.

### Print CSS Requirements

- Use `@page` rules.
- Use print-specific styles.
- Hide UI controls.
- Use printer-friendly backgrounds only where necessary.
- Ensure logo behaves correctly in print.
- Avoid page breaks inside important receipt sections.
- Ensure totals remain aligned.
- Use fixed-layout measurements where necessary.

### PDF Naming

```text
Customer_Copy_<receipt-number>.pdf
Store_Copy_<receipt-number>.pdf
Combined_Print_<receipt-number>.pdf
```

Ensure repeated PDF generation always creates a correct fresh document from stored order data.

---

## 16. Calculation Rules

Implement calculation functions as tested reusable utilities.

### Formulas

For each order item:

```text
line_total = (quantity × rate) - item_discount_amount
```

Order subtotal:

```text
subtotal = sum(line_total)
```

Taxable amount:

```text
taxable_amount = subtotal - order_discount_amount
```

CGST:

```text
cgst_amount = taxable_amount × (cgst_rate / 100)
```

SGST:

```text
sgst_amount = taxable_amount × (sgst_rate / 100)
```

Grand total:

```text
grand_total = taxable_amount + cgst_amount + sgst_amount
```

Balance due:

```text
balance_due = grand_total - total_payments_received
```

### Rules

- Use decimal-safe currency handling.
- Do not rely on floating-point arithmetic without safeguards.
- Store money using either:
  - Integer paise, preferred; or
  - Exact decimal database types.
- Use Indian Rupee formatting.
- Display values such as `₹1,234.00` when appropriate.
- Ensure negative balances are clearly handled as credit/overpayment.
- Default GST rates should load from store settings.
- Allow tax-rate override per order only for admins if desired.
- Ensure PDFs use final saved calculation values rather than recalculating differently on the client.

---

## 17. Settings Page

Implement an admin-only Settings area.

### 17.1 Store Profile

- Store name
- Subtitle
- GSTIN
- Address
- Phones
- Email
- Logo upload/path
- Receipt footer / terms

### 17.2 Receipt Settings

- Receipt prefix
- Numbering strategy
- Yearly reset behavior
- Starting number
- Default tax rates
- Currency

### 17.3 Measurement Templates

- Create template
- Edit template
- Add/remove/reorder fields
- Update display codes
- Update long labels
- Activate/deactivate templates

### 17.4 Garment Types

- Configure presets
- Add custom garment categories

### 17.5 Staff and Permissions

- Optional if user management is within scope
- At minimum, prepare role support in schema and application authorization

---

## 18. Recommended Project Structure

Use a clean, scalable directory structure such as:

```text
src/
  app/
    (auth)/
    dashboard/
    customers/
    orders/
    settings/
    api/
  components/
    ui/
    layout/
    dashboard/
    customers/
    orders/
    measurements/
    receipts/
    shared/
  lib/
    supabase/
    utils/
    validations/
    calculations/
    constants/
    permissions/
  services/
    customers/
    orders/
    payments/
    receipts/
    settings/
    measurements/
  types/
  hooks/
  styles/

supabase/
  migrations/
  seed.sql
  functions/

public/
  Logo.PNG

docs/
  architecture.md
  setup.md
  print-testing.md
  data-model.md
```

Do not put all business logic directly inside page components.

---

## 19. Implementation Phases

Follow these phases in order.

### Phase 0: Repository Assessment and Execution Plan

1. Inspect the repository.
2. Identify:
   - Existing framework
   - Existing dependencies
   - Existing database setup
   - Existing environment variables
   - Existing styles/components
   - Existing test setup
3. Report:
   - What will be reused
   - What will be changed
   - Risks/compatibility concerns
4. Create or update:
   - `README.md`
   - `docs/architecture.md`
   - `docs/setup.md`
   - `.env.example`
5. Do not begin large-scale implementation until the codebase assessment is complete.

#### Acceptance Criteria

- The repository assessment is complete.
- The initial technical direction is documented.
- Setup requirements are explicit.

---

### Phase 1: Foundation and Design System

1. Configure:
   - TypeScript strict mode
   - Tailwind
   - shadcn/ui
   - Linting
   - Formatting
   - Environment-variable validation
2. Build:
   - Main app shell
   - Sidebar navigation
   - Header
   - Responsive mobile navigation
   - Auth pages
   - Dashboard placeholder with real empty-state structures
3. Implement:
   - Brand colors
   - Typography
   - Buttons
   - Inputs
   - Form layouts
   - Status badges
   - Loading skeletons
   - Error states
4. Add `Logo.PNG` fallback behavior.

#### Acceptance Criteria

- App runs locally.
- Responsive layout works.
- No TypeScript errors.
- No lint errors.
- UI feels coherent and premium.

---

### Phase 2: Database and Authentication

1. Create Supabase migrations.
2. Create all core tables.
3. Add indexes and constraints.
4. Add row-level security policies.
5. Create roles and permission checks.
6. Create receipt-sequence logic.
7. Add seed data:
   - Store settings
   - Measurement templates
   - Initial garment types
   - Test admin/staff instructions only, never actual secrets
8. Build authentication flow.
9. Build protected-route logic.

#### Acceptance Criteria

- Fresh database migration works from scratch.
- Authenticated staff can access operational pages.
- Admin-only routes are protected.
- Receipt-number generation is safe and unique.
- Database schema is documented.

---

### Phase 3: Customer Management

1. Implement customer list page.
2. Implement customer create/edit form.
3. Implement customer detail page.
4. Implement phone/name search.
5. Implement duplicate detection.
6. Implement customer order-history display.
7. Implement latest-measurement display structure.

#### Acceptance Criteria

- Staff can create, search, and edit customers.
- Duplicate detection works.
- Customer detail shows related orders.
- Mobile layout remains usable.

---

### Phase 4: Measurement Templates and Measurement Capture

1. Implement measurement-template storage and UI.
2. Seed initial templates.
3. Build measurement-entry component.
4. Build reusable measurement-value display.
5. Build previous-measurement-copy workflow.
6. Store measurements as order snapshots.
7. Update latest customer measurement profile after order save, with clear business rules.

Recommended business rule:

> When a non-draft order is created or updated, offer a checked-by-default option: “Save these as the customer’s latest measurements.”

Preserve old order measurements permanently.

#### Acceptance Criteria

- Measurements can be entered quickly.
- Templates are configurable.
- Reusing measurements works.
- Historical orders retain original measurement snapshots.

---

### Phase 5: Order Creation and Payment Handling

1. Build complete new-order page.
2. Build order-item editor.
3. Build totals calculator.
4. Build tax/discount logic.
5. Build payment recording.
6. Build status transitions and timeline.
7. Implement draft behavior.
8. Build order-detail page.
9. Build order-edit behavior with audit logging.

#### Acceptance Criteria

- A complete order can be created, saved, searched, edited, and marked delivered.
- Totals are correct.
- Receipt number is unique.
- Payment balance is correct.
- Status history is recorded.
- Audit log records meaningful changes.

---

### Phase 6: Dashboard, Lists, Search, and Filtering

1. Build live dashboard data.
2. Build order-list filters.
3. Add overdue calculation.
4. Add customer-list filters.
5. Add CSV export for filtered orders.
6. Add responsive table/card behavior.

#### Acceptance Criteria

- Staff can find an order quickly by phone, customer name, or receipt number.
- Overdue deliveries are visible.
- Dashboard shows meaningful operational data.
- Filters are reliable and fast.

---

### Phase 7: PDF Generation and Printing

1. Build receipt-template data mapper.
2. Build customer-copy template.
3. Build store-copy template.
4. Build combined A4 landscape template.
5. Add print-preview route/page.
6. Add PDF download/generation endpoints.
7. Validate print styles in browser.
8. Test multiple data scenarios:
   - Single item
   - Multiple items
   - Long customer name
   - Long garment instructions
   - No advance
   - Partial advance
   - Full payment
   - Discount
   - GST
   - Long measurement values/notes
   - Missing-logo fallback
9. Ensure all generated PDF filenames follow the naming convention.

#### Acceptance Criteria

- All three document types generate successfully.
- Combined layout remains legible and correctly proportioned.
- No clipping or overflow.
- Totals and measurements accurately match saved order data.
- Reprinting old orders works.

---

### Phase 8: Quality Assurance and Production Readiness

1. Add comprehensive validation.
2. Add unit tests for calculations and receipt numbering.
3. Add critical-flow tests:
   - Create customer
   - Create order
   - Reuse measurements
   - Add payment
   - Change status
   - Generate PDFs
4. Verify RLS/security.
5. Verify responsive layouts.
6. Verify empty/loading/error states.
7. Review accessibility.
8. Run production build.
9. Add deployment instructions.
10. Add database backup/export guidance.

#### Acceptance Criteria

- `npm run lint` passes.
- `npm run typecheck` passes.
- `npm run test` passes.
- Production build passes.
- No obvious console errors.
- No hard-coded secrets.
- Documentation is complete.

---

## 20. Implementation Details and Quality Bar

### Components

- Keep components focused.
- Prefer composition.
- Use reusable form sections.
- Avoid deeply nested prop drilling.
- Use proper loading, disabled, and error states.

### Validation

- Zod schemas should be shared between client and server where possible.
- Validate dates.
- Validate payment values.
- Validate quantity and rate.
- Validate delivery-date behavior without unnecessarily preventing legitimate backdated records.
- Validate tax-rate bounds.

### Data Integrity

- Receipt numbers must be unique.
- Payments cannot silently make the balance inconsistent.
- Orders should preserve tax and price snapshots.
- Measurements must preserve snapshots.
- Never mutate historical receipt data unintentionally.

### UX

- Confirm destructive actions.
- Toast success/error feedback.
- Prevent accidental double submission.
- Show save state.
- Allow keyboard-friendly operation.
- Use sensible default values.
- Do not require users to understand technical terminology.

### Performance

- Paginate large lists.
- Index searchable fields.
- Avoid fetching entire history unnecessarily.
- Use server-side filtering where practical.
- Cache non-sensitive stable settings carefully.

### Accessibility

- Labels for every input.
- Keyboard-accessible dropdowns and dialogs.
- Adequate color contrast.
- Do not rely on color alone for statuses.
- Semantic table and heading structure.

---

## 21. Documentation Requirements

Create and maintain the following files.

### `README.md`

Include:

- Overview
- Stack
- Local setup
- Environment variables
- Supabase setup
- Migration instructions
- Development commands
- Test commands
- Build/deploy steps

### `docs/architecture.md`

Include:

- System architecture
- Data flow
- Authentication
- PDF generation design
- Receipt-numbering strategy

### `docs/data-model.md`

Include:

- Entity-relationship explanation
- Key constraints
- Why measurement snapshots are stored separately

### `docs/print-testing.md`

Include:

- How to test customer copy
- How to test store copy
- How to test combined A4 landscape copy
- Browser/printer considerations
- Test cases for long text and multiple garment items

### `docs/operations.md`

Include:

- Daily staff workflow
- How to create an order
- How to find an old order
- How to reprint a bill
- How to update measurements
- How to mark an order delivered
- How to record payment

---

## 22. Final Deliverables

By the end of implementation, deliver:

1. Fully functional web app.
2. Supabase migration files.
3. Seed data.
4. Authentication and authorization.
5. Customer management.
6. Order management.
7. Measurement templates and reusable measurements.
8. Payment tracking.
9. Dashboard.
10. Search/filter/order list.
11. Customer history.
12. Three PDF receipt types:
    - Customer Copy
    - Store Copy
    - Combined A4 Print Copy
13. Settings area.
14. Tests.
15. Documentation.
16. `.env.example`.
17. Production-ready build verification.

---

## 23. Required Progress Report Format

At the end of every major implementation phase, provide a concise engineering report containing:

1. What was implemented.
2. Files created/modified.
3. Database migrations added.
4. Commands run.
5. Test/build results.
6. Known limitations or deferred items.
7. Exact next phase.

At the end of the project, provide:

1. Final architecture summary.
2. Main routes/pages.
3. Database schema summary.
4. Receipt/PDF implementation explanation.
5. Required environment variables.
6. Local run instructions.
7. Supabase migration/deployment steps.
8. Production deployment steps.
9. Test evidence.
10. Known future enhancements.

---

## 24. Starting Instruction

Begin by inspecting the repository and providing the **Phase 0 repository assessment**.

Do not jump directly into building screens before understanding the existing codebase.
