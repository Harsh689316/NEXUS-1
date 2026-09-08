# NEXUS — Investigation Intelligence Platform

NEXUS is a controlled investigation intelligence workspace with adaptive device authentication, jurisdiction-aware access control, relationship analysis and cryptographic audit verification.

## Services

Only two application ports are used:

- **3000** — React/Vite interface
- **4000** — Express authentication API

The Vite development server proxies `/api/*` to port 4000.

## Run

```bash
npm install
npm run server
```

In a second terminal:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Authentication

The login flow uses an officer ID and password as the first factor, followed by adaptive WebAuthn/passkey authentication when a registered authenticator is available. Supported device authenticators can include Windows Hello, fingerprint, face authentication, platform PIN verification, passkeys and security keys.

If a device cannot use WebAuthn, the officer can use the controlled recovery-code path. A passkey can also be registered on a supported device after recovery verification.

WebAuthn verification is performed by the Express service on port 4000. Registered credential metadata is persisted under `.nexus-auth/` for local continuity.

## Jurisdiction hierarchy

- **Investigator / Inspector:** assigned operational area
- **Senior Investigator / SI / ACP / SP / DCP:** assigned city
- **DIG / IG / ADG / DGP:** assigned division

The data service filters persons, cases, relationships, transactions, tips, searches and graph entities against the authenticated officer's clearance and jurisdiction. In a production deployment, the same policy must also be enforced at the database/API layer; client-side filtering alone is not a security boundary.

## Network intelligence graph

The relationship graph is responsive, searchable, zoomable, draggable and jurisdiction-scoped. Selecting an entity opens its authorized dossier context, and graph links are limited to records visible to the current officer.

## Build

```bash
npm run build
```


## Remote one-time recovery
The authentication flow now supports administrator-approved recovery requests. An officer requests recovery after password verification; a `system_admin` approves the request; NEXUS generates a cryptographically random 8-digit code that expires after 5 minutes and can be used once. If Resend is configured, the code is emailed to the officer's server-side verified recovery address. If email is not configured, the code is shown only to the system administrator so it can be communicated through an approved secure channel.

### Hosted deployment
1. Host the Vite frontend on an HTTPS domain.
2. Host `server.js` on a backend service with Node 20+ and port 4000 (or map the platform's public port to the app's `PORT`).
3. Set `FRONTEND_ORIGIN` to the exact HTTPS frontend origin and `RP_ID` to the frontend hostname. WebAuthn requires HTTPS in production.
4. Configure `RESEND_API_KEY` and `RECOVERY_FROM_EMAIL`, then set `RECOVERY_EMAIL_<OFFICER_ID>` variables for verified officer mailboxes.
5. Never put provider API keys in Vite/client environment variables.
6. For production, replace in-source officer passwords with a database/identity provider, move sessions to a persistent server-side store, add CSRF protection/rate limiting, and store recovery/audit data in durable storage.


## Recovery flow verification

After `npm run server` is running on port 4000, log in on port 3000 with an officer ID and password. If no passkey is registered, choose **Request recovery**. The request is created by `POST /api/auth/recovery/request` and appears to the isolated `system_admin` account under Settings. The administrator approves it, which issues a random one-time code. The officer's screen polls the recovery status until it becomes `APPROVED`, then accepts the one-time code.

The Security Administrator also has a local bootstrap recovery path for first-time local testing using the seeded administrator recovery code. This is intended only for local development; disable it for production.


## GitHub safety and secret management

Officer passwords and recovery codes are loaded only from server-side environment variables. No authentication secret belongs in `server.js` or frontend source. The committed `.env.example` contains placeholders only.

Before pushing to GitHub:

1. Copy `.env.example` to a local `.env` or `.env.local` and replace placeholders with strong unique values.
2. Never commit `.env`, `.env.local`, `.nexus-auth/`, API keys, private keys, certificates, local databases, or build artifacts.
3. Use GitHub/hosting secret management for deployed credentials.
4. Run `npm run lint` and `npm run build`.
5. Review `git status` and staged changes for credentials before pushing.
6. Rotate any credential that was ever committed; removing it later does not make the old secret safe.

The isolated Security Administrator is kept separate from the police command hierarchy, and its credentials are server-side only.


## PERN + CCTNS Upgrade

The project now includes a PostgreSQL-backed data path while preserving a synthetic fallback for demonstrations. The backend can expose 120 synthetic persons, **500 synthetic investigation cases**, 900 graph relationships, and 1,200 financial transactions. Synthetic records are explicitly marked and must not be confused with live police data.

### CCTNS / ICJS boundary

NEXUS includes an authorized CCTNS/ICJS adapter boundary and a real-time e-FIR intake workflow. The connector is disabled until `CCTNS_BASE_URL` and `CCTNS_API_KEY` are configured in the protected server environment. Do not scrape, bypass, or attempt unauthorized access to CCTNS. In production, the adapter should be connected through the applicable authorized police/government network and interface.

The ingestion flow is:

`New FIR → Validation → SHA-256 payload proof → Entity resolution → Case creation → Knowledge graph update → AI analysis → Investigator alert → Audit/ledger record`

Raw sensitive evidence is not placed on-chain. The blockchain layer should store hashes, timestamps, provenance, signatures, and chain-of-custody metadata; the evidence itself remains in encrypted controlled storage.

### PostgreSQL

Set `DATABASE_URL`, then run `npm run db:migrate` to ensure the FIR ingestion table exists. Use `npm run db:seed` to populate the synthetic dataset. `docker-compose.yml` provides a local PostgreSQL 16 instance.

### FIR intake persistence

The **CCTNS / e-FIR Ingestion** page submits the Add latest FIR form to `POST /api/cctns/firs`. The API validates the authenticated session, normalizes the payload, creates a SHA-256 payload hash, persists the FIR in PostgreSQL `firs`, and creates a linked investigation case. Duplicate `(source_system, fir_number)` submissions are detected without creating a second FIR. The page reloads recently ingested FIRs directly from PostgreSQL so persistence is visible immediately.

For an existing PostgreSQL volume created before the FIR table was added, run:

```bash
npm run db:migrate
```

Use synthetic/demo FIR content during local development. Do not enter real sensitive police records into this development database.

### CCTNS source

CCTNS is the Crime and Criminal Tracking Network & Systems operated within India's criminal-justice data ecosystem. ICJS integrates police/CCTNS with courts, prisons, forensics and prosecution. This project implements an integration boundary rather than claiming direct access to government systems.
