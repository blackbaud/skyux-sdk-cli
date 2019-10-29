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
    const spyFS = jasmine.createSpyObj('fs-extra', [
      'existsSync',
      'ensureDirSync',
      'removeSync',
      'writeFileSync'
    ]);
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
      'getCertCommonName',
      'getCertName',
      'getKeyName',
      'getCertPath',
      'getKeyPath',
      'remove',
      'validate'
    ];

    methods.forEach(method => expect(certUtils[method]).toBeDefined());
  });

  it('should return the common certificate name', () => {
    const certUtils = mock.reRequire('../lib/utils/cert-utils');
    expect(certUtils.getCertCommonName()).toBe('SKYUX-Developer-Certificate');
  });

  it('should return the cert name', () => {
    const certUtils = mock.reRequire('../lib/utils/cert-utils');
    expect(certUtils.getCertName()).toBe('skyux-server.crt');
  });

  it('should return the key name', () => {
    const certUtils = mock.reRequire('../lib/utils/cert-utils');
    expect(certUtils.getKeyName()).toBe('skyux-server.key');
  });

  it('should return the default cert path and key path', () => {
    const fakeHomeDir = 'my-homedir';
    const fakeCertDir = `${fakeHomeDir}/.skyux/certs/`;
    const spyOS = spyOnOS();
    spyOS.homedir.and.returnValue(fakeHomeDir)

    const spyPath = spyOnPath();

    spyPath.dirname.and.callFake(p => p);
    spyPath.join.and.callFake((...p) => p.join('/'));
    spyPath.resolve.and.callFake(p => p);

    const certUtils = getUtils();
    expect(certUtils.getCertPath()).toBe(`${fakeCertDir}/skyux-server.crt`);
    expect(certUtils.getKeyPath()).toBe(`${fakeCertDir}/skyux-server.key`);
  });

  describe('validate() method', () => {
    it('should return false if certPath does not exist', () => {
      const spyFS = spyOnFS();
      spyFS.existsSync.and.returnValue(false);
      const certUtils = getUtils();

      expect(certUtils.validate()).toBe(false);
      expect(logger.error.calls.argsFor(0)[0].indexOf(`Error locating certificate:`)).toBe(0);
    });

    it('should return false if keyPath does not exist', () => {
      const spyFS = spyOnFS();

      // Get past the cert check
      spyFS.existsSync.and.callFake(p => p.indexOf('.key') === -1);
      const certUtils = getUtils();

      expect(certUtils.validate()).toBe(false);
      expect(logger.error.calls.argsFor(0)[0].indexOf(`Error locating key:`)).toBe(0);
    });

    it('should return true if certPath and keyPath both exist', () => {
      const spyFS = spyOnFS();
      spyFS.existsSync.and.returnValue(true);
      const certUtils = getUtils();

      expect(certUtils.validate()).toBe(true);
      expect(logger.error).not.toHaveBeenCalled();
    });
  });

  it('should generate a certificate', () => {

    const fakeHomeDir = 'my-homedir';
    const fakeCertDir = `${fakeHomeDir}/.skyux/certs/`;
    const spyOS = spyOnOS();
    spyOS.homedir.and.returnValue(fakeHomeDir)

    const spyFS = spyOnFS();
    const spyPath = spyOnPath();

    spyPath.dirname.and.callFake(p => p);
    spyPath.join.and.callFake((...p) => p.join('/'));
    spyPath.resolve.and.callFake(p => p);

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
    certUtils.generate();

    expect(spyFS.ensureDirSync).toHaveBeenCalledWith(fakeCertDir);
    expect(spyFS.writeFileSync.calls.argsFor(0)[0]).toContain('skyux-server.crt');
    expect(spyFS.writeFileSync.calls.argsFor(1)[0]).toContain('skyux-server.key');
    expect(logger.info).toHaveBeenCalledWith(`Successfully generated ${fakeCertDir}/skyux-server.crt and ${fakeCertDir}/skyux-server.key.`);
  });

  it('should remove the certificate and key', () => {
    const spyPath = spyOnPath();

    const fakeDefaultPath = 'fake-path';
    spyPath.resolve.and.returnValue(fakeDefaultPath);

    const spyFS = spyOnFS();
    const certUtils = getUtils();
    certUtils.remove();

    expect(spyFS.removeSync).toHaveBeenCalledWith(fakeDefaultPath);
  });

});