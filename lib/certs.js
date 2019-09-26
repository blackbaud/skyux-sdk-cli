/*jslint node: true */
'use strict';

const os = require('os');
const path = require('path');
const fs = require('fs-extra');
const logger = require('@blackbaud/skyux-logger');
const npmInstall = require('./npm-install');
const cloneUtil = require('./utils/clone');

function getCertRootPath() {
  return path.resolve(`${os.homedir()}/.skyux/certs/`);
}

function getResolver() {
  return require(certRootPath);
}

async function clean() {
  const certRootPath = getCertRootPath();

  if (fs.existsSync(certRootPath)) {
    logger.info(`Removing previous clone of certs from ${certRootPath}`);
    await fs.remove(certRootPath);
  } else {
    logger.info(`Previous clone of certs not found at ${certRootPath}`);
  }
}

async function clone() {
  const certRootPath = getCertRootPath();
  await cloneUtil('https://github.com/blackbaud/skyux-sdk-certs.git', certRootPath, argv);
  await npmInstall({ path: certRootPath });
}

async function install() {
  logger.info('Installing SKY UX certificate.');
  await clean();
  await clone();
  await trust();
  logger.info('Successfully installed SKY UX certificate.');
}

async function trust() {
  const resolver = getResolver();
  await resolver.trust();
}

async function uninstall() {
  logger.info('Uninstalling SKY UX certificate.');
  await untrust();
  await clean();
  logger.info('Successfully uninstalled SKY UX certificate.');
}

async function untrust() {
  const resolver = getResolver()
  await resolver.untrust();
}

module.exports = async function certs(argv) {
  try {
    switch (argv['_'][1]) {
      case 'clean':
        await clean();
      break;

      case 'clone':
        await clone();
      break;

      case 'install':
        await install();
      break;

      case 'trust':
        await trust();
      break;

      case 'uninstall':
        await uninstall();
      break;

      case 'untrust':
        await untrust();
      break;

      default:
        logger.warn(`Unknown action for the certs command.`);
      break;
    }
  } catch (err) {
    logger.error(`Command exited with error: ${err}`);
  }
};
