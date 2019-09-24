/*jslint node: true */
'use strict';

const os = require('os');
const path = require('path');
const fs = require('fs-extra');
const logger = require('@blackbaud/skyux-logger');
const { clone } = require('./utils');

// PATH SHARED WITH BUILDER
const certRootPath = path.resolve(`${os.homedir()}/.skyux/certs/`);

function getResolver() {
  return require(certRootPath);
}

async function trust() {
  const resolver = getResolver();
  await resolver.trust();
}

async function untrust() {
  const resolver = getResolver()
  await resolver.trust();
}

/**
 * Clones the certs repo to the ./skyux folder.
 * @name cloneRepo
 */
async function cloneRepo(argv) {
  const url = 'https://github.com/blackbaud/skyux-sdk-certs.git';
  logger.info(`Cloning SKY UX certificate repository ${url}.`);

  try {
    await clone(url, certRootPath, argv);
  } catch (err) {
    logger.error(`Error cloning SKY UX certificate repository ${url}.`);
    throw err;
  }
}

/**
 * Deletes the certs repo from the ./skyux folder.
 * @name removeRepo
 */
async function removeRepo() {
  if (fs.existsSync(certRootPath)) {
    logger.info(`Removing previous clone of certs from ${certRootPath}`);
    await fs.remove(certRootPath);
  } else {
    logger.info(`Previous clone of certs not found at ${certRootPath}`);
  }
}

async function certs(argv) {
  try {
    switch (argv['_'][1]) {
      case 'install':
        // await removeRepo();
        // await cloneRepo(argv);
        await trust();
      break;

      case 'uninstall':
        // await removeRepo();
        await untrust();
      break;

      default:
        logger.info(`Unknown action for the certs command.`);
      break;
    }
  } catch (err) {
    logger.error(`Command exited with error: ${err}`);
  }
}

module.exports = certs;
