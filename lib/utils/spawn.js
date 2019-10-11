const { spawn } = require('child_process');
const logger = require('@blackbaud/skyux-logger');

async function run(...args) {
  return new Promise((resolve, reject) => {
    const script = args.join(' ');
    const command = args.shift();

    logger.info(`Executing: \`${script}\``);

    const running = spawn(command, args, { stdio: 'inherit' });

    running.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        logger.error(`\nError executing: \`${script}\``);
        reject(code);
      }
    });
  });
}

module.exports = run;