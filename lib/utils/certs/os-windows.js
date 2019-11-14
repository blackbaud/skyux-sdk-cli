const fs = require('fs-extra');
const spawn = require('../spawn');
const { execute } = require('./shared');
const generator = require('./generator');

async function executeBatchFile(argv, isTrust) {
  const batchPath = './skyux-temp-windows-commands.bat';

  const commands = [
    `certutil -delstore root ${generator.getCertCommonName()}`,
    `certutil -delstore root ${generator.getCertAuthCommonName()}`,
  ];

  if (isTrust) {
    commands.push(`certutil -addstore -f root "${generator.getCertAuthPath()}"`);
  }

  if (argv.pause !== false) {
    commands.push(`PAUSE`);
  }

  fs.writeFileSync(batchPath, commands.join('\n'));

  await execute('trust', 'OS', async () => {
    await spawn(`powershell`, `start-process ${batchPath} -verb runas`);
  });

  fs.removeSync(batchPath);
}

async function trust(argv) {
  await executeBatchFile(argv, true);
}

async function untrust(argv) {
  await executeBatchFile(argv, false);
}

module.exports = {
  trust,
  untrust
};