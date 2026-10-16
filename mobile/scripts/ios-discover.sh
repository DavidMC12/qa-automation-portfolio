#!/usr/bin/env bash
# TEMPORARY. Walks the app to a series of screens and dumps the accessibility
# hierarchy + a screenshot of each, so the iOS flows can be written against what
# Maestro really sees instead of what the storyboards suggest.
set -uo pipefail

MAESTRO="$HOME/.maestro/bin/maestro"
OUT=mobile/artifacts/ios/discovery
mkdir -p "$OUT"

for stage in mobile/flows-ios/_discovery/*.yaml; do
  name=$(basename "$stage" .yaml)
  echo "=== $name"
  "$MAESTRO" --device "$IOS_UDID" test "$stage" > "$OUT/$name.log" 2>&1 \
    && echo "ok" || echo "stage failed (see $name.log)"
  "$MAESTRO" --device "$IOS_UDID" hierarchy > "$OUT/$name.hierarchy.json" 2> "$OUT/$name.hierarchy.err" || true
  xcrun simctl io "$IOS_UDID" screenshot "$OUT/$name.png" > /dev/null 2>&1 || true
done
