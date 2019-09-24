const { spawn } = require('child_process');
const gitClone = require('git-clone');
const logger = require('@blackbaud/skyux-logger');

async function clone(url, target, argv) {
  const checkout = argv.checkout || 'master';
  logger.info(`Cloning ${url}#${checkout} into ${target}`);

  return new Promise((resolve, reject) => {
    gitClone(
      url,
      target,
      { checkout },
      err => err ? reject(err) : resolve()
    );
  });
}

module.exports = {
  clone
};
