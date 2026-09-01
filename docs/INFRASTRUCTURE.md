# Infrastructure Hardening, Performance & Operations Guide

This guide documents operational procedures, host hardening, performance architecture for instant data loading, and maintenance routines for running **Alanya Holidays** in production on a VPS.

---

## 1. VPS Swap Space Configuration

To prevent out-of-memory (OOM) kernel panics on 2GB–4GB RAM VPS instances, configure a 2GB swap file:

```bash
# 1. Create swap file
sudo fallocate -l 2G /swapfile

# 2. Set strict permissions
sudo chmod 600 /swapfile

# 3. Format as swap space
sudo mkswap /swapfile

# 4. Enable swap
sudo swapon /swapfile

# 5. Persist across reboots in /etc/fstab
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# 6. Tune swappiness (optimal for server workloads)
sudo sysctl vm.swappiness=20
echo 'vm.swappiness=20' | sudo tee -a /etc/sysctl.conf
```

---

## 2. Firewall & Port Security (UFW)

Restrict external access strictly to necessary ports (HTTP/80, HTTPS/443, SSH/22):

```bash
# Set default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow standard web traffic
sudo ufw allow 22/tcp comment 'SSH'
sudo ufw allow 80/tcp comment 'HTTP'
sudo ufw allow 443/tcp comment 'HTTPS'

# Enable firewall
sudo ufw enable
sudo ufw status verbose
```

---

## 3. Nginx Gateway, Cloudflare Real IP & Rate Limiting

Rate limiting and real IP restoration are configured in [`nginx.prod.conf`](../nginx/nginx.prod.conf):

* **Cloudflare Real IP:** `set_real_ip_from` blocks match Cloudflare edge IPs, restoring actual visitor IPs via `CF-Connecting-IP`.
* **API Zone (`/api/`):** 20 req/sec with burst limit of 30 requests.
* **Edge Functions Zone (`/functions/v1/`):** 15 req/sec with burst limit of 20 requests.
* **HTTP 429 Status:** Returned when clients exceed burst thresholds.
* **Security Headers:** HSTS enabled with `max-age=31536000`, Referrer Policy, No-Sniff, and Frame-Options.

### Cloudflare Dashboard Configuration:
1. **SSL/TLS Encryption Mode:** Set to **Full (Strict)**.
2. **Speed -> Optimization:** Enable **Brotli** compression.
3. **Security -> WAF:** Enable Security Level **Medium** and Bot Fight Mode.

---

## 4. Redis In-Memory Caching & Resource Management

Redis container configuration in [`docker-compose.prod.yml`](../docker-compose.prod.yml):

* **Image:** `redis:7-alpine`
* **Memory Cap:** Max 100MB with LRU eviction (`--maxmemory 100mb --maxmemory-policy allkeys-lru`).
* **Container Resource Limit:** 128MB RAM max, 32MB reserved.
* **Healthcheck:** `redis-cli ping` every 10 seconds.

Logging limits across containers:
* **Log Driver:** `json-file` (20MB max per file, max 5 files).
* **Memory Limits:**
  * `backend`: 1024MB max, 256MB reserved.
  * `nginx`: 512MB max, 128MB reserved.
  * `redis`: 128MB max, 32MB reserved.

Manual Docker cleanup:
```bash
docker system prune -af --volumes
```

---

## 5. Automated Continuous Deployment (CD)

GitHub Actions workflow [`cd.yml`](../.github/workflows/cd.yml) automates deployment on push to `main`.

### Required GitHub Repository Secrets:

| Secret | Description | Example |
| :--- | :--- | :--- |
| `VPS_HOST` | IP address or domain of the VPS | `194.163.x.x` |
| `VPS_USERNAME` | SSH user | `root` or `deploy` |
| `VPS_SSH_KEY` | Private SSH Key for authentication | `-----BEGIN OPENSSH PRIVATE KEY-----` |
| `VPS_SSH_PORT` | Optional SSH Port | `22` |

---

## 6. Instant Data Loading Architecture & Performance Roadmap

To achieve near-instantaneous page transitions and data loading (TTFB < 50ms, LCP < 0.8s), implementation covers 5 primary infrastructure layers:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        1. EDGE & CDN (Cloudflare)                      │
│   • Global Anycast DNS (<10ms)  • Brotli/Gzip  • Edge Page & API Cache   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                    2. MEDIA STORAGE & OPTIMIZATION                         │
│   • Cloudflare R2 / S3 Storage  • Auto-conversion to WebP/AVIF         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                   3. BACKEND CACHING (NestJS + Redis)                  │
│   • In-Memory Cache (Districts, Listings, Categories)                  │
│   • Redis Cache Invalidation on Mutations                              │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│              4. DATABASE & QUERY TUNING (PostgreSQL / Supabase)        │
│   • B-Tree & Spatial Indexes  • Connection Pooling (PgBouncer)       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                   5. FRONTEND INSTANT UX (React / TanStack)            │
│   • Stale-While-Revalidate Caching  • Hover Prefetching               │
└────────────────────────────────────────────────────────────────────────┘
```

### 📋 Phase 1: Edge & CDN Layer (Cloudflare)
- [ ] Connect domain `alanyaholidays.com` to Cloudflare Anycast DNS.
- [ ] Enable HTTP/3 (QUIC) and Brotli compression in Cloudflare Speed tab.
- [ ] Configure Cache Rules for static assets (`/assets/*`, `.webp`, `.png`, `.js`, `.css`) with `Cache-Control: public, max-age=31536000, immutable`.
- [ ] Set up Edge Cache-Control headers for public API GET endpoints (`/api/districts`, `/api/categories`).

### 🖼️ Phase 2: Media Storage & Image Pipeline
- [ ] Migrate property and directory photo uploads to S3-compatible storage (**Cloudflare R2** / Supabase Storage).
- [ ] Implement thumbnail generator pipeline: automatically compress uploaded images to WebP/AVIF format with responsive sizes (`thumb-300`, `medium-800`, `large-1600`).
- [ ] Enable `loading="lazy"` and `fetchpriority="high"` for hero listing images on frontend.

### 🚀 Phase 3: In-Memory API Caching (NestJS + Redis)
- [ ] Integrate `@nestjs/cache-manager` with the existing Redis container.
- [ ] Cache heavy public read endpoints:
  - `GET /api/properties` (TTL: 5 min)
  - `GET /api/districts` (TTL: 1 hour)
  - `GET /api/categories` (TTL: 1 hour)
- [ ] Implement Cache Invalidation events in NestJS Repositories on create/update/delete operations (`cacheManager.del('properties_*')`).

### 🗄️ Phase 4: Database Optimization & Indexing
- [ ] Audit PostgreSQL slow queries (`pg_stat_statements`).
- [ ] Create missing B-Tree indexes on foreign keys: `properties(district_id)`, `properties(host_id)`, `bookings(property_id, status)`.
- [ ] Enable PgBouncer / Supabase Connection Pooler to prevent database connection overhead under high concurrency.

### 📱 Phase 5: Frontend Instant UI (TanStack Query & Prefetching)
- [ ] Configure TanStack Query `staleTime: 5 * 60 * 1000` (5 minutes) and `gcTime: 30 * 60 * 1000`.
- [ ] Implement route & data prefetching on hover over property cards and navigation links.
- [ ] Use optimistic updates for booking interactions and favorite toggles.

### 📊 Phase 6: Observability & Health Monitoring
- [ ] Configure **Uptime Kuma** or Cloudflare Health Checks for 24/7 endpoint pinging and SSL expiration alerts.
- [ ] Log API response times and cache hit/miss ratios in NestJS structured logs.

---

## 7. Disaster Recovery & Database Backups

Host cron for scheduled database dumps:

```bash
# Daily DB Backup Cron Job (02:00 AM)
0 2 * * * pg_dump -U postgres -h localhost alanya_holidays | gzip > /backups/db_$(date +\%Y\%m\%d).sql.gz
```

---

## 8. Microservices & Message Queue Integrations (Adapted from Course Architecture)

From the microservices course architecture, the following high-value patterns are adapted to **Alanya Holidays** without adding excessive complexity or memory overhead on VPS:

### ✉️ 8.1 Async Task Queues (BullMQ / Redis Queue instead of heavy RabbitMQ)
Rather than running a resource-heavy Erlang/RabbitMQ container, we use **BullMQ** on top of our existing **Redis** container:
* **Stripe Webhook Processing:** Stripe webhooks immediately respond with `200 OK`, pushing events to Redis Queue for background execution (preventing Stripe timeouts).
* **Notification Service:** Background worker for sending Email (Nodemailer / Resend) and WhatsApp / SMS confirmation messages for bookings.
* **AI Local Guide Generation:** Async generation of multi-day itineraries via Gemini API to avoid API gateway timeouts.

### 🔒 8.2 Private Docker Bridge Networks & Container Isolation
* **Network Isolation:** Create `frontend-net` (Nginx + Frontend) and `backend-net` (Nginx + NestJS + Redis + Postgres).
* **Port Restrictions:** Ensure PostgreSQL (`5432`) and Redis (`6379`) do **NOT** expose public ports in `docker-compose.prod.yml`, making them accessible exclusively within the internal Docker bridge network.

### 📈 8.3 Event-Driven Analytics (Redis Streams / ClickHouse)
* **Separation of OLTP & Analytics:** Store transactional data (bookings, listings, payments) in PostgreSQL, while streaming high-frequency view/click analytics into **Redis Streams** or a lightweight **ClickHouse** instance.
* Prevent analytics load from degrading booking search SQL query performance.

### 🛡️ 8.4 Gateway JWT Verification & Request Sanitization
* Validate JWT tokens and sanitize incoming headers directly at the **Nginx / Edge Gateway** level before passing requests down to NestJS controllers.

