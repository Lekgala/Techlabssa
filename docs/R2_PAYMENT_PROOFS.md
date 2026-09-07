# Private payment-proof storage in Cloudflare R2

The Academy API supports R2 Standard storage through the S3 API. Students continue to upload PDFs/JPEGs/PNGs through the existing authenticated API, with its 5 MB limit, signature checks and duplicate detection. The API checks ownership before reading private objects. No public bucket URL or browser storage credentials are used.

## Cloudflare setup

1. Enable R2 in your Cloudflare account and create a **Standard** bucket, for example `techlabs-payment-proofs`.
2. Keep public access disabled: do not enable an r2.dev URL or attach a public custom domain.
3. Create R2 S3 credentials with **Object Read & Write** permission scoped to that bucket. Copy the Access Key ID, Secret Access Key and S3 endpoint into your local `.env` or hosting secret settings. Do not paste credentials into chat or commit them.
4. Set these values on the Academy API server:

```dotenv
PAYMENT_PROOF_STORAGE=r2
R2_ENDPOINT=https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com
R2_BUCKET=techlabs-payment-proofs
R2_ACCESS_KEY_ID=your-access-key-id
R2_SECRET_ACCESS_KEY=your-secret-access-key
R2_PROOF_PREFIX=payment-proofs/
```

Use the endpoint Cloudflare gives you, including a jurisdiction suffix if present. Missing R2 configuration stops API startup when R2 mode is selected. A storage error never silently switches new uploads to local disk. Browser CORS on the bucket is unnecessary because only the server contacts R2.

Restart the **existing** Academy API after configuring it. Do not start a second process on the same port. Until R2 is configured, leave `PAYMENT_PROOF_STORAGE=local` or unset; the existing local workflow continues.

## Existing local files

Back up both the database and local payment-proof directory first. From the project directory, after supplying R2 credentials:

```powershell
node --require ./scripts/windows-tsx-preload.cjs --import tsx scripts/migrate-proofs-to-r2.ts
```

This dry run reads local files and checks existing R2 objects. It uploads nothing. To copy and verify:

```powershell
node --require ./scripts/windows-tsx-preload.cjs --import tsx scripts/migrate-proofs-to-r2.ts --apply
```

The tool compares SHA-256 checksums after download, skips matching objects, refuses conflicting objects, and leaves all local files and database records unchanged. It copies files with valid proof filenames; retain the output as a migration report. A failure sets a nonzero exit code.

New R2-backed payment records have `r2:` storage keys. Legacy records retain their original keys. In R2 mode, legacy downloads try R2 first and use local files only if the object does not exist. An access-denied or network error does not trigger that fallback. Keep R2 enabled to serve migrated legacy objects after moving hosts. Do not change the bucket or prefix without migrating objects.

Do not remove local copies until every referenced payment proof is verified in the new deployment and independent backups exist. This migration deliberately does not delete anything. Restoring local mode alone will not restore R2-only uploads: keep R2 credentials available for those records.

## Acceptance checks

- Upload a synthetic PDF as an authorized student with an eligible invoice.
- Confirm an `r2:` key is recorded and the object exists in the private bucket.
- Download as that student and as an admin; both should succeed.
- Attempt access as another student and anonymously; both must be denied.
- Confirm the proof still opens after API restart/redeploy.
- Confirm no public URL exposes the proof.
- Verify a migrated legacy proof against its stored database checksum.

Local storage tests use mocked R2 responses; they do not replace these live checks. A database-save failure after upload can leave an unreferenced object. Reconcile such objects against payment records before deleting anything. Set a retention policy and monitor storage/request usage; the free allowance is not a spending cap.

## References

- [Cloudflare S3 setup](https://developers.cloudflare.com/r2/get-started/s3/)
- [Cloudflare AWS SDK v3 example](https://developers.cloudflare.com/r2/examples/aws/aws-sdk-js-v3/)
- [R2 pricing](https://developers.cloudflare.com/r2/pricing/)
