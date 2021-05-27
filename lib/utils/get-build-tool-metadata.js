const logger = require('@blackbaud/skyux-logger');
const latestVersion = require('latest-version');

const jsonUtils = require('./json-utils');

/**
 * Returns metadata describing a project's build tool.
 * E.g., @skyux-sdk/builder, @blackbaud-internal/skyux-angular-builders, etc.
 */
async function getBuildToolMetadata() {
  logger.verbose('Getting metadata for the currently installed build tool...');

  const packageJson = await jsonUtils.readJson('package.json');

  const buildTools = [
    '@blackbaud-internal/skyux-angular-builders',
    '@skyux-sdk/builder',
    '@skyux-sdk/angular-builders'
  ];

  const metadata = {};
  for (const packageName of buildTools) {
    const currentVersion = packageJson.devDependencies[packageName];
    if (currentVersion) {
      metadata.name = packageName;
      metadata.currentlyInstalledVersion = currentVersion;
    }
  }

  let majorVersion;
  try {
    const result = await latestVersion(metadata.name, {
      version: metadata.currentlyInstalledVersion
    });
    majorVersion = parseInt(result.split('.')[0], 10);
  } catch (err) {
    logger.verbose(
      `[warn] A latest version could not be found for "${metadata.name}@${metadata.currentlyInstalledVersion}".\n`
    );
    majorVersion = null;
  }

  metadata.currentlyInstalledMajorVersion = majorVersion;

  logger.verbose('Build tool metadata:', metadata);

  return metadata;
}

module.exports = getBuildToolMetadata;
