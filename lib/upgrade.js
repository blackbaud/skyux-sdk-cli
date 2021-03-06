const logger = require('@blackbaud/skyux-logger');
const cleanup = require('../lib/cleanup');
const jsonUtils = require('../lib/utils/json-utils');
const cliVersion = require('./utils/cli-version');
const npmAudit = require('./utils/npm-audit');
const npmInstall = require('./utils/npm-install');
const latestVersion = require('latest-version');

/**
 * Returns the app dependencies utility that's compatible with the
 * currently installed version of SKY UX Builder.
 * @param {*} packageJson The contents of a package.json file.
 */
async function getAppDependenciesUtil(packageJson) {
  const builderVersion = packageJson.devDependencies['@skyux-sdk/builder'];

  if (!builderVersion) {
    return require('./app-dependencies');
  }

  const builderVersionInstalled = await latestVersion('@skyux-sdk/builder', {
    version: builderVersion
  });

  const majorVersion = builderVersionInstalled.split('.')[0];
  switch (majorVersion) {
    case '3':
      return require('./v3-compat/app-dependencies');
    default:
      return require('./v4-compat/app-dependencies');
  }
}

async function upgrade(argv) {

  await cliVersion.verifyLatestVersion();

  // Did the consumer pass `--no-install` via the command line?
  let runInstall = (argv.install !== false);

  // Did the consumer pass `--audit` via the command line?
  let runAudit = (argv.audit === true);
  if (runAudit) {
    runInstall = true;
  }

  // Override a few settings if a clean install is requested (`--clean`).
  const runCleanInstall = (argv.clean === true);
  if (runCleanInstall) {
    runInstall = true;
    runAudit = true;
  }

  const packageJson = await jsonUtils.readJson('package.json');

  const appDependencies = await getAppDependenciesUtil(packageJson);

  try {
    logger.info('Upgrading dependencies...');
    await appDependencies.upgradeDependencies(packageJson.dependencies);

    logger.info('Upgrading development dependencies...');
    await appDependencies.upgradeDependencies(packageJson.devDependencies);

    logger.info('Checking SKY UX peer dependencies...');
    await appDependencies.addSkyPeerDependencies(packageJson.dependencies);
    await appDependencies.addSkyPeerDependencies(packageJson.devDependencies);

    await jsonUtils.writeJson('package.json', packageJson);

    logger.info('Done updating package.json.\n');

    if (runInstall) {
      const settings = {};
      if (logger.logLevel === 'verbose') {
        settings.stdio = 'inherit';
      }

      if (runCleanInstall) {
        logger.info('Deleting node_modules and package-lock.json for a clean install...');
        await cleanup.deleteDependencies();
        logger.info('Done deleting files.');
      }

      await npmInstall(settings);
    }

    if (runAudit) {
      logger.info('Auditing NPM packages for vulnerabilities...');
      npmAudit();
      logger.info('Done with audit.');
    }

    logger.info('SKY UX upgrade successfully completed.');

  } catch (error) {
    logger.error('Error: ' + error.message);
    process.exit(1);
  }
}

module.exports = upgrade;
