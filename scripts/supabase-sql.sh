#!/usr/bin/env bash
# ============================================================================
# PracticeKoro — run SQL against a Supabase Postgres database.
#
# Usage (CI or local):
#   SUPABASE_DB_PASSWORD=... scripts/supabase-sql.sh -f supabase/tests/rls_security.sql
#
# Resolution order for the connection string:
#   1. DATABASE_URL env var (used verbatim)
#   2. scripts/db-url.sh: SUPABASE_DB_PASSWORD (session pooler, password
#      percent-encoded) or SUPABASE_DB_URL
#
# Requires: psql (libpq). Installs nothing.
# ============================================================================
set -euo pipefail

if ! command -v psql >/dev/null 2>&1; then
  for candidate in /opt/homebrew/opt/libpq/bin /usr/local/opt/libpq/bin; do
    if [ -x "$candidate/psql" ]; then PATH="$candidate:$PATH"; break; fi
  done
fi
command -v psql >/dev/null 2>&1 || { echo "error: psql not found (brew install libpq)" >&2; exit 2; }

if [ -n "${DATABASE_URL:-}" ]; then
  CONN="$DATABASE_URL"
else
  CONN="$("$(dirname "$0")/db-url.sh")"
  if [ -z "$CONN" ]; then
    echo "error: set DATABASE_URL, SUPABASE_DB_PASSWORD or SUPABASE_DB_URL" >&2
    exit 2
  fi
fi

exec psql "$CONN" -v ON_ERROR_STOP=1 "$@"
