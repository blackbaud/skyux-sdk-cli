const spawn = require('./spawn');

async function npmAudit() {
  await spawn('npm', 'audit', 'fix');
}

module.exports = npmAudit;
