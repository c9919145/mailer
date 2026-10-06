#!/usr/bin/env bash
# Runs the integration tests against a throwaway SQLite database.
#
# The tests drive the real route handlers through the real Prisma client, so they
# need a real database. This script creates a temp one, runs every test/*.test.ts
# against it, and deletes it afterwards, so it never touches dev.db or prod.
set -euo pipefail

cd "$(dirname "$0")/.."

# GNU mktemp (Linux, incl. CI) requires a template with at least three X's, while
# BSD mktemp (macOS) replaces the X's and appends its own suffix. Rather than branch
# on the platform, give each mktemp a temp directory and build the filename inside it.
TEST_DIR="$(mktemp -d)"
DB_FILE="${TEST_DIR}/mailer-test.db"
export DATABASE_URL="file:${DB_FILE}"

cleanup() { rm -rf "$TEST_DIR"; }
trap cleanup EXIT

echo "==> creating throwaway test database at ${DB_FILE}"
npm run db:push >/dev/null 2>&1 || {
  echo "FAIL: could not create the test database" >&2
  exit 1
}

status=0
for test_file in test/*.test.ts; do
  echo ""
  echo "==> ${test_file}"
  if ! npx tsx "$test_file"; then
    status=1
  fi
done

echo ""
if [ "$status" -eq 0 ]; then
  echo "ALL TESTS PASSED"
else
  echo "SOME TESTS FAILED"
fi
exit "$status"