const logger = require('@blackbaud/skyux-logger');

function eject() {
  logger.warn('The "eject" command is not available in this version of SKY UX CLI.');
}

module.exports = eject;
