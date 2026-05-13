#!/bin/bash
# This script uploads the build artifacts to the CDN after the npm publish command.

set -e

# Read version from package.json (strip quotes)
VERSION=$(jq -r .version package.json)

# Your bucket name
BUCKET_NAME="cdn.addtowallet.io"

# Build directory (local)
BUILD_DIR="./build"

# Destination in bucket
DESTINATION="gs://${BUCKET_NAME}/js/webview/v${VERSION}/"

echo "Uploading build artifacts to $DESTINATION ..."

# Upload the entire build dir recursively
gcloud storage cp --recursive ${BUILD_DIR}/* ${DESTINATION}

echo "Upload complete."
