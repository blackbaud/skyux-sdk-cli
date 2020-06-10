const mock = require('mock-require');
const logger = require('@blackbaud/skyux-logger');

describe('cert utils generator', () => {

  beforeEach(() => {
    spyOn(logger, 'info');
    spyOn(logger, 'error');
  });

  afterEach(() => {
    mock.stopAll();
  });

  function spyOnOS() {
    const spyOS = jasmine.createSpyObj('os', ['homedir']);
    mock('os', spyOS);
    return spyOS;
  }

  function spyOnPath() {
    const spyPath = jasmine.createSpyObj('path', ['resolve', 'join', 'dirname', 'indexOf']);
    spyPath.dirname.and.callFake(p => p);
    spyPath.join.and.callFake((...p) => p.join('/'));
    spyPath.resolve.and.callFake(p => p);

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

  function getGenerator() {
    return mock.reRequire('../lib/utils/certs/generator');
  }

  it('should expose a public API', () => {
    const generator = getGenerator();
    const methods = [
      'createCertDirPath',
      'generate',
      'getCertAuthCommonName',
      'getCertAuthPath',
      'getCertAuthName',
      'getCertDirPath',
      'getCertCommonName',
      'getCertName',
      'getCertPath',
      'getKeyName',
      'getKeyPath',
      'removeCertDirPath',
      'validate'
    ];

    methods.forEach(method => expect(generator[method]).toBeDefined());
  });

  it('should return the cert dir path', () => {
    const fakeHomeDir = 'my-homedir';
    const fakeCertDir = `${fakeHomeDir}/.skyux/certs/`;

    const spyOS = spyOnOS();
    const spyPath = spyOnPath();

    spyOS.homedir.and.returnValue(fakeHomeDir)

    const generator = getGenerator();

    expect(generator.getCertDirPath()).toBe(fakeCertDir);
    expect(spyPath.resolve).toHaveBeenCalledWith(fakeCertDir);
  });

  it('should return the common certificate name', () => {
    const generator = getGenerator();
    expect(generator.getCertCommonName()).toBe('SKYUX-Developer-Certificate');
  });

  it('should return the common auth certificate name', () => {
    const generator = getGenerator();
    expect(generator.getCertAuthCommonName()).toBe('SKYUX-Developer-CA');
  });

  it('should return the cert name', () => {
    const generator = getGenerator();
    expect(generator.getCertName()).toBe('skyux-server.crt');
  });

  it('should return the cert auth name', () => {
    const generator = getGenerator();
    expect(generator.getCertAuthName()).toBe('skyux-ca.crt');
  });

  it('should return the key name', () => {
    const generator = getGenerator();
    expect(generator.getKeyName()).toBe('skyux-server.key');
  });

  it('should return the default cert path and key path', () => {
    const fakeHomeDir = 'my-homedir';
    const fakeCertDir = `${fakeHomeDir}/.skyux/certs/`;
    const spyOS = spyOnOS();
    spyOS.homedir.and.returnValue(fakeHomeDir)

    spyOnPath();

    const generator = getGenerator();
    expect(generator.getCertPath()).toBe(`${fakeCertDir}/skyux-server.crt`);
    expect(generator.getKeyPath()).toBe(`${fakeCertDir}/skyux-server.key`);
  });

  describe('validate() method', () => {
    it('should return false if certPath does not exist', () => {
      const spyFS = spyOnFS();
      spyFS.existsSync.and.returnValue(false);
      const generator = getGenerator();

      expect(generator.validate()).toBe(false);
      expect(logger.error.calls.argsFor(0)[0].indexOf(`Error locating certificate:`)).toBe(0);
    });

    it('should return false if keyPath does not exist', () => {
      const spyFS = spyOnFS();

      // Get past the cert check
      spyFS.existsSync.and.callFake(p => p.indexOf('.key') === -1);
      const generator = getGenerator();

      expect(generator.validate()).toBe(false);
      expect(logger.error.calls.argsFor(0)[0].indexOf(`Error locating key:`)).toBe(0);
    });

    it('should return true if certPath and keyPath both exist', () => {
      const spyFS = spyOnFS();
      spyFS.existsSync.and.returnValue(true);
      const generator = getGenerator();

      expect(generator.validate()).toBe(true);
      expect(logger.error).not.toHaveBeenCalled();
    });
  });

  it('should generate a ca, certificate, and key', () => {

    const fakeHomeDir = 'my-homedir';
    const fakeCertDir = `${fakeHomeDir}/.skyux/certs/`;
    const spyOS = spyOnOS();
    const spyFS = spyOnFS();
    const spyPath = spyOnPath();

    const spyPrivateKeyToPem = jasmine.createSpy('privateKeyToPem');
    const spyPrivateKeyFromPem = jasmine.createSpy('privateKeyFromPem');
    const spyGenerateKeyPair = jasmine.createSpy('generateKeyPair');
    const spyMdSha256Crate = jasmine.createSpy('md.sha256.create');
    const spySign = jasmine.createSpy('sign');

    spyOS.homedir.and.returnValue(fakeHomeDir)
    spyPath.dirname.and.callFake(p => p);
    spyPath.join.and.callFake((...p) => p.join('/'));
    spyPath.resolve.and.callFake(p => p);

    spyMdSha256Crate.and.returnValue('created-256');
    spyPrivateKeyToPem.and.returnValue('private-key-to-pem');
    spyPrivateKeyFromPem.and.returnValue('private-key-from-pem');
    spyGenerateKeyPair.and.returnValue({
      publicKey: 'public-key',
      privateKey: 'private-key'
    });

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
          sign: spySign
        }),
        certificateToPem: () => {},
        privateKeyFromPem: spyPrivateKeyFromPem,
        privateKeyToPem: spyPrivateKeyToPem,
        rsa: {
          generateKeyPair: spyGenerateKeyPair
        }
      },
      md: {
        sha256: {
          create: spyMdSha256Crate
        }
      },
    });

    const generator = getGenerator();
    generator.generate();

    expect(spyFS.ensureDirSync).toHaveBeenCalledWith(fakeCertDir);
    expect(spyFS.writeFileSync.calls.argsFor(0)[0]).toContain('skyux-ca.crt');
    expect(spyFS.writeFileSync.calls.argsFor(1)[0]).toContain('skyux-server.crt');
    expect(spyFS.writeFileSync.calls.argsFor(2)[0]).toContain('skyux-server.key');
    expect(logger.info).toHaveBeenCalledWith(`Successfully generated the following:`);
    expect(logger.info).toHaveBeenCalledWith(` - ${fakeCertDir}/skyux-ca.crt`);
    expect(logger.info).toHaveBeenCalledWith(` - ${fakeCertDir}/skyux-server.crt`);
    expect(logger.info).toHaveBeenCalledWith(` - ${fakeCertDir}/skyux-server.key`);

    expect(spyPrivateKeyFromPem).toHaveBeenCalledWith('private-key-to-pem');
    expect(spySign).toHaveBeenCalledWith('private-key', 'created-256');
    expect(spySign).toHaveBeenCalledWith('private-key-from-pem', 'created-256');
  });

  it('should sign the server server with the ca key', () => {

  });

  it('should remove the certificates and key', () => {
    const spyPath = spyOnPath();

    const fakeDefaultPath = 'fake-path';
    spyPath.resolve.and.returnValue(fakeDefaultPath);

    const spyFS = spyOnFS();
    const generator = getGenerator();
    generator.removeCertDirPath();

    expect(spyFS.removeSync).toHaveBeenCalledWith(fakeDefaultPath);
  });

});