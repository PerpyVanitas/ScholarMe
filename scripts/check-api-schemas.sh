#!/bin/bash

echo "Checking API routes for Zod schema validation..."

# Find all route.ts files in app/api
routes=$(find app/api -name "route.ts")
failed=0

for route in $routes; do
  # Check if route reads body, query, or formData
  if grep -qE "req\.json|request\.json|searchParams\.get|formData" "$route"; then
    # Check if it has a safeParse or parse call
    if ! grep -qE "\.safeParse\(|\.parse\(" "$route"; then
      echo "❌ Validation missing in: $route"
      failed=1
    fi
  fi
done

if [ $failed -eq 1 ]; then
  echo "Error: One or more API routes are missing Zod validation."
  exit 1
else
  echo "✅ All required routes have validation."
  exit 0
fi
