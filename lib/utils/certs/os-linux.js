const logger = require('@blackbaud/skyux-logger');
const fs = require('fs');
const os = require('os');
const path = require('path');

const spawn = require('../spawn');
const { execute } = require('./shared');
const generator = require('./generator');

const linuxChromeNSSPath = path.resolve(`${os.homedir()}/.pki/nssdb`);

function logAutomationSkip(action, level) {
  logger.info(`Skipped ${action}ing the SKY UX certificate at the ${level} level.`);
}

async function trust() {
  await execute('trust', 'OS', async () => {
    await spawn(`sudo`, `cp`, generator.getCertAuthPath(), `/usr/local/share/ca-certificates/${generator.getCertAuthName()}`);
    await spawn(`sudo`, `update-ca-certificates`);
  });

  if (fs.existsSync(linuxChromeNSSPath)) {
    await execute('trust', 'NSS Chrome', async () => {
      await spawn(`certutil`, `-d`, `sql:${linuxChromeNSSPath}`, `-A`, `-t`, `P`, `-n`, generator.getCertAuthCommonName(), `-i`, generator.getCertPath());
    });
  } else {
    logAutomationSkip('trust', 'NSS Chrome')
  }
}

async function untrust() {
  await execute('untrust', 'OS', async () => {
    await spawn(`sudo`, `rm`, `-rf`, `/usr/local/share/ca-certificates/${generator.getCertName()}`);
    await spawn(`sudo`, `rm`, `-rf`, `/usr/local/share/ca-certificates/${generator.getCertAuthName()}`);
    await spawn(`sudo`, `update-ca-certificates`, `--fresh`);
  });

  if (fs.existsSync(linuxChromeNSSPath)) {
    await execute('untrust', 'NSS Chrome', async () => {
      await spawn(`certutil`, `-D`, `-d`, `sql:${linuxChromeNSSPath}`,`-n`, generator.getCertCommonName());
      await spawn(`certutil`, `-D`, `-d`, `sql:${linuxChromeNSSPath}`,`-n`, generator.getCertAuthCommonName());
    });
  } else {
    logAutomationSkip('untrust', 'NSS Chrome');
  }
}

module.exports = {
  trust,
  untrust
};