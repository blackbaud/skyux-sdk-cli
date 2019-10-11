const os = require('os');
const logger = require('@blackbaud/skyux-logger');
const spawn = require('./utils/spawn');

const certUtils = require('./utils/cert-utils');

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
      logger.error('Unable to automatically trust based on your OS.')
    break;
  }
  logger.info('Successfully trusted SKY UX certificate.');
}

async function untrust() {
  logger.info('Untrusting SKY UX certificate.');
  switch (os.type()) {
    case 'Darwin':
      await untrustMac();
    break;
    case 'Linux':
      await untrustLinux();
    break;
    case 'Windows_NT':
      await untrustWindows();
    break;
    default:
      logger.error('Unable to automatically untrust based on your OS.')
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
  await spawn(`powershell`, `start-process cmd -verb runas -ArgumentList @("/c", "certutil", "-addstore", "-f", "root", '"${certUtils.getCertPath(argv)}"', "&", "PAUSE")`);
}

async function untrustWindows() {
  await spawn(`powershell`, `start-process cmd -verb runas -ArgumentList @("/c", "certutil", "-delstore", "root", "${certUtils.getCertName()}", "&", "PAUSE")`);
}

module.exports = async function certs(argv) {
  try {
    switch (argv['_'][1]) {
      case 'trust':
        certUtils.generate(argv);
        await trust(argv);
      break;

      case 'untrust':
        await untrust(argv);
      break;

      case 'validate':
        certUtils.validate(argv);
      break;

      default:
        logger.warn(`Unknown action for the certs command.`);
        logger.warn(`Available actions are trust, untrust, and validate.`)
      break;
    }
  } catch (err) {
    logger.error(`Command exited with error: ${err}`);
  }
};
