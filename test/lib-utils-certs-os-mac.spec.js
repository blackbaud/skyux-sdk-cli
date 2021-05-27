const mock = require('mock-require');

describe('cert utils mac', () => {
  afterEach(() => {
    mock.stopAll();
  });

  function spyOnExecute() {
    const spyExecute = jasmine.createSpy('execute');
    spyExecute.and.callFake((action, level, cb) => cb());
    mock('../lib/utils/certs/shared', { execute: spyExecute });
    return spyExecute;
  }

  function spyOnGenerator() {
    const spyGenerator = jasmine.createSpyObj('generator', [
      'getCertAuthPath',
      'getCertAuthCommonName',
      'getCertCommonName'
    ]);
    mock('../lib/utils/certs/generator', spyGenerator);
    return spyGenerator;
  }

  function spyOnSpawn() {
    const spySpawn = jasmine.createSpy('spawn');
    mock('../lib/utils/spawn', spySpawn);
    return spySpawn;
  }

  function getLib() {
    return mock.reRequire('../lib/utils/certs/os-mac');
  }

  it('should expose a public API', () => {
    const lib = getLib();
    const methods = ['trust', 'untrust'];
    methods.forEach((method) => expect(lib[method]).toBeDefined());
  });

  it('should trust at the OS level', async () => {
    const certAuthPath = 'cert-auth-path';

    const spyExecute = spyOnExecute();
    const spyGenerator = spyOnGenerator();
    const spySpawn = spyOnSpawn();
    const lib = getLib();

    spyGenerator.getCertAuthPath.and.returnValue(certAuthPath);

    await lib.trust();

    expect(spyExecute).toHaveBeenCalledWith(
      'trust',
      'OS',
      jasmine.any(Function)
    );
    expect(spySpawn).toHaveBeenCalledWith(
      `sudo`,
      `security`,
      `add-trusted-cert`,
      `-d`,
      `-r`,
      `trustRoot`,
      `-k`,
      `/Library/Keychains/System.keychain`,
      certAuthPath
    );
  });

  it('should untrust at the OS level', async () => {
    const certAuthCommonName = 'cert-auth-common-name';
    const certCommonName = 'cert-common-name';

    const spyExecute = spyOnExecute();
    const spyGenerator = spyOnGenerator();
    const spySpawn = spyOnSpawn();
    const lib = getLib();

    spyGenerator.getCertAuthCommonName.and.returnValue(certAuthCommonName);
    spyGenerator.getCertCommonName.and.returnValue(certCommonName);

    await lib.untrust();

    expect(spyExecute).toHaveBeenCalledWith(
      'untrust',
      'OS',
      jasmine.any(Function)
    );
    expect(spySpawn).toHaveBeenCalledWith(
      `sudo`,
      `security`,
      `delete-certificate`,
      `-c`,
      certAuthCommonName
    );
    expect(spySpawn).toHaveBeenCalledWith(
      `sudo`,
      `security`,
      `delete-certificate`,
      `-c`,
      certCommonName
    );
  });
});
