#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Get version from version-bump.js, CLI arg, or package.json
let version;
try {
  version = require('./version-bump').newVersion;
} catch {
  version = process.argv[2] || JSON.parse(fs.readFileSync('./package.json', 'utf8')).version;
}

if (!version || !/^\d+\.\d+\.\d+$/.test(version)) {
  console.error(`Error: Invalid version format: ${version}`);
  process.exit(1);
}

const today = new Date().toISOString().slice(0, 10);
let changelog = fs.readFileSync(path.resolve('./CHANGELOG.md'), 'utf8');

// Prevent duplicate version entries
if (changelog.includes(`## [${version}]`)) {
  console.error(`Error: Version ${version} already exists in CHANGELOG.md`);
  process.exit(1);
}

// Extract and sort previous versions
const linkRegex = /\[([\d.]+)\]: (.*?)(?=\n|$)/g;
const versions = [];
let match;
while ((match = linkRegex.exec(changelog)) !== null) {
  versions.push(match[1]);
}

const sortVersions = (a, b) => {
  const partsA = a.split('.').map(Number);
  const partsB = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if (partsA[i] !== partsB[i]) return partsB[i] - partsA[i];
  }
  return 0;
};

versions.sort(sortVersions);
const previousVersion = versions[0] || version.replace(/\.\d+$/, '.0');

// Add new version entry
changelog = changelog.replace(
  /# Changelog\n\n/,
  `# Changelog\n\n## [${version}] - ${today}\n\n### Added\n\n- \n\n### Changed\n\n- \n\n### Fixed\n\n- \n\n`
);

// Handle version links
const newLink = `[${version}]: https://github.com/BTRSupply/btr-swap/compare/v${previousVersion}...v${version}`;
const separatorIndex = changelog.indexOf('\n---\n');

if (separatorIndex !== -1) {
  const beforeSeparator = changelog.substring(0, separatorIndex);
  const afterSeparator = changelog.substring(separatorIndex);

  // Extract and deduplicate links
  const links = [];
  linkRegex.lastIndex = 0;

  while ((match = linkRegex.exec(beforeSeparator)) !== null) {
    if (!links.some(link => link.version === match[1])) {
      links.push({
        version: match[1],
        text: match[0]
      });
    }
  }

  // Add new link if not a duplicate
  if (!links.some(link => link.version === version)) {
    links.push({
      version,
      text: newLink
    });
  }

  // Sort links by version
  links.sort((a, b) => sortVersions(a.version, b.version));

  // Combine everything
  const contentWithoutLinks = beforeSeparator.replace(/\[[\d.]+\]: .*(\n|$)/g, '');
  const formattedLinks = links.map(link => link.text).join('\n');
  changelog = contentWithoutLinks.trim() + '\n\n' + formattedLinks + '\n' + afterSeparator;
} else {
  changelog += '\n' + newLink;
}

fs.writeFileSync('CHANGELOG.md', changelog);
console.log(`✅ CHANGELOG.md updated for v${version}`);
