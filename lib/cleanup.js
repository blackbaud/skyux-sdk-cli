const fs = require('fs-extra');
const logger = require('@blackbaud/skyux-logger');

/**
 * Deletes package-lock.json file and node_modules folder after an application's
 * dependencies have been updated.
 */
async function deleteDependencies() {
  const packageLockPath = 'package-lock.json';

  if (await fs.exists(packageLockPath)) {
    logger.info('Deleting package-lock.json file...');
    await fs.unlink(packageLockPath);
  }

  const nodeModulesPath = 'node_modules';

  if (await fs.exists(nodeModulesPath)) {
    logger.info('Deleting node_modules directory...');
    await fs.remove(nodeModulesPath);
  }
}

module.exports = {
  deleteDependencies
};
