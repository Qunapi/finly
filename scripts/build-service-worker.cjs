const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const root = path.resolve(__dirname, "../out");
const base = process.env.GITHUB_REPOSITORY ? `/${process.env.GITHUB_REPOSITORY.split("/")[1]}/` : "/";
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(file) : [file];
  });
}
const files = walk(root)
  .filter((file) => !file.endsWith("/sw.js"))
  .sort();
const template = fs.readFileSync(path.join(__dirname, "service-worker.js"), "utf8");
const hash = crypto.createHash("sha256").update(template);
for (const file of files) hash.update(path.relative(root, file)).update(fs.readFileSync(file));
const version = hash.digest("hex").slice(0, 16);
const assets = files.map((file) => base + path.relative(root, file).split(path.sep).join("/"));
fs.writeFileSync(
  path.join(root, "sw.js"),
  template
    .replace('"__CACHE__"', JSON.stringify(`finly-${base}-${version}`))
    .replace('"__ASSETS__"', JSON.stringify(assets)),
);
console.log(`PWA: precache ${assets.length} files, version ${version}`);
