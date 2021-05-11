const crossSpawn = require('cross-spawn');

function runLintFix(cwd) {
  crossSpawn.sync('ng', ['lint', '--fix'], {
    cwd,
    stdio: 'inherit'
  });
}

module.exports = runLintFix;
