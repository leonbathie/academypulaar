#!/usr/bin/env bash
#
# Sauvegarde quotidienne GoomuFuloWiɗto.
#   - Dump de la base PostgreSQL (format custom compressé)
#   - Archive du dossier uploads (couvertures, hero, etc.)
#   - Regroupement dans une seule archive datée
#   - Envoi hors-site vers Google Drive via rclone
#   - Rotation locale et distante
#
# Lancé automatiquement par le timer systemd `academypulaar-backup.timer`
# (cf. .github/workflows/deploy.yml), ou manuellement :
#     bash backend/scripts/backup.sh
#
# Configuration via variables d'environnement (valeurs par défaut adaptées
# à la prod sur le VPS). Voir backend/scripts/BACKUP.md.

set -euo pipefail

# ── Configuration ────────────────────────────────────────────
BACKUP_DIR="${BACKUP_DIR:-/var/backups/academypulaar}"
UPLOADS_DIR="${UPLOADS_DIR:-/var/www/academypulaar/backend/uploads}"
ENV_FILE="${ENV_FILE:-/var/www/academypulaar/backend/.env}"

# Destination rclone (remote:chemin). Le remote "gdrive" se configure une
# seule fois sur le serveur avec `rclone config` (cf. BACKUP.md).
RCLONE_REMOTE="${RCLONE_REMOTE:-gdrive:academypulaar-backups}"
RCLONE_CONFIG="${RCLONE_CONFIG:-${HOME:-/home/gha}/.config/rclone/rclone.conf}"

# Rétention (jours)
LOCAL_RETENTION_DAYS="${LOCAL_RETENTION_DAYS:-7}"
REMOTE_RETENTION_DAYS="${REMOTE_RETENTION_DAYS:-30}"

log() { echo "[backup $(date '+%Y-%m-%d %H:%M:%S')] $*"; }
fail() { echo "[backup ERREUR] $*" >&2; }

# ── Récupération de DATABASE_URL ─────────────────────────────
DATABASE_URL="${DATABASE_URL:-}"
if [ -z "$DATABASE_URL" ] && [ -f "$ENV_FILE" ]; then
    DATABASE_URL="$(grep -E '^DATABASE_URL=' "$ENV_FILE" | head -1 | cut -d= -f2-)"
fi
if [ -z "$DATABASE_URL" ]; then
    fail "DATABASE_URL introuvable (ni en env, ni dans $ENV_FILE)"
    exit 1
fi

# ── Préparation ──────────────────────────────────────────────
command -v pg_dump >/dev/null 2>&1 || { fail "pg_dump introuvable"; exit 1; }

mkdir -p "$BACKUP_DIR"
TIMESTAMP="$(date +%Y-%m-%d_%H%M%S)"
WORK="$(mktemp -d "${BACKUP_DIR}/tmp_${TIMESTAMP}.XXXX")"
ARCHIVE="${BACKUP_DIR}/academypulaar_${TIMESTAMP}.tar.gz"
trap 'rm -rf "$WORK"' EXIT

# ── 1. Dump de la base ───────────────────────────────────────
log "Dump PostgreSQL…"
pg_dump "$DATABASE_URL" -Fc -f "$WORK/db.dump"
log "Base sauvegardée ($(du -h "$WORK/db.dump" | cut -f1))"

# ── 2. Archive des uploads ───────────────────────────────────
if [ -d "$UPLOADS_DIR" ]; then
    log "Archive des uploads…"
    tar -czf "$WORK/uploads.tar.gz" -C "$(dirname "$UPLOADS_DIR")" "$(basename "$UPLOADS_DIR")"
    log "Uploads archivés ($(du -h "$WORK/uploads.tar.gz" | cut -f1))"
else
    log "Dossier uploads absent ($UPLOADS_DIR) — ignoré"
fi

# ── 3. Regroupement ──────────────────────────────────────────
tar -czf "$ARCHIVE" -C "$WORK" .
log "Archive créée : $ARCHIVE ($(du -h "$ARCHIVE" | cut -f1))"

# ── 4. Envoi hors-site (Google Drive via rclone) ─────────────
remote_ok=0
if command -v rclone >/dev/null 2>&1; then
    if [ -f "$RCLONE_CONFIG" ] && rclone --config "$RCLONE_CONFIG" listremotes 2>/dev/null | grep -q "^${RCLONE_REMOTE%%:*}:"; then
        log "Envoi vers $RCLONE_REMOTE…"
        if rclone --config "$RCLONE_CONFIG" copy "$ARCHIVE" "$RCLONE_REMOTE" --no-traverse; then
            remote_ok=1
            log "Envoi hors-site OK"
        else
            fail "Échec de l'envoi rclone (backup local conservé)"
        fi
    else
        fail "Remote rclone '${RCLONE_REMOTE%%:*}' non configuré dans $RCLONE_CONFIG (cf. BACKUP.md) — backup local uniquement"
    fi
else
    fail "rclone introuvable — backup local uniquement"
fi

# ── 5. Rotation locale ───────────────────────────────────────
log "Rotation locale (> ${LOCAL_RETENTION_DAYS} j)…"
find "$BACKUP_DIR" -maxdepth 1 -name 'academypulaar_*.tar.gz' -mtime "+${LOCAL_RETENTION_DAYS}" -print -delete || true

# ── 6. Rotation distante ─────────────────────────────────────
if [ "$remote_ok" = "1" ]; then
    log "Rotation distante (> ${REMOTE_RETENTION_DAYS} j)…"
    rclone --config "$RCLONE_CONFIG" delete "$RCLONE_REMOTE" \
        --min-age "${REMOTE_RETENTION_DAYS}d" --include 'academypulaar_*.tar.gz' || \
        fail "Rotation distante en échec (non bloquant)"
fi

log "Terminé."

# Code de sortie non nul si l'envoi hors-site a échoué : visible dans
# `systemctl status academypulaar-backup`.
[ "$remote_ok" = "1" ] || exit 2
