#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Try to get the version from version-bump.js if it was just run
let version;
try {
  // This works if update-changelog.js is called right after version-bump.js in the same process
  const versionInfo = require('./version-bump');
  version = versionInfo.newVersion;
  console.log(`Using version ${version} from version-bump.js`);
} catch (error) {
  // Fallback to command line argument or package.json
  version = process.argv[2];

  // If no version was provided via CLI, read from package.json
  if (!version) {
    try {
      const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
      version = packageJson.version;
      console.log(`Using version ${version} from package.json`);
    } catch (err) {
      console.error('Error: Could not determine version. Please provide it as a command line argument.');
      process.exit(1);
    }
  }
}

if (!version || !/^\d+\.\d+\.\d+$/.test(version)) {
  console.error(`Error: Invalid version format: ${version}`);
  process.exit(1);
}

const today = new Date().toISOString().slice(0, 10);
let changelog = fs.readFileSync(path.resolve('./CHANGELOG.md'), 'utf8');

// Check if this version already exists in the changelog
if (changelog.includes(`## [${version}]`)) {
  console.error(`Error: Version ${version} already exists in CHANGELOG.md`);
  process.exit(1);
}

// Find the previous version from the links section
const linkRegex = /\[([\d.]+)\]: (.*?)(?=\n|$)/g;
const versions = [];
let match;

while ((match = linkRegex.exec(changelog)) !== null) {
  versions.push(match[1]);
}

// Sort versions descending using semver-like comparison
versions.sort((a, b) => {
  const versionA = a.split('.').map(Number);
  const versionB = b.split('.').map(Number);

  for (let i = 0; i < Math.max(versionA.length, versionB.length); i++) {
    const numA = versionA[i] || 0;
    const numB = versionB[i] || 0;
    if (numA !== numB) {
      return numB - numA; // Descending order
    }
  }
  return 0;
});

const previousVersion = versions[0] || version.replace(/\.\d+$/, '.0');

// Create a new version entry
const newVersionEntry = `## [${version}] - ${today}\n\n### Added\n\n- \n\n### Changed\n\n- \n\n### Fixed\n\n- \n\n`;

// Insert the new version entry after the title
changelog = changelog.replace(
  /# Changelog\n\n/,
  `# Changelog\n\n${newVersionEntry}`
);

// Create the new version link
const newLink = `[${version}]: https://github.com/BTRSupply/btr-swap/compare/v${previousVersion}...v${version}`;

// Find where to insert the new link - before the comment section
const separatorIndex = changelog.indexOf('\n---\n');
if (separatorIndex !== -1) {
  // Extract content before separator
  const beforeSeparator = changelog.substring(0, separatorIndex);
  const afterSeparator = changelog.substring(separatorIndex);

  // Extract all version links
  const links = [];
  let linkMatch;
  linkRegex.lastIndex = 0; // Reset regex index

  while ((linkMatch = linkRegex.exec(beforeSeparator)) !== null) {
    // Check for duplicates
    if (!links.some(link => link.version === linkMatch[1])) {
      links.push({
        version: linkMatch[1],
        url: linkMatch[2],
        text: linkMatch[0]
      });
    }
  }

  // Add new link if not a duplicate
  if (!links.some(link => link.version === version)) {
    links.push({
      version: version,
      url: `https://github.com/BTRSupply/btr-swap/compare/v${previousVersion}...v${version}`,
      text: newLink
    });
  }

  // Sort links by version in descending order
  links.sort((a, b) => {
    const versionA = a.version.split('.').map(Number);
    const versionB = b.version.split('.').map(Number);

    for (let i = 0; i < Math.max(versionA.length, versionB.length); i++) {
      const numA = versionA[i] || 0;
      const numB = versionB[i] || 0;
      if (numA !== numB) {
        return numB - numA; // Descending order
      }
    }
    return 0;
  });

  // Remove all links from the content
  const contentWithoutLinks = beforeSeparator.replace(/\[[\d.]+\]: .*(\n|$)/g, '');

  // Format the sorted links (removing duplicates)
  const uniqueLinks = Array.from(new Map(links.map(link => [link.version, link])).values());
  const formattedLinks = uniqueLinks.map(link => link.text).join('\n');

  // Combine everything
  changelog = contentWithoutLinks.trim() + '\n\n' + formattedLinks + '\n' + afterSeparator;
} else {
  // If no separator found, add to the end
  changelog += '\n' + newLink;
}

fs.writeFileSync('CHANGELOG.md', changelog);
console.log(`✅ CHANGELOG.md updated for v${version}`);
