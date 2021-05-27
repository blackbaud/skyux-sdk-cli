const childProcessSpawn = require('child_process').spawn;
const logger = require('@blackbaud/skyux-logger');

function spawn(...args) {
  return spawnWithOptions({ stdio: 'inherit' }, ...args);
}

function spawnWithOptions(options, ...args) {
  return new Promise((resolve, reject) => {
    const script = args.join(' ');
    const command = args.shift();

    logger.info(`Executing: \`${script}\``);
    const running = childProcessSpawn(command, args, options);

    running.on('error', (err) => {
      logger.error(`\nError executing (code 0): \`${script}\``);
      reject(err);
    });

    running.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        logger.error(`\nError executing (code 1): \`${script}\``);
        reject(code);
      }
    });
  });
}

module.exports = spawn;
module.exports.spawnWithOptions = spawnWithOptions;
