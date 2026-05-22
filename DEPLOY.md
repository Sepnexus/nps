# Deploy Vault to your Hostinger VPS

Target: `https://vault.srv844822.hstgr.cloud` — auto-SSL via Traefik (same pattern as iBuyKC dashboards, n8n, buffer).

You will end up with:
- `vault-app` container (Next.js, port 3000 internal, routed by Traefik)
- `vault-db` container (Postgres 16, isolated to Vault)
- Volumes `vault_vault-db-data` and `vault_vault-storage` (database + receipt uploads)
- Joined to the existing `root_default` network so Traefik routes to it

## Step 1 — Upload the project to the VPS

Open a Terminal **on your Mac** and run:

```bash
rsync -avz --delete \
  --exclude node_modules --exclude .next --exclude storage \
  --exclude .env.local --exclude '*.log' --exclude .DS_Store \
  "/Users/akshaypalsingh/Desktop/Apps Dev/Ibuy/vault/" \
  root@srv844822.hstgr.cloud:/root/vault/
```

It will prompt for your VPS root password.

**Success:** the last line shows `sent ... bytes received ... bytes` and no errors.

## Step 2 — SSH into the VPS

```bash
ssh root@srv844822.hstgr.cloud
```

You should now be at a `root@srv844822 ~#` prompt.

## Step 3 — Create the `.env` file on the VPS

```bash
cd /root/vault
cat > .env <<'EOF'
PUBLIC_HOST=vault.srv844822.hstgr.cloud
SESSION_SECRET=656b3ebe4cb828ac535d503f9700b964e45316dc8a9d3d7d6ea75c96017f759a
DB_PASSWORD=CHANGE-ME-to-a-strong-password
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o
OPENAI_VISION_MODEL=gpt-4o
TIMEZONE=Asia/Kolkata
CURRENCY=INR
EOF
nano .env
```

In nano, change:
- `DB_PASSWORD` to a strong password (any 16+ random chars)
- `OPENAI_API_KEY` to your real OpenAI key (or leave empty for now — you can add it later)

Save: **Ctrl+O**, **Enter**, **Ctrl+X**.

## Step 4 — Build and start the stack

```bash
cd /root/vault
docker compose --profile prod up -d --build
```

**Success:** the final output shows `Container vault-db ... Started` and `Container vault-app ... Started`. First build will take 3–5 minutes (it installs and compiles Next.js inside Docker).

Check containers:
```bash
docker ps --format "table {{.Names}}\t{{.Status}}"
```
You should see `vault-app` and `vault-db` both with status `Up ... (healthy)` or `Up`.

## Step 5 — Run migrations + seed your user (first time only)

```bash
docker compose exec app node node_modules/.bin/tsx scripts/migrate.ts
SEED_EMAIL=akshay@sepnexus.com SEED_PASSWORD=vault123 \
  docker compose exec -T app node node_modules/.bin/tsx scripts/seed.ts
```

**Success:** prints `Migrations applied.` and `Created user: akshay@sepnexus.com (password: vault123)` and `Seed complete.`

## Step 6 — Open it on your iPhone

Wait ~30 seconds for Traefik to issue the SSL certificate, then open Safari and go to:

```
https://vault.srv844822.hstgr.cloud
```

Log in with `akshay@sepnexus.com` / `vault123`.

**Install as a phone app:** Tap the Share button → **Add to Home Screen** → Add. Vault now has its own icon and opens full-screen.

## Step 7 — Change your password

Right now it's the seed default `vault123`. From the VPS:

```bash
docker compose exec db psql -U vault -d vault
```

Inside psql, paste:
```sql
-- generate a new scrypt hash by running this on your Mac first:
-- node -e "const c=require('node:crypto'); const u=require('node:util'); const s=u.promisify(c.scrypt); (async()=>{const salt=c.randomBytes(16); const k=await s('YOUR-NEW-PASSWORD',salt,64); console.log('s1$'+salt.toString('hex')+'$'+k.toString('hex'));})()"

-- then on the VPS:
UPDATE users SET password_hash='<PASTE THE HASH HERE>' WHERE email='akshay@sepnexus.com';
\q
```

Or just re-run seed with a new `SEED_PASSWORD`:
```bash
# WARNING: only works if user table is empty. To force, delete first:
# docker compose exec db psql -U vault -d vault -c "DELETE FROM users;"
SEED_EMAIL=akshay@sepnexus.com SEED_PASSWORD=YOUR-NEW-STRONG-PASSWORD \
  docker compose exec -T app node node_modules/.bin/tsx scripts/seed.ts
```

## Updating later (when you change code on your Mac)

From Mac:
```bash
rsync -avz --delete --exclude node_modules --exclude .next --exclude storage \
  --exclude .env.local --exclude '*.log' --exclude .DS_Store \
  "/Users/akshaypalsingh/Desktop/Apps Dev/Ibuy/vault/" \
  root@srv844822.hstgr.cloud:/root/vault/
```

Then SSH in and rebuild:
```bash
ssh root@srv844822.hstgr.cloud "cd /root/vault && docker compose --profile prod up -d --build"
```

## Backups

The DB lives in the `vault_vault-db-data` Docker volume. Set up nightly snapshots:

```bash
ssh root@srv844822.hstgr.cloud
mkdir -p /root/vault-backups
crontab -l 2>/dev/null | { cat; echo '0 3 * * * docker exec vault-db pg_dump -U vault vault | gzip > /root/vault-backups/$(date +\%F).sql.gz'; } | crontab -
```

## Troubleshooting

**Site not loading after ~1 min?**
```bash
docker compose logs app --tail 100
docker compose logs db --tail 50
```

**SSL cert errors in browser?** Traefik issues the cert on first request. Refresh after 30s. If still bad:
```bash
docker logs root-traefik-1 --tail 50 | grep -i vault
```

**Need to start over (delete everything):**
```bash
cd /root/vault
docker compose --profile prod down -v   # -v deletes volumes too
```
