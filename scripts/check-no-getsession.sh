#!/bin/bash
# P1-18: getSession() regression guard
# Fails the CI build if auth.getSession() is found anywhere in the source code.
# The only acceptable place to use getSession is in components/landing/auth-button.tsx
# However, we updated it to getUser() too, so we do not allow getSession() anywhere.

echo "Checking for getSession() usage..."

# Search for getSession() across .ts and .tsx files, excluding node_modules and this script itself
# We use grep with line numbers and file names.
RESULTS=$(grep -rn "getSession(" --include="*.ts" --include="*.tsx" . | grep -v "node_modules" | grep -v "check-no-getsession.sh" | grep -v "node_modules" | grep -v "vitest")

if [ -n "$RESULTS" ]; then
  echo "❌ ERROR: getSession() is banned. Use getUser() instead to validate identities cryptographically."
  echo "Found in the following locations:"
  echo "$RESULTS"
  exit 1
else
  echo "✅ No getSession() usage found."
  exit 0
fi
