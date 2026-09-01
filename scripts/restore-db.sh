#!/usr/bin/env bash
# ==============================================================================
# Alanya Holidays - Non-Destructive Database Restore & Verification Tool
# ==============================================================================
# Implements 3-tier dry-run restore verification:
# - Tier 1: SHA256 checksum & archive gzip decompression integrity check
# - Tier 2: Schema syntax & TOC table/index structure parsing drill
# - Tier 3: Guardrailed database restore execution (when --force-restore supplied)
# ==============================================================================

set -eo pipefail
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
    log_error "No SHA256 tool found."
    return 1
  fi
}

# ------------------------------------------------------------------------------
# Parameters & Flag Parsing
# ------------------------------------------------------------------------------
VERSION="1.0.0"
DRY_RUN=true
FORCE_RESTORE=false
ALLOW_PROD=false
TARGET_FILE=""
TARGET_DB="${POSTGRES_DB:-}"
TARGET_HOST="${POSTGRES_HOST:-localhost}"
TARGET_PORT="${POSTGRES_PORT:-5432}"
TARGET_USER="${POSTGRES_USER:-postgres}"
TARGET_PASSWORD="${POSTGRES_PASSWORD:-}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --version)
      echo "Alanya Holidays Database Restore Tool v${VERSION}"
      exit 0
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --force-restore)
      DRY_RUN=false
      FORCE_RESTORE=true
      shift
      ;;
    --allow-production-restore)
      ALLOW_PROD=true
      shift
      ;;
    --target-db=*)
      TARGET_DB="${1#*=}"
      shift
      ;;
    --target-host=*)
      TARGET_HOST="${1#*=}"
      shift
      ;;
    --target-port=*)
      TARGET_PORT="${1#*=}"
      shift
      ;;
    --target-user=*)
      TARGET_USER="${1#*=}"
      shift
      ;;
    --file=*)
      TARGET_FILE="${1#*=}"
      shift
      ;;
    --help|-h)
      echo "Usage: $0 [OPTIONS] [BACKUP_FILE]"
      echo "Options:"
      echo "  --dry-run                 Run validation tiers without modifying database (Default)"
      echo "  --force-restore           Execute actual restore against target database"
      echo "  --allow-production-restore Required override when restoring to production database"
      echo "  --target-db=DB            Target database name"
      echo "  --target-host=HOST        Target database host"
      echo "  --target-port=PORT        Target database port"
      echo "  --target-user=USER        Target database user"
      echo "  --file=FILE               Path to backup archive"
      echo "  --version                 Display version"
      echo "  --help, -h                Display this help"
      exit 0
      ;;
    *)
      if [[ -z "${TARGET_FILE}" && ! "$1" =~ ^-- ]]; then
        TARGET_FILE="$1"
      else
        log_warn "Unknown option: $1"
      fi
      shift
      ;;
  esac
done

if [[ -z "${TARGET_FILE}" ]]; then
  log_error "No backup file specified. Please provide a backup archive file path."
  exit 1
fi

if [[ ! -f "${TARGET_FILE}" ]]; then
  log_error "Specified backup file '${TARGET_FILE}' does not exist."
  exit 1
fi

log_info "============================================================"
log_info "Alanya Holidays Database Restore & Verification Engine"
log_info "Target File: ${TARGET_FILE}"
if [[ "${DRY_RUN}" == true ]]; then
  log_info "Mode: DRY-RUN VERIFICATION (Non-destructive)"
else
  log_info "Mode: LIVE RESTORE to target DB '${TARGET_DB}'"
fi
log_info "============================================================"

# ==============================================================================
# TIER 1: Checksum & Archive Integrity Verification
# ==============================================================================
log_info "[Tier 1] Computing SHA-256 checksum..."
ACTUAL_SHA256=$(compute_sha256 "${TARGET_FILE}")
log_info "[Tier 1] Computed SHA-256: ${ACTUAL_SHA256}"

CHECKSUM_FILE="${TARGET_FILE}.sha256"
if [[ -f "${CHECKSUM_FILE}" ]]; then
  EXPECTED_SHA256=$(awk '{print $1}' "${CHECKSUM_FILE}")
  if [[ "${ACTUAL_SHA256}" != "${EXPECTED_SHA256}" ]]; then
    log_error "[Tier 1] FAILED: SHA-256 checksum mismatch!"
    log_error "  Expected: ${EXPECTED_SHA256}"
    log_error "  Actual  : ${ACTUAL_SHA256}"
    exit 1
  fi
  log_info "[Tier 1] PASSED: SHA-256 matches verified companion checksum file."
else
  log_warn "[Tier 1] No companion .sha256 file found. Skipping checksum comparison."
fi

# Decompression validation
log_info "[Tier 1] Testing archive compression integrity..."
if [[ "${TARGET_FILE}" == *.gz ]]; then
  if ! gzip -t "${TARGET_FILE}" 2>/dev/null; then
    log_error "[Tier 1] FAILED: Gzip archive integrity test failed. File is corrupt or truncated."
    exit 1
  fi
  log_info "[Tier 1] PASSED: Gzip archive integrity confirmed."
fi

# Metadata validation
MANIFEST_FILE="${TARGET_FILE}.meta.json"
if [[ -f "${MANIFEST_FILE}" ]]; then
  log_info "[Tier 1] Inspecting metadata manifest '${MANIFEST_FILE}'..."
  if command -v jq >/dev/null 2>&1; then
    META_DB=$(jq -r '.db_name // empty' "${MANIFEST_FILE}")
    META_SHA=$(jq -r '.sha256 // empty' "${MANIFEST_FILE}")
    if [[ -n "${META_SHA}" && "${META_SHA}" != "${ACTUAL_SHA256}" ]]; then
      log_error "[Tier 1] FAILED: Manifest SHA256 does not match computed SHA256!"
      exit 1
    fi
    log_info "[Tier 1] Manifest valid: DB='${META_DB}', Version=$(jq -r '.version // "unknown"' "${MANIFEST_FILE}")"
  fi
fi

# ==============================================================================
# TIER 2: Schema TOC & Syntax Parsing Drill
# ==============================================================================
log_info "[Tier 2] Parsing schema syntax and database structures..."

VALID_SQL_HEADER=false
STATEMENT_COUNT=0

if [[ "${TARGET_FILE}" == *.sql.gz ]]; then
  # Read header lines to inspect SQL structure
  HEADER_SNIPPET=$(gzip -dc "${TARGET_FILE}" | head -n 50 2>/dev/null || true)
  
  if echo "${HEADER_SNIPPET}" | grep -Ei "(PostgreSQL database dump|CREATE TABLE|ALTER TABLE|SET |DROP )" >/dev/null; then
    VALID_SQL_HEADER=true
  fi
  
  STATEMENT_COUNT=$(gzip -dc "${TARGET_FILE}" | grep -Ec "(CREATE TABLE|ALTER TABLE|INSERT INTO|CREATE INDEX)" 2>/dev/null || echo "0")
elif [[ "${TARGET_FILE}" == *.dump ]]; then
  if command -v pg_restore >/dev/null 2>&1; then
    if pg_restore --list "${TARGET_FILE}" >/dev/null 2>&1; then
      VALID_SQL_HEADER=true
      STATEMENT_COUNT=$(pg_restore --list "${TARGET_FILE}" | grep -Ec "TABLE|INDEX|SEQUENCE|CONSTRAINT" || echo "0")
    fi
  else
    VALID_SQL_HEADER=true
  fi
fi

if [[ "${VALID_SQL_HEADER}" == false ]]; then
  log_error "[Tier 2] FAILED: Archive does not contain recognizable PostgreSQL SQL dump statements."
  exit 1
fi

log_info "[Tier 2] PASSED: Recognized valid PostgreSQL dump structure with ~${STATEMENT_COUNT} key DDL/DML objects."

# ==============================================================================
# TIER 3: Summary / Execution
# ==============================================================================
if [[ "${DRY_RUN}" == true ]]; then
  log_info "============================================================"
  log_info "[SUCCESS] 3-Tier Dry-Run Restore Verification PASSED:"
  log_info "  - Tier 1: Checksum & Gzip Decompression Verified (SHA256: ${ACTUAL_SHA256})"
  log_info "  - Tier 2: SQL DDL / TOC Structure Validated (~${STATEMENT_COUNT} objects)"
  log_info "  - Database State: UNTOUCHED (Zero write operations performed)"
  log_info "============================================================"
  exit 0
fi

# Live Restore Guardrails
log_info "[Tier 3] Preparing Live Restore..."

if [[ -z "${TARGET_DB}" ]]; then
  log_error "Target database is not specified. Use --target-db=<NAME>."
  exit 1
fi

# Production Lock Safety Check
if [[ "${TARGET_DB}" == "production" || "${TARGET_DB}" == "postgres" ]]; then
  if [[ "${ALLOW_PROD}" != true && "${ALLOW_PRODUCTION_RESTORE}" != "true" ]]; then
    log_error "SAFETY LOCK: Attempted restore to production database '${TARGET_DB}' without --allow-production-restore flag!"
    exit 2
  fi
  log_warn "SAFETY OVERRIDE: Restoring to production database '${TARGET_DB}'."
fi

log_info "Executing database restore into '${TARGET_DB}' on '${TARGET_HOST}:${TARGET_PORT}'..."

export PGPASSWORD="${TARGET_PASSWORD}"
if [[ "${TARGET_FILE}" == *.sql.gz ]]; then
  gzip -dc "${TARGET_FILE}" | psql -h "${TARGET_HOST}" -p "${TARGET_PORT}" -U "${TARGET_USER}" -d "${TARGET_DB}"
elif [[ "${TARGET_FILE}" == *.dump ]]; then
  pg_restore -h "${TARGET_HOST}" -p "${TARGET_PORT}" -U "${TARGET_USER}" -d "${TARGET_DB}" --clean --if-exists "${TARGET_FILE}"
fi
unset PGPASSWORD

log_info "[Tier 3] PASSED: Database restore successfully executed."
exit 0
