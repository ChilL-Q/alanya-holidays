#!/usr/bin/env bash
set -e

if [ -z "$1" ] || [ -z "$2" ]; then
  echo "Usage: ./scripts/init-letsencrypt.sh <domain> <email>"
  echo "Example: ./scripts/init-letsencrypt.sh alanya-holidays.com admin@alanya-holidays.com"
  exit 1
fi

DOMAIN=$1
EMAIL=$2
DATA_PATH="./certbot-data"

echo "=== Initializing Let's Encrypt Certificate for $DOMAIN ==="

mkdir -p "$DATA_PATH/conf/live/$DOMAIN"
mkdir -p "$DATA_PATH/www"

echo "Creating dummy certificate..."
docker run --rm -v "$(pwd)/$DATA_PATH/conf:/etc/letsencrypt" \
  alpine sh -c "
    apk add --no-cache openssl && \
    openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
      -keyout '/etc/letsencrypt/live/$DOMAIN/privkey.pem' \
      -out '/etc/letsencrypt/live/$DOMAIN/fullchain.pem' \
      -subj '/CN=localhost'
  "

echo "Starting Nginx..."
docker compose -f docker-compose.prod.yml up -d nginx

echo "Requesting real certificate from Let's Encrypt..."
docker run --rm \
  -v "$(pwd)/$DATA_PATH/conf:/etc/letsencrypt" \
  -v "$(pwd)/$DATA_PATH/www:/var/www/certbot" \
  certbot/certbot certonly --webroot -w /var/www/certbot \
    -d "$DOMAIN" --email "$EMAIL" --rsa-key-size 4096 --agree-tos --non-interactive --force-renewal

echo "Reloading Nginx..."
docker compose -f docker-compose.prod.yml exec nginx nginx -s reload

echo "=== Let's Encrypt SSL Setup Complete ==="
