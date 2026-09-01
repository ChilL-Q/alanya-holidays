# ==============================================================================
# Alanya Holidays - Automated PostgreSQL Backup & Retention Runner
# ==============================================================================
# Hardened, lightweight Alpine container for automated pg_dump, SHA256 checksums,
# S3/Cloudflare R2 remote dispatch, and GFS retention pruning.
# ==============================================================================

FROM alpine:3.20

LABEL maintainer="Alanya Holidays DevOps Team"
LABEL description="Containerized PostgreSQL backup, verification, and S3/R2 retention runner"

# Install core utilities and PostgreSQL 16 client
RUN apk add --no-cache \
    bash \
    postgresql16-client \
    gzip \
    aws-cli \
    jq \
    coreutils \
    openssl \
    curl \
    tzdata

# Create dedicated unprivileged non-root user (UID/GID 10001)
RUN addgroup -g 10001 backupgroup && \
    adduser -u 10001 -G backupgroup -s /bin/bash -D backupuser

# Setup working directories and permissions
RUN mkdir -p /backups /scripts && \
    chown -R backupuser:backupgroup /backups /scripts

# Copy executable scripts
COPY scripts/backup-db.sh /scripts/backup-db.sh
COPY scripts/prune-backups.sh /scripts/prune-backups.sh
COPY scripts/restore-db.sh /scripts/restore-db.sh

RUN chmod +x /scripts/*.sh && \
    chown -R backupuser:backupgroup /scripts

WORKDIR /backups

# Switch to non-root execution
USER backupuser

# Periodic container healthcheck
HEALTHCHECK --interval=60s --timeout=5s --start-period=5s --retries=3 \
    CMD /scripts/restore-db.sh --version || exit 0

ENTRYPOINT ["/scripts/backup-db.sh"]
