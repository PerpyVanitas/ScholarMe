#!/usr/bin/env bash
# Schema Synchronization Check Script
# Verifies that database migration files are properly documented in docs/schema.md

set -euo pipefail

MIGRATIONS_DIR="supabase/migrations"
SCHEMA_DOC="docs/schema.md"

if [ ! -f "$SCHEMA_DOC" ]; then
  echo "❌ Error: $SCHEMA_DOC does not exist."
  exit 1
fi

echo "🔍 Checking database migration sync..."
MISSING_COUNT=0

for migration in "$MIGRATIONS_DIR"/*.sql; do
  if [ -f "$migration" ]; then
    filename=$(basename "$migration")
    if ! grep -q "$filename" "$SCHEMA_DOC"; then
      echo "⚠️ Migration $filename is missing reference in $SCHEMA_DOC"
      MISSING_COUNT=$((MISSING_COUNT + 1))
    fi
  fi
done

if [ "$MISSING_COUNT" -gt 0 ]; then
  echo "⚠️ Warning: $MISSING_COUNT migration(s) require documentation updates in $SCHEMA_DOC"
else
  echo "✅ All migrations are documented in $SCHEMA_DOC"
fi

exit 0
