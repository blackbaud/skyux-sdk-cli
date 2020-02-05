const logger = require('@blackbaud/skyux-logger');
const fs = require('fs-extra');
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
      await spawn(`certutil`, `-d`, `sql:${linuxChromeNSSPath}`, `-A`, `-t`, `C`, `-n`, generator.getCertAuthCommonName(), `-i`, generator.getCertAuthPath());
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
      try {
        await spawn(`certutil`, `-D`, `-d`, `sql:${linuxChromeNSSPath}`, `-n`, generator.getCertCommonName());
      } catch (err) {
        logger.info('Certificate from old technique did not exist. OK to proceed and ignore previous error.');
      }

      await spawn(`certutil`, `-D`, `-d`, `sql:${linuxChromeNSSPath}`, `-n`, generator.getCertAuthCommonName());
    });
  } else {
    logAutomationSkip('untrust', 'NSS Chrome');
  }
}

module.exports = {
  trust,
  untrust
};
