#!/usr/bin/env bash
# Download the static KeeWeb web app into public/keeweb so it is served
# same-origin (session cookies are sent to /api/vault automatically).
# Binaries are intentionally git-ignored; run this on each fresh checkout.
set -euo pipefail

KEEWEB_VERSION="${KEEWEB_VERSION:-v1.18.7}"
DEST="public/keeweb"
TMP_DIR="$(mktemp -d)"
ZIP_URL="https://github.com/keeweb/keeweb/releases/download/${KEEWEB_VERSION}/KeeWeb-${KEEWEB_VERSION#v}.html.zip"

echo "Downloading KeeWeb ${KEEWEB_VERSION} web app..."
curl -fL --retry 3 -o "${TMP_DIR}/keeweb-html.zip" "${ZIP_URL}"

echo "Extracting to ${DEST}/..."
rm -rf "${DEST}"
mkdir -p "${DEST}"
unzip -q "${TMP_DIR}/keeweb-html.zip" -d "${TMP_DIR}/keeweb-html"
# The archive contains a single index.html plus assets; copy everything flat.
cp -R "${TMP_DIR}/keeweb-html/." "${DEST}/"
rm -rf "${TMP_DIR}"

echo "KeeWeb ready at ${DEST}/index.html (open /securecontent to use it)."
