const gitClone = require('git-clone');
const logger = require('@blackbaud/skyux-logger');

async function clone(url, target, checkout) {
  logger.info(`Cloning ${url}#${checkout} into ${target}`);

  return new Promise((resolve, reject) => {
    gitClone(url, target, { checkout }, (err) =>
      err ? reject({ message: err, branch: checkout }) : resolve()
    );
  });
}

module.exports = clone;
