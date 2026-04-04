# Deploying Subsplit (Azure App Service + PostgreSQL)

Subsplit uses **PostgreSQL** (recommended: **Azure Database for PostgreSQL**). The app connects with `DATABASE_URL` and Prisma.

## 1. Azure PostgreSQL

1. Create an **Azure Database for PostgreSQL Flexible Server**.
2. Allow your App Service outbound IPs (or use **Azure private connectivity** if applicable).
3. Create a database (e.g. `postgres` or `subsplit`).
4. Build the connection string:

```text
postgresql://USER:PASSWORD@YOUR_HOST.postgres.database.azure.com:5432/DATABASE?sslmode=require
```

Set this as **`DATABASE_URL`** in your Web App **Configuration** → **Application settings**.

## 2. Apply the schema (migrations)

On first deploy (or from a machine that can reach the DB):

```bash
export DATABASE_URL="postgresql://..."
npm ci
npm run prisma:generate
npm run prisma:deploy
npm run prisma:seed   # optional: seed default models
```

In **GitHub Actions**, the workflow runs `prisma:deploy` against a temporary Postgres service before `build` so the client matches the schema.

## 3. Moving data from old `dev.db` (SQLite) to PostgreSQL

1. **Create an empty Postgres database** and run migrations (`prisma:deploy`) so tables exist.
2. Keep a copy of your SQLite file (e.g. `dev.db`).
3. From your machine, with **both** `DATABASE_URL` (Postgres) and optional `SQLITE_SOURCE` set:

```bash
export DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require"
export SQLITE_SOURCE="dev.db"   # or file:./dev.db
npm run migrate:sqlite-to-pg
```

This copies rows in dependency order (users → wallets → transactions → keys → logs → payments → tickets, etc.). Run it **once** after the schema is applied.

## 4. Bring **production** users from the DB that is live today → Azure Postgres

Yes, you can keep everyone: you copy the **existing database file or dump** into this repo’s migration path, then run the same SQLite → Postgres script against **your Azure Postgres** `DATABASE_URL`.

### If production is still **SQLite** on Azure App Service (most likely)

1. **Download the live SQLite file** from the Web App (pick the path your app actually used):
   - Open the app in Azure Portal → **Development Tools** → **Advanced Tools (Kudu)** → **Go**.
   - **Debug console** → **CMD** or **Bash**, browse under `site/wwwroot` (and `prisma/` if you stored `dev.db` there), or under `/home/data/` if you used a path like `file:/home/data/subsplit.db`.
   - Download the `.db` file to your laptop (e.g. save as `prod-from-azure.db`).

2. **Prepare Azure Postgres** (empty schema first):
   - Create the Flexible Server DB and set firewall so **your laptop** can connect (temporarily), or run the next step from a VM that can reach Postgres.
   - Locally:

   ```bash
   export DATABASE_URL="postgresql://USER:PASSWORD@YOUR_HOST.postgres.database.azure.com:5432/DATABASE?sslmode=require"
   npm run prisma:generate
   npm run prisma:deploy
   ```

3. **Copy all users and related rows** from the downloaded SQLite file:

   ```bash
   export DATABASE_URL="postgresql://USER:PASSWORD@YOUR_HOST...?sslmode=require"
   export SQLITE_SOURCE="prod-from-azure.db"
   npm run migrate:sqlite-to-pg
   ```

4. **Point the Web App at Postgres**: set **`DATABASE_URL`** on the App Service to the same Azure Postgres URL (and deploy the new code that uses PostgreSQL). After cutover, new traffic uses Postgres; your migrated users, wallets, keys, etc. are already there.

5. **Optional**: run `npm run prisma:seed` only if you want default catalog rows; the migration script already brought real users—seeding does not recreate users if you’re careful (seed only touches `ModelOffering` in our seed).

### If production is already **PostgreSQL** somewhere else

Then you do **not** use `migrate:sqlite-to-pg`. Instead:

- Use **pg_dump** from the old server and **pg_restore** / SQL import into Azure Postgres, or
- Use Azure **Database migration** tools, or
- Export/import per-table with matching schema (harder).

The important part is: **same table names and columns** as this app’s Prisma schema, or adjust the dump.

### Short answers to your questions

- **“Pull that DB to our local code”** → Download the `.db` file via Kudu (or backup) into your project folder; that *is* pulling production data locally.
- **“Push users to Azure Postgres”** → Run `prisma:deploy` then `migrate:sqlite-to-pg` with `DATABASE_URL` = Azure Postgres and `SQLITE_SOURCE` = that file. That **is** pushing existing users (and wallets, keys, payments, etc.) to the cloud DB.
- **“Make sure users already using it see them”** → After the Web App’s `DATABASE_URL` points at Postgres and you’ve migrated once, they sign in against the same emails/password hashes you copied—no re-registration needed.

## 5. Azure Web App (Node 20)

- **Runtime:** Node 20 LTS, Linux.
- Set **all** env vars from `.env.example` (including `AUTH_SECRET`, `APP_BASE_URL`, payment keys, Azure OpenAI, etc.).
- Start command: `npm start` (or your configured start script).

## 6. Notes

- **Do not commit** real passwords or connection strings; use App Service / Key Vault / GitHub secrets.
- If the app fails to start with a database error, verify **`DATABASE_URL`**, firewall rules, and **`sslmode=require`** for Azure Postgres.

### Login fails with `P1010` / “denied access on the database `dev.db`”

That means **Azure still has `DATABASE_URL=file:./dev.db`** (or an old deployment built for SQLite). This project expects **PostgreSQL** only.

1. In **Azure Portal** → your Web App → **Environment variables** (or Configuration), delete or replace `DATABASE_URL` with your **Azure Database for PostgreSQL** connection string, e.g. `postgresql://USER:PASSWORD@HOST.postgres.database.azure.com:5432/DATABASE?sslmode=require`.
2. Ensure the **Postgres firewall** allows your App Service (or “Azure services” / outbound IPs).
3. **Redeploy** the latest app (so Prisma client + `prisma migrate deploy` match Postgres).
4. Restart the Web App after changing variables.

If Postgres is already set in Azure but you still saw errors about `file:` / SQLite, an older build may have picked up `DATABASE_URL=file:./dev.db` from a local `.env`. The server reads `DATABASE_URL` at **runtime** from the host environment; after updating Azure, redeploy **this** revision and restart the app. Prefer **CI builds** (GitHub Actions sets a Postgres URL for `npm run build`) over zipping a local `.next` built with SQLite in `.env`.
