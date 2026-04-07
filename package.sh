#!/usr/bin/env bash
set -euo pipefail

VERSION=$(grep '"version"' manifest.json | sed -E 's/.*"([0-9.]+)".*/\1/')
NAME="Stream-v${VERSION}.zip"

rm -f "$NAME"

zip -r "$NAME" \
	manifest.json \
	buttons.js \
	chart-renderer.js \
	lib/ \
	icons/ \
	-x "*.DS_Store" "__MACOSX/*" "._*"

echo "Packaged: $NAME ($(du -h "$NAME" | cut -f1))"
