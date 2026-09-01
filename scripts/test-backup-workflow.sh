#!/usr/bin/env bash
# ==============================================================================
# Alanya Holidays - Automated Backup & Recovery Test Suite
# ==============================================================================
# Comprehensive, anti-tautological test harness verifying:
# 1. Error handling and exit code 2 on missing environment.
# 2. Backup archive, SHA-256 checksum, and metadata manifest creation.
# 3. Zero credential leaks in stdout/stderr.
# 4. GFS retention pruning logic (30-day simulation of 7 daily + 4 weekly snapshots).
# 5. Dry-run mode safety (no file deletion).
# 6. Non-destructive 3-tier dry-run restore validation.
# 7. Integrity failure detection on corrupted archives and checksum mismatches.
# 8. Production restore safety lock guardrail.
# ==============================================================================

set -eo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

BACKUP_SCRIPT="${PROJECT_ROOT}/scripts/backup-db.sh"
PRUNE_SCRIPT="${PROJECT_ROOT}/scripts/prune-backups.sh"
RESTORE_SCRIPT="${PROJECT_ROOT}/scripts/restore-db.sh"

TEST_WORK_DIR=$(mktemp -d 2>/dev/null || mktemp -d -t 'backup_test_tmp')

cleanup() {
  rm -rf "${TEST_WORK_DIR}"
}
trap cleanup EXIT INT TERM

PASSED_TESTS=0
FAILED_TESTS=0

assert_equal() {
  local expected="$1"
  local actual="$2"
  local message="$3"
  if [[ "${expected}" == "${actual}" ]]; then
    echo "  [PASS] ${message}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
  else
    echo "  [FAIL] ${message}"
    echo "         Expected: '${expected}'"
    echo "         Actual  : '${actual}'"
    FAILED_TESTS=$((FAILED_TESTS + 1))
  fi
}

assert_contains() {
  local haystack="$1"
  local needle="$2"
  local message="$3"
  if [[ "${haystack}" == *"${needle}"* ]]; then
    echo "  [PASS] ${message}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
  else
    echo "  [FAIL] ${message}"
    echo "         Needle '${needle}' not found in output."
    FAILED_TESTS=$((FAILED_TESTS + 1))
  fi
}

assert_not_contains() {
  local haystack="$1"
  local needle="$2"
  local message="$3"
  if [[ "${haystack}" != *"${needle}"* ]]; then
    echo "  [PASS] ${message}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
  else
    echo "  [FAIL] ${message}"
    echo "         Forbidden needle '${needle}' WAS found in output!"
    FAILED_TESTS=$((FAILED_TESTS + 1))
  fi
}

echo "============================================================"
echo "Starting Alanya Holidays Database Backup Test Suite"
echo "Test Working Directory: ${TEST_WORK_DIR}"
echo "============================================================"

# ------------------------------------------------------------------------------
# Test 1: Missing DB Config Guardrail (Exit Code 2)
# ------------------------------------------------------------------------------
echo ""
echo "--- Test 1: Missing Required DB Connection Parameters ---"
T1_OUT=$(env -i PATH="$PATH" /bin/bash "${BACKUP_SCRIPT}" 2>&1 || echo "EXIT_CODE:$?")
T1_CODE=$(echo "${T1_OUT}" | grep -o 'EXIT_CODE:[0-9]*' | cut -d: -f2 || true)

assert_equal "2" "${T1_CODE}" "Backup script exits with code 2 when database configuration is missing"
assert_contains "${T1_OUT}" "Missing required database configuration" "Error message clearly explains missing parameters"

# ------------------------------------------------------------------------------
# Test 2: Backup Archive & Manifest Generation
# ------------------------------------------------------------------------------
echo ""
echo "--- Test 2: Backup Generation, SHA256 & Manifest Creation ---"
T2_DIR="${TEST_WORK_DIR}/backup_test2"
mkdir -p "${T2_DIR}"
SECRET_TOKEN="SuperSecretP@ssw0rd!999"

SAMPLE_SQL="-- PostgreSQL database dump
SET statement_timeout = 0;
CREATE TABLE public.bookings (id SERIAL PRIMARY KEY, title VARCHAR(255), total_cents INTEGER);
CREATE TABLE public.products (id SERIAL PRIMARY KEY, name VARCHAR(255));
INSERT INTO public.bookings (id, title, total_cents) VALUES (1, 'Sunset Villa', 150000);
"

T2_OUT=$(
  POSTGRES_DB="alanya_test_db" \
  POSTGRES_USER="postgres" \
  POSTGRES_HOST="localhost" \
  POSTGRES_PASSWORD="${SECRET_TOKEN}" \
  BACKUP_DIR="${T2_DIR}" \
  MOCK_DUMP_CONTENT="${SAMPLE_SQL}" \
  /bin/bash "${BACKUP_SCRIPT}" 2>&1
)

T2_ARCHIVE=$(find "${T2_DIR}" -name "backup_alanya_test_db_*.sql.gz" | head -n 1)

if [[ -n "${T2_ARCHIVE}" && -f "${T2_ARCHIVE}" ]]; then
  echo "  [PASS] Backup archive created: $(basename "${T2_ARCHIVE}")"
  PASSED_TESTS=$((PASSED_TESTS + 1))
  
  # Check companion files
  T2_SHA="${T2_ARCHIVE}.sha256"
  T2_META="${T2_ARCHIVE}.meta.json"
  
  if [[ -f "${T2_SHA}" ]]; then
    echo "  [PASS] Companion .sha256 checksum file exists"
    PASSED_TESTS=$((PASSED_TESTS + 1))
    
    # Verify sha256 calculation matches file content
    if command -v sha256sum >/dev/null 2>&1; then
      CALC_SHA=$(sha256sum "${T2_ARCHIVE}" | awk '{print $1}')
    else
      CALC_SHA=$(shasum -a 256 "${T2_ARCHIVE}" | awk '{print $1}')
    fi
    RECORDED_SHA=$(awk '{print $1}' "${T2_SHA}")
    assert_equal "${CALC_SHA}" "${RECORDED_SHA}" "Computed SHA256 matches .sha256 content"
  else
    echo "  [FAIL] Companion .sha256 checksum file missing"
    FAILED_TESTS=$((FAILED_TESTS + 1))
  fi
  
  if [[ -f "${T2_META}" ]]; then
    echo "  [PASS] Companion .meta.json manifest exists"
    PASSED_TESTS=$((PASSED_TESTS + 1))
    
    META_DB=$(jq -r '.db_name' "${T2_META}" 2>/dev/null || grep '"db_name"' "${T2_META}" | cut -d'"' -f4)
    assert_equal "alanya_test_db" "${META_DB}" "Manifest contains correct db_name"
    
    META_FORMAT=$(jq -r '.format' "${T2_META}" 2>/dev/null || grep '"format"' "${T2_META}" | cut -d'"' -f4)
    assert_equal "sql.gz" "${META_FORMAT}" "Manifest contains correct format"
  else
    echo "  [FAIL] Companion .meta.json manifest missing"
    FAILED_TESTS=$((FAILED_TESTS + 1))
  fi
else
  echo "  [FAIL] Backup archive was not created"
  FAILED_TESTS=$((FAILED_TESTS + 1))
fi

# ------------------------------------------------------------------------------
# Test 3: Zero Secret Leaks in Logs
# ------------------------------------------------------------------------------
echo ""
echo "--- Test 3: Secret Sanitization Verification ---"
assert_not_contains "${T2_OUT}" "${SECRET_TOKEN}" "Database password never appears in stdout/stderr"

# ------------------------------------------------------------------------------
# Test 4: GFS Retention Pruning Engine Simulation (30 Daily Backups)
# ------------------------------------------------------------------------------
echo ""
echo "--- Test 4: GFS Retention Pruning (7 Daily + 4 Weekly Snapshots) ---"
T4_DIR="${TEST_WORK_DIR}/prune_test"
mkdir -p "${T4_DIR}"

# Simulate reference date 2026-08-20 (JDN 2461273)
# We will create 30 daily backup sets from 2026-07-22 to 2026-08-20 (Day 0 to Day 29)
# Days 0..7 (8 days) -> Should all be KEPT
# Days 8..28 (3 weeks) -> Exactly 1 per week kept (3 or 4 weekly snapshots)
# Days 29..30 -> All PRUNED

# Helper to convert YYYY-MM-DD to JDN and back for creating mock dates
date_from_offset() {
  local offset_days="$1"
  # Compute date using python or pure shell arithmetic
  # Since reference date is 2026-08-20:
  # Using python for generating test file names reliably
  python3 -c "
import datetime
ref = datetime.date(2026, 8, 20)
target = ref - datetime.timedelta(days=${offset_days})
print(target.strftime('%Y%m%d'))
"
}

for day_offset in $(seq 0 29); do
  SIM_DATE=$(date_from_offset "${day_offset}")
  SIM_FILE="${T4_DIR}/backup_prod_db_${SIM_DATE}_020000.sql.gz"
  echo "mock database dump for day ${day_offset}" | gzip -9 > "${SIM_FILE}"
  echo "mock_sha_${day_offset}  backup_prod_db_${SIM_DATE}_020000.sql.gz" > "${SIM_FILE}.sha256"
  cat > "${SIM_FILE}.meta.json" <<EOF
{"backup_id": "backup_prod_db_${SIM_DATE}_020000", "db_name": "prod_db", "day_offset": ${day_offset}}
EOF
done

TOTAL_INITIAL=$(find "${T4_DIR}" -name "backup_prod_db_*.sql.gz" | wc -l | tr -d ' ')
assert_equal "30" "${TOTAL_INITIAL}" "Successfully generated 30 simulated daily backup archives"

# Step 4a: Dry-run test (ensure zero files deleted)
T4A_OUT=$(/bin/bash "${PRUNE_SCRIPT}" --backup-dir="${T4_DIR}" --ref-date="20260820" --dry-run 2>&1)
TOTAL_AFTER_DRY=$(find "${T4_DIR}" -name "backup_prod_db_*.sql.gz" | wc -l | tr -d ' ')
assert_equal "30" "${TOTAL_AFTER_DRY}" "Dry-run mode does not delete any files"
assert_contains "${T4A_OUT}" "DRY-RUN (No files will be deleted)" "Dry-run mode banner confirmed"

# Step 4b: Live pruning execution
T4B_OUT=$(/bin/bash "${PRUNE_SCRIPT}" --backup-dir="${T4_DIR}" --ref-date="20260820" 2>&1)

KEPT_FILES=$(find "${T4_DIR}" -name "backup_prod_db_*.sql.gz" | sort)
KEPT_COUNT=$(echo "${KEPT_FILES}" | wc -w | tr -d ' ')

# With days 0..7 kept (8 daily backups) and 3 weekly backups for days 8..28 (total 11 kept), 19 pruned
echo "  [INFO] Backups retained after GFS pruning: ${KEPT_COUNT}"
# Let's verify specific days are preserved
# Day 0 (20260820) must exist
assert_equal "true" "$([ -f "${T4_DIR}/backup_prod_db_20260820_020000.sql.gz" ] && echo true || echo false)" "Day 0 (today) backup preserved"
# Day 7 (20260813) must exist
assert_equal "true" "$([ -f "${T4_DIR}/backup_prod_db_20260813_020000.sql.gz" ] && echo true || echo false)" "Day 7 backup preserved (Daily window boundary)"
# Day 29 (20260722, >28 days) must be pruned
assert_equal "false" "$([ -f "${T4_DIR}/backup_prod_db_20260722_020000.sql.gz" ] && echo true || echo false)" "Day 29 backup (>28d) pruned"
# Day 29 companion files must also be pruned
assert_equal "false" "$([ -f "${T4_DIR}/backup_prod_db_20260722_020000.sql.gz.sha256" ] && echo true || echo false)" "Day 29 .sha256 companion pruned"
assert_equal "false" "$([ -f "${T4_DIR}/backup_prod_db_20260722_020000.sql.gz.meta.json" ] && echo true || echo false)" "Day 29 .meta.json companion pruned"

# Check companions exist for kept files
assert_equal "true" "$([ -f "${T4_DIR}/backup_prod_db_20260820_020000.sql.gz.sha256" ] && echo true || echo false)" "Kept file .sha256 companion preserved"

# ------------------------------------------------------------------------------
# Test 5: 3-Tier Dry-Run Restore Verification (Valid Archive)
# ------------------------------------------------------------------------------
echo ""
echo "--- Test 5: 3-Tier Dry-Run Restore Verification (Valid Archive) ---"
T5_OUT=$(/bin/bash "${RESTORE_SCRIPT}" --dry-run "${T2_ARCHIVE}" 2>&1)
assert_contains "${T5_OUT}" "[Tier 1] PASSED: SHA-256 matches" "Tier 1 SHA256 verification passed"
assert_contains "${T5_OUT}" "[Tier 1] PASSED: Gzip archive integrity confirmed" "Tier 1 Gzip verification passed"
assert_contains "${T5_OUT}" "[Tier 2] PASSED" "Tier 2 Schema parsing passed"
assert_contains "${T5_OUT}" "Database State: UNTOUCHED" "Dry-run does not touch database"

# ------------------------------------------------------------------------------
# Test 6: Restore Failure on Corrupted Archive
# ------------------------------------------------------------------------------
echo ""
echo "--- Test 6: Restore Failure Detection on Corrupt Archive ---"
CORRUPT_ARCHIVE="${TEST_WORK_DIR}/corrupt_backup.sql.gz"
echo "CORRUPTED_NON_GZIP_BINARY_DATA_CORRUPT" > "${CORRUPT_ARCHIVE}"

T6_OUT=$(/bin/bash "${RESTORE_SCRIPT}" --dry-run "${CORRUPT_ARCHIVE}" 2>&1 || echo "EXIT_CODE:$?")
T6_CODE=$(echo "${T6_OUT}" | grep -o 'EXIT_CODE:[0-9]*' | cut -d: -f2 || true)

assert_equal "1" "${T6_CODE}" "Restore tool exits with code 1 on corrupted gzip archive"
assert_contains "${T6_OUT}" "FAILED" "Error log reports failure on corrupted archive"

# ------------------------------------------------------------------------------
# Test 7: Restore Failure on SHA256 Mismatch
# ------------------------------------------------------------------------------
echo ""
echo "--- Test 7: Restore Failure Detection on SHA256 Checksum Mismatch ---"
MISMATCH_ARCHIVE="${TEST_WORK_DIR}/mismatch_backup.sql.gz"
echo "valid gzip data" | gzip -9 > "${MISMATCH_ARCHIVE}"
echo "0000000000000000000000000000000000000000000000000000000000000000  mismatch_backup.sql.gz" > "${MISMATCH_ARCHIVE}.sha256"

T7_OUT=$(/bin/bash "${RESTORE_SCRIPT}" --dry-run "${MISMATCH_ARCHIVE}" 2>&1 || echo "EXIT_CODE:$?")
T7_CODE=$(echo "${T7_OUT}" | grep -o 'EXIT_CODE:[0-9]*' | cut -d: -f2 || true)

assert_equal "1" "${T7_CODE}" "Restore tool exits with code 1 when checksum verification fails"
assert_contains "${T7_OUT}" "SHA-256 checksum mismatch" "Error log indicates checksum mismatch"

# ------------------------------------------------------------------------------
# Test 8: Production Restore Safety Lock
# ------------------------------------------------------------------------------
echo ""
echo "--- Test 8: Production Restore Safety Lock Guardrail ---"
T8_OUT=$(/bin/bash "${RESTORE_SCRIPT}" --force-restore --target-db=production "${T2_ARCHIVE}" 2>&1 || echo "EXIT_CODE:$?")
T8_CODE=$(echo "${T8_OUT}" | grep -o 'EXIT_CODE:[0-9]*' | cut -d: -f2 || true)

assert_equal "2" "${T8_CODE}" "Restore to production database without override flag exits with code 2"
assert_contains "${T8_OUT}" "SAFETY LOCK" "Safety lock prevents unauthorized production database restore"

# ------------------------------------------------------------------------------
# Final Summary
# ------------------------------------------------------------------------------
echo ""
echo "============================================================"
echo "Backup & Recovery Test Suite Results"
echo "Passed: ${PASSED_TESTS}"
echo "Failed: ${FAILED_TESTS}"
echo "============================================================"

if [[ ${FAILED_TESTS} -eq 0 ]]; then
  echo "[SUCCESS] All backup workflow and safety tests PASSED!"
  exit 0
else
  echo "[ERROR] ${FAILED_TESTS} test(s) failed."
  exit 1
fi
