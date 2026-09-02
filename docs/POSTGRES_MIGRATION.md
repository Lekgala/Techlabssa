# SQLite to PostgreSQL migration

The application supports both databases through the same storage interface. SQLite remains the default until `DATABASE_PROVIDER=postgres` is configured.

## Before migration

1. Back up `server/data/techlabs.db`, including any `-wal` and `-shm` files while the API is stopped.
2. Provision PostgreSQL and restrict access to the application and administrators.
3. Create a dedicated database and least-privilege application user.
4. Rehearse this process against a staging database before production cutover.

## Rehearsal

Stop the API so SQLite cannot change during the copy. Set these environment variables in the terminal or hosting secret manager:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE
DATABASE_SSL=true
```

Then run:

```bash
npm run db:migrate:postgres
```

The command creates the PostgreSQL `collections` table, copies every SQLite collection in one transaction, and checks the number copied. It refuses a non-empty target. `--replace` exists for a disposable rehearsal database only:

```bash
npm run db:migrate:postgres -- --replace
```

## Cutover

After a successful rehearsal:

1. Stop writes by stopping the API.
2. Take a final SQLite backup.
3. Run the migration against the production PostgreSQL database.
4. Configure the API with `DATABASE_PROVIDER=postgres`, `DATABASE_URL`, and the provider's SSL requirement.
5. Start one API instance and test login, applications, POP upload/verification, invoices, enrollment, and audit logs.
6. Keep the SQLite backup unchanged until the retention period has passed.

To roll back before new production writes occur, stop the API, remove `DATABASE_PROVIDER` and `DATABASE_URL`, and restart against the retained SQLite file.

## Current transition limitation

PostgreSQL currently stores the same collection snapshots used by SQLite. This enables a low-risk database cutover, but it is not yet the final relational model. Run a single API instance during this phase: separate instances can read the same snapshot and overwrite each other's changes. The next phase should normalize applications, invoices, payments, sessions, and audit logs into relational tables with targeted transactions and constraints.
