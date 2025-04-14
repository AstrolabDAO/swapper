#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const version = process.argv[2] || (console.error('Error: Version required'), process.exit(1));
const today = new Date().toISOString().slice(0, 10);
let changelog = fs.readFileSync(path.resolve('./CHANGELOG.md'), 'utf8');

// Check for Unreleased content
const unreleasedMatch = changelog.match(/## \[Unreleased\]\n\n(.*?)(?=\n## \[|$)/s);
if (!unreleasedMatch?.[1]?.trim()) console.warn('Warning: Empty Unreleased section');

// Update release sections
changelog = changelog
  .replace(
    /## \[Unreleased\]\n\n.*?(\n## \[|$)/s,
    `## [Unreleased]\n\n### Added\n- TBA\n\n### Changed\n- TBA\n\n### Fixed\n- TBA\n\n## [${version}] - ${today}\n\n$1`
  )
  .replace(
    /(\[Unreleased\]:.*?compare\/)v[\d.]+/,
    `$1v${version}`
  )
  .replace(
    /(\[Unreleased\]:.*)/,
    `$1\n[${version}]: https://github.com/BTRSupply/btr-swap/compare/v${changelog.match(/compare\/v([\d.]+)\.\.\.HEAD/)[1]}...v${version}`
  );

fs.writeFileSync('CHANGELOG.md', changelog);
console.log(`✅ CHANGELOG.md updated for v${version}`);
