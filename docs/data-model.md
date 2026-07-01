# Data Model

## Core Entities

- `profiles`: staff/admin metadata mapped to Supabase Auth users.
- `store_settings`: editable business profile, GST, logo path, receipt prefix, and terms.
- `customers`: searchable customer records with phone indexes, tags, and soft archive.
- `orders`: order header, status, priority, delivery date, payment summary, and immutable receipt number.
- `orders.cloth_sample_image_url`: optional customer fabric sample image for the web order detail and store copy only.
- `order_items`: multiple garment lines per order.
- `measurement_templates` and `measurement_template_fields`: configurable measurement labels and field order.
- `order_measurements`: immutable order-level measurement snapshot.
- `customer_measurement_profiles`: latest reusable customer measurements.
- `payments`: payment events.
- `order_status_history`: audit timeline for status changes.
- `receipt_sequence`: concurrency-safe yearly counters.
- `audit_log`: meaningful business change records.

## Measurement Snapshot Rationale

Customer measurements can change over time. A printed bill must reproduce the measurements used on that specific order, so `order_measurements` stores a snapshot independent of latest customer measurement profiles. Reusing measurements copies values into a new editable snapshot; it does not link the new order to mutable historical values.

## Constraints and Indexes

The migration includes:

- Unique `receipt_number`.
- Non-draft orders require receipt numbers.
- Cloth sample images are stored with the order snapshot so they reference the exact garment fabric for that bill.
- Customer phone and name search indexes.
- Order indexes for customer, delivery date, status, order date, and created date.
- Unique `(template_id, field_key)` for measurement fields.
- Unique `(customer_id, template_id, field_key)` for latest customer measurements.
