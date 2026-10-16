#!/usr/bin/env bash
# Runs every iOS Maestro flow, recording a video of each one while it runs.
#
# Unlike the Android script this is a single pass: `xcrun simctl io recordVideo`
# records the simulator natively, so each flow can be wrapped by its own
# recording and produces its own JUnit file. (Android needs a second pass because
# `maestro record --local` replays the flow under xvfb.) The gallery generator
# merges the per-flow reports back into one table.
#
# Needs IOS_UDID — the booted simulator, set by boot-ios-simulator.sh.
# Written for bash 3.2 (macOS default): no mapfile, no associative arrays.
set -uo pipefail

MAESTRO="$HOME/.maestro/bin/maestro"
OUT=mobile/artifacts/ios
mkdir -p "$OUT/report" "$OUT/videos" "$OUT/debug"

# `_`-prefixed paths hold reusable subflows and discovery stages, which are only
# meaningful when called from a real flow.
FLOWS=()
while IFS= read -r flow; do
  FLOWS+=("$flow")
done < <(find mobile/flows-ios -name '*.yaml' ! -path '*/_*' | sort)

echo "Running ${#FLOWS[@]} iOS flows on simulator $IOS_UDID"

for flow in "${FLOWS[@]}"; do
  name=$(basename "$flow" .yaml)
  echo "--- $name"

  xcrun simctl io "$IOS_UDID" recordVideo --codec=h264 --force "$OUT/videos/$name.mp4" > /dev/null 2>&1 &
  recorder=$!
  sleep 2 # let the recorder attach before the first frame matters

  "$MAESTRO" --device "$IOS_UDID" test "$flow" \
    --format=JUNIT \
    --output="$OUT/report/$name.xml" \
    --debug-output="$OUT/debug/$name" || true

  # SIGINT is what makes simctl finalise the mp4 container; a plain kill leaves
  # an unplayable file.
  kill -INT "$recorder" 2> /dev/null || true
  wait "$recorder" 2> /dev/null || true
done

# A flow that crashed before Maestro could write its report must not vanish from
# the gallery silently.
reports=$(find "$OUT/report" -name '*.xml' | wc -l | tr -d ' ')
if [ "$reports" != "${#FLOWS[@]}" ]; then
  echo "Expected ${#FLOWS[@]} reports but found $reports" >&2
  exit 1
fi
