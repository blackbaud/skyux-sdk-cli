const spawn = require('cross-spawn');

function getOriginUrl() {
  const spawnResult = spawn.sync('git', [
    'config',
    '--get', 'remote.origin.url'
  ], {
    cwd: process.cwd()
  });

  return spawnResult.stdout.toString();
}

module.exports = {
  getOriginUrl
};
