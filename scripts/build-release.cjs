const fs = require("node:fs");
const path = require("node:path");
const { releaseVersion } = require("./release-version");
const root = path.resolve(__dirname, "../out");
const version = releaseVersion();
fs.writeFileSync(path.join(root, "version.json"), JSON.stringify({ version }));
// Keep this URL to retire service workers installed by older Finly releases.
fs.copyFileSync(path.join(__dirname, "service-worker.js"), path.join(root, "sw.js"));
console.log(`Release ${version}; offline PWA caching disabled`);
