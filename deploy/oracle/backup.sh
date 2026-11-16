#!/usr/bin/env bash
# Backup diário do Postgres do Ninho, mantendo os últimos 7.
# Agendar no crontab do usuário ubuntu:
#   15 3 * * * /opt/ninho/deploy/oracle/backup.sh >> /opt/backups/backup.log 2>&1
set -euo pipefail

cd "$(dirname "$0")"
BACKUP_DIR="${BACKUP_DIR:-/opt/backups}"
KEEP="${KEEP:-7}"
STAMP="$(date +%Y%m%d-%H%M%S)"
FILE="$BACKUP_DIR/ninho-$STAMP.sql.gz"

mkdir -p "$BACKUP_DIR"
docker compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner' | gzip > "$FILE"
echo "$(date -Is) backup criado: $FILE ($(du -h "$FILE" | cut -f1))"

ls -1t "$BACKUP_DIR"/ninho-*.sql.gz | tail -n +"$((KEEP + 1))" | xargs -r rm --

# Restaurar (cuidado, sobrescreve dados):
#   gunzip -c /opt/backups/ninho-AAAAMMDD-HHMMSS.sql.gz | docker compose exec -T db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
