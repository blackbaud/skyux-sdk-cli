const gitClone = require('git-clone');
const logger = require('@blackbaud/skyux-logger');

async function clone(url, target, argv) {
  const checkout = argv.checkout || '4.x.x';
  logger.info(`Cloning ${url}#${checkout} into ${target}`);

  return new Promise((resolve, reject) => {
    gitClone(
      url,
      target,
      { checkout },
      err => err ? reject({ message: err, branch: checkout }) : resolve()
    );
  });
}

module.exports = clone;
