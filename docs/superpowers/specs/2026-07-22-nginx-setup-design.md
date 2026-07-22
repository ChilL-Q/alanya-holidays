# Nginx & Docker Setup Design Specification

**Date:** 2026-07-22  
**Status:** Approved  
**Topic:** Full-cycle Nginx & Docker Compose configuration for local development and production deployment (VPS).

---

## 1. Overview & Goals

This specification outlines the architecture and configuration for Nginx and Docker in the `alanya-holidays` project.

Key goals:
1. Maintain a smooth **Development** workflow with live reloading (Vite HMR via WebSocket) and API proxying.
2. Provide a robust, secure, and optimized **Production** configuration with SPA routing fallback, static asset caching, Gzip compression, security headers, and automated Let's Encrypt SSL/HTTPS certificate renewal.
3. Keep the architecture fully containerized using Docker Compose for 100% environment reproducibility across environments.

---

## 2. File & Directory Structure

```
.
├── nginx/
│   ├── nginx.conf              # Development Nginx configuration (Vite HMR proxy + API proxy)
│   └── nginx.prod.conf         # Production Nginx configuration (Static SPA + Gzip + Cache + SSL + API proxy)
├── frontend/
│   ├── Dockerfile.dev          # Development Dockerfile (runs vite dev server)
│   └── Dockerfile.prod         # Multi-stage Production Dockerfile (node build -> nginx static serving)
├── docker-compose.yml          # Development Docker Compose stack
├── docker-compose.prod.yml     # Production Docker Compose stack (frontend, backend, nginx, certbot)
└── scripts/
    └── init-letsencrypt.sh     # Bootstrap script for initial Let's Encrypt SSL certificate issuance
```

---

## 3. Detailed Component Specification

### 3.1. Frontend Multi-stage Dockerfile (`frontend/Dockerfile.prod`)
- **Stage 1 (Build):**
  - Base image: `node:20-alpine`
  - Installs dependencies (`npm ci`) and compiles frontend static bundle (`npm run build`).
- **Stage 2 (Serving):**
  - Base image: `nginx:alpine`
  - Copies compiled build from `/app/dist` to `/usr/share/nginx/html`.
  - Exposes port 80 internally.

### 3.2. Development Nginx Configuration (`nginx/nginx.conf`)
- Listens on port 80.
- `location /`: Proxy pass to `http://frontend:5173` with WebSocket headers (`Upgrade`, `Connection "upgrade"`) for Vite HMR.
- `location /api/`: Proxy pass to `http://backend:4000/api/` with client headers (`Host`, `X-Real-IP`).

### 3.3. Production Nginx Configuration (`nginx/nginx.prod.conf`)
- **HTTP Server (Port 80):**
  - Responds to ACME challenge requests (`location /.well-known/acme-challenge/`).
  - Redirects all other HTTP traffic to `https://$host$request_uri`.
- **HTTPS Server (Port 443):**
  - Configures SSL certificates (`/etc/letsencrypt/live/<domain>/fullchain.pem` and `privkey.pem`).
  - **SPA Fallback:** `location / { try_files $uri $uri/ /index.html; }`.
  - **API Proxying:** `location /api/ { proxy_pass http://backend:4000/api/; ... }`.
  - **Static Caching:** `location ~* \.(?:css|js|png|jpg|jpeg|gif|ico|svg|woff2)$` with `expires 1y; add_header Cache-Control "public, max-age=31536000, immutable";`.
  - **Gzip Compression:** Enabled for `text/plain`, `text/css`, `application/json`, `application/javascript`, `image/svg+xml`.
  - **Security Headers:** `X-Frame-Options SAMEORIGIN`, `X-Content-Type-Options nosniff`, `X-XSS-Protection "1; mode=block"`.

### 3.4. Production Docker Compose Stack (`docker-compose.prod.yml`)
- **`backend` service:** Builds from `./backend/Dockerfile` (or `Dockerfile.prod`), `restart: unless-stopped`, environment variables loaded from `.env.prod`.
- **`frontend` service:** Builds from `./frontend/Dockerfile.prod`, `restart: unless-stopped`.
- **`nginx` service:** Uses `nginx:alpine`, maps host ports `80:80` and `443:443`, depends on `frontend` and `backend`, mounts `./nginx/nginx.prod.conf`, SSL cert volume, and certbot webroot.
- **`certbot` service:** Uses `certbot/certbot`, runs renewal check loop every 12 hours.

### 3.5. Initial SSL Bootstrap Script (`scripts/init-letsencrypt.sh`)
- Pre-creates dummy SSL certificates so Nginx can start up without failing on missing certificate files.
- Starts Nginx via Docker Compose.
- Deletes dummy certificates and requests real certificates from Let's Encrypt.
- Reloads Nginx gracefully.

---

## 4. Verification & Testing Plan

1. **Development Verification:**
   - Run `docker compose up --build`.
   - Verify frontend loads on `http://localhost:8080`.
   - Verify HMR works when modifying React code.
   - Verify `/api/` endpoints reach the backend service.

2. **Production Build Verification:**
   - Test multi-stage frontend Docker build locally: `docker build -t frontend-prod -f frontend/Dockerfile.prod ./frontend`.
   - Test `docker-compose.prod.yml` configuration parsing with `docker compose -f docker-compose.prod.yml config`.

---

## 5. Security & Maintenance

- Certificates renew automatically via the `certbot` sidecar container.
- Container restart policy `unless-stopped` guarantees auto-recovery on system reboot.
