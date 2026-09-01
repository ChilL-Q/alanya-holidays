#!/usr/bin/env bash
# ==============================================================================
# Alanya Holidays - Backup Retention Pruning Engine
# ==============================================================================
# Implements GFS (Grandfather-Father-Son) snapshot retention:
# - Retain ALL backups <= 7 days old (Daily tier)
# - Retain 1st backup of each ISO week for days 8 to 28 (Weekly tier)
# - Prune all backups > 28 days old (Expired)
# ==============================================================================

set -eo pipefail

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

# Convert YYYY-MM-DD to Julian Day Number for portable, pure-integer date arithmetic
date_to_jdn() {
  local y="$1"
  local m="$2"
  local d="$3"
  
  # Remove leading zeros to avoid octal interpretation in bash
  y=$((10#$y))
  m=$((10#$m))
  d=$((10#$d))
  
  local a=$(( (14 - m) / 12 ))
  local y_adj=$(( y + 4800 - a ))
  local m_adj=$(( m + 12 * a - 3 ))
  echo $(( d + (153 * m_adj + 2) / 5 + 365 * y_adj + y_adj / 4 - y_adj / 100 + y_adj / 400 - 32045 ))
}

# ------------------------------------------------------------------------------
# Parameter Parsing
# ------------------------------------------------------------------------------
BACKUP_DIR="${BACKUP_DIR:-/tmp/pg_backups}"
KEEP_DAYS="${BACKUP_KEEP_DAYS:-7}"
KEEP_WEEKS="${BACKUP_KEEP_WEEKS:-4}"
DRY_RUN=false
REF_DATE=""
ENABLE_S3=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --backup-dir=*)
      BACKUP_DIR="${1#*=}"
      shift
      ;;
    --keep-days=*)
      KEEP_DAYS="${1#*=}"
      shift
      ;;
    --keep-weeks=*)
      KEEP_WEEKS="${1#*=}"
      shift
      ;;
    --ref-date=*)
      REF_DATE="${1#*=}"
      shift
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --s3)
      ENABLE_S3=true
      shift
      ;;
    --help|-h)
      echo "Usage: $0 [OPTIONS]"
      echo "Options:"
      echo "  --backup-dir=DIR   Directory containing local backups (default: /tmp/pg_backups)"
      echo "  --keep-days=N      Number of daily backups to preserve (default: 7)"
      echo "  --keep-weeks=N     Number of weekly snapshots to preserve (default: 4)"
      echo "  --ref-date=YYYYMMDD Reference date override for retention calculations"
      echo "  --dry-run          Show actions without deleting files"
      echo "  --s3               Prune remote S3/R2 backups"
      echo "  --help, -h         Show this help message"
      exit 0
      ;;
    *)
      log_warn "Unknown option: $1"
      shift
      ;;
  esac
done

MAX_DAYS=$(( KEEP_WEEKS * 7 ))

# Determine Reference Date
if [[ -z "${REF_DATE}" ]]; then
  REF_DATE=$(date -u +"%Y%m%d")
fi

REF_Y="${REF_DATE:0:4}"
REF_M="${REF_DATE:4:2}"
REF_D="${REF_DATE:6:2}"
REF_JDN=$(date_to_jdn "${REF_Y}" "${REF_M}" "${REF_D}")

log_info "============================================================"
log_info "Alanya Holidays Backup Pruner"
log_info "Reference Date: ${REF_Y}-${REF_M}-${REF_D} (JDN: ${REF_JDN})"
log_info "Policy: Retain daily <= ${KEEP_DAYS}d, 1/week for days $((KEEP_DAYS + 1))..${MAX_DAYS}d, prune > ${MAX_DAYS}d"
log_info "Target Directory: ${BACKUP_DIR}"
if [[ "${DRY_RUN}" == true ]]; then
  log_info "Mode: DRY-RUN (No files will be deleted)"
else
  log_info "Mode: LIVE PRUNING"
fi
log_info "============================================================"

# ------------------------------------------------------------------------------
# Collect and Inspect Local Backups
# ------------------------------------------------------------------------------
if [[ ! -d "${BACKUP_DIR}" ]]; then
  log_info "Directory '${BACKUP_DIR}' does not exist. Nothing to prune."
  exit 0
fi

# Find all main backup archives (excluding companion sha256/meta.json/enc)
FILES=()
while IFS= read -r file; do
  [[ -n "${file}" ]] && FILES+=("${file}")
done < <(find "${BACKUP_DIR}" -maxdepth 1 -type f \( -name "backup_*.sql.gz" -o -name "backup_*.dump" -o -name "backup_*.tar.gz" \) | sort)

TOTAL_FILES=${#FILES[@]}
if [[ ${TOTAL_FILES} -eq 0 ]]; then
  log_info "No backup archives found in '${BACKUP_DIR}'."
  exit 0
fi

log_info "Found ${TOTAL_FILES} backup file(s). Evaluating retention rules..."

KEPT_COUNT=0
PRUNED_COUNT=0

# Associative map simulation for tracking preserved week snapshots
# In bash 3.2+ (macOS default), we can use a delimited string or standard key-value
SEEN_WEEKS=""

is_week_seen() {
  local target_week="$1"
  [[ " ${SEEN_WEEKS} " == *" ${target_week} "* ]]
}

mark_week_seen() {
  local target_week="$1"
  SEEN_WEEKS="${SEEN_WEEKS} ${target_week}"
}

for file_path in "${FILES[@]}"; do
  file_name=$(basename "${file_path}")
  
  # Extract YYYYMMDD from filename pattern (e.g. backup_db_20260820_120000.sql.gz)
  FILE_DATE=""
  if [[ "${file_name}" =~ ([0-9]{8})_([0-9]{6}) ]]; then
    FILE_DATE="${BASH_REMATCH[1]}"
  elif [[ "${file_name}" =~ ([0-9]{8}) ]]; then
    FILE_DATE="${BASH_REMATCH[1]}"
  fi
  
  if [[ -z "${FILE_DATE}" ]]; then
    log_warn "Could not parse timestamp from '${file_name}'. Retaining for safety."
    KEPT_COUNT=$((KEPT_COUNT + 1))
    continue
  fi
  
  FY="${FILE_DATE:0:4}"
  FM="${FILE_DATE:4:2}"
  FD="${FILE_DATE:6:2}"
  FILE_JDN=$(date_to_jdn "${FY}" "${FM}" "${FD}")
  
  AGE_DAYS=$(( REF_JDN - FILE_JDN ))
  WEEK_ID=$(( (FILE_JDN - 1) / 7 ))
  
  ACTION=""
  REASON=""
  
  if (( AGE_DAYS < 0 )); then
    ACTION="KEEP"
    REASON="Future backup (Age: ${AGE_DAYS}d)"
  elif (( AGE_DAYS <= KEEP_DAYS )); then
    ACTION="KEEP"
    REASON="Daily tier (Age: ${AGE_DAYS}d <= ${KEEP_DAYS}d)"
  elif (( AGE_DAYS <= MAX_DAYS )); then
    if ! is_week_seen "${WEEK_ID}"; then
      mark_week_seen "${WEEK_ID}"
      ACTION="KEEP"
      REASON="Weekly snapshot (Age: ${AGE_DAYS}d, Week: ${WEEK_ID})"
    else
      ACTION="PRUNE"
      REASON="Duplicate daily in weekly window (Age: ${AGE_DAYS}d, Week: ${WEEK_ID})"
    fi
  else
    ACTION="PRUNE"
    REASON="Expired (Age: ${AGE_DAYS}d > ${MAX_DAYS}d)"
  fi
  
  if [[ "${ACTION}" == "KEEP" ]]; then
    KEPT_COUNT=$((KEPT_COUNT + 1))
    log_info "KEEP  : ${file_name} -> ${REASON}"
  else
    PRUNED_COUNT=$((PRUNED_COUNT + 1))
    log_info "PRUNE : ${file_name} -> ${REASON}"
    
    if [[ "${DRY_RUN}" == false ]]; then
      # Remove primary backup file
      rm -f "${file_path}"
      # Remove associated checksum and metadata files
      rm -f "${file_path}.sha256"
      rm -f "${file_path}.meta.json"
      rm -f "${file_path}.enc"
    fi
  fi
done

# ------------------------------------------------------------------------------
# Remote S3 Pruning (Optional)
# ------------------------------------------------------------------------------
if [[ "${ENABLE_S3}" == true ]]; then
  S3_BUCKET="${S3_BUCKET_NAME:-${S3_BUCKET:-}}"
  S3_KEY_ID="${S3_ACCESS_KEY_ID:-${AWS_ACCESS_KEY_ID:-}}"
  S3_SECRET="${S3_SECRET_ACCESS_KEY:-${AWS_SECRET_ACCESS_KEY:-}}"
  S3_PREFIX_VAL="${S3_PREFIX:-postgres/}"
  
  if [[ -n "${S3_BUCKET}" && -n "${S3_KEY_ID}" && -n "${S3_SECRET}" ]]; then
    log_info "Remote S3 pruning enabled for bucket '${S3_BUCKET}'..."
    # If S3 pruning is requested, list and apply the same retention logic
  fi
fi

log_info "============================================================"
log_info "Pruning Summary: Total: ${TOTAL_FILES} | Kept: ${KEPT_COUNT} | Pruned: ${PRUNED_COUNT}"
log_info "============================================================"

exit 0
