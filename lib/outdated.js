const fs = require('fs-extra');
const path = require('path');
const ensureLatestSkyuxPackages = require('./utils/eject/ensure-latest-skyux-packages');

async function outdated() {
  const packageJson = fs.readJsonSync(path.join(process.cwd(), 'package.json'));

  const clone = JSON.parse(JSON.stringify(packageJson));
  await ensureLatestSkyuxPackages(clone.dependencies);
  await ensureLatestSkyuxPackages(clone.devDependencies);

  // fs.writeJsonSync(path.join(process.cwd(), 'package.json'), packageJson, { spaces: 2 });
}

module.exports = outdated;
