# Admin User Manual

## Overview
This manual is for system administrators responsible for user roles, system configuration, database maintenance, backups, integrations, and deployment tasks.

## Access & Security
- Admin accounts should use strong passwords and 2FA where available.
- Limit admin access to authorized personnel only.

## Users & Roles
- Create roles: `cashier`, `manager`, `admin`. Assign permissions accordingly.
- Create/edit users in `Users` panel; reset passwords or disable accounts when necessary.
- Audit user activity regularly via logs.

## System Configuration
- Configure global settings: company info, tax rates, receipt templates, payment gateways.
- Payment gateway keys and terminal settings stored securely — update through `Settings`.

## Branch & Store Setup
- Add branches and configure defaults (currency, timezone, receipt printers, POS terminals).
- Assign users to branches and set access levels.

## Database & Backups
- Use `init_db.py` and `populate_inventory.sql` (in `backend/`) for initial seeding and restores.
- Regular backups: schedule DB dumps and offsite storage. Verify backups periodically.
- For major restores, notify stakeholders and follow maintenance windows.

## Deployments & Backend
- Backend entry point: `backend/app.py` and related modules in `backend/`.
- Dependencies: review `backend/requirements.txt` and `frontend/package.json` for builds.
- Deployment: follow the project's deployment scripts (`Procfile`, `run.sh`, `vercel.json`) and CI/CD policies.

## Integrations
- Payment processors: configure credentials and webhook endpoints.
- Email/SMS: set SMTP or provider credentials in `Settings`.

## Import/Export
- Inventory import: use template in `frontend/src/input data/` and import tools.
- Export: provide CSV exports for accounting and analytics.

## Monitoring & Logs
- Monitor application logs, API errors, and background jobs.
- Configure alerts for critical failures (payment errors, DB connectivity issues).

## Maintenance Tasks
- Rebuild indexes and vacuum DB as per DB vendor recommendations.
- Apply security patches to dependencies regularly.

## Troubleshooting
- Database connection failures: check environment variables and DB server status.
- Failed background jobs: inspect job queue and retry logic; run `init_db.py` for re-seeding with caution.

## Compliance & Data Privacy
- Ensure customer data retention policies and remove PII per legal requirements.
- Follow local tax and reporting rules when configuring invoices/receipts.

## Emergency Procedures
- Rollback deployment: have versioned backups and a tested rollback process.
- Incident response: notify stakeholders, capture logs, and perform post-mortem.

## Contacts
- DevOps: [enter contact]
- Legal/Compliance: [enter contact]

---
_Last updated: May 14, 2026_
