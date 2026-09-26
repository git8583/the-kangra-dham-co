#!/usr/bin/env bash
set -euo pipefail

if [[ ${EUID} -ne 0 ]]; then
  echo "Run this script as root." >&2
  exit 1
fi

APP_DIR=/opt/kangra-dham/current
DATA_DIR=/var/lib/kangra-dham
SERVER_NAME=${1:-_}

apt-get update
apt-get install -y nginx sqlite3 ca-certificates curl

if ! command -v node >/dev/null || [[ $(node -p 'Number(process.versions.node.split(".")[0])') -lt 22 ]]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi

id kangradham >/dev/null 2>&1 || useradd --system --home "$DATA_DIR" --shell /usr/sbin/nologin kangradham
mkdir -p "$APP_DIR" "$DATA_DIR" /var/backups/kangra-dham
chown -R kangradham:kangradham "$DATA_DIR" /var/backups/kangra-dham

cd "$APP_DIR"
npm ci --omit=dev

if [[ ! -f /etc/kangra-dham.env ]]; then
  echo "Missing /etc/kangra-dham.env. Copy .env.example and set secure values first." >&2
  exit 1
fi
chmod 600 /etc/kangra-dham.env

install -m 0644 deploy/kangra-dham.service /etc/systemd/system/kangra-dham.service
install -m 0644 deploy/kangra-dham-backup.service /etc/systemd/system/kangra-dham-backup.service
install -m 0644 deploy/kangra-dham-backup.timer /etc/systemd/system/kangra-dham-backup.timer
sed "s/__SERVER_NAME__/$SERVER_NAME/g" deploy/nginx.conf > /etc/nginx/sites-available/kangra-dham
ln -sfn /etc/nginx/sites-available/kangra-dham /etc/nginx/sites-enabled/kangra-dham
rm -f /etc/nginx/sites-enabled/default

nginx -t
systemctl daemon-reload
systemctl enable --now kangra-dham.service kangra-dham-backup.timer nginx
systemctl reload nginx

for attempt in {1..15}; do
  if curl --fail --silent http://127.0.0.1:3000/api/health >/dev/null; then
    break
  fi
  if [[ "$attempt" -eq 15 ]]; then
    echo "Application failed its health check." >&2
    systemctl --no-pager --full status kangra-dham.service >&2 || true
    exit 1
  fi
  sleep 1
done
echo "Deployment completed. Application is responding behind Nginx."
if [[ "$SERVER_NAME" != "_" ]]; then
  echo "After DNS points here, run: apt-get install -y certbot python3-certbot-nginx && certbot --nginx -d $SERVER_NAME"
fi
