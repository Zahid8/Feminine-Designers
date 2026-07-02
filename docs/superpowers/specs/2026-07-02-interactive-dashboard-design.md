# Interactive Dashboard Design

## Goal

Make the dashboard an interactive workbench for daily shop operations. The dashboard should let staff tap summary cards and immediately see the matching orders, payments, or balances without leaving the dashboard.

## Approved Direction

The approved direction is the "Insightful Workbench" layout:

- Large clickable metric cards across the top.
- A main work queue that changes based on the selected metric.
- A right-side insight column for urgent work, high balances, and recent collections.
- Touch-friendly buttons and rows for tablet use.

## Dashboard Views

The summary cards become filter controls:

- `Orders Today`: orders created today.
- `Deliveries Today`: orders due today and not cancelled.
- `Pending Orders`: orders that are not delivered or cancelled.
- `Overdue Orders`: orders past delivery date and not delivered or cancelled.
- `Collected Today`: payments collected today, grouped with their order/customer.
- `Outstanding`: orders with positive balance due, sorted highest first.

## Work Queue

The main panel shows the selected view with a clear title, count, explanatory text, and relevant rows. Order rows include receipt, customer, garment summary, date context, status badges, total/paid/balance, and an `Open` button. Payment rows include receipt, customer, amount, method, and paid time/date.

## Insight Panels

The right column shows small operational panels:

- Highest outstanding balances.
- Urgent or overdue deliveries.
- Recent collections.
- Ready orders with undelivered items.

## Data Flow

The server dashboard page fetches orders once using the existing order service. A pure dashboard model helper derives summaries, filtered views, and insight lists. A client dashboard component handles selected-view state locally for instant interaction.

## Testing

Add focused tests for the dashboard model helper: card counts, filtered view membership, payment rows, and outstanding sorting. Then verify with lint, typecheck, full test suite, audit, build, and HTTP smoke checks.
