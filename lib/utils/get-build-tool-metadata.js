const latestVersion = require('latest-version');

const jsonUtils = require('./json-utils');

async function getBuildToolMetadata() {
  const packageJson = await jsonUtils.readJson('package.json');

  const buildTools = [
    '@blackbaud-internal/skyux-angular-builders',
    '@skyux-sdk/builder',
    '@skyux-sdk/angular-builders'
  ];

  const metadata = {};

  for (const packageName in buildTools) {
    const currentVersion = packageJson.devDependencies[packageName];
    if (currentVersion) {
      metadata.name = packageName;
      metadata.currentlyInstalledVersion = currentVersion;
    }
  }

  const result = await latestVersion(metadata.name, {
    version: metadata.currentlyInstalledVersion
  });

  const majorVersion = parseInt(result.split('.')[0], 10);

  metadata.currentlyInstalledMajorVersion = majorVersion;

  // const latest = await latestVersion(metadata.name);

  // metadata.latestAvailableVersion = latest;

  return metadata;
}

module.exports = getBuildToolMetadata;
