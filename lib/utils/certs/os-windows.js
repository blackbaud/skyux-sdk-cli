const fs = require('fs-extra');
const path = require('path');
const spawn = require('../spawn');
const { execute } = require('./shared');
const generator = require('./generator');

async function executeBatchFile(argv, action) {
  const batchPath = path.resolve(
    generator.getCertDirPath(),
    'skyux-temp-windows-commands.bat'
  );

  const commands = [
    `certutil -delstore root ${generator.getCertCommonName()}`,
    `certutil -delstore root ${generator.getCertAuthCommonName()}`
  ];

  if (action === 'trust') {
    commands.push(
      `certutil -addstore -f root "${generator.getCertAuthPath()}"`
    );
  }

  if (argv.pause !== false) {
    commands.push(`PAUSE`);
  }

  fs.writeFileSync(batchPath, commands.join('\n'));

  // Let error bubble up but always delete batch file
  try {
    await execute(action, 'OS', async () => {
      await spawn(`powershell`, `start-process ${batchPath} -verb runas -wait`);
    });
  } finally {
    fs.removeSync(batchPath);
  }
}

async function trust(argv) {
  await executeBatchFile(argv, 'trust');
}

async function untrust(argv) {
  await executeBatchFile(argv, 'untrust');
}

module.exports = {
  trust,
  untrust
};
