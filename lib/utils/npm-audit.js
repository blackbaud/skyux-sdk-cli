const spawn = require('cross-spawn');

function npmAudit() {
  spawn.sync('npm', ['audit', 'fix'], {
    stdio: 'inherit'
  });
}

module.exports = npmAudit;
