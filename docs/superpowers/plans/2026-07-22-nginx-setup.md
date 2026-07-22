# Nginx & Docker Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a full-cycle Nginx and Docker Compose configuration for `alanya-holidays`, supporting local development with Vite HMR and production deployment with SPA routing, static caching, Gzip compression, and Let's Encrypt SSL/HTTPS.

**Architecture:** Split configurations into Development (`nginx/nginx.conf`, `docker-compose.yml`) and Production (`nginx/nginx.prod.conf`, `docker-compose.prod.yml`, `frontend/Dockerfile.prod`). Use multi-stage Docker build for frontend static assets and sidecar `certbot` container for SSL certificates.

**Tech Stack:** Nginx (alpine), Docker, Docker Compose, Vite, Node.js, Let's Encrypt Certbot.

## Global Constraints

- Keep Nginx image lightweight (`nginx:alpine`).
- Production SPA fallback MUST use `try_files $uri $uri/ /index.html;`.
- Proxy API requests to backend container at `http://backend:4000/api/`.
- Ensure WebSocket HMR headers are present in dev Nginx config (`Upgrade`, `Connection "upgrade"`).

---

### Task 1: Production Multi-stage Frontend Dockerfile

**Files:**
- Create: `frontend/Dockerfile.prod`

**Interfaces:**
- Produces: Production Docker image serving compiled Vite bundle from `/usr/share/nginx/html` on port 80.

- [ ] **Step 1: Create `frontend/Dockerfile.prod`**

```dockerfile
# Stage 1: Build static assets
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve static assets with Nginx
FROM nginx:alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

- [ ] **Step 2: Test building production frontend image**

Run: `docker build -t alanya-frontend-prod -f frontend/Dockerfile.prod ./frontend`  
Expected: Successful build completing with `Successfully tagged alanya-frontend-prod:latest` (or exit code 0).

- [ ] **Step 3: Commit changes**

```bash
git add frontend/Dockerfile.prod
git commit -m "feat(nginx): add production multi-stage Dockerfile for frontend"
```

---

### Task 2: Production Nginx Configuration

**Files:**
- Create: `nginx/nginx.prod.conf`

**Interfaces:**
- Consumes: Frontend static files mounted at `/usr/share/nginx/html` and backend API service running at `http://backend:4000`.
- Produces: Production web server configuration with HTTP->HTTPS redirect, ACME challenge location, SPA fallback, static asset caching, Gzip, and Security headers.

- [ ] **Step 1: Create `nginx/nginx.prod.conf`**

```nginx
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    # Logging
    access_log  /var/log/nginx/access.log;
    error_log   /var/log/nginx/error.log warn;

    # Gzip Compression
    gzip on;
    gzip_disable "msie6";
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # HTTP Server (Redirects to HTTPS + handles Certbot ACME challenge)
    server {
        listen 80;
        server_name _;

        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        location / {
            return 301 https://$host$request_uri;
        }
    }

    # HTTPS Server
    server {
        listen 443 ssl;
        server_name _;

        ssl_certificate /etc/letsencrypt/live/alanya-holidays/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/alanya-holidays/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;

        root /usr/share/nginx/html;
        index index.html;

        # Frontend SPA Routing
        location / {
            try_files $uri $uri/ /index.html;
        }

        # Static Asset Caching
        location ~* \.(?:css|js|jpg|jpeg|gif|png|ico|cur|gz|svg|svgz|mp4|ogg|ogv|webm|htc|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, max-age=31536000, immutable";
            access_log off;
        }

        # Backend API Proxy
        location /api/ {
            proxy_pass http://backend:4000/api/;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

- [ ] **Step 2: Validate Nginx configuration syntax**

Run: `docker run --rm -v $(pwd)/nginx/nginx.prod.conf:/etc/nginx/nginx.conf:ro nginx:alpine nginx -t`  
Expected: `nginx: configuration file /etc/nginx/nginx.conf test is successful`

- [ ] **Step 3: Commit changes**

```bash
git add nginx/nginx.prod.conf
git commit -m "feat(nginx): add production Nginx configuration with SSL, SPA fallback, caching and proxying"
```

---

### Task 3: Development Nginx Configuration Audit

**Files:**
- Modify: `nginx/nginx.conf:1-25`

**Interfaces:**
- Consumes: `frontend:5173` (Vite dev server) and `backend:4000`.
- Produces: Clean dev Nginx config supporting WebSocket HMR and API routing.

- [ ] **Step 1: Update `nginx/nginx.conf`**

```nginx
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    server {
        listen 80;

        # Frontend Vite Dev Server + HMR WebSocket
        location / {
            proxy_pass http://frontend:5173;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
        }

        # Backend API Proxy
        location /api/ {
            proxy_pass http://backend:4000/api/;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

- [ ] **Step 2: Test syntax of dev `nginx.conf`**

Run: `docker run --rm -v $(pwd)/nginx/nginx.conf:/etc/nginx/nginx.conf:ro nginx:alpine nginx -t`  
Expected: `nginx: configuration file /etc/nginx/nginx.conf test is successful`

- [ ] **Step 3: Commit changes**

```bash
git add nginx/nginx.conf
git commit -m "refactor(nginx): enhance dev Nginx configuration with mime types and proxy headers"
```

---

### Task 4: Production Docker Compose Stack & SSL Initialization Script

**Files:**
- Create: `docker-compose.prod.yml`
- Create: `scripts/init-letsencrypt.sh`

**Interfaces:**
- Consumes: `./frontend/Dockerfile.prod`, `./backend`, `./nginx/nginx.prod.conf`.
- Produces: Production deployment stack orchestrating frontend, backend, nginx, and certbot.

- [ ] **Step 1: Create `docker-compose.prod.yml`**

```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    restart: unless-stopped
    environment:
      - NODE_ENV=production
    env_file:
      - .env

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.prod.conf:/etc/nginx/nginx.conf:ro
      - certbot-etc:/etc/letsencrypt
      - certbot-var:/var/www/certbot
    depends_on:
      - frontend
      - backend

  certbot:
    image: certbot/certbot
    restart: unless-stopped
    volumes:
      - certbot-etc:/etc/letsencrypt
      - certbot-var:/var/www/certbot
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait $${!}; done;'"

volumes:
  certbot-etc:
  certbot-var:
```

- [ ] **Step 2: Create `scripts/init-letsencrypt.sh`**

```bash
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

echo "Deleting dummy certificate..."
docker run --rm -v "$(pwd)/$DATA_PATH/conf:/etc/letsencrypt" \
  alpine rm -rf "/etc/letsencrypt/live/$DOMAIN" "/etc/letsencrypt/archive/$DOMAIN" "/etc/letsencrypt/renewal/$DOMAIN.conf"

echo "Requesting real certificate from Let's Encrypt..."
docker run --rm \
  -v "$(pwd)/$DATA_PATH/conf:/etc/letsencrypt" \
  -v "$(pwd)/$DATA_PATH/www:/var/www/certbot" \
  certbot/certbot certonly --webroot -w /var/www/certbot \
    -d "$DOMAIN" --email "$EMAIL" --rsa-key-size 4096 --agree-tos --non-interactive

echo "Reloading Nginx..."
docker compose -f docker-compose.prod.yml exec nginx nginx -s reload

echo "=== Let's Encrypt SSL Setup Complete ==="
```

- [ ] **Step 3: Make `scripts/init-letsencrypt.sh` executable**

Run: `chmod +x scripts/init-letsencrypt.sh`

- [ ] **Step 4: Validate `docker-compose.prod.yml` syntax**

Run: `docker compose -f docker-compose.prod.yml config`  
Expected: Valid YAML output representing service configurations without errors.

- [ ] **Step 5: Commit changes**

```bash
git add docker-compose.prod.yml scripts/init-letsencrypt.sh
git commit -m "feat(deploy): add production Docker Compose stack and SSL initialization script"
```
