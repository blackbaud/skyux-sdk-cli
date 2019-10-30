const os = require('os');
const logger = require('@blackbaud/skyux-logger');
const spawn = require('./utils/spawn');

const certUtils = require('./utils/cert-utils');

function formatArgumentList(args) {
  // Wrap each item in the array in double quotes and return as a single string
  return args.map(arg => `"${arg}"`).join();
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
  await spawn(`sudo`, `cp`, certUtils.getCertPath(), `/usr/local/share/ca-certificates/${certUtils.getCertName()}`);
  await spawn(`sudo`, `update-ca-certificates`);
}

async function untrustLinux() {
  await spawn(`sudo`, `update-ca-certificates`, `--fresh`);
}

async function trustMac() {
  await spawn(`sudo`, `security`, `add-trusted-cert`, `-d`, `-r`, `trustRoot`, `-k`, `/Library/Keychains/System.keychain`, certUtils.getCertPath());
}

async function untrustMac() {
  await spawn(`sudo`, `security`, `delete-certificate`, `-c`, certUtils.getCertCommonName());
}

async function trustWindows(argv) {
  const cmdArgs = ['/c', 'certutil', '-addstore', '-f', 'root', certUtils.getCertPath()];

  // Pauses by default.
  if (argv.pause !== false) {
    cmdArgs.push('&', 'PAUSE');
  }

  await spawn(`powershell`, `start-process cmd -verb runas -ArgumentList @(${formatArgumentList(cmdArgs)})`);
}

async function untrustWindows(argv) {
  const cmdArgs = ['/c', 'certutil', '-delstore', 'root', certUtils.getCertCommonName()];

  // Pauses by default.
  if (argv.pause !== false) {
    cmdArgs.push('&', 'PAUSE');
  }

  await spawn(`powershell`, `start-process cmd -verb runas -ArgumentList @(${formatArgumentList(cmdArgs)})`);
}

async function install(argv) {
  certUtils.generate();
  await trust(argv);
}

async function uninstall(argv) {
  certUtils.remove();
  await untrust(argv);
}

module.exports = async function certs(argv) {
  try {
    switch (argv['_'][1]) {
      case 'generate':
        certUtils.generate();
      break;

      case 'install':

        try {
          await uninstall(argv);
        } catch (ignoreErr) {
          logger.verbose('Ignoring uninstall error.');
        }

        await install(argv);
      break;

      case 'uninstall':
        await uninstall(argv);
      break;

      case 'validate':
        certUtils.validate();
      break;

      default:
        logger.warn(`Unknown action for the certs command.`);
        logger.warn(`Available actions are install and uninstall.`)
      break;
    }
  } catch (err) {
    logger.error(`Command exited with error: ${err}`);
  }
};
