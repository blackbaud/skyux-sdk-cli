

const mock = require('mock-require');
const logger = require('@blackbaud/skyux-logger');

describe('cert utils linux', () => {

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
    const spyPath = jasmine.createSpyObj('path', ['resolve']);
    spyPath.resolve.and.callFake(p => p);

    mock('path', spyPath);
    return spyPath;
  }

  function spyOnFS() {
    const spyFS = jasmine.createSpyObj('fs-extra', ['existsSync']);
    mock('fs-extra', spyFS);
    return spyFS;
  }

  function spyOnExecute() {
    const spyExecute = jasmine.createSpy('execute');
    mock('../lib/utils/certs/shared', { execute: spyExecute });
    return spyExecute;
  }

  function spyOnGenerator() {
    const spyGenerator = jasmine.createSpyObj(
      'generator',
      ['getCertAuthPath', 'getCertAuthName', 'getCertAuthCommonName', 'getCertPath', 'getCertName', 'getCertCommonName']
    );
    mock('../lib/utils/certs/generator', spyGenerator );
    return spyGenerator;
  }

  function spyOnSpawn() {
    const spySpawn = jasmine.createSpy('spawn');
    mock('../lib/utils/spawn', spySpawn);
    return spySpawn;
  }

  function getLib() {
    return mock.reRequire('../lib/utils/certs/os-linux');
  }

  async function setupForOS(action) {
    const certAuthPath = 'cert-auth-path';
    const certAuthName = 'cert-auth-name';

    const spyFS = spyOnFS();
    const spyExecute = spyOnExecute();
    const spyGenerator = spyOnGenerator();
    const spySpawn = spyOnSpawn();

    spyFS.existsSync.and.returnValue(false);
    spyGenerator.getCertAuthPath.and.returnValue(certAuthPath);
    spyGenerator.getCertAuthName.and.returnValue(certAuthName);
    spyExecute.and.callFake((command, level, cb) => cb());

    const lib = getLib();
    await lib[action]();

    return {
      certAuthPath,
      certAuthName,
      spyFS,
      spyExecute,
      spyGenerator,
      spySpawn
    };
  }

  async function setupForNSS(action) {
    const homeDir = 'home-dir';
    const linuxChromeNSSPath = 'nssdb';
    const certAuthCommonName = 'cert-auth-common-name';
    const certPath = 'cert-path';
    const certName = 'cert-name';
    const certCommonName = 'cert-common-name';

    const spyOS = spyOnOS();
    const spyFS = spyOnFS();
    const spyPath = spyOnPath();
    const spyExecute = spyOnExecute();
    const spyGenerator = spyOnGenerator();
    const spySpawn = spyOnSpawn();

    spyOS.homedir.and.returnValue(homeDir);
    spyFS.existsSync.and.returnValue(true);
    spyPath.resolve.and.returnValue(linuxChromeNSSPath);
    spyGenerator.getCertAuthCommonName.and.returnValue(certAuthCommonName);
    spyGenerator.getCertPath.and.returnValue(certPath);
    spyGenerator.getCertName.and.returnValue(certName);
    spyGenerator.getCertCommonName.and.returnValue(certCommonName);
    spyExecute.and.callFake((command, level, cb) => level === 'NSS Chrome' ? cb() : Promise.resolve());

    const lib = getLib();
    await lib[action]();

    return {
      homeDir,
      linuxChromeNSSPath,
      certAuthCommonName,
      certPath,
      certName,
      certCommonName,
      spyOS,
      spyFS,
      spyPath,
      spyGenerator,
      spyExecute,
      spySpawn
    };
  }

  it('should expose a public API', () => {
    const lib = getLib();
    const methods = [
      'trust',
      'untrust'
    ];
    methods.forEach(method => expect(lib[method]).toBeDefined());
  });

  it('should trust at the OS level', async () => {
    const results = await setupForOS('trust');
    expect(results.spyExecute).toHaveBeenCalledWith('trust', 'OS', jasmine.any(Function));
    expect(results.spySpawn).toHaveBeenCalledWith(
      `sudo`, `cp`, results.certAuthPath, `/usr/local/share/ca-certificates/${results.certAuthName}`
    );
    expect(results.spySpawn).toHaveBeenCalledWith(`sudo`, `update-ca-certificates`);
    expect(logger.info).toHaveBeenCalledWith(
      `Skipped trusting the SKY UX certificate at the NSS Chrome level.`
    );
  });

  it('should trust at the NSS level', async () => {
    const results = await setupForNSS('trust');
    expect(results.spyPath.resolve).toHaveBeenCalledWith(`${results.homeDir}/.pki/nssdb`);
    expect(results.spyExecute).toHaveBeenCalledWith('trust', 'NSS Chrome', jasmine.any(Function));
    expect(results.spySpawn).toHaveBeenCalledWith(
      `certutil`, `-d`, `sql:${results.linuxChromeNSSPath}`, `-A`, `-t`, `P`, `-n`, results.certAuthCommonName, `-i`, results.certPath
    );
  });

  it('should untrust at the OS level', async () => {
    const results = await setupForOS('untrust');
    expect(results.spyExecute).toHaveBeenCalledWith('untrust', 'OS', jasmine.any(Function));
    expect(results.spySpawn).toHaveBeenCalledWith(
      `sudo`, `rm`, `-rf`, `/usr/local/share/ca-certificates/${results.certName}`
    );
    expect(results.spySpawn).toHaveBeenCalledWith(
      `sudo`, `rm`, `-rf`, `/usr/local/share/ca-certificates/${results.certAuthName}`
    );
    expect(results.spySpawn).toHaveBeenCalledWith(
      `sudo`, `update-ca-certificates`, `--fresh`
    );
    expect(logger.info).toHaveBeenCalledWith(
      `Skipped untrusting the SKY UX certificate at the NSS Chrome level.`
    );
  });

  it('should untrust at the NSS level', async () => {
    const results = await setupForNSS('untrust');
    expect(results.spyExecute).toHaveBeenCalledWith('untrust', 'NSS Chrome', jasmine.any(Function));
    expect(results.spySpawn).toHaveBeenCalledWith(
      `certutil`, `-D`, `-d`, `sql:${results.linuxChromeNSSPath}`, `-n`, results.certCommonName
    );
    expect(results.spySpawn).toHaveBeenCalledWith(
      `certutil`, `-D`, `-d`, `sql:${results.linuxChromeNSSPath}`, `-n`, results.certAuthCommonName
    );
  });

});