const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
function releaseVersion() {
  const root = path.resolve(__dirname, "..");
  const hash = crypto.createHash("sha256");
  function add(relative) {
    const file = path.join(root, relative);
    if (fs.statSync(file).isDirectory()) {
      for (const name of fs.readdirSync(file).sort()) add(path.join(relative, name));
    } else hash.update(relative.split(path.sep).join("/")).update(fs.readFileSync(file));
  }
  for (const name of [
    "app",
    "scripts",
    "public",
    "next.config.ts",
    "package.json",
    "package-lock.json",
    "tsconfig.json",
  ])
    add(name);
  return hash.digest("hex").slice(0, 16);
}
module.exports = { releaseVersion };
