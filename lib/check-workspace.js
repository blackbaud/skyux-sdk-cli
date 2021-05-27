const logger = require('@blackbaud/skyux-logger');

const cliVersion = require('./utils/cli-version');

async function checkWorkspace() {
  try {
    await cliVersion.verifyLatestVersion();
  } catch (err) {
    logger.error(`[skyux check-workspace] Error: ${err.message}`);
    process.exit(1);
  }
}

module.exports = checkWorkspace;
