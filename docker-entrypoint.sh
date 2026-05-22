#!/bin/sh
set -e

echo "[vault] Waiting for database to accept connections..."
i=0
until node -e "const{Pool}=require('pg');const p=new Pool({connectionString:process.env.DATABASE_URL});p.query('SELECT 1').then(()=>process.exit(0)).catch(()=>process.exit(1));" 2>/dev/null; do
  i=$((i + 1))
  if [ "$i" -gt 30 ]; then
    echo "[vault] Database not reachable after 30s — exiting."
    exit 1
  fi
  sleep 1
done
echo "[vault] Database is up."

echo "[vault] Running migrations..."
./node_modules/.bin/tsx scripts/migrate.ts
echo "[vault] Migrations done."

echo "[vault] Starting Next.js..."
exec ./node_modules/.bin/next start -p 3000 -H 0.0.0.0
