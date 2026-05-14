# Cashier User Manual

## Overview
This manual explains how to use the Point-of-Sale (POS) interface for cashiers: logging in, ringing sales, applying discounts, processing payments, and handling common issues.

## Getting Started
- Open the POS app (typically `frontend` URL provided by your organization).
- Log in with your cashier account credentials.

## Main Screen (POS)
- Cart area: displays items added to the sale.
- Product search: search by name or barcode to add items.
- Quantity selector: change item quantities in the cart.
- Payment button: proceed to payment modal.
- Manager Auth: prompts when manager approval is required.

## Typical Sales Workflow
1. Search or scan product and press Enter to add to cart.
2. Verify quantities and prices in the cart.
3. If discount is required, select the item and apply discount (percent or fixed). If manager approval required, request manager.
4. Click `Payment` or `Checkout`.
5. Choose payment method: Cash, Card, or Other (as configured).
6. Enter amount tendered (for cash) and confirm. The system calculates change.
7. Print or email receipt when prompted.
8. End sale — cash drawer opens if connected.

## Quick Sale (Express)
- Use Quick Sale mode (if available) to enter a fixed price item or service quickly.

## Returns, Refunds and Exchanges
- Open `Transactions` or `Sales` and search by receipt number or date.
- Select the transaction and choose `Return` or `Refund`.
- Scan/itemize returned items and confirm refund method (cash/card/store credit).
- Manager approval may be required depending on store policy.

## Opening / Closing Shift
- On shift start: log into POS and record opening balance if required via `Opening Balance` modal.
- On shift close: run `Closing Balance` modal, count cash, enter totals, and confirm. Submit any variance notes.

## Discounts & Promotions
- Apply item-level or cart-level discounts via discount controls. Follow store policy for approvals.

## Handling Payments
- Cash: enter amount given; system shows change.
- Card: select `Card` and follow terminal prompts. Confirm payment success before completing sale.
- Split payments: add multiple payment types sequentially.

## Printing & Emailing Receipts
- After completing a sale, choose `Print` to send to the connected printer or `Email` to send receipt to customer.

## Low-stock & Near-expiry Alerts
- The POS may surface low-stock or near-expiry alerts. If shown, notify manager and follow escalation.

## Security & Best Practices
- Never share your login or password.
- Log out when leaving terminal unattended.
- Use `Manager Auth` when asked to override limits.

## Troubleshooting (Common Issues)
- Barcode not scanning: try manual search by SKU or product name.
- Card terminal failing: ask manager to reinitialize terminal or use alternate payment.
- Printer not printing: check paper and connection, restart printer.
- Incorrect prices: do not override price without manager approval; log incident.

## FAQ
- Q: What if the customer wants a price override? A: Request manager approval via `ManagerAuth`.
- Q: How to reprint a receipt? A: Find transaction in `Transactions` and select `Reprint`.

## Contacts & Escalation
- Local manager: [enter name/extension]
- IT support: [enter contact]

---
_Last updated: May 14, 2026_
