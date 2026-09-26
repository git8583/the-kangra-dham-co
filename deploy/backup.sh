#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR=/var/backups/kangra-dham
DATABASE=/var/lib/kangra-dham/kangra-dham.sqlite
mkdir -p "$BACKUP_DIR"
sqlite3 "$DATABASE" ".backup '$BACKUP_DIR/kangra-dham-$(date +%Y%m%d-%H%M%S).sqlite'"
find "$BACKUP_DIR" -type f -name 'kangra-dham-*.sqlite' -mtime +14 -delete
