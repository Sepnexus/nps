# Deploy Vault to your Hostinger VPS

Target: `https://vault.srv844822.hstgr.cloud` — auto-SSL via Traefik (same pattern as iBuyKC dashboards, n8n, buffer).

Code lives at: `https://github.com/Sepnexus/nps`

You will end up with:
- `vault-app` container (Next.js, port 3000 internal, routed by Traefik)
- `vault-db` container (Postgres 16, isolated to Vault)
- Volumes `vault_vault-db-data` and `vault_vault-storage` (database + receipt uploads)
- Joined to the existing `root_default` network so Traefik routes to it

## Step 1 — SSH into the VPS

```bash
ssh root@srv844822.hstgr.cloud
```

You should be at a `root@srv844822 ~#` prompt.

## Step 2 — Clone the repo

```bash
cd /root
git clone https://github.com/Sepnexus/nps.git vault
cd vault
```

**Success:** `ls` shows files including `docker-compose.yml`, `Dockerfile`, `app/`, `db/`.

## Step 3 — Create the `.env` file with secrets

The `.env` file is **NOT in git** (correctly — it has your secrets). Create it on the VPS:

```bash
cd /root/vault
cat > .env <<'EOF'
PUBLIC_HOST=vault.srv844822.hstgr.cloud
SESSION_SECRET=656b3ebe4cb828ac535d503f9700b964e45316dc8a9d3d7d6ea75c96017f759a
DB_PASSWORD=CHANGE-ME-to-a-strong-password
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5
OPENAI_VISION_MODEL=gpt-5
TIMEZONE=Asia/Kolkata
CURRENCY=INR
EOF
nano .env
```

In nano, change:
- `DB_PASSWORD` to any strong 16+ character random string
- `OPENAI_API_KEY` to your real OpenAI key (starts with `sk-...`)

Save: **Ctrl+O**, **Enter**, **Ctrl+X**.

> **Where to add the OpenAI key**: it goes ONLY in this `.env` file on the VPS. Never in git, never in code. If you want to change it later: `nano /root/vault/.env`, edit the line, save, then run `docker compose --profile prod up -d` to apply.

## Step 4 — Build and start the stack

```bash
docker compose --profile prod up -d --build
```

First build takes 3–5 minutes (installs deps + builds Next.js inside Docker).

**Success:** `Container vault-db ... Started` and `Container vault-app ... Started`.

Verify:
```bash
docker ps --format "table {{.Names}}\t{{.Status}}"
```
You should see `vault-app` and `vault-db` both running.

## Step 5 — Run migrations + seed your user (first time only)

```bash
docker compose exec app node node_modules/.bin/tsx scripts/migrate.ts
SEED_EMAIL=akshay@sepnexus.com SEED_PASSWORD=vault123 \
  docker compose exec -T app node node_modules/.bin/tsx scripts/seed.ts
```

**Success:** prints `Migrations applied.` then `Created user: akshay@sepnexus.com (password: vault123)` and `Seed complete.`

## Step 6 — Open it on your iPhone

Wait ~30 seconds for Traefik to issue the SSL cert. Then in **Safari**:

```
https://vault.srv844822.hstgr.cloud
```

Log in with `akshay@sepnexus.com` / `vault123`.

**Install as an app:** Share button → **Add to Home Screen** → Add. Vault now has its own icon and opens full-screen with camera access for receipt scanning.

## Step 7 — Change the default password (do this now)

On your Mac, generate a new password hash:

```bash
node -e "const c=require('node:crypto'),u=require('node:util'),s=u.promisify(c.scrypt);(async()=>{const salt=c.randomBytes(16);const k=await s('YOUR-NEW-PASSWORD-HERE',salt,64);console.log('s1\$'+salt.toString('hex')+'\$'+k.toString('hex'));})()"
```

Copy the output (the long `s1$...$...` string).

On the VPS:
```bash
docker compose exec db psql -U vault -d vault -c "UPDATE users SET password_hash='<paste the s1$... hash here>' WHERE email='akshay@sepnexus.com';"
```

Logout in your browser and log back in with the new password.

---

## Updating later (when you change code)

From your Mac:
```bash
cd "/Users/akshaypalsingh/Desktop/Apps Dev/Ibuy/vault"
git add .
git commit -m "your change description"
git push
```

Then on the VPS:
```bash
ssh root@srv844822.hstgr.cloud
cd /root/vault
git pull
docker compose --profile prod up -d --build
```

If your changes include new tables or column additions, after the rebuild:
```bash
docker compose exec app node node_modules/.bin/tsx scripts/migrate.ts
```

## Backups

```bash
ssh root@srv844822.hstgr.cloud
mkdir -p /root/vault-backups
crontab -l 2>/dev/null | { cat; echo '0 3 * * * docker exec vault-db pg_dump -U vault vault | gzip > /root/vault-backups/$(date +\%F).sql.gz'; } | crontab -
```

Daily backups at 3am, stored at `/root/vault-backups/YYYY-MM-DD.sql.gz`.

## Troubleshooting

**Site not loading after ~1 min?**
```bash
docker compose logs app --tail 100
docker compose logs db --tail 50
```

**SSL cert errors?** Traefik issues the cert on first HTTPS request. Refresh after 30 seconds. If still broken:
```bash
docker logs root-traefik-1 --tail 50 | grep -i vault
```

**Need to start over (delete everything including data):**
```bash
cd /root/vault
docker compose --profile prod down -v
```

**OpenAI key not working / receipts/assistant pages say key missing?**
```bash
cat /root/vault/.env | grep OPENAI_API_KEY
# Make sure it has a real value, then:
docker compose --profile prod up -d
```
