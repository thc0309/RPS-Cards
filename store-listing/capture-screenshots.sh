#!/usr/bin/env bash
# Captures the current phone screen as a Google Play phone screenshot.
#   store-listing/capture-screenshots.sh <name> [adb-serial]
# Play requires PNG/JPEG, each side 320–3840 px, and the long side at most 2x the short side.
# A 1080x2340 phone is taller than 2:1, so the status bar strip and the bottom gesture strip are cropped to 1080x2160.
set -euo pipefail
NAME="${1:?usage: capture-screenshots.sh <name> [adb-serial]}"
SERIAL="${2:-}"
OUT="$(cd "$(dirname "$0")" && pwd)/screenshots"
ADB=(adb); [ -n "$SERIAL" ] && ADB=(adb -s "$SERIAL")
RAW="$(mktemp -t playshot).png"
"${ADB[@]}" exec-out screencap -p > "$RAW"
W=$(sips -g pixelWidth "$RAW" | awk '/pixelWidth/{print $2}')
H=$(sips -g pixelHeight "$RAW" | awk '/pixelHeight/{print $2}')
TARGET_H=$(( H > W * 2 ? W * 2 : H ))
TOP=$(( (H - TARGET_H) * 55 / 100 ))   # take a little more from the top (status bar) than from the bottom
ffmpeg -loglevel error -y -i "$RAW" -vf "crop=${W}:${TARGET_H}:0:${TOP}" -pix_fmt rgb24 "$OUT/$NAME.png"
rm -f "$RAW"
echo "$OUT/$NAME.png  ${W}x${TARGET_H}"
