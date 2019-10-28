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
      await trustMac(argv);
    break;
    case 'Linux':
      await trustLinux(argv);
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

async function trustLinux(argv) {
  await spawn(`sudo`, `cp`, certUtils.getCertPath(argv), `/usr/local/share/ca-certificates/${certUtils.getCertName()}`);
  await spawn(`sudo`, `update-ca-certificates`);
}

async function untrustLinux() {
  await spawn(`sudo`, `update-ca-certificates`, `--fresh`);
}

async function trustMac(argv) {
  await spawn(`sudo`, `security`, `add-trusted-cert`, `-d`, `-r`, `trustRoot`, `-k`, `/Library/Keychains/System.keychain`, certUtils.getCertPath(argv));
}

async function untrustMac() {
  await spawn(`sudo`, `security`, `delete-certificate`, `-c`, certUtils.getCertName());
}

async function trustWindows(argv) {
  const cmdArgs = ['/c', 'certutil', '-addstore', '-f', 'root', certUtils.getCertPath(argv)];

  // Pauses by default.
  if (argv.pause !== false) {
    cmdArgs.push('&', 'PAUSE');
  }

  await spawn(`powershell`, `start-process cmd -verb runas -ArgumentList @(${formatArgumentList(cmdArgs)})`);
}

async function untrustWindows(argv) {
  const cmdArgs = ['/c', 'certutil', '-delstore', 'root', certUtils.getCertName()];

  // Pauses by default.
  if (argv.pause !== false) {
    cmdArgs.push('&', 'PAUSE');
  }

  await spawn(`powershell`, `start-process cmd -verb runas -ArgumentList @(${formatArgumentList(cmdArgs)})`);
}

module.exports = async function certs(argv) {
  try {
    switch (argv['_'][1]) {
      case 'generate':
        certUtils.generate(argv);
      break;

      case 'install':
        certUtils.generate(argv);
        await trust(argv);
      break;

      case 'uninstall':
        certUtils.remove(argv);
        await untrust(argv);
      break;

      case 'validate':
        certUtils.validate(argv);
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
