#!/usr/bin/env bash
# Runs every Android Maestro flow once, recording a video of each while it runs.
#
# The recording is `adb shell screenrecord` wrapped around each flow, not
# `maestro record --local`. The latter replays the flow under xvfb to render a
# video, and on a green run it accounted for ~46 of the job's 51 minutes — the
# seven flows themselves take about 3.5. Wrapping a single execution also means
# the video is of the exact run that produced the verdict.
#
# Extracted into its own script because reactivecircus/android-emulator-runner
# executes each line of its `script:` input as an INDEPENDENT `sh -c` call,
# so multi-line control structures (while/for/done) can't live inline there.
set -uo pipefail

MAESTRO="$HOME/.maestro/bin/maestro"
OUT=mobile/artifacts
mkdir -p "$OUT/report" "$OUT/videos" "$OUT/debug"

# `adb logcat -d` at the end of the run came back holding only the last 17 seconds
# of a 40-minute job — the default ring buffer had rolled over many times over, so
# the dump never covered the failure it was captured for. Grow it and clear it up
# front so the tail dump below spans the whole suite.
adb logcat -G 16M || true
adb logcat -c || true

# `_`-prefixed paths hold reusable subflows (see flows/_shared/), which are only
# meaningful when called with env vars from a real flow.
mapfile -t FLOWS < <(find mobile/flows -name '*.yaml' ! -name 'config.yaml' ! -path '*/_*' | sort)

echo "Running ${#FLOWS[@]} Android flows"

# `maestro test <dir>` does not discover flows nested in subdirectories, so every
# flow file is passed explicitly, one invocation per flow so each can be recorded
# on its own. --debug-output keeps the screenshots and view-hierarchy dumps of
# every failing step, which is the only way to diagnose selector problems from CI
# logs alone.
for flow in "${FLOWS[@]}"; do
  name=$(basename "$flow" .yaml)
  echo "--- $name"

  # screenrecord stops by itself after 180s, which is its hard cap; the longest
  # flow (checkout) takes under two minutes.
  adb shell screenrecord --time-limit 180 "/sdcard/$name.mp4" > /dev/null 2>&1 &
  recorder=$!
  sleep 2 # let the recorder attach before the first frame matters

  "$MAESTRO" test "$flow" \
    --format=JUNIT \
    --output="$OUT/report/$name.xml" \
    --debug-output="$OUT/debug/$name" || true

  # SIGINT is what makes screenrecord finalise the mp4 container. Killing the
  # local `adb shell` would not reach the process running on the device.
  adb shell 'kill -2 $(pidof screenrecord)' > /dev/null 2>&1 || true
  wait "$recorder" 2> /dev/null || true
  adb pull "/sdcard/$name.mp4" "$OUT/videos/$name.mp4" > /dev/null 2>&1 \
    || echo "no video pulled for $name"
  adb shell rm -f "/sdcard/$name.mp4" || true
done

# `--debug-output` has come back empty on this runner more than once, and without
# it a crash-on-launch and a wrong selector produce the same JUnit report. The
# device log tells them apart, and guarantees the debug artifact is never empty.
adb logcat -d > "$OUT/debug/logcat.txt" 2>&1 || true
adb shell dumpsys window displays > "$OUT/debug/displays.txt" 2>&1 || true

# A flow that crashed before Maestro could write its report must not vanish from
# the gallery silently.
reports=$(find "$OUT/report" -name '*.xml' | wc -l)
if [ "$reports" -ne "${#FLOWS[@]}" ]; then
  echo "Expected ${#FLOWS[@]} reports but found $reports" >&2
  exit 1
fi
