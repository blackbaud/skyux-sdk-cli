const spawn = require('cross-spawn');

function spawnToString(command, args) {
  const spawnResult = spawn.sync(command, args, {
    cwd: process.cwd(),
    stdio: 'pipe',
  });

  return spawnResult.stdout.toString().trim();
}

function isGitClean() {
  const result = spawnToString('git', ['status', '--porcelain']);
  return result.trim().length === 0;
}

function getOriginUrl() {
  return spawnToString('git', ['config', '--get', 'remote.origin.url']);
}

module.exports = {
  isGitClean,
  getOriginUrl,
};
