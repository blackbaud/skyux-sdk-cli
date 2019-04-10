const spawn = require('cross-spawn');
const logger = require('@blackbaud/skyux-logger');

/**
 * Runs npm install for a specific package
 * @name npmInstall
 */
function npmInstall(settings) {

  let messageText = 'Running npm install. This step can take several minutes.';
  const installArgs = {};

  if (settings) {
    if (settings.path) {
      installArgs.cwd = settings.path;
    }

    if (settings.stdio) {
      installArgs.stdio = settings.stdio;
    }

    if (settings.stdio !== 'inherit') {
      messageText += ' Add `--logLevel verbose` for realtime output.';
    }
  }

  const message = logger.promise(messageText);
  const npmProcess = spawn('npm', ['install'], installArgs);

  return new Promise((resolve, reject) => {
    let error = '';
    let warn = '';

    // stderr property doesn't exist if spawned with stdio === 'inherit'
    if (npmProcess.stderr) {
      npmProcess.stderr.on('data', buffer => error += buffer.toString());
    }

    // stdout property doesn't exist if spawned with stdio === 'inherit'
    if (npmProcess.stdout) {
      console.log('LISTENING TO OUTPUT');
      npmProcess.stdout.on('data', buffer => {
        const text = buffer.toString();
        warn += text;

        if (text.indexOf('requires a peer') > -1) {
          console.log('FOUND SOME WARN TEXT');
        }
      });
    }


    npmProcess.on('exit', (code) => {
      if (code !== 0) {
        message.fail();
        reject(error || 'Unknown error occured. `npm install` has failed.  Run `skyux install --logLevel verbose` for more information.');
        return;
      }

      if (warn) {
        logger.warn('Your project has unmet peer dependencies, but may still function properly.');
        logger.warn(warn);
      }

      message.succeed();
      resolve();
    });
  });
}

module.exports = npmInstall;
