

const mock = require('mock-require');

describe('cert utils windows', () => {

  afterEach(() => {
    mock.stopAll();
  });

  function spyOnPath() {
    const spyPath = jasmine.createSpyObj('path', ['resolve']);
    spyPath.resolve.and.callFake((...p) => p.join('/'));

    mock('path', spyPath);
    return spyPath;
  }

  function spyOnFS() {
    const spyFS = jasmine.createSpyObj('fs-extra', ['writeFileSync', 'removeSync']);
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
      ['getCertDirPath', 'getCertAuthPath', 'getCertAuthCommonName', 'getCertCommonName']
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
    return mock.reRequire('../lib/utils/certs/os-windows');
  }

  async function run(action, argv) {
    const certCommonName = 'cert-common-name';
    const certAuthPath = 'cert-auth-path';
    const certAuthCommonName = 'cert-auth-common-name';
    const certDirPath = 'cert-dir-path';
    const batchResolve = `${certDirPath}/skyux-temp-windows-commands.bat`;

    const spyFS = spyOnFS();
    const spyPath = spyOnPath();
    const spyGenerator = spyOnGenerator();
    const spyExecute = spyOnExecute();
    const spySpawn = spyOnSpawn();

    spyGenerator.getCertDirPath.and.returnValue(certDirPath);
    spyGenerator.getCertAuthPath.and.returnValue(certAuthPath);
    spyGenerator.getCertCommonName.and.returnValue(certCommonName);
    spyGenerator.getCertAuthCommonName.and.returnValue(certAuthCommonName);
    spyExecute.and.callFake((action, level, cb) => cb());

    const lib = getLib();
    await lib[action](argv);

    const commands = [
      `certutil -delstore root ${certCommonName}`,
      `certutil -delstore root ${certAuthCommonName}`
    ];

    if (action === 'trust') {
      commands.push(`certutil -addstore -f root "${certAuthPath}"`);
    }

    if (argv.pause !== false) {
      commands.push('PAUSE');
    }

    return {
      certDirPath,
      batchResolve,
      commands,
      spyPath,
      spyFS,
      spyExecute,
      spySpawn
    };
  }

  async function test(action, argv) {
    const results = await run(action, argv);
    
    expect(results.spyPath.resolve).toHaveBeenCalledWith(results.certDirPath, 'skyux-temp-windows-commands.bat');
    expect(results.spyFS.writeFileSync).toHaveBeenCalledWith(results.batchResolve, results.commands.join('\n'));
    expect(results.spyExecute).toHaveBeenCalledWith(action, 'OS', jasmine.any(Function));
    expect(results.spySpawn).toHaveBeenCalledWith(`powershell`, `start-process ${results.batchResolve} -verb runas -wait`);
    expect(results.spyFS.removeSync).toHaveBeenCalledWith(results.batchResolve);
  }

  it('should expose a public API', () => {
    const lib = getLib();
    const methods = [
      'trust',
      'untrust'
    ];
    methods.forEach(method => expect(lib[method]).toBeDefined());
  });

  it('should trust at the OS level with PAUSE', async () => {
    await test('trust', {})
  });

  it('should trust at the OS level without PAUSE', async () => {
    await test('trust', { pause: false })
  });

  it('should untrust at the OS level with PAUSE', async () => {
    await test('untrust', {})
  });

  it('should untrust at the OS level without PAUSE', async () => {
    await test('untrust', { pause: false })
  });

  it('should always delete the batch file but let the error bubble up', async () => {
    const err = 'execute-error';
    const spyFS = spyOnFS();
    const spyExecute = spyOnExecute();

    spyExecute.and.throwError(err);
    const lib = getLib();

    await expectAsync(lib.trust({})).toBeRejectedWithError(err);
    expect(spyFS.removeSync).toHaveBeenCalled();
  });

});