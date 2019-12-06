const logger = require('@blackbaud/skyux-logger');

async function execute(action, level, cb) {
  try {
    logger.info(`Automatically ${action}ing the SKY UX certificates at the ${level} level.`);
    await cb();
    logger.info(`Successfully ${action}ed the SKY UX certificates at the ${level} level.`);
  } catch (err) {
    logger.error(`Unsuccessfully ${action}ed the SKY UX certificates at the ${level} level. ${err}`);
    throw err;
  }
}

module.exports = {
  execute
};