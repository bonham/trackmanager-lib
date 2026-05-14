#!/usr/bin/env bash
set -euo pipefail

BUMP=${1:-}
if [[ "$BUMP" != "major" && "$BUMP" != "minor" && "$BUMP" != "patch" ]]; then
  echo "Usage: ./scripts/release.sh major|minor|patch"
  exit 1
fi

# Ensure working tree is clean
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "Error: working tree is not clean — commit or stash changes first"
  exit 1
fi

# Let npm compute the incremented version on root, capture it
NEW=$(npm version "$BUMP" --no-git-tag-version)
VERSION=${NEW#v}  # strip leading 'v' that npm adds

# Ensure tag doesn't already exist
if git rev-parse "v$VERSION" >/dev/null 2>&1; then
  echo "Error: tag v$VERSION already exists"
  exit 1
fi

echo "Releasing v$VERSION..."

# Apply same version to all workspaces
npm version "$VERSION" --workspaces --no-git-tag-version

# Update internal cross-dependency: elevation-chart -> elevation-cursor-sync
node -e "
const fs = require('fs');
const p = 'packages/elevation-chart/package.json';
const pkg = JSON.parse(fs.readFileSync(p));
pkg.dependencies['@bonham/elevation-cursor-sync'] = '$VERSION';
fs.writeFileSync(p, JSON.stringify(pkg, null, 2) + '\n');
"

# Commit, tag, push
git add package.json packages/*/package.json
git commit -m "chore: release v$VERSION"
git tag "v$VERSION"
git push --follow-tags

echo "Done. Tag v$VERSION pushed — publish workflow will trigger on GitHub."
