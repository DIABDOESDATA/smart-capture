# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

We take the security of dealership data, vehicle inventory assets, and user privacy seriously.

If you believe you have discovered a vulnerability in Smart Capture:

1. **Do not create a public GitHub Issue.**
2. Email security vulnerability reports directly to `hussein@diabdoesdata.com`.
3. Include detailed steps to reproduce, affected endpoints/components, and an impact assessment.
4. We acknowledge receipt within 48 hours and coordinate remediation before public disclosure.

## Public Repository Security Guardrails

- All database access is governed by strict PostgreSQL Row Level Security (RLS) policies ensuring complete multi-tenant dealership isolation.
- Service-role keys, customer secrets, and private credentials are NEVER committed to source control or exposed to client-side code.
- Continuous dependency audits and static security analysis are automated via GitHub Actions and CodeQL.
