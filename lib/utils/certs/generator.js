const os = require('os');
const path = require('path');
const fs = require('fs-extra');
const forge = require('node-forge');
const logger = require('@blackbaud/skyux-logger');

const certAuthCommonName = 'SKYUX-Developer-CA';
const certCommonName = 'SKYUX-Developer-Certificate';
const certAuthName = 'skyux-ca.crt';
const certName = 'skyux-server.crt';
const keyName = 'skyux-server.key';

const skyuxCertDirPath = path.resolve(`${os.homedir()}/.skyux/certs/`);
const certAuthPath = path.join(skyuxCertDirPath, certAuthName);
const certPath = path.join(skyuxCertDirPath, certName);
const keyPath = path.join(skyuxCertDirPath, keyName);

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

function generateCertificate(extensions, subject, issuer, serial, signWith) {
  const now = new Date();
  const keys = forge.pki.rsa.generateKeyPair(2048);

  const certificate = forge.pki.createCertificate();

  certificate.serialNumber = Buffer.from(serial).toString('hex');
  certificate.publicKey = keys.publicKey;
  certificate.validity.notBefore = now;
  certificate.validity.notAfter.setFullYear(certificate.validity.notBefore.getFullYear() + 1);

  certificate.setSubject(subject);
  certificate.setIssuer(issuer);
  certificate.setExtensions(extensions);

  certificate.sign(
    signWith ? forge.pki.privateKeyFromPem(signWith) : keys.privateKey,
    forge.md.sha256.create()
  );

  return {
    cert: forge.pki.certificateToPem(certificate),
    key: forge.pki.privateKeyToPem(keys.privateKey)
  };
}

function getCertificateAttributes(commonName) {
  return [
    {
      name: 'commonName',
      value: commonName
    },
    {
      name: 'countryName',
      value: 'US'
    },
    {
      name: 'stateOrProvinceName',
      value: 'SC'
    },
    {
      name: 'localityName',
      value: 'Charleston'
    },
    {
      name: 'organizationName',
      value: 'Blackbaud'
    },
    {
      name: 'organizationalUnitName',
      value: 'Research, Delivery, and Operations'
    },
    {
      name: 'emailAddress',
      value: 'sky-build-user@blackbaud.com'
    }
  ];
}

function generate() {
  const certAuthExtensions = [
    { 
      name: 'basicConstraints',
      cA: true,
      critical: true
    },
    {
      name: 'keyUsage',
      keyCertSign: true,
      critical: true
    }
  ];
  const certExtensions = [
    {
      name: 'subjectAltName',
      altNames: [
        {
          type: 2,
          value: 'localhost'
        }
      ]
    },
    {
      name: 'keyUsage',
      dataEncipherment: true,
      digitalSignature: true,
      keyEncipherment: true,
      nonRepudiation: true,
      critical: true
    },
    {
      name: 'extKeyUsage',
      serverAuth: true,
      clientAuth: true
    },
    {
      name: 'basicConstraints',
      cA: false,
      critical: true
    }
  ];
  const certAuthAttributes = getCertificateAttributes(getCertAuthCommonName());
  const certAttributes = getCertificateAttributes(getCertCommonName());
  const now = Date.now();

  logger.info(`Generating ${getCertAuthCommonName()}`);
  const ca = generateCertificate(
    certAuthExtensions,
    certAuthAttributes,
    certAuthAttributes,
    `${now}-01`
  );

  logger.info(`Generating ${getCertCommonName()}`);
  const certificate = generateCertificate(
    certExtensions, 
    certAttributes,
    certAuthAttributes,
    `${now}-02`,
    ca.key
  );

  createCertDirPath();
  fs.writeFileSync(getCertAuthPath(), ca.cert);
  fs.writeFileSync(getCertPath(), certificate.cert);
  fs.writeFileSync(getKeyPath(), certificate.key);
  logger.info(`Successfully generated the following:`);
  logger.info(` - ${getCertAuthPath()}`);
  logger.info(` - ${getCertPath()}`);
  logger.info(` - ${getKeyPath()}`);
}

function getCertCommonName() {
  return certCommonName;
}

function getCertAuthCommonName() {
  return certAuthCommonName;
}

function getCertName() {
  return certName;
}

function getCertAuthName() {
  return certAuthName;
}

function getKeyName() {
  return keyName;
}

function getCertAuthPath() {
  return certAuthPath;
}

function getCertPath() {
  return certPath;
}

function getKeyPath() {
  return keyPath;
}

function getCertDirPath() {
  return skyuxCertDirPath;
}

function createCertDirPath() {
  fs.ensureDirSync(skyuxCertDirPath);
}

function removeCertDirPath() {
  fs.removeSync(skyuxCertDirPath);
}

module.exports = {
  createCertDirPath,
  generate,
  getCertAuthCommonName,
  getCertAuthPath,
  getCertAuthName,
  getCertDirPath,
  getCertCommonName,
  getCertName,
  getCertPath,
  getKeyName,
  getKeyPath,
  removeCertDirPath,
  validate
}