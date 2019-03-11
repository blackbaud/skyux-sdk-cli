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

    // stderr property doesn't exist is spawned with stdio === 'inherit'
    if (npmProcess.stderr) {
      npmProcess.stderr.on('data', buffer => error += buffer.toString());
    }

    npmProcess.on('exit', (code) => {
      if (code !== 0) {
        message.fail();

        const defaultError = 'Unknown error occured. `npm install` has failed.  Run `skyux install --logLevel verbose` for more information.';
        reject(error || defaultError);

        return;
      }

      message.succeed();
      resolve();
    });
  });
}

module.exports = npmInstall;
