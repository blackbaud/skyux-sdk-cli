const os = require('os');
const path = require('path');
const fs = require('fs-extra');
const forge = require('node-forge');
const logger = require('@blackbaud/skyux-logger');

const certCommonName = 'SKYUX-Developer-Certificate';
const certName = 'skyux-server.crt';
const keyName = 'skyux-server.key';

const defaultCertDir = path.resolve(`${os.homedir()}/.skyux/certs/`);
const defaultCertPath = path.join(defaultCertDir, certName);
const defaultKeyPath = path.join(defaultCertDir, keyName);

// The methods provided in this class purposefully do not allow argv overrides.
// These commands only deal with known filenames and locations.

function error(msg) {
  logger.error(msg);
  return false;
}

function validate() {
  const cert = getCertPath();
  const key = getKeyPath();

  if (!fs.existsSync(cert)) {
    return error(`Error locating certificate: ${cert}`);
  }

  if (!fs.existsSync(key)) {
    return error(`Error locating key: ${key}`);
  }

  // https://github.com/blackbaud/skyux-sdk-cli/issues/37
  return true;
}

function generate() {
  logger.info('Generating SKY UX certificate.');
  const now = new Date();
  const keys = forge.pki.rsa.generateKeyPair(2048);
  const certificate = forge.pki.createCertificate();
  const attrs = [{
    name: 'commonName',
    value: getCertCommonName()
  }];

  certificate.publicKey = keys.publicKey;
  certificate.validity.notBefore = now;
  certificate.validity.notAfter.setFullYear(certificate.validity.notBefore.getFullYear() + 1);

  certificate.setSubject(attrs);
  certificate.setIssuer(attrs);
  certificate.setExtensions([
    {
      name: 'subjectAltName',
      altNames: [{
        type: 2, // DNS
        value: 'localhost'
      }]
    },
    {
      name: 'keyUsage',
      digitalSignature: true,
      keyEncipherment: true,
      dataEncipherment: true
    }, {
      name: 'extKeyUsage',
      serverAuth: true
    }, {
      name: 'friendlyName',
      value: getCertCommonName()
    }]);

  certificate.sign(keys.privateKey, forge.md.sha256.create());

  fs.ensureDirSync(defaultCertDir);
  fs.writeFileSync(getCertPath(), forge.pki.certificateToPem(certificate));
  fs.writeFileSync(getKeyPath(), forge.pki.privateKeyToPem(keys.privateKey));

  logger.info(`Successfully generated ${getCertPath()} and ${getKeyPath()}.`);
}

function getCertCommonName() {
  return certCommonName;
}

function getCertName() {
  return certName;
}

function getKeyName() {
  return keyName;
}

function getCertPath() {
  return defaultCertPath;
}

function getKeyPath() {
  return defaultKeyPath;
}

function remove() {
  fs.removeSync(defaultCertDir);
}

module.exports = {
  generate,
  getCertCommonName,
  getCertName,
  getKeyName,
  getCertPath,
  getKeyPath,
  remove,
  validate
}