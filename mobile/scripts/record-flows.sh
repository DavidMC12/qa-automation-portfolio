#!/usr/bin/env bash
# Runs every Maestro flow and records a video per flow.
# Extracted into its own script because reactivecircus/android-emulator-runner
# executes each line of its `script:` input as an INDEPENDENT `sh -c` call,
# so multi-line control structures (while/for/done) can't live inline there.
set -uo pipefail

MAESTRO="$HOME/.maestro/bin/maestro"
mkdir -p mobile/artifacts/videos

# `_`-prefixed paths hold reusable subflows (see flows/_shared/), which are only
# meaningful when called with env vars from a real flow.
mapfile -t FLOWS < <(find mobile/flows -name '*.yaml' ! -name 'config.yaml' ! -path '*/_*' | sort)

# `maestro test <dir>` does not discover flows nested in subdirectories, so
# pass every flow file explicitly instead of pointing at the flows/ directory.
# --debug-output keeps the screenshots and view-hierarchy dumps of every failing
# step, which is the only way to diagnose selector problems from CI logs alone.
"$MAESTRO" test "${FLOWS[@]}" \
  --format=JUNIT \
  --output=mobile/artifacts/report.xml \
  --debug-output=mobile/artifacts/debug || true

# The debug artifact came back empty once; list what Maestro actually wrote so a
# failing run tells us where to look instead of silently uploading nothing.
echo "--- debug output tree ---"
ls -R mobile/artifacts/debug 2>/dev/null | head -40 || echo "(no debug output written)"
ls -R "$HOME/.maestro/tests" 2>/dev/null | head -20 || true

for flow in "${FLOWS[@]}"; do
  name=$(basename "$flow" .yaml)
  xvfb-run -a "$MAESTRO" record "$flow" "mobile/artifacts/videos/$name.mp4" --local || true
done
