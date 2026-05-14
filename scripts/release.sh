#!/usr/bin/env bash
set -euo pipefail

VERSION=$1
if [[ -z "${VERSION:-}" ]]; then
  echo "Usage: ./scripts/release.sh <version>  (e.g. 0.2.0)"
  exit 1
fi

# Validate semver format
if ! [[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.]+)?$ ]]; then
  echo "Error: version must be semver (e.g. 1.2.3 or 1.2.3-beta.1)"
  exit 1
fi

# Ensure working tree is clean
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "Error: working tree is not clean — commit or stash changes first"
  exit 1
fi

# Ensure tag doesn't already exist
if git rev-parse "v$VERSION" >/dev/null 2>&1; then
  echo "Error: tag v$VERSION already exists"
  exit 1
fi

echo "Releasing v$VERSION..."

# Bump all workspace package versions
npm version "$VERSION" --workspaces --no-git-tag-version

# Update internal cross-dependency: elevation-chart -> elevation-cursor-sync
npm pkg set "dependencies.@bonham/elevation-cursor-sync=$VERSION" \
  --workspace packages/elevation-chart

# Commit, tag, push
git add packages/*/package.json
git commit -m "chore: release v$VERSION"
git tag "v$VERSION"
git push --follow-tags

echo "Done. Tag v$VERSION pushed — publish workflow will trigger on GitHub."
