const crossSpawn = require('cross-spawn');

const SUPPORTED_ANGULAR_VERSION = '12';

/**
 * Runs an Angular CLI command with arguments.
 */
 function runNgCommand(command, args = [], spawnOptions) {
  return crossSpawn.sync('npx', [
    '-p', `@angular/cli@${SUPPORTED_ANGULAR_VERSION}`,
    'ng', command,
    ...args
  ], spawnOptions || {
    stdio: 'inherit'
  });
}

module.exports = runNgCommand;
