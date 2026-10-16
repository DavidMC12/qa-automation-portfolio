#!/usr/bin/env bash
# Boots an iPhone simulator on the newest installed iOS runtime and installs the
# app under test. Writes the simulator's UDID to $GITHUB_ENV when running in CI.
#
# usage: boot-ios-simulator.sh "<path to My Demo App.app>"
set -euo pipefail

APP_PATH="${1:?path to the simulator .app is required}"

UDID=$(xcrun simctl list devices available -j | python3 -c '
import json, re, sys

PREFERRED = ["iPhone 16", "iPhone 15", "iPhone 16 Pro", "iPhone 15 Pro"]
best = None
for runtime, devices in json.load(sys.stdin)["devices"].items():
    m = re.search(r"iOS-(\d+)-(\d+)", runtime)
    if not m:
        continue
    version = (int(m.group(1)), int(m.group(2)))
    for d in devices:
        if not d["name"].startswith("iPhone"):
            continue
        rank = PREFERRED.index(d["name"]) if d["name"] in PREFERRED else len(PREFERRED)
        key = (version, -rank)
        if best is None or key > best[0]:
            best = (key, d["udid"], d["name"], runtime)
if best is None:
    sys.exit("no available iPhone simulator found")
print(best[1])
print("selected %s on %s" % (best[2], best[3]), file=sys.stderr)
')

echo "Simulator UDID: $UDID"
xcrun simctl boot "$UDID" || true
xcrun simctl bootstatus "$UDID" -b
xcrun simctl install "$UDID" "$APP_PATH"

if [ -n "${GITHUB_ENV:-}" ]; then
  echo "IOS_UDID=$UDID" >> "$GITHUB_ENV"
fi
