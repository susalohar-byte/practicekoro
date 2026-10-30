#!/usr/bin/env bash
# ============================================================================
# Print the Postgres connection string for the production Supabase project.
#
# Resolution order:
#   1. SUPABASE_DB_PASSWORD (just the database password, as typed in Supabase).
#      The session-pooler URL is built here and the password is percent-encoded,
#      so characters such as @ : / # in it are safe.
#      Overrides: SUPABASE_PROJECT_REF (default wzcmhowowoyeldfqzkeh),
#                 SUPABASE_DB_REGION   (default ap-southeast-1).
#   2. SUPABASE_DB_URL or DATABASE_URL (a full URI, used as given; a
#      transaction-pooler port 6543 is switched to the session port 5432).
#
# Prints nothing (exit 0) when none is set, so callers can skip politely.
# ============================================================================
set -euo pipefail

if [ -n "${SUPABASE_DB_PASSWORD:-}" ]; then
  REF="${SUPABASE_PROJECT_REF:-wzcmhowowoyeldfqzkeh}"
  REGION="${SUPABASE_DB_REGION:-ap-southeast-1}"
  ENCODED="$(python3 -c 'import os, urllib.parse; print(urllib.parse.quote(os.environ["SUPABASE_DB_PASSWORD"], safe=""))')"
  printf 'postgresql://postgres.%s:%s@aws-0-%s.pooler.supabase.com:5432/postgres\n' "$REF" "$ENCODED" "$REGION"
elif [ -n "${SUPABASE_DB_URL:-${DATABASE_URL:-}}" ]; then
  URL="${SUPABASE_DB_URL:-${DATABASE_URL:-}}"
  printf '%s\n' "${URL/:6543\//:5432/}"
fi
