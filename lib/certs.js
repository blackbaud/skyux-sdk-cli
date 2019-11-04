const os = require('os');
const logger = require('@blackbaud/skyux-logger');
const spawn = require('./utils/spawn');
const certUtils = require('./utils/cert-utils');

// Wrap each item in the array in double quotes and return as a single string
function formatArgumentList(args) {
  return args.map(arg => `"${arg}"`).join();
}

function logAutomationSkip(action, level) {
  logger.info(`Skipped ${action}ing the SKY UX certificate at the ${level} level.`);
}

function logAutomationUnsupported(action) {
  logger.error(`Unsupported platform. You will need to manually ${action} the certificate.`);
}

async function execute(action, level, cb) {
  try {
    logger.info(`Automatically ${action}ing the SKY UX certificate at the ${level} level.`);
    await cb();
    logger.info(`Successfully ${action}ed the SKY UX certificate at the ${level} level.`);
  } catch (err) {
    logger.error(`Unuccessfully ${action}ed the SKY UX certificate at the ${level} level. ${err}`);
    throw err;
  }
}

async function trust(argv) {
  switch (os.type()) {
    case 'Darwin':
      await trustMac();
    break;
    case 'Linux':
      await trustLinux();
    break;
    case 'Windows_NT':
      await trustWindows(argv);
    break;
    default:
      logAutomationUnsupported('install');
    break;
  }
}

async function untrust(argv) {
  switch (os.type()) {
    case 'Darwin':
      await untrustMac();
    break;
    case 'Linux':
      await untrustLinux();
    break;
    case 'Windows_NT':
      await untrustWindows(argv);
    break;
    default:
      logAutomationUnsupported('uninstall');
    break;
  }
}

async function trustLinux() {
  await execute('trust', 'OS', async () => {
    await spawn(`sudo`, `cp`, certUtils.getCertPath(), `/usr/local/share/ca-certificates/${certUtils.getCertName()}`);
    await spawn(`sudo`, `update-ca-certificates`);
  });

  if (certUtils.getLinuxChromeNSSPathExists()) {
    await execute('trust', 'NSS Chrome', async () => {
      await spawn(`certutil`, `-d`, `sql:${certUtils.getLinuxChromeNSSPath()}`, `-A`, `-t`, `P`, `-n`, certUtils.getCertCommonName(), `-i`, certUtils.getCertPath());
    });
  } else {
    logAutomationSkip('trust', 'NSS Chrome')
  }
}

async function untrustLinux() {
  await execute('untrust', 'OS', async () => {
    await spawn(`sudo`, `rm`, `-rf`, `/usr/local/share/ca-certificates/${certUtils.getCertName()}`);
    await spawn(`sudo`, `update-ca-certificates`, `--fresh`);
  });

  if (certUtils.getLinuxChromeNSSPathExists()) {
    await execute('untrust', 'NSS Chrome', async () => {
      await spawn(`certutil`, `-D`, `-d`, `sql:${certUtils.getLinuxChromeNSSPath()}`,`-n`, certUtils.getCertCommonName());
    });
  } else {
    logAutomationSkip('untrust', 'NSS Chrome');
  }
}

async function trustMac() {
  await execute('trust', 'OS', async () => {
    await spawn(`sudo`, `security`, `add-trusted-cert`, `-d`, `-r`, `trustRoot`, `-k`, `/Library/Keychains/System.keychain`, certUtils.getCertPath());
  });
}

async function untrustMac() {
  await execute('untrust', 'OS', async () => {
    await spawn(`sudo`, `security`, `delete-certificate`, `-c`, certUtils.getCertCommonName());
  });
}

async function trustWindows(argv) {
  const cmdArgs = ['/c', 'certutil', '-addstore', '-f', 'root', `""${certUtils.getCertPath()}""`];

  if (argv.pause !== false) {
    cmdArgs.push('&', 'PAUSE');
  }

  await execute('trust', 'OS', async () => {
    await spawn(`powershell`, `start-process cmd -verb runas -ArgumentList @(${formatArgumentList(cmdArgs)})`);
  });
}

async function untrustWindows(argv) {
  const cmdArgs = ['/c', 'certutil', '-delstore', 'root', certUtils.getCertCommonName()];

  if (argv.pause !== false) {
    cmdArgs.push('&', 'PAUSE');
  }

  await execute('untrust', 'OS', async () => {
    await spawn(`powershell`, `start-process cmd -verb runas -ArgumentList @(${formatArgumentList(cmdArgs)})`);
  });
}

async function install(argv) {
  try {
    logger.info('Attempting to install SKY UX certificate.');
    certUtils.generate();
    await trust(argv);
    logger.info('Successfully installed SKY UX certificate.');
  } catch (err) {
    logger.error(`Unable to install the SKY UX certificate.`);
  }
}

async function uninstall(argv) {
  try {
    logger.info('Attempting to uninstall the SKY UX certificate.');
    await untrust(argv);
    certUtils.remove();
    logger.info('Successfully uninstalled SKY UX certificate.');
  } catch (err) {
    logger.error(`Unable to uninstall the SKY UX certificate.`);
  }
}

module.exports = async function certs(argv) {
  switch (argv['_'][1]) {
    case 'generate':
      certUtils.generate();
    break;

    case 'install':
      if (certUtils.validate()) {
        await uninstall(argv);
      }
      await install(argv);
    break;

    case 'uninstall':
      await uninstall(argv);
    break;

    case 'validate':
      logger.info('Validating SKY UX certificate and key.');
      certUtils.validate();
    break;

    default:
      logger.warn(`Unknown action for the certs command.`);
      logger.warn(`Available actions are install and uninstall.`)
    break;
  }
};
