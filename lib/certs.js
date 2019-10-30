const os = require('os');
const logger = require('@blackbaud/skyux-logger');
const spawn = require('./utils/spawn');

const certUtils = require('./utils/cert-utils');

function formatArgumentList(args) {
  // Wrap each item in the array in double quotes and return as a single string
  return args.map(arg => `"${arg}"`).join();
}

function logAutomationStart(action, level) {
  logger.info(`Automatically trying to ${action} the SKY UX certificate at the ${level} level.`);
}

function logAutomationError(err) {
  logger.error(`Unsuccessful in completing last task: ${err}`);
}

async function trust(argv) {
  logger.info('Trusting SKY UX certificate.');
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
      return logger.error('Unable to automatically install based on your OS.')
  }
  logger.info('Successfully trusted SKY UX certificate.');
}

async function untrust(argv) {
  logger.info('Untrusting SKY UX certificate.');
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
      logger.error('Unable to automatically uninstall based on your OS.')
    break;
  }
  logger.info('Successfully untrusted SKY UX certificate.');
}

async function trustLinux() {
  try {
    logAutomationStart('trust', 'OS');
    await spawn(`sudo`, `cp`, certUtils.getCertPath(), `/usr/local/share/ca-certificates/${certUtils.getCertName()}`);
    await spawn(`sudo`, `update-ca-certificates`);
  } catch (err) {
    logAutomationError(err);
  }

  try {
    logAutomationStart('trust', 'NSS Chrome');
    await spawn(`certutil`, `-d`, `sql:${os.homedir()}/.pki/nssdb`, `-A`, `-t`, `P`, `-n`, certUtils.getCertCommonName(), `-i`, certUtils.getCertPath());
  } catch (err) {
    logAutomationError(err);
  }
}

async function untrustLinux() {
  try {
    logAutomationStart('untrust', 'OS');
    await spawn(`sudo`, `rm`, `-rf`, `/usr/local/share/ca-certificates/${certUtils.getCertName()}`);
    await spawn(`sudo`, `update-ca-certificates`, `--fresh`);    
  } catch (err) {
    logAutomationError( err);
  }

  try {
    logAutomationStart('untrust', 'NSS Chrome');
    await spawn(`certutil`, `-D`, `-d`, `sql:${os.homedir()}/.pki/nssdb`,`-n`, certUtils.getCertCommonName());
  } catch (err) {
    logAutomationError(err);
  }
}

async function trustMac() {
  try {
    logAutomationStart('trust', 'OS');
    await spawn(`sudo`, `security`, `add-trusted-cert`, `-d`, `-r`, `trustRoot`, `-k`, `/Library/Keychains/System.keychain`, certUtils.getCertPath());
  } catch (err) {
    logAutomationError(err);
  }
}

async function untrustMac() {
  try {
    logAutomationStart('untrust', 'OS');
    await spawn(`sudo`, `security`, `delete-certificate`, `-c`, certUtils.getCertCommonName());
  } catch (err) {
    logAutomationError(err);
  }
}

async function trustWindows(argv) {
  const cmdArgs = ['/c', 'certutil', '-addstore', '-f', 'root', certUtils.getCertPath()];

  // Pauses by default.
  if (argv.pause !== false) {
    cmdArgs.push('&', 'PAUSE');
  }

  try {
    logAutomationStart('trust', 'OS');
    await spawn(`powershell`, `start-process cmd -verb runas -ArgumentList @(${formatArgumentList(cmdArgs)})`);
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
  } catch (err) {
    logAutomationError(err);
  }
}

async function install(argv) {
  try {
    logger.info('Attempting to install SKY UX certificate.');
    certUtils.generate();
    await trust(argv);
  } catch (err) {
    logger.error(`Unable to install the SKY UX certificate.`);
  }
}

async function uninstall(argv) {
  try {
    logger.info('Attempting to uninstall the SKY UX certificate.');
    certUtils.remove();
    await untrust(argv);
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
      await uninstall(argv);
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
