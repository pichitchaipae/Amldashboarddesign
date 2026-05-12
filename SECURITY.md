# Security Policy

## Project Scope

This repository contains the **AML Decision Support Dashboard** — a front-end prototype built with React + TypeScript + Vite. It is designed for academic demonstration (Mahidol University, ITDS 345 — Business Intelligence) and does **not** process real financial data, personally identifiable information (PII), or connect to live AML systems.

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.0.1   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security issue in this project, please report it responsibly:

1. **Email:** [pichitchai.pae@student.mahidol.edu](mailto:pichitchai.pae@student.mahidol.edu)
2. **GitHub Issues:** Open a [new issue](https://github.com/pichitchaipae/Amldashboarddesign/issues) with the label `security`.

### What to include

- A clear description of the vulnerability and its potential impact.
- Steps to reproduce the issue.
- Any suggested fix or mitigation, if available.

### Response timeline

- **Acknowledgement:** within 48 hours.
- **Assessment and fix:** best-effort basis, as this is an academic project.

## Security Considerations

Although this is a prototype, the following practices are observed:

| Area | Measure |
| ---- | ------- |
| **No secrets in source** | No API keys, tokens, or credentials are committed to the repository. |
| **Dependency management** | Dependencies are pinned and audited via `npm audit`. |
| **No server-side code** | The application is a client-side SPA with no backend, database, or authentication layer. |
| **No real data** | All transaction IDs, amounts, risk scores, and KPI values are synthetic/demo data. |
| **Content Security** | No user-generated content is rendered with `dangerouslySetInnerHTML`. |
| **Accessibility** | Inputs are labelled, modals are focus-trapped, and ARIA attributes are applied to meet WCAG 2.1 AA guidelines. |

## Disclaimer

This project is an academic prototype and is **not intended for production use** in any real AML compliance or financial monitoring environment. The decision engine and all dashboard metrics use simulated data for demonstration purposes only.
