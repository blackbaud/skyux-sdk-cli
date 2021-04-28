const spawn = require('cross-spawn');

function spawnToString(command, args) {
  const spawnResult = spawn.sync(command, args, {
    cwd: process.cwd()
  });

  return spawnResult.stdout.toString();
}

function getOriginUrl() {
  return spawnToString('git', [
    'config',
    '--get', 'remote.origin.url'
  ]);
}

function hasUncommittedChanges() {
  const result = spawnToString('git', [
    'status', '--porcelain'
  ]);
  console.log('Eh?', result);
}

module.exports = {
  getOriginUrl,
  hasUncommittedChanges
};
