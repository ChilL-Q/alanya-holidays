# Infrastructure Hardening & Operations Guide

This guide documents operational procedures, host hardening, security practices, and maintenance routines for running **Alanya Holidays** in production on a VPS.

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

## 6. Disaster Recovery & Database Backups

If running a scheduled database dump cron on the host:

```bash
# Daily DB Backup Cron Job (02:00 AM)
0 2 * * * pg_dump -U postgres -h localhost alanya_holidays | gzip > /backups/db_$(date +\%Y\%m\%d).sql.gz
```

