#!/usr/bin/env bash
# ============================================================================
# PRACTICEKORO 2.0 — PRODUCTION DATABASE MIGRATION ROLLOUT RUNNER
# ============================================================================
# Applies database migrations to production Supabase via psql (session pooler, IPv4).
#
# Usage:
#   # 1. Apply only pending migrations (018 through 031 - Recommended):
#   SUPABASE_DB_PASSWORD=*** bash scripts/apply-migrations-prod.sh
#
#   # 2. Dry-run (preview which files will run without modifying anything):
#   bash scripts/apply-migrations-prod.sh --dry-run
#
#   # 3. Verify current live schema state:
#   bash scripts/apply-migrations-prod.sh --verify
#
#   # 4. Apply all migrations from 001 through 031 (idempotent-safe):
#   SUPABASE_DB_PASSWORD=*** bash scripts/apply-migrations-prod.sh --all
#
#   # 5. Apply a single migration:
#   SUPABASE_DB_PASSWORD=*** bash scripts/apply-migrations-prod.sh --file supabase/migrations/018_admin_v2_architecture.sql
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# ----------------------------------------------------------------------------
# 1. MIGRATION CATALOG DEFINITIONS
# ----------------------------------------------------------------------------

# All historical migrations in canonical lexicographical order
ALL_MIGRATIONS=(
  "supabase/migrations/001_initial_schema.sql"
  "supabase/migrations/002_rls_policies.sql"
  "supabase/migrations/003_seed_data.sql"
  "supabase/migrations/004_mock_test_engine_rpc.sql"
  "supabase/migrations/005_phase2a_security_hardening.sql"
  "supabase/migrations/006_admin_content_management.sql"
  "supabase/migrations/007_subscription_razorpay.sql"
  "supabase/migrations/008_security_hardening.sql"
  "supabase/migrations/009_test_types_and_associations.sql"
  "supabase/migrations/010_remove_question_difficulty_constraint.sql"
  "supabase/migrations/011_make_subject_exam_id_optional.sql"
  "supabase/migrations/0111_role_source_of_truth.sql"
  "supabase/migrations/013_fix_user_test_access_view.sql"
  "supabase/migrations/014_canonical_question_bank_architecture.sql"
  "supabase/migrations/015_repair_broken_admin_policies.sql"
  "supabase/migrations/0151_upgrade_admin_practicekoro_online.sql"
  "supabase/migrations/016_separate_question_sources.sql"
  "supabase/migrations/017_allow_topic_mock_tests_without_exam.sql"
  "supabase/migrations/018_admin_v2_architecture.sql"
  "supabase/migrations/019_admin_v2_polish.sql"
  "supabase/migrations/020_replace_questions_with_bengali.sql"
  "supabase/migrations/021_upgrade_admin_and_sync_rpc.sql"
  "supabase/migrations/022_add_free_plan.sql"
  "supabase/migrations/024_create_coupons_table.sql"
  "supabase/migrations/025_notifications_scheduling_and_audience.sql"
  "supabase/migrations/026_remove_admin_practicekoro_com.sql"
  "supabase/migrations/027_commerce_student_management.sql"
  "supabase/migrations/0271_question_images_and_exam_categories.sql"
  "supabase/migrations/028_app_settings_upsert_and_maintenance_rls.sql"
  "supabase/migrations/029_admin_roles_and_audit_logs.sql"
  "supabase/migrations/030_sync_test_question_counts_trigger.sql"
  "supabase/migrations/031_admin_payment_gateway_management.sql"
  "supabase/migrations/032_app_settings_grants_and_admin_rpc.sql"
  "supabase/migrations/033_strictly_reset_student_roles_and_fix_admin.sql"
  "supabase/migrations/034_fix_payment_gateway_and_order_creation.sql"
  "supabase/migrations/035_auto_revoke_subscription_on_refund.sql"
  "supabase/migrations/036_test_level_negative_marking.sql"
  "supabase/migrations/038_submit_attempt_covering_indexes.sql"
  "supabase/migrations/039_verify_payment_require_signature.sql"
  "supabase/migrations/040_pyq_question_images_in_rpcs.sql"
)

# Unapplied migrations verified missing from production via schema audit (018 to 033)
PENDING_MIGRATIONS=(
  "supabase/migrations/018_admin_v2_architecture.sql"
  "supabase/migrations/019_admin_v2_polish.sql"
  "supabase/migrations/020_replace_questions_with_bengali.sql"
  "supabase/migrations/021_upgrade_admin_and_sync_rpc.sql"
  "supabase/migrations/022_add_free_plan.sql"
  "supabase/migrations/024_create_coupons_table.sql"
  "supabase/migrations/025_notifications_scheduling_and_audience.sql"
  "supabase/migrations/026_remove_admin_practicekoro_com.sql"
  "supabase/migrations/027_commerce_student_management.sql"
  "supabase/migrations/0271_question_images_and_exam_categories.sql"
  "supabase/migrations/028_app_settings_upsert_and_maintenance_rls.sql"
  "supabase/migrations/029_admin_roles_and_audit_logs.sql"
  "supabase/migrations/030_sync_test_question_counts_trigger.sql"
  "supabase/migrations/031_admin_payment_gateway_management.sql"
  "supabase/migrations/032_app_settings_grants_and_admin_rpc.sql"
  "supabase/migrations/033_strictly_reset_student_roles_and_fix_admin.sql"
  "supabase/migrations/034_fix_payment_gateway_and_order_creation.sql"
  "supabase/migrations/035_auto_revoke_subscription_on_refund.sql"
  "supabase/migrations/036_test_level_negative_marking.sql"
  "supabase/migrations/038_submit_attempt_covering_indexes.sql"
  "supabase/migrations/039_verify_payment_require_signature.sql"
  "supabase/migrations/040_pyq_question_images_in_rpcs.sql"
)

# ----------------------------------------------------------------------------
# 2. PARSE COMMAND LINE ARGUMENTS
# ----------------------------------------------------------------------------

MODE="pending"
DRY_RUN=false
SINGLE_FILE=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --verify)
      if [ -f "$SCRIPT_DIR/verify-prod-migrations.py" ]; then
        exec python3 "$SCRIPT_DIR/verify-prod-migrations.py"
      else
        echo "Error: $SCRIPT_DIR/verify-prod-migrations.py not found" >&2
        exit 1
      fi
      ;;
    --all)
      MODE="all"
      shift
      ;;
    --pending)
      MODE="pending"
      shift
      ;;
    --file)
      MODE="single"
      SINGLE_FILE="${2:-}"
      if [ -z "$SINGLE_FILE" ]; then
        echo "Error: --file requires a path argument" >&2
        exit 1
      fi
      shift 2
      ;;
    *)
      echo "Unknown argument: $1" >&2
      echo "Usage: $0 [--dry-run] [--verify] [--pending] [--all] [--file <path>]" >&2
      exit 1
      ;;
  esac
done

# Select target files
if [ "$MODE" = "single" ]; then
  FILES=("$SINGLE_FILE")
elif [ "$MODE" = "all" ]; then
  FILES=("${ALL_MIGRATIONS[@]}")
else
  FILES=("${PENDING_MIGRATIONS[@]}")
fi

# ----------------------------------------------------------------------------
# 3. DRY-RUN MODE
# ----------------------------------------------------------------------------

if [ "$DRY_RUN" = true ]; then
  echo "============================================================================"
  echo "  PRACTICEKORO 2.0 — MIGRATION DRY-RUN PREVIEW"
  echo "  Mode: $MODE (${#FILES[@]} migrations)"
  echo "============================================================================"
  echo
  idx=1
  for f in "${FILES[@]}"; do
    if [ -f "$ROOT_DIR/$f" ]; then
      lines=$(wc -l < "$ROOT_DIR/$f" | tr -d ' ')
      bytes=$(wc -c < "$ROOT_DIR/$f" | tr -d ' ')
      printf "  [%02d] %-60s (%5s lines, %6s bytes)\n" "$idx" "$f" "$lines" "$bytes"
    else
      printf "  [%02d] %-60s (FILE NOT FOUND!)\n" "$idx" "$f"
    fi
    idx=$((idx + 1))
  done
  echo
  echo "No changes executed (--dry-run specified)."
  exit 0
fi

# ----------------------------------------------------------------------------
# 4. RESOLVE DATABASE CONNECTION & PSQL BINARY
# ----------------------------------------------------------------------------

# Search for psql binary
PSQL=""
for candidate in \
  /opt/homebrew/opt/libpq/bin/psql \
  /usr/local/opt/libpq/bin/psql \
  /usr/bin/psql \
  "$(command -v psql 2>/dev/null || true)"
do
  if [ -n "$candidate" ] && [ -x "$candidate" ]; then
    PSQL="$candidate"
    break
  fi
done

if [ -z "$PSQL" ]; then
  echo "Error: psql client binary not found. Install via: brew install libpq" >&2
  exit 2
fi

# Detect project ref from .env if not already set
if [ -z "${SUPABASE_PROJECT_REF:-}" ] && [ -f "$ROOT_DIR/.env" ]; then
  DETECTED_REF=$(grep -E '^VITE_SUPABASE_URL=' "$ROOT_DIR/.env" | sed -E 's/.*https:\/\/([^.]+)\.supabase\.co.*/\1/' || true)
  if [ -n "$DETECTED_REF" ]; then
    SUPABASE_PROJECT_REF="$DETECTED_REF"
  fi
fi

SUPABASE_PROJECT_REF="${SUPABASE_PROJECT_REF:-prycanbnxuihxhskallw}"
REGION="${SUPABASE_DB_REGION:-ap-south-1}"

if [ -z "${DATABASE_URL:-}" ]; then
  if [ -z "${SUPABASE_DB_PASSWORD:-}" ]; then
    echo "============================================================================"
    echo "  PRACTICEKORO — PRODUCTION CREDENTIAL REQUIRED"
    echo "============================================================================"
    echo "Error: SUPABASE_DB_PASSWORD is not set."
    echo
    echo "Get the database password from:"
    echo "  Supabase Dashboard -> Project Settings -> Database -> Database password"
    echo
    echo "Run:"
    echo "  SUPABASE_DB_PASSWORD=\"YOUR_PASSWORD\" bash scripts/apply-migrations-prod.sh"
    echo "============================================================================"
    exit 1
  fi
  # Clean leading and trailing whitespace from password
  CLEAN_PASSWORD=$(echo "$SUPABASE_DB_PASSWORD" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')
  export PGPASSWORD="$CLEAN_PASSWORD"
  PSQL_CONN_ARGS=(
    -h "aws-0-${REGION}.pooler.supabase.com"
    -p "6543"
    -U "postgres.${SUPABASE_PROJECT_REF}"
    -d "postgres"
  )
else
  PSQL_CONN_ARGS=("$DATABASE_URL")
fi

# ----------------------------------------------------------------------------
# 5. EXECUTE MIGRATIONS IN ORDER
# ----------------------------------------------------------------------------

echo "============================================================================"
echo "  PRACTICEKORO 2.0 — APPLYING PRODUCTION MIGRATIONS"
echo "  Target Project: ${SUPABASE_PROJECT_REF} (Region: ${REGION})"
echo "  Mode:           ${MODE}"
echo "  Count:          ${#FILES[@]} file(s)"
echo "============================================================================"
echo

start_total=$(date +%s)
success_count=0

for f in "${FILES[@]}"; do
  full_path="$ROOT_DIR/$f"
  if [ ! -f "$full_path" ]; then
    echo "ERROR: Migration file missing: $full_path" >&2
    exit 1
  fi

  echo "==> Applying: $f"
  step_start=$(date +%s)
  "$PSQL" "${PSQL_CONN_ARGS[@]}" -v ON_ERROR_STOP=1 -q -f "$full_path"
  step_end=$(date +%s)
  duration=$((step_end - step_start))
  echo "    ✓ Successfully applied in ${duration}s"
  success_count=$((success_count + 1))
  echo
done

end_total=$(date +%s)
total_duration=$((end_total - start_total))

echo "============================================================================"
echo "  ✓ ALL ${success_count} MIGRATION(S) APPLIED SUCCESSFULLY IN ${total_duration}s"
echo "============================================================================"
echo

# ----------------------------------------------------------------------------
# 6. POST-ROLLOUT VERIFICATION PROBE
# ----------------------------------------------------------------------------

if [ -f "$SCRIPT_DIR/verify-prod-migrations.py" ]; then
  echo "Running post-rollout schema verification probe..."
  echo
  python3 "$SCRIPT_DIR/verify-prod-migrations.py" || true
fi
