const os = require('os');
const logger = require('@blackbaud/skyux-logger');
const spawn = require('./utils/spawn');

const certUtils = require('./utils/cert-utils');

function formatArgumentList(args) {
  // Wrap each item in the array in double quotes and return as a single string
  return args.map(arg => `"${arg}"`).join();
}

function logAutomationStart(action, level) {
  logger.info(`Automatically ${action}ing the SKY UX certificate at the ${level} level.`);
}

function logAutomationSkip(action, level) {
  logger.info(`Skipping automatically ${action}ing the SKY UX certificate at the ${level} level.`);
}

function logAutomationEnd(action, level) {
  logger.info(`Successful in automatically ${action}ing the SKY UX certificate at the ${level} level.`);
}

function logAutomationError(err) {
  logger.error(`Unsuccessful in completing last task: ${err}`);
}

function logAutomationUnsupported(action) {
  logger.error(`Unsupported platform. You will need to manually ${action} the certificate.`);
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
  try {
    logAutomationStart('trust', 'OS');
    await spawn(`sudo`, `cp`, certUtils.getCertPath(), `/usr/local/share/ca-certificates/${certUtils.getCertName()}`);
    await spawn(`sudo`, `update-ca-certificates`);
    logAutomationEnd('trust', 'OS');
  } catch (err) {
    logAutomationError(err);
  }

  if (certUtils.getLinuxChromeNSSPathExists()) {
    try {
      logAutomationStart('trust', 'NSS Chrome');
      await spawn(`certutil`, `-d`, `sql:${certUtils.getLinuxChromeNSSPath()}`, `-A`, `-t`, `P`, `-n`, certUtils.getCertCommonName(), `-i`, certUtils.getCertPath());
      logAutomationEnd('trust', 'NSS Chrome');
    } catch (err) {
      logAutomationError(err);
    }
  } else {
    logAutomationSkip('trust', 'NSS Chrome')
    }
}

async function untrustLinux() {
  try {
    logAutomationStart('untrust', 'OS');
    await spawn(`sudo`, `rm`, `-rf`, `/usr/local/share/ca-certificates/${certUtils.getCertName()}`);
    await spawn(`sudo`, `update-ca-certificates`, `--fresh`);
    logAutomationEnd('untrust', 'OS');
  } catch (err) {
    logAutomationError(err);
  }

  if (certUtils.getLinuxChromeNSSPathExists()) {
    try {
      logAutomationStart('untrust', 'NSS Chrome');
      await spawn(`certutil`, `-D`, `-d`, `sql:${certUtils.getLinuxChromeNSSPath()}`,`-n`, certUtils.getCertCommonName());
      logAutomationEnd('untrust', 'NSS Chrome');
    } catch (err) {
      logAutomationError(err);
    }
  } else {
    logAutomationSkip('untrust', 'NSS Chrome');
  }
}

async function trustMac() {
  try {
    logAutomationStart('trust', 'OS');
    await spawn(`sudo`, `security`, `add-trusted-cert`, `-d`, `-r`, `trustRoot`, `-k`, `/Library/Keychains/System.keychain`, certUtils.getCertPath());
    logAutomationEnd('trust', 'OS');
  } catch (err) {
    logAutomationError(err);
  }
}

async function untrustMac() {
  try {
    logAutomationStart('untrust', 'OS');
    await spawn(`sudo`, `security`, `delete-certificate`, `-c`, certUtils.getCertCommonName());
    logAutomationEnd('untrust', 'OS');
  } catch (err) {
    logAutomationError(err);
  }
}

async function trustWindows(argv) {
  const cmdArgs = ['/c', 'certutil', '-addstore', '-f', 'root', `""${certUtils.getCertPath()}""`];

  // Pauses by default.
  if (argv.pause !== false) {
    cmdArgs.push('&', 'PAUSE');
  }

  try {
    logAutomationStart('trust', 'OS');
    await spawn(`powershell`, `start-process cmd -verb runas -ArgumentList @(${formatArgumentList(cmdArgs)})`);
    logAutomationEnd('trust', 'OS');
  } catch (err) {
    logAutomationError(err);
  }
}

async function untrustWindows(argv) {
  const cmdArgs = ['/c', 'certutil', '-delstore', 'root', certUtils.getCertCommonName()];

  // Pauses by default.
  if (argv.pause !== false) {
    cmdArgs.push('&', 'PAUSE');
  }

  try {
    logAutomationStart('untrust', 'OS');
    await spawn(`powershell`, `start-process cmd -verb runas -ArgumentList @(${formatArgumentList(cmdArgs)})`);
    logAutomationEnd('untrust', 'OS');
  } catch (err) {
    logAutomationError(err);
  }
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
    certUtils.remove();
    await untrust(argv);
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
