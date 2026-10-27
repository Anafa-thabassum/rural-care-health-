# RuralCare — offline-friendly patient records

RuralCare is a React + TypeScript frontend with an Express API and MongoDB persistence. The current frontend stores a local cache for field-worker workflows; the API is required for authentication and secure patient document access.

## Requirements

- Node.js 20+
- pnpm
- MongoDB running locally or a MongoDB Atlas connection string

## Local setup

1. Copy `.env.example` to `.env`.
2. Set `MONGODB_URI` and replace `JWT_SECRET` with a long, random secret.
3. Run:

```sh
pnpm install
pnpm dev
```

The web app runs at `http://localhost:3000` and the API at `http://localhost:5000`. Vite proxies `/api` to the API.

Development-only demo logins (created automatically after MongoDB connects; not seeded in production):

```text
Doctor / Staff
a.okafor@ruralcare.org
demo1234

Patient
patient@example.com
Patient123!
```

On the login screen, select **Doctor / Staff** or **Patient** first. Successful login sends staff to `/dashboard` and patients to `/patient`. The server checks that the selected account type matches the account role.

Production deployments must provision staff accounts through a trusted administrative process; do not rely on the demo account.

## Patient accounts

Patient accounts are linked to a single existing patient record by the server-side `patientId` stored on the authenticated account. Patients cannot choose a record ID on history/file requests.

Patient self-registration is enabled for local development without a clinic invitation code. The registration form requires patient record ID, full name, date of birth, email, and a password of at least 6 characters. The entered ID, name, and date of birth must match an existing patient record, and only one patient account can be linked to each patient record. Existing accounts sign in through the same login page. For real clinical deployment, use a staff-managed identity verification workflow and rate-limit registration/login endpoints.

## Patient portal and security

- `GET /api/data` scopes patient accounts to their linked patient and medical records; staff accounts retain the existing clinic data view.
- `GET /api/patient/me` returns the authenticated patient's own profile/history/documents metadata.
- `GET /api/patient/me/files` lists only the authenticated patient's file metadata.
- `POST /api/patient/me/files` accepts PDF, JPEG, PNG, WebP, or plain-text files up to 5 MB.
- `GET /api/patient/me/files/:fileId` streams a file only when its stored owner matches the authenticated account's linked patient record.
- Patient access to staff sync endpoints is rejected. Medical history is read-only in the patient UI.
- Uploaded bytes are stored in MongoDB, not a public static directory or public URL. This is a simple local implementation; use encrypted managed object storage and appropriate retention/access policies for production-scale deployments.

Never use a default/development JWT secret in production. Configure HTTPS, secure deployment secrets, request rate limits, audit logging, backup/retention policies, and a verified patient onboarding process before using real health information.

## Offline behavior

The existing field-worker offline cache and sync queue are preserved. Patient history is displayed from the scoped data already loaded into a patient-session cache while offline; the patient cache uses `sessionStorage`, is isolated from the field-worker cache, and is cleared when the patient signs out. Browser session storage is not encrypted by this application, so full-device encryption and private user sessions are still required. Uploaded documents are currently fetched from the API and are **not** cached for offline download; uploads also require a connection. Do not use a shared or public device for patient access, and sign out after use.

## API

- `GET /api/health` — API/database status
- `POST /api/auth/login` — existing account login
- `POST /api/auth/patient-register` — invitation-gated patient account creation
- `GET /api/data` — scoped initial data
- `GET /api/patient/me` — patient profile/history/document metadata
- `GET /api/patient/me/files` — patient-owned file metadata
- `POST /api/patient/me/files` — patient-owned upload
- `GET /api/patient/me/files/:fileId` — patient-owned file download
- `POST /api/sync` — existing staff offline sync (patient accounts forbidden)

## Security integration tests

The patient isolation tests use a real test MongoDB database. Set `MONGODB_URI_TEST` to a dedicated disposable database before running them:

```sh
MONGODB_URI_TEST=mongodb://127.0.0.1:27017/ruralcare_test pnpm test:security
```

The test suite creates temporary fixtures and removes them afterward. Never point it at a production database.
