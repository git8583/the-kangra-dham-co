# Production deployment

The application runs as an unprivileged `kangradham` user behind Nginx. SQLite data is stored outside the release directory at `/var/lib/kangra-dham`, and a systemd timer keeps 14 days of daily backups.

## Required secrets

Generate an admin hash locally:

```powershell
npm run hash-password -- "use-a-unique-password-of-at-least-12-characters"
```

On the server, create `/etc/kangra-dham.env` from `.env.example`. Set `DATABASE_PATH=/var/lib/kangra-dham/kangra-dham.sqlite`, paste the generated password hash, and generate `COOKIE_SECRET` with:

```bash
openssl rand -base64 48
```

## First deployment

Upload the repository to `/opt/kangra-dham/current`, then run:

```bash
chmod +x deploy/install.sh deploy/backup.sh
./deploy/install.sh kangradham.kran-apps.cloud
```

The production URL is `https://kangradham.kran-apps.cloud`. Current Certbot releases can issue short-lived,
publicly trusted certificates for IP addresses. After issuance, install `deploy/nginx-tls.conf`
with the matching `__SERVER_NAME__` and `__CERT_NAME__`, and configure renewal with the
`/var/www/certbot` webroot. A domain can use the same TLS template with its certificate name.

## Updating

```bash
cd /opt/kangra-dham/current
git pull --ff-only
npm ci --omit=dev
systemctl restart kangra-dham
curl --fail http://127.0.0.1:3000/api/health
```

Admin is available at `/admin.html`. Enquiries are stored only in SQLite; no personal email or phone integration is enabled.
