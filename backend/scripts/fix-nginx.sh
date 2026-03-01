#!/bin/bash
# fix-nginx.sh - Fix Nginx configuration for large file uploads
# Run with: sudo bash fix-nginx.sh

set -e

echo "=== Fixing Nginx upload limit ==="

SITE_CONF="/var/www/academypulaar/nginx-academypulaar.conf"

# 1. Add client_max_body_size globally in nginx.conf
echo "Step 1: Updating /etc/nginx/nginx.conf..."
sed -i '/client_max_body_size/d' /etc/nginx/nginx.conf
sed -i '/http\s*{/a \    client_max_body_size 100M;' /etc/nginx/nginx.conf
echo "  -> Added client_max_body_size 100M globally"

# 2. Replace all site configs in sites-enabled
echo "Step 2: Updating sites-enabled..."
if [ -d /etc/nginx/sites-enabled ]; then
    for f in /etc/nginx/sites-enabled/*; do
        [ -f "$f" ] || continue
        cp "$SITE_CONF" "$f"
        echo "  -> Replaced $f"
    done
    # If empty, create our config
    if [ -z "$(ls -A /etc/nginx/sites-enabled/ 2>/dev/null)" ]; then
        cp "$SITE_CONF" /etc/nginx/sites-enabled/academypulaar
        echo "  -> Created /etc/nginx/sites-enabled/academypulaar"
    fi
else
    echo "  -> No sites-enabled directory"
fi

# 3. Handle conf.d
echo "Step 3: Checking conf.d..."
if [ -d /etc/nginx/conf.d ]; then
    for f in /etc/nginx/conf.d/*.conf; do
        [ -f "$f" ] || continue
        cp "$SITE_CONF" "$f"
        echo "  -> Replaced $f"
    done
else
    echo "  -> No conf.d directory"
fi

# 4. Test and reload
echo "Step 4: Testing configuration..."
nginx -t

echo "Step 5: Reloading Nginx..."
systemctl reload nginx

echo "=== Verification ==="
grep -r "client_max_body_size" /etc/nginx/ 2>/dev/null || echo "WARNING: client_max_body_size NOT FOUND!"
echo ""
echo "=== Done! ==="
