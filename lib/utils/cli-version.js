const logger = require('@blackbaud/skyux-logger');
const path = require('path');
const getLatestVersion = require('latest-version');

const jsonUtils = require('./json-utils');

async function getPackageJson() {
  const packageJson = await jsonUtils.readJson(
    path.resolve(__dirname, '../../package.json')
  );

  return packageJson;
}

async function verifyLatestVersion() {
  logger.info('Verifying latest version of SKY UX CLI installed...');

  const packageJson = await getPackageJson();

  // Check against the "next" version if CLI is using a prerelease version.
  let distTag = 'latest';
  if (/^[0-9].0.0-.+/.test(packageJson.version)) {
    distTag = 'next';
  }

  const latestVersion = await getLatestVersion(packageJson.name, {
    version: distTag
  });

  if (latestVersion !== packageJson.version) {
    throw new Error(
      'You are using an outdated version of the SKY UX CLI.\n' +
      `Please upgrade the CLI by running: \`npm i -g ${packageJson.name}@${distTag}\`, ` +
      'then try running the CLI command again.\nVersion installed: ' +
      packageJson.version +
      '\nVersion wanted: ' +
      latestVersion
    );
  }

  logger.info('The latest version of SKY UX CLI is installed. OK.');
}

module.exports = {
  getPackageJson,
  verifyLatestVersion
};
