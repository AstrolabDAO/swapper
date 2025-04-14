#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const version = process.argv[2] || (console.error('Error: Version required'), process.exit(1));
const today = new Date().toISOString().slice(0, 10);
let changelog = fs.readFileSync(path.resolve('./CHANGELOG.md'), 'utf8');

// Find the previous version from the links section
const previousVersionMatch = changelog.match(/\[([\d.]+)\]:.*?compare\/v.*?\.\.\.v.*?$/m);
const previousVersion = previousVersionMatch?.[1];

if (!previousVersion) {
  console.error('Error: Could not determine previous version');
  process.exit(1);
}

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
  // Extract and parse existing links
  const beforeSeparator = changelog.substring(0, separatorIndex);
  const afterSeparator = changelog.substring(separatorIndex);

  // Extract all version links
  const linkRegex = /\[([\d.]+)\]: (.*?)(?=\n|$)/g;
  const links = [];
  let match;

  while ((match = linkRegex.exec(beforeSeparator)) !== null) {
    links.push({
      version: match[1],
      url: match[2],
      text: match[0]
    });
  }

  // Add new link
  links.push({
    version: version,
    url: `https://github.com/BTRSupply/btr-swap/compare/v${previousVersion}...v${version}`,
    text: newLink
  });

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

  // Format the sorted links
  const formattedLinks = links.map(link => link.text).join('\n');

  // Combine everything
  changelog = contentWithoutLinks.trim() + '\n\n' + formattedLinks + '\n' + afterSeparator;
} else {
  // If no separator found, add to the end
  changelog += '\n' + newLink;
}

fs.writeFileSync('CHANGELOG.md', changelog);
console.log(`✅ CHANGELOG.md updated for v${version}`);
