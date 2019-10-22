const mock = require('mock-require');
const logger = require('@blackbaud/skyux-logger');

describe('cert utils', () => {

  beforeEach(() => {
    spyOn(logger, 'info');
    spyOn(logger, 'error');
  });

  function spyOnOS() {
    const spyOS = jasmine.createSpyObj('os', ['homedir']);
    mock('os', spyOS);
    return spyOS;
  }

  function spyOnPath() {
    const spyPath = jasmine.createSpyObj('path', ['resolve', 'join', 'dirname']);
    mock('path', spyPath);
    return spyPath;
  }

  function spyOnFS() {
    const spyFS = jasmine.createSpyObj('fs-extra', ['existsSync', 'ensureDirSync', 'writeFileSync']);
    mock('fs-extra', spyFS);
    return spyFS;
  }

  function getUtils() {
    return mock.reRequire('../lib/utils/cert-utils');
  }

  it('should expose a public API', () => {
    const certUtils = getUtils();
    const methods = [
      'generate',
      'getCertName',
      'getCertPath',
      'getKeyPath',
      'validate'
    ];

    methods.forEach(method => expect(certUtils[method]).toBeDefined());
  });

  it('should return the common certificate name', () => {
    const certUtils = mock.reRequire('../lib/utils/cert-utils');
    expect(certUtils.getCertName()).toBe('SKYUX-Developer-Certificate');
  });

  it('should return the default cert path and key path', () => {
    const sslCert = 'custom-ssl-cert-path';
    const sslKey = 'custom-ssl-key-path';

    const certUtils = getUtils();
    expect(certUtils.getCertPath({ sslCert })).toBe(sslCert);
    expect(certUtils.getKeyPath({ sslKey })).toBe(sslKey);
  });

  it('should override the default cert path and key path', () => {
    const spyOS = spyOnOS();
    const spyPath = spyOnPath();

    const customHomeDir = 'my-custom-dir';
    const certName = 'skyux-server.pem';
    const keyName = 'skyux-server.key';

    const customCertRootPath = `${customHomeDir}/.skyux/certs/`;
    spyOS.homedir.and.returnValue(customHomeDir);
    spyPath.resolve.and.callFake(p => p);
    spyPath.join.and.callFake((...p) => p.join('/'));

    const certUtils = getUtils();
    const certPath = certUtils.getCertPath({});
    const keyPath = certUtils.getKeyPath({});

    expect(spyPath.resolve).toHaveBeenCalledWith(customCertRootPath);
    expect(spyPath.join).toHaveBeenCalledWith(customCertRootPath, certName);
    expect(spyPath.join).toHaveBeenCalledWith(customCertRootPath, keyName);
    expect(certPath).toBe(`${customCertRootPath}/${certName}`);
    expect(keyPath).toBe(`${customCertRootPath}/${keyName}`);
  });

  describe('validate() method', () => {
    it('should return false if certPath does not exist', () => {
      const sslCert = 'custom-cert-path';
      const spyFS = spyOnFS();
      spyFS.existsSync.and.returnValue(false);
      const certUtils = getUtils();

      expect(certUtils.validate({ sslCert })).toBe(false);
      expect(logger.error).toHaveBeenCalledWith(`Error locating certificate: ${sslCert}`);
    });

    it('should return false if keyPath does not exist', () => {
      const sslKey = 'custom-key-path';
      const spyFS = spyOnFS();

      // Get past the cert check
      spyFS.existsSync.and.callFake(p => p !== sslKey);
      const certUtils = getUtils();

      expect(certUtils.validate({ sslKey })).toBe(false);
      expect(logger.error).toHaveBeenCalledWith(`Error locating key: ${sslKey}`);
    });

    it('should return true if certPath and keyPath both exist', () => {
      const spyFS = spyOnFS();
      spyFS.existsSync.and.returnValue(true);
      const certUtils = getUtils();

      expect(certUtils.validate({ })).toBe(true);
      expect(logger.error).not.toHaveBeenCalled();
    });
  });

  it('should generate a certificate', () => {
    const argv = {
      sslCert: 'custom-cert-path',
      sslKey: 'custom-key-path'
    };

    const spyFS = spyOnFS();
    const spyPath = spyOnPath();
    spyPath.dirname.and.callFake(p => p);

    mock('node-forge', {
      pki: {
        createCertificate: () => ({
          validity: {
            notAfter: {
              setFullYear: () => {}
            }
          },
          setSubject: () => {},
          setIssuer: () => {},
          setExtensions: () => {},
          sign: () => {}
        }),
        certificateToPem: () => {},
        privateKeyToPem: () => {},
        rsa: {
          generateKeyPair: () => ({
            publicKey: ''
          })
        }
      },
      md: {
        sha256: {
          create: () => {}
        }
      },
    });

    const certUtils = getUtils();
    certUtils.generate(argv);

    expect(spyPath.dirname).toHaveBeenCalledWith(argv.sslCert);
    expect(spyPath.dirname).toHaveBeenCalledWith(argv.sslKey);
    expect(spyFS.ensureDirSync).toHaveBeenCalledWith(argv.sslCert);
    expect(spyFS.ensureDirSync).toHaveBeenCalledWith(argv.sslKey);
    expect(logger.info).toHaveBeenCalledWith(`Successfully generated ${argv.sslCert} and ${argv.sslKey}.`);
  });

});