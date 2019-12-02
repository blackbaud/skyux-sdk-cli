const os = require('os');
const logger = require('@blackbaud/skyux-logger');
const generator = require('./utils/certs/generator');
const { execute } = require('./utils/certs/shared');

const osLinux = require('./utils/certs/os-linux');
const osMac = require('./utils/certs/os-mac');
const osWindows = require('./utils/certs/os-windows');

const osType = os.type();

async function runActionForOS(argv, action) {
  let osUtils;

  if (osType === 'Darwin') {
    osUtils = osMac;
  }

  if (osType === 'Linux') {
    osUtils = osLinux;
  }

  if (osType === 'Windows_NT') {
    osUtils = osWindows;
  }

  if (!osUtils) {
    return logger.error(`Unsupported platform. You will need to manually ${action} the certificate.`);
  }

  await osUtils[action](argv);
}

async function trust(argv) {
  await runActionForOS(argv, 'trust');
}

async function untrust(argv) {
  await runActionForOS(argv, 'untrust');
}

async function install(argv) {
  try {
    await execute('install', 'system', async () => {
      generator.generate();
      await trust(argv);
    });
  } catch (err) {
    // Error already logged
  }
}

async function uninstall(argv) {
  try {
    await execute('uninstall', 'system', async () => {
      await untrust(argv);
      generator.removeCertDirPath();
    });
  } catch (err) {
    // Error already logged
  }
}

module.exports = async function certs(argv) {
  switch (argv['_'][1]) {
    case 'generate':
      generator.generate();
    break;

    case 'install':
      // Uninstall is batched in Windows to prevent multiple UAC prompts
      if (osType !== 'Windows_NT') {
        await uninstall(argv);
      }

      await install(argv);
    break;

    case 'uninstall':
      await uninstall(argv);
    break;

    case 'validate':
      logger.info('Validating SKY UX certificate and key.');
      generator.validate();
    break;

    default:
      logger.warn(`Unknown action for the certs command.`);
      logger.warn(`Available actions are install and uninstall.`)
    break;
  }
};
