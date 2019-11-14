const os = require('os');
const logger = require('@blackbaud/skyux-logger');
const generator = require('./utils/certs/generator');
const { execute } = require('./utils/certs/shared');

const osLinux = require('./utils/certs/os-linux');
const osMac = require('./utils/certs/os-mac');
const osWindows = require('./utils/certs/os-windows');

async function runActionForOS(argv, action) {
  const osType = os.type();
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
  await execute('install', 'system', async () => {
    generator.removeCertDirPath();    
    generator.generate();
    await trust(argv);
  });
}

async function uninstall(argv) {
  await execute('uninstall', 'system', async () => {
    generator.removeCertDirPath();
    await untrust(argv);    
  });
}

module.exports = async function certs(argv) {
  switch (argv['_'][1]) {
    case 'generate':
      generator.generate();
    break;

    case 'install':
      await uninstall(argv);
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
