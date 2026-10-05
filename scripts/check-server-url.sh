#!/usr/bin/env bash
# Exercises the exact host-extraction + loopback block from
# mailer/.github/workflows/build-android.yml.
#
# Run with the script path as $1:  bash guardtest.sh <path-to-workflow>
# If no path is given it uses a copy in cwd, so the block can be reviewed
# next to the cases it has to satisfy.

WORKFLOW="${1:-.github/workflows/build-android.yml}"
[ -f "$WORKFLOW" ] || { echo "usage: bash guardtest.sh <workflow.yml>"; exit 64; }

# Pull the "Validate server URL" run block straight out of the YAML so the
# test cannot drift from what actually ships.
extract() {
  awk '
    /name: Validate server URL/ { grab = 1 }
    grab && /^        run: \|/ { inrun = 1; next }
    inrun && /^          / { sub(/^          /, ""); print; next }
    inrun { exit }
  ' "$WORKFLOW"
}

extract > .guard-extracted.sh
if ! grep -q "norm_host" .guard-extracted.sh; then
  echo "FAIL: could not extract the guard from $WORKFLOW" >&2
  exit 1
fi

# The guard reads MAILER_SERVER_URL from the environment and copies it into
# `url`, exactly as the step does. Export it so each case runs against the same
# entry point the workflow uses.
check() {
  local url="$1"
  (
    export MAILER_SERVER_URL="$url"
    # shellcheck disable=SC1091
    . ./.guard-extracted.sh
  ) >/dev/null 2>&1
  if [ $? -eq 0 ]; then echo ACCEPTED; else echo REJECTED; fi
}

pass=0
fail=0

expect() {
  local want="$1" url="$2" got
  got="$(check "$url")"
  if [ "$got" = "$want" ]; then
    printf '  ok    %-8s %s\n' "$got" "$url"
    pass=$((pass + 1))
  else
    printf '  FAIL  got=%-8s want=%-8s %s\n' "$got" "$want" "$url"
    fail=$((fail + 1))
  fi
}

echo "must be REJECTED (resolves to the device, APK cannot work):"
expect REJECTED "http://localhost:3000"
expect REJECTED "https://localhost"
expect REJECTED "http://127.0.0.1:8080"
expect REJECTED "https://127.0.0.1"
expect REJECTED "http://0.0.0.0:3000"
expect REJECTED "https://0.0.0.0"
expect REJECTED "http://[::1]:3000"
expect REJECTED "https://[::1]"
expect REJECTED "https://LOCALHOST:3000"
expect REJECTED "https://LocalHost"
expect REJECTED "https://[0:0:0:0:0:0:0:1]"
expect REJECTED "https://[::ffff:127.0.0.1]"
expect REJECTED "https://[::ffff:7f00:1]"
expect REJECTED "http://user:pass@localhost:3000"
expect REJECTED "http://"
expect REJECTED "not-a-url"

echo
echo "must be ACCEPTED (real servers; the old guard wrongly refused some):"
expect ACCEPTED "https://api.example.com"
expect ACCEPTED "https://mailer.example.com"
expect ACCEPTED "http://localhost.example.com"
expect ACCEPTED "http://127.0.0.1.evil.com"
expect ACCEPTED "https://127.0.0.1.evil.com"
expect ACCEPTED "https://my-localhost.dev"
expect ACCEPTED "https://example.com:8443"
expect ACCEPTED "https://user:pass@api.example.com"
expect ACCEPTED "https://example.com/path?q=1"
# "localhost" and "[::1]" here are userinfo, not the host; the host is
# evil.example.com, so these are ordinary public URLs.
expect ACCEPTED "http://localhost@evil.example.com"
expect ACCEPTED "http://[::1]@evil.example.com"

echo
echo "passed=$pass failed=$fail"
[ "$fail" -eq 0 ]