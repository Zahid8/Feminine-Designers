# Print Testing

## Routes

- Customer copy: `/receipts/order-1/customer`
- Store copy: `/receipts/order-1/store`
- Combined A4 landscape: `/receipts/order-1/combined`
- PDF downloads: `/api/receipts/order-1/customer`, `/api/receipts/order-1/store`, `/api/receipts/order-1/combined`

## Browser Checks

1. Open each preview route.
2. Use print preview.
3. Confirm customer copy excludes measurements and internal notes.
4. Confirm store copy includes measurements and stitching/internal notes.
5. Confirm combined copy uses A4 landscape with store copy on the left and customer copy on the right.
6. Confirm totals match the order detail page.

## Data Scenarios

Test at least:

- Single garment item.
- Multiple garment items.
- Long customer name.
- Long stitching instructions.
- No advance payment.
- Partial advance.
- Full payment.
- Item discount and order discount.
- GST at configured rates.
- Missing `public/Logo.PNG`; text branding must remain visible.

## Printer Notes

Use printer-safe margins and avoid scaling below 95 percent unless the printer driver requires it. The HTML preview uses `@page` rules; the PDF route produces fixed A4 documents.
