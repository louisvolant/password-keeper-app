#!/usr/bin/env bash
# Download the static KeeWeb web app into public/keeweb so it is served
# same-origin (session cookies are sent to /api/vault automatically).
# Binaries are intentionally git-ignored; this script runs automatically via
# the `prebuild` npm hook (including CI/production builds) and is a no-op
# when the client is already vendored (set FORCE=1 to re-download).
set -euo pipefail

KEEWEB_VERSION="${KEEWEB_VERSION:-v1.18.7}"
DEST="public/keeweb"

if [ -f "${DEST}/index.html" ] && [ "${FORCE:-0}" != "1" ]; then
  echo "KeeWeb already vendored at ${DEST}/ (set FORCE=1 to re-download)."
  exit 0
fi

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "${TMP_DIR}"' EXIT
ZIP_URL="https://github.com/keeweb/keeweb/releases/download/${KEEWEB_VERSION}/KeeWeb-${KEEWEB_VERSION#v}.html.zip"

echo "Downloading KeeWeb ${KEEWEB_VERSION} web app..."
curl -fL --retry 3 -o "${TMP_DIR}/keeweb-html.zip" "${ZIP_URL}"

echo "Extracting to ${DEST}/..."
rm -rf "${DEST}"
mkdir -p "${DEST}"
if command -v unzip >/dev/null 2>&1; then
  unzip -q "${TMP_DIR}/keeweb-html.zip" -d "${TMP_DIR}/keeweb-html"
else
  # Minimal build images may lack unzip; python3 is a reliable fallback.
  python3 -c "import zipfile; zipfile.ZipFile('${TMP_DIR}/keeweb-html.zip').extractall('${TMP_DIR}/keeweb-html')"
fi
# The archive contains a single index.html plus assets; copy everything flat.
cp -R "${TMP_DIR}/keeweb-html/." "${DEST}/"

echo "KeeWeb ready at ${DEST}/index.html (open /securecontent to use it)."
