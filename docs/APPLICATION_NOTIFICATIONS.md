# New application alerts

After saving a new application, the API sends the applicant their existing acknowledgement and sends admissions a separate review alert. Course-guide requests immediately email the guide to the prospect and send admissions the prospect's contact details with the prospect's email as Reply-To. Staff must sign in to view saved records.

Configure these server-side variables on the Render staging API service:

- `APPLICATION_NOTIFICATION_EMAIL=ltkgawane1@gmail.com`
- `APP_ORIGIN=https://techlabssa.vercel.app`
- `RESEND_API_KEY` and `EMAIL_FROM`: use the existing Resend credentials and verified sender.

If `APPLICATION_NOTIFICATION_EMAIL` is absent, application and lead alerts use `ADMIN_EMAIL`. Never prefix these email configuration variables with `VITE_`.

Deploy the API changes to Render and the admin link changes to Vercel. Local `.env` changes do not update Render environment variables.

All email attempts are recorded in the admin email delivery log. `SENT` means the provider accepted the email; inbox delivery is confirmed separately through the existing Resend webhook. Failed notifications do not undo a saved application or lead, and alerts are not automatically retried.

Validation: submit one new application to an open cohort with a unique test email, check that the staff alert reaches the configured inbox, then open its link and sign in to confirm the matching application appears. Rejected or duplicate applications do not trigger alerts.
