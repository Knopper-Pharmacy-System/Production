# Manager User Manual

## Overview
This manual covers manager responsibilities: oversight of daily operations, approving cashier actions, inventory management, purchase orders, reports, and user management within the system.

## Accessing the Manager UI
- Navigate to the manager dashboard (URL or frontend route).
- Log in with your manager credentials. Two-factor or additional auth may be required.

## Dashboard Overview
- Summary widgets: daily sales, transactions, top products, low stock alerts.
- Branch selector: switch between branches (if multi-branch).
- Quick actions: Open/Close registers, Approve refunds, Create purchase orders.

## Approving Cashier Actions
- When a cashier requests `Manager Auth`, receive a prompt with details.
- Review the request and either `Approve` or `Deny` with optional note.

## Inventory Management
- View inventory list and filter by branch, category, or low-stock.
- Adjust stock: use `Receive Delivery` to add quantities against POs.
- Manual adjustments: apply corrections only with notes and reason.
- Import inventory: use CSV import tools in `Inventory` -> `Import` (follow template).

## Purchase Orders (PO)
- Create PO: choose supplier, add items and quantities, save as draft or send.
- Receive deliveries: match delivery to PO, confirm quantities and mark as received.
- Track open POs and backorders from the `Purchase Orders` list.

## Sales & Reports
- Run sales reports by date range, branch, or cashier.
- Use `Sales Analytics` for trends, top selling SKUs, and margin analysis.
- Export reports as CSV or PDF for accounting.

## Branch & User Management
- Create or edit branches with address and contact details.
- Add users: create cashier or manager accounts and assign roles.
- Reset passwords and deactivate users as needed.

## Stock Transfers
- Initiate transfer: select source and destination branch, add items and quantities.
- Confirm receipt at destination to finalize transfer and update inventory.

## Near-Expiry & Low Stock Monitoring
- Review `Near Expiry` and `Low Stock` dashboards daily.
- Plan promotions or transfers to move stock; create POs if replenishment needed.

## Audit & Transactions
- Use `Transactions` to view detailed receipts, returns, and adjustments.
- Audit logs: review user actions, price overrides, and stock adjustments.

## System Settings (Manager-level)
- Configure register settings like tax rates, receipt templates, and payment methods (some settings may be admin-only).

## Troubleshooting & Escalation
- Cash drawer/receipt printer issues: verify hardware and restart services; escalate to IT if unresolved.
- Data discrepancies: run inventory reports and reconcile with physical counts; log issues.

## Best Practices
- Review daily dashboard at start and end of shift.
- Approve only documented price overrides.
- Keep audit notes for manual adjustments.

## FAQ
- Q: How to approve a refund? A: Open the transaction and use `Approve Refund` with reason.
- Q: How to import a large inventory? A: Use the `Import` CSV tool — follow the sample template.

## Contacts & Escalation
- System Admin: [enter contact]
- IT Support: [enter contact]

---
_Last updated: May 14, 2026_
