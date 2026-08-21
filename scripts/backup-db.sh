#!/usr/bin/env bash
# ==============================================================================
# Alanya Holidays - Automated PostgreSQL Database Backup Script
# ==============================================================================
# Performs compressed pg_dump with SHA256 checksum, metadata manifest, and
# secure dispatch to Cloudflare R2 / AWS S3 (or local storage fallback).
# ==============================================================================

set -eo pipefail

# Ensure no command tracing exposes secrets
set +x

# ------------------------------------------------------------------------------
# Helper Functions
# ------------------------------------------------------------------------------
log_info() {
  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] [INFO] $*"
}

log_warn() {
  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] [WARN] $*" >&2
}

log_error() {
  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] [ERROR] $*" >&2
}

compute_sha256() {
  local target_file="$1"
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "${target_file}" | awk '{print $1}'
  elif command -v shasum >/dev/null 2>&1; then
    shasum -a 256 "${target_file}" | awk '{print $1}'
  elif command -v openssl >/dev/null 2>&1; then
    openssl dgst -sha256 "${target_file}" | awk '{print $NF}'
  else
    log_error "No SHA256 calculation tool (sha256sum, shasum, openssl) found in PATH."
    return 1
  fi
}

get_file_size() {
  local target_file="$1"
  if stat -f%z "${target_file}" 2>/dev/null; then
    return 0
  elif stat -c%s "${target_file}" 2>/dev/null; then
    return 0
  else
    wc -c < "${target_file}" | tr -d ' '
  fi
}

# ------------------------------------------------------------------------------
# Parse Connection Configuration
# ------------------------------------------------------------------------------
DB_HOST="${POSTGRES_HOST:-}"
DB_PORT="${POSTGRES_PORT:-5432}"
DB_NAME="${POSTGRES_DB:-}"
DB_USER="${POSTGRES_USER:-}"
DB_PASSWORD="${POSTGRES_PASSWORD:-}"
DB_SSLMODE="${POSTGRES_SSLMODE:-prefer}"

# Parse from DATABASE_URL or POSTGRES_URL if individual vars missing
CONN_URL="${DATABASE_URL:-${POSTGRES_URL:-}}"
if [[ -n "${CONN_URL}" && ( -z "${DB_HOST}" || -z "${DB_NAME}" || -z "${DB_USER}" ) ]]; then
  # Extract components from postgresql://[user[:password]@][host][:port][/dbname][?params]
  # Remove protocol prefix
  PROTO_STRIPPED="${CONN_URL#*://}"
  # Extract query params if any
  PARAMS_STRIPPED="${PROTO_STRIPPED%%\?*}"
  
  if [[ "${PARAMS_STRIPPED}" == *"@"* ]]; then
    AUTH_PART="${PARAMS_STRIPPED%%@*}"
    HOST_PART="${PARAMS_STRIPPED#*@}"
    
    if [[ -z "${DB_USER}" ]]; then
      DB_USER="${AUTH_PART%%:*}"
    fi
    if [[ -z "${DB_PASSWORD}" && "${AUTH_PART}" == *":"* ]]; then
      DB_PASSWORD="${AUTH_PART#*:}"
    fi
  else
    HOST_PART="${PARAMS_STRIPPED}"
  fi
  
  if [[ "${HOST_PART}" == *"/"* ]]; then
    HP="${HOST_PART%%/*}"
    if [[ -z "${DB_NAME}" ]]; then
      DB_NAME="${HOST_PART#*/}"
    fi
  else
    HP="${HOST_PART}"
  fi
  
  if [[ -z "${DB_HOST}" ]]; then
    if [[ "${HP}" == *":"* ]]; then
      DB_HOST="${HP%%:*}"
      if [[ -z "${POSTGRES_PORT:-}" ]]; then
        DB_PORT="${HP#*:}"
      fi
    else
      DB_HOST="${HP}"
    fi
  fi
fi

# ------------------------------------------------------------------------------
# Validation
# ------------------------------------------------------------------------------
if [[ -z "${DB_NAME}" || -z "${DB_USER}" || ( -z "${DB_HOST}" && -z "${CONN_URL}" ) ]]; then
  log_error "Missing required database configuration. You must set POSTGRES_DB, POSTGRES_USER, POSTGRES_HOST (and POSTGRES_PASSWORD) or DATABASE_URL."
  exit 2
fi

BACKUP_DIR="${BACKUP_DIR:-/tmp/pg_backups}"
mkdir -p "${BACKUP_DIR}"

TIMESTAMP=$(date -u +"%Y%m%d_%H%M%S")
ISO_TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
BACKUP_FILENAME="backup_${DB_NAME}_${TIMESTAMP}.sql.gz"
BACKUP_FILEPATH="${BACKUP_DIR}/${BACKUP_FILENAME}"
CHECKSUM_FILEPATH="${BACKUP_FILEPATH}.sha256"
MANIFEST_FILEPATH="${BACKUP_FILEPATH}.meta.json"

# Set up clean temporary directory for intermediate operations
TEMP_DIR=$(mktemp -d 2>/dev/null || mktemp -d -t 'pg_backup_tmp')

cleanup() {
  local exit_code=$?
  set +x
  if [[ -d "${TEMP_DIR:-}" ]]; then
    rm -rf "${TEMP_DIR}"
  fi
  exit "${exit_code}"
}
trap cleanup EXIT INT TERM

# ------------------------------------------------------------------------------
# Database Dump Generation
# ------------------------------------------------------------------------------
log_info "Initiating database backup for '${DB_NAME}' at host '${DB_HOST}:${DB_PORT}'..."

if [[ -n "${MOCK_DUMP_CONTENT:-}" ]]; then
  # Test hook for environments without live Postgres
  echo "${MOCK_DUMP_CONTENT}" | gzip -9 > "${BACKUP_FILEPATH}"
elif command -v pg_dump >/dev/null 2>&1; then
  export PGPASSWORD="${DB_PASSWORD}"
  export PGSSLMODE="${DB_SSLMODE}"
  
  pg_dump \
    -h "${DB_HOST}" \
    -p "${DB_PORT}" \
    -U "${DB_USER}" \
    -d "${DB_NAME}" \
    --clean \
    --if-exists \
    --no-owner \
    --no-privileges | gzip -9 > "${BACKUP_FILEPATH}"
  
  unset PGPASSWORD
else
  log_error "'pg_dump' command not found in PATH."
  exit 1
fi

if [[ ! -s "${BACKUP_FILEPATH}" ]]; then
  log_error "Backup file was not created or is 0 bytes."
  exit 1
fi

# ------------------------------------------------------------------------------
# Checksum & Manifest Generation
# ------------------------------------------------------------------------------
log_info "Calculating SHA-256 integrity checksum..."
SHA256_VAL=$(compute_sha256 "${BACKUP_FILEPATH}")
if [[ -z "${SHA256_VAL}" ]]; then
  log_error "Failed to compute SHA256 checksum."
  exit 1
fi

echo "${SHA256_VAL}  ${BACKUP_FILENAME}" > "${CHECKSUM_FILEPATH}"
FILE_SIZE_BYTES=$(get_file_size "${BACKUP_FILEPATH}")

log_info "Writing metadata manifest..."
cat > "${MANIFEST_FILEPATH}" <<EOF
{
  "backup_id": "backup_${DB_NAME}_${TIMESTAMP}",
  "timestamp": "${ISO_TIMESTAMP}",
  "db_name": "${DB_NAME}",
  "format": "sql.gz",
  "file_name": "${BACKUP_FILENAME}",
  "size_bytes": ${FILE_SIZE_BYTES},
  "sha256": "${SHA256_VAL}",
  "environment": "${NODE_ENV:-production}",
  "version": "1.0.0"
}
EOF

# ------------------------------------------------------------------------------
# Optional Encryption
# ------------------------------------------------------------------------------
ENC_KEY="${BACKUP_ENCRYPTION_KEY:-${BACKUP_ENCRYPTION_PASSPHRASE:-}}"
if [[ -n "${ENC_KEY}" ]]; then
  log_info "Encrypting backup archive with AES-256-CBC..."
  openssl enc -aes-256-cbc -salt -pbkdf2 -iter 100000 \
    -in "${BACKUP_FILEPATH}" \
    -out "${BACKUP_FILEPATH}.enc" \
    -pass "pass:${ENC_KEY}"
  log_info "Encryption complete: ${BACKUP_FILENAME}.enc"
fi

# ------------------------------------------------------------------------------
# S3 / Cloudflare R2 Remote Storage Dispatch
# ------------------------------------------------------------------------------
S3_BUCKET="${S3_BUCKET_NAME:-${S3_BUCKET:-}}"
S3_KEY_ID="${S3_ACCESS_KEY_ID:-${AWS_ACCESS_KEY_ID:-}}"
S3_SECRET="${S3_SECRET_ACCESS_KEY:-${AWS_SECRET_ACCESS_KEY:-}}"
S3_REGION_VAL="${S3_REGION:-${AWS_DEFAULT_REGION:-auto}}"
S3_PREFIX_VAL="${S3_PREFIX:-postgres/}"

if [[ -n "${S3_BUCKET}" && -n "${S3_KEY_ID}" && -n "${S3_SECRET}" ]]; then
  log_info "S3 / Cloudflare R2 credentials detected. Preparing remote upload to bucket: ${S3_BUCKET}..."
  
  if ! command -v aws >/dev/null 2>&1; then
    log_error "AWS CLI not found. Cannot upload to S3."
    exit 1
  fi
  
  export AWS_ACCESS_KEY_ID="${S3_KEY_ID}"
  export AWS_SECRET_ACCESS_KEY="${S3_SECRET}"
  export AWS_DEFAULT_REGION="${S3_REGION_VAL}"
  
  AWS_EXTRA_ARGS=()
  if [[ -n "${S3_ENDPOINT_URL:-}" ]]; then
    AWS_EXTRA_ARGS+=(--endpoint-url "${S3_ENDPOINT_URL}")
  fi
  
  log_info "Uploading backup archive: ${BACKUP_FILENAME}..."
  aws s3 cp "${BACKUP_FILEPATH}" "s3://${S3_BUCKET}/${S3_PREFIX_VAL}${BACKUP_FILENAME}" "${AWS_EXTRA_ARGS[@]}"
  
  log_info "Uploading SHA256 checksum: ${BACKUP_FILENAME}.sha256..."
  aws s3 cp "${CHECKSUM_FILEPATH}" "s3://${S3_BUCKET}/${S3_PREFIX_VAL}${BACKUP_FILENAME}.sha256" "${AWS_EXTRA_ARGS[@]}"
  
  log_info "Uploading metadata manifest: ${BACKUP_FILENAME}.meta.json..."
  aws s3 cp "${MANIFEST_FILEPATH}" "s3://${S3_BUCKET}/${S3_PREFIX_VAL}${BACKUP_FILENAME}.meta.json" "${AWS_EXTRA_ARGS[@]}"
  
  if [[ -f "${BACKUP_FILEPATH}.enc" ]]; then
    log_info "Uploading encrypted archive: ${BACKUP_FILENAME}.enc..."
    aws s3 cp "${BACKUP_FILEPATH}.enc" "s3://${S3_BUCKET}/${S3_PREFIX_VAL}${BACKUP_FILENAME}.enc" "${AWS_EXTRA_ARGS[@]}"
  fi
  
  unset AWS_ACCESS_KEY_ID
  unset AWS_SECRET_ACCESS_KEY
  log_info "Remote dispatch to S3/R2 completed successfully."
else
  log_info "S3 storage credentials not configured. Backup retained locally in '${BACKUP_DIR}'."
fi

log_info "Backup workflow finished successfully."
log_info "Archive: ${BACKUP_FILENAME} (${FILE_SIZE_BYTES} bytes, SHA256: ${SHA256_VAL})"

exit 0
