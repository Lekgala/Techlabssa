# TechLabs Academy SA

TechLabs Academy SA is a practical IT training platform for admissions, student labs, simulated enterprise support work, progress tracking, invoicing, and certificate verification.

See [AUDIT.md](AUDIT.md) for the verified system architecture, operational workflows, security posture, risks, and production-readiness checklist.

Staff members should use the [Staff Guide](STAFF_GUIDE.md) for admissions, payment verification, cohort management, communications, student documents, and daily operating procedures.

## Local development

Requirements: Node.js 20+ and npm.

1. Copy `.env.example` to `.env` and set a unique administrator email and strong password.
2. Install dependencies with `npm install`.
3. Start the API with `npm run dev:server`.
4. In another terminal, start the web application with `npm run dev`.
5. Open `http://localhost:3000`.

The API listens on port 4000 and Vite proxies `/api` during development. SQLite data is stored in `server/data/techlabs.db`.

## Security model

- Public callers receive only course catalog data and may submit inquiries/applications or verify one certificate number.
- Administrator operations require a server-issued session configured with `ADMIN_EMAIL` and `ADMIN_PASSWORD`.
- Approved students create a password from a single-use emailed link. Passwords use salted scrypt hashes; password-reset, verification, magic-login, and session tokens are stored only as hashes.
- Student sessions persist in SQLite across server restarts, expire after eight hours, and student endpoints return only that student's records.
- Application, lead, and invoice creation is committed in one server-side operation.

## Checks

Run `npm run lint` for TypeScript validation and `npm run build` for the production bundle.

## Production checklist

- Set `APP_ORIGIN` to the exact frontend origin and serve everything over HTTPS.
- Keep secrets in the hosting platform's secret manager; never use `VITE_` variables for secrets.
- Rate-limit login, application, inquiry, and certificate endpoints.
- Use Redis or another shared session store when horizontally scaling.
- Configure database backups and retention, or migrate to a managed relational database.
- Connect an email provider and record provider message IDs and delivery failures.
- Resend is supported through `RESEND_API_KEY`, `EMAIL_FROM`, and `EMAIL_REPLY_TO`. The configured sending domain is `techlabs.madilotane.co.za`.
- For delivery, bounce, complaint, and suppression tracking, configure a Resend webhook pointing to `https://YOUR_API_DOMAIN/api/webhooks/resend` and store its signing secret as `RESEND_WEBHOOK_SECRET`.
- Rewrite non-API routes to `index.html` in the web host.

TechLabs certificates are completion records, not university qualifications or Microsoft certifications.
