#!/usr/bin/env node
const fs = require("fs"),
  path = require("path");
const bumpType = process.argv[2] || "minor";

if (!["major", "minor", "patch"].includes(bumpType)) {
  console.error("Error: Invalid bump type");
  process.exit(1);
}

const rootPkg = JSON.parse(fs.readFileSync("./package.json", "utf8"));
let [major, minor, patch] = rootPkg.version.split(".").map(Number);

if (bumpType === "major") [major, minor, patch] = [++major, 0, 0];
else if (bumpType === "minor") [minor, patch] = [++minor, 0];
else patch++;

const newVersion = `${major}.${minor}.${patch}`;
fs.writeFileSync("./package.json", JSON.stringify({ ...rootPkg, version: newVersion }, null, 2));

const updatePackage = (pkgPath, isCLI = false) => {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  pkg.version = newVersion;
  if (isCLI) pkg.dependencies["@btr-supply/swap"] = newVersion;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
};

updatePackage(path.resolve("./packages/core/package.json"));
updatePackage(path.resolve("./packages/cli/package.json"), true);
console.log(`✅ All versions updated to ${newVersion}`);
