#!/usr/bin/env bash
set -euo pipefail

# Ensure signed Node 22 binary is available if invoked from a minimal shell
if [ -d "/Users/aqel/.nvm/versions/node/v22.12.0/bin" ]; then
  export PATH="/Users/aqel/.nvm/versions/node/v22.12.0/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"
fi

TAG="${1:-}"
MESSAGE="${2:-}"

if [ -z "$TAG" ]; then
  echo "Usage: ./scripts/release.sh <vX.Y.Z-label> [\"commit message\"]"
  exit 1
fi

case "$TAG" in
  v*) ;;
  *)
    echo "Error: Release tag must start with 'v' (for example: v0.1.0-memory-match)."
    exit 1
    ;;
esac

if [ -z "$MESSAGE" ]; then
  MESSAGE="release: $TAG"
fi

echo "==> Running type-check and production build..."
npm run build

echo "==> Staging changes..."
git add -A

if ! git diff --cached --quiet; then
  echo "==> Creating commit: $MESSAGE"
  git commit -m "$MESSAGE"
else
  echo "==> Working tree clean; tagging current HEAD."
fi

if git rev-parse "$TAG" >/dev/null 2>&1; then
  echo "Error: Tag '$TAG' already exists locally. Pick a new tag version."
  exit 1
fi

echo "==> Creating annotated tag $TAG..."
git tag -a "$TAG" -m "$MESSAGE"

echo "==> Pushing main and tags to origin..."
git push origin main --follow-tags

echo "==> Release $TAG pushed successfully!"
