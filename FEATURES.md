# TransferPoint Web App Features

This document summarizes the core features of the TransferPoint money transfer system.

## Authentication and Access
- Microsoft SSO (Azure AD) sign-in.
- Role-based access control (ADMIN, STAFF, AML).
- Protected routes and API endpoints.

## Customer Management
- Create, edit, and view customer profiles.
- Store contact details, address, and employment data.
- Upload and view customer ID documents.

## Transactions
- Create and manage money transfer transactions.
- Track status, fees, rates, and totals.
- Support for multiple currencies (NZD, WST, AUD, USD).
- Upload and manage supporting documents (source of funds, proof of address, other).

## Agents and Portal
- Agent management with codes and locations.
- Agent portal for creating and tracking transactions.

## AML and Compliance
- AML/PTR transaction review.
- Export selected transactions for reporting.

## Reports and Analytics
- Daily and monthly reports (JSON/CSV).
- Agent performance statistics.
- Transaction history charts.

## Settings and Configuration
- Branding and UI customization (business name, fonts, footer).
- Email configuration via Microsoft Graph.
- Exchange rate management (manual + API update).
- Fee brackets and transaction status management.

## Operational Tools
- Activity logging for key actions.
- Database connection settings and test/migration utilities.
