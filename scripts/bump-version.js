const fs = require("fs");
const path = require("path");

const pkgPath = path.join(__dirname, "..", "package.json");
const versionJsonPath = path.join(__dirname, "..", "src", "data", "version.json");

const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
const currentVersion = pkg.version || "1.0.0";

let [major, minor, patch] = currentVersion.split(".").map((num) => parseInt(num, 10) || 0);

// Increment patch
patch += 1;

// If patch reaches 100, shift to minor
if (patch >= 100) {
  patch = 0;
  minor += 1;
}

// If minor reaches 100, shift to major
if (minor >= 100) {
  minor = 0;
  major += 1;
}

const newVersion = `${major}.${minor}.${patch}`;

// Update package.json
pkg.version = newVersion;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf-8");

// Update src/data/version.json
fs.writeFileSync(
  versionJsonPath,
  JSON.stringify({ version: newVersion }, null, 2) + "\n",
  "utf-8"
);

console.log(`\x1b[32m✔ Versi berhasil diperbarui:\x1b[0m v${currentVersion} -> \x1b[1m\x1b[33mv${newVersion}\x1b[0m`);

