#!/usr/bin/env bash
# ============================================================================
# PRACTICEKORO 2.0 — DATA LAYER VERIFICATION (read-only, safe to run anytime)
# ============================================================================
# Verifies production Supabase state for the test-level negative marking
# policy and submit_test_attempt hot paths WITHOUT modifying anything:
#
#   [1] submit_test_attempt contains the 036 test-level policy marker
#   [2] public.tests.negative_marking column exists
#   [3] Covering indexes from 037 exist (rank COUNT(*) hot paths)
#   [4] RLS enabled on exam/scoring tables
#   [5] tests.test_type CHECK allows chapter_mock/full_mock/subject_mock/pyq/topic
#
# Usage:
#   SUPABASE_DB_PASSWORD="YOUR_PASSWORD" bash scripts/verify-data-layer.sh
#   DATABASE_URL="postgresql://..." bash scripts/verify-data-layer.sh
# ============================================================================

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

PSQL_BIN="$(
  for c in \
    /opt/homebrew/opt/libpq/bin/psql \
    /usr/local/opt/libpq/bin/psql \
    /usr/bin/psql \
    "$(command -v psql 2>/dev/null || true)"; do
    if [ -n "$c" ] && [ -x "$c" ]; then echo "$c"; break; fi
  done
)"
if [ -z "$PSQL_BIN" ]; then
  echo "Error: psql client binary not found. Install via: brew install libpq" >&2
  exit 1
fi

if [ -z "${SUPABASE_PROJECT_REF:-}" ] && [ -f "$ROOT_DIR/.env" ]; then
  DETECTED_REF=$(grep -E '^VITE_SUPABASE_URL=' "$ROOT_DIR/.env" | sed -E 's/.*https:\/\/([^.]+)\.supabase\.co.*/\1/' || true)
  if [ -n "$DETECTED_REF" ]; then SUPABASE_PROJECT_REF="$DETECTED_REF"; fi
fi
SUPABASE_PROJECT_REF="${SUPABASE_PROJECT_REF:-wzcmhowowoyeldfqzkeh}"
REGION="${SUPABASE_DB_REGION:-ap-south-1}"

if [ -z "${DATABASE_URL:-}" ]; then
  if [ -z "${SUPABASE_DB_PASSWORD:-}" ]; then
    echo "Error: SUPABASE_DB_PASSWORD is not set." >&2
    echo "Run: SUPABASE_DB_PASSWORD=\"YOUR_PASSWORD\" bash scripts/verify-data-layer.sh" >&2
    exit 1
  fi
  CLEAN_PASSWORD=$(echo "$SUPABASE_DB_PASSWORD" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')
  export PGPASSWORD="$CLEAN_PASSWORD"
  PSQL_CONN_ARGS=(
    -h "aws-0-${REGION}.pooler.supabase.com"
    -p "6543"
    -U "postgres.${SUPABASE_PROJECT_REF}"
    -d "postgres"
  )
else
  # shellcheck disable=SC2206
  PSQL_CONN_ARGS=($DATABASE_URL)
fi

PASS=0
FAIL=0

check() {
  local name="$1"; shift
  local expected="$1"; shift
  local sql="$1"; shift
  local got
  got=$("$PSQL_BIN" "${PSQL_CONN_ARGS[@]}" -X -q -t -A -c "$sql" 2>&1) || got="CONN_ERROR: $got"
  if [ "$got" = "$expected" ]; then
    echo "  [PASS] $name (got: $got)"
    PASS=$((PASS + 1))
  else
    echo "  [FAIL] $name (expected: $expected, got: $got)"
    FAIL=$((FAIL + 1))
  fi
}

echo "============================================================================"
echo "  PRACTICEKORO 2.0 — DATA LAYER VERIFICATION (read-only)"
echo "  Target: ${SUPABASE_PROJECT_REF} (Region: ${REGION})"
echo "============================================================================"

echo " [1] 036 policy marker in submit_test_attempt ..."
check "036 test-level policy applied" "1" \
  "SELECT COUNT(*) FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname='public' AND p.proname='submit_test_attempt' AND pg_get_functiondef(p.oid) LIKE '%TEST-LEVEL NEGATIVE MARKING POLICY%';"

echo " [2] tests.negative_marking column ..."
check "tests.negative_marking exists" "1" \
  "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='tests' AND column_name='negative_marking';"

echo " [3] 037 covering indexes ..."
check "idx_test_results_test_score exists" "1" \
  "SELECT COUNT(*) FROM pg_indexes WHERE schemaname='public' AND tablename='test_results' AND indexname='idx_test_results_test_score';"
check "idx_test_results_attempt exists" "1" \
  "SELECT COUNT(*) FROM pg_indexes WHERE schemaname='public' AND tablename='test_results' AND indexname='idx_test_results_attempt';"

echo " [4] RLS enabled on exam/scoring tables ..."
for t in tests test_questions questions test_attempts attempt_answers test_results mistakes; do
  check "RLS on $t" "true" \
    "SELECT relrowsecurity::text FROM pg_class WHERE relnamespace='public'::regnamespace AND relname='$t';"
done

echo " [5] test_type CHECK allows all five types ..."
check "test_type CHECK complete" "1" \
  "SELECT COUNT(*) FROM pg_constraint WHERE conrelid='public.tests'::regclass AND pg_get_constraintdef(oid) LIKE '%chapter_mock%' AND pg_get_constraintdef(oid) LIKE '%full_mock%' AND pg_get_constraintdef(oid) LIKE '%subject_mock%' AND pg_get_constraintdef(oid) LIKE '%pyq%' AND pg_get_constraintdef(oid) LIKE '%topic%';"

echo "============================================================================"
echo "  Result: ${PASS} passed, ${FAIL} failed"
echo "============================================================================"
[ "$FAIL" -eq 0 ]
