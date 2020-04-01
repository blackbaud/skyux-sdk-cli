const spawn = require('cross-spawn');
const logger = require('@blackbaud/skyux-logger');

/**
 * Runs npm install for a specific package
 * @name npmInstall
 */
function npmInstall(settings) {

  function logWarnings(output) {
    const matches = output.match(/\bnpm WARN\b(.*)\n/ig);
    if (matches && matches.length > 0) {
      logger.warn('\nYou may need to address the following warnings:\n')
      matches.forEach(match => logger.warn(match.trim()));
      logger.warn('\n');
    }
  }

    // stderr and stdout don't exist if spawned with stdio === 'inherit'
  function addOutputHandler(output, stream) {
    if (npmProcess[stream]) {
      npmProcess[stream].on('data', buffer => output[stream] += buffer.toString());
    }
  }

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
    const output = {
      stderr: '',
      stdout: ''
    };

    addOutputHandler(output, 'stderr')
    addOutputHandler(output, 'stdout');

    npmProcess.on('exit', (code) => {
      if (code !== 0) {
        message.fail();
        reject(output.stderr || 'Unknown error occured. `npm install` has failed.  Run `skyux install --logLevel verbose` for more information.');
      } else {
        message.succeed();
        logWarnings(output.stderr + output.stdout);
        resolve();
      }
    });
  });
}

module.exports = npmInstall;
