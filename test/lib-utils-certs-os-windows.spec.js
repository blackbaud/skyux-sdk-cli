

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

    expect(spyPath.resolve).toHaveBeenCalledWith(certDirPath, 'skyux-temp-windows-commands.bat');
    expect(spyFS.writeFileSync).toHaveBeenCalledWith(batchResolve, commands.join('\n'));
    expect(spyExecute).toHaveBeenCalledWith(action, 'OS', jasmine.any(Function));
    expect(spySpawn).toHaveBeenCalledWith(`powershell`, `start-process ${batchResolve} -verb runas -wait`);
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
    await run('trust', {})
  });

  it('should trust at the OS level without PAUSE', async () => {
    await run('trust', { pause: false })
  });

  it('should untrust at the OS level with PAUSE', async () => {
    await run('untrust', {})
  });

  it('should untrust at the OS level without PAUSE', async () => {
    await run('untrust', { pause: false })
  });

});