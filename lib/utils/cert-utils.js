const os = require('os');
const path = require('path');
const fs = require('fs-extra');
const forge = require('node-forge');
const logger = require('@blackbaud/skyux-logger');

const certCommonName = 'SKYUX-Developer-Certificate';
const certName = 'skyux-server.pem';
const keyName = 'skyux-server.key';

const defaultCertRootPath = path.resolve(`${os.homedir()}/.skyux/certs/`);
const defaultCertPath = path.join(defaultCertRootPath, certName);
const defaultKeyPath = path.join(defaultCertRootPath, keyName);

function error(msg) {
  logger.error(msg);
  return false;
}

function validate(argv) {
  const cert = getCertPath(argv);
  const key = getKeyPath(argv);

  if (!fs.existsSync(cert)) {
    return error(`Error locating certificate: ${cert}`);
  }

  if (!fs.existsSync(key)) {
    return error(`Error locating key: ${key}`);
  }

  // TODO: VALIDATE CERT + KEY using forge
  return true;
}

function generate(argv) {
  logger.info('Generating SKY UX certificate.');
  const now = new Date();
  const keys = forge.pki.rsa.generateKeyPair(2048);
  const certificate = forge.pki.createCertificate();
  const attrs = [{
    name: 'commonName',
    value: getCertName()
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
      value: getCertName()
    }]);

  certificate.sign(keys.privateKey, forge.md.sha256.create());

  // Ensure parent directories exist
  fs.ensureDirSync(path.dirname(getCertPath(argv)));
  fs.ensureDirSync(path.dirname(getKeyPath(argv)));

  fs.writeFileSync(getCertPath(argv), forge.pki.certificateToPem(certificate));
  fs.writeFileSync(getKeyPath(argv), forge.pki.privateKeyToPem(keys.privateKey));

  logger.info(`Successfully generated ${getCertPath(argv)} and ${getKeyPath(argv)}.`);
}

function getCertName() {
  return certCommonName;
}

function getCertPath(argv) {
  return argv.sslCert || defaultCertPath;
}

function getKeyPath(argv) {
  return argv.sslKey || defaultKeyPath;
}

function remove(argv) {
  fs.removeSync(getCertPath(argv));
  fs.removeSync(getKeyPath(argv));
}

module.exports = {
  generate,
  getCertName,
  getCertPath,
  getKeyPath,
  remove,
  validate
}