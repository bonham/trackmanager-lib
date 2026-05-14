#!/usr/bin/env bash
set -euo pipefail

VERSION=${1:-}
if [[ -z "$VERSION" ]]; then
  echo "Usage: release.sh <version>  (e.g. 0.3.0)"
  exit 1
fi

# Bump root
node -e "
const fs = require('fs');
const p = JSON.parse(fs.readFileSync('package.json'));
p.version = '$VERSION';
fs.writeFileSync('package.json', JSON.stringify(p, null, 2) + '\n');
"

# Bump all workspaces
for pkg in packages/*/package.json; do
  node -e "
const fs = require('fs');
const p = JSON.parse(fs.readFileSync('$pkg'));
p.version = '$VERSION';
fs.writeFileSync('$pkg', JSON.stringify(p, null, 2) + '\n');
"
done

# Update internal cross-dependency: elevation-chart -> elevation-cursor-sync
node -e "
const fs = require('fs');
const p = 'packages/elevation-chart/package.json';
const pkg = JSON.parse(fs.readFileSync(p));
pkg.dependencies['@bonham/elevation-cursor-sync'] = '$VERSION';
fs.writeFileSync(p, JSON.stringify(pkg, null, 2) + '\n');
"
