#!/usr/bin/env node
const fs = require("fs"),
  path = require("path");

// Parse command line arguments
const bumpType = process.argv[2] || "minor";

// Validate bump type
if (!["major", "minor", "patch"].includes(bumpType)) {
  console.error("Error: Invalid bump type. Must be one of: major, minor, patch");
  process.exit(1);
}

// Read the root package.json
const rootPkgPath = "./package.json";
if (!fs.existsSync(rootPkgPath)) {
  console.error("Error: Could not find package.json");
  process.exit(1);
}

const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, "utf8"));
if (!rootPkg.version || !/^\d+\.\d+\.\d+$/.test(rootPkg.version)) {
  console.error(`Error: Invalid version format in package.json: ${rootPkg.version}`);
  process.exit(1);
}

// Calculate new version
let [major, minor, patch] = rootPkg.version.split(".").map(Number);

if (bumpType === "major") [major, minor, patch] = [++major, 0, 0];
else if (bumpType === "minor") [minor, patch] = [++minor, 0];
else patch++;

const newVersion = `${major}.${minor}.${patch}`;
const oldVersion = rootPkg.version;

// Don't proceed if the version isn't actually changing
if (newVersion === oldVersion) {
  console.error(`Error: New version ${newVersion} is the same as current version ${oldVersion}`);
  process.exit(1);
}

// Update the root package.json
rootPkg.version = newVersion;
fs.writeFileSync(rootPkgPath, JSON.stringify(rootPkg, null, 2) + "\n");

// Helper function to update a package
const updatePackage = (pkgPath, isCLI = false) => {
  if (!fs.existsSync(pkgPath)) {
    console.error(`Warning: Package file not found: ${pkgPath}`);
    return false;
  }

  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    pkg.version = newVersion;

    if (isCLI && pkg.dependencies && pkg.dependencies["@btr-supply/swap"]) {
      pkg.dependencies["@btr-supply/swap"] = newVersion;
    }

    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
    return true;
  } catch (error) {
    console.error(`Error updating ${pkgPath}: ${error.message}`);
    return false;
  }
};

// Update package versions
const corePkgUpdated = updatePackage(path.resolve("./packages/core/package.json"));
const cliPkgUpdated = updatePackage(path.resolve("./packages/cli/package.json"), true);

// Write the version information to a file to be consumed by other scripts
fs.writeFileSync(
  path.resolve("./.version-info.json"),
  JSON.stringify({ oldVersion, newVersion }, null, 2)
);

if (corePkgUpdated && cliPkgUpdated) {
  console.log(`✅ All versions updated from ${oldVersion} to ${newVersion}`);
} else {
  console.warn(`⚠️ Some packages could not be updated. Please check the errors above.`);
}

// Export the version for other scripts
module.exports = {
  oldVersion,
  newVersion
};
