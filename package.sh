#!/usr/bin/env bash
set -euo pipefail

VERSION=$(grep '"version"' manifest.json | sed -E 's/.*"([0-9.]+)".*/\1/')
NAME="Stream-v${VERSION}.zip"

rm -f "$NAME"

# Derive the file list from manifest.json itself so the package can never go
# stale: the popup, every content script/css, icons, and web-accessible
# resources. Paths keep their directory prefix, files sit at the zip root.
FILE_LIST=$(jq -r '[
	"manifest.json",
	.action.default_popup,
	(.content_scripts[]?.js[]?),
	(.content_scripts[]?.css[]?),
	(.icons[]?),
	(.web_accessible_resources[]?.resources[]?)
] | map(select(type == "string")) | unique | .[]' manifest.json) || {
	echo "ERROR: failed to parse manifest.json with jq" >&2
	exit 1
}

# Pull in local assets referenced by packaged HTML files (e.g. popup.css and
# popup.js referenced from popup.html). Skip remote URLs and protocol-relative
# ones; only local relative paths are bundled.
EXTRA=""
for html in $(echo "$FILE_LIST" | grep '\.html$' || true); do
	refs=$(grep -oE '(src|href)="[^"]+"' "$html" \
		| sed -E 's/.*="([^"]+)"/\1/' \
		| grep -Ev '^(https?:)?//' || true)
	EXTRA="${EXTRA}${refs}"$'\n'
done

ALL_FILES=$(printf '%s\n%s' "$FILE_LIST" "$EXTRA" | sed '/^$/d' | sort -u)
mapfile -t FILES <<< "$ALL_FILES"

# Pack exactly the referenced files, nothing else.
zip -q "$NAME" "${FILES[@]}"

# Verify every referenced file actually made it into the zip before releasing.
MISSING=0
for f in "${FILES[@]}"; do
	if ! unzip -l "$NAME" "$f" > /dev/null 2>&1; then
		echo "ERROR: $f is referenced by manifest.json but missing from $NAME" >&2
		MISSING=1
	fi
done
if [ "$MISSING" -ne 0 ]; then
	rm -f "$NAME"
	exit 1
fi

echo "Packaged: $NAME ($(du -h "$NAME" | cut -f1)) with ${#FILES[@]} files:"
echo "$ALL_FILES" | sed 's/^/  /'
