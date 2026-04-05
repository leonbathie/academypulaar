#!/bin/bash
# Fix uploads directory permissions for the backend service
# Called by systemd ExecStartPre (as root) and by deploy.yml

UPLOADS_DIR="/var/www/academypulaar/backend/uploads"
BOOKS_DIR="$UPLOADS_DIR/books"
SERVICE_USER="gha"

echo "[fix-permissions] Fixing uploads permissions..."

# Create directories
mkdir -p "$BOOKS_DIR"

# Set ownership
chown -R "$SERVICE_USER:$SERVICE_USER" "$UPLOADS_DIR"

# Set permissions (rwxrwxr-x)
chmod -R 775 "$UPLOADS_DIR"

# Verify
echo "[fix-permissions] Owner: $(stat -c '%U:%G' "$UPLOADS_DIR")"
echo "[fix-permissions] Perms: $(stat -c '%a' "$UPLOADS_DIR")"

# Test write access as service user
TEST_FILE="$UPLOADS_DIR/.write-test-$$"
if sudo -u "$SERVICE_USER" touch "$TEST_FILE" 2>/dev/null; then
    rm -f "$TEST_FILE"
    echo "[fix-permissions] Write test: OK"
else
    echo "[fix-permissions] Write test: FAILED - trying more aggressive fix"
    chmod -R 777 "$UPLOADS_DIR"
    if sudo -u "$SERVICE_USER" touch "$TEST_FILE" 2>/dev/null; then
        rm -f "$TEST_FILE"
        echo "[fix-permissions] Write test after chmod 777: OK"
    else
        echo "[fix-permissions] CRITICAL: Cannot write to $UPLOADS_DIR"
        ls -la "$UPLOADS_DIR"
        ls -la "$(dirname "$UPLOADS_DIR")"
    fi
fi
