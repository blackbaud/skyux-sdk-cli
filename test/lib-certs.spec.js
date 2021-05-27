const mock = require('mock-require');
const logger = require('@blackbaud/skyux-logger');

describe('skyux certs command', () => {
  beforeEach(() => {
    spyOn(logger, 'error');
    spyOn(logger, 'warn');
    spyOn(logger, 'info');
  });

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
      'generate',
      'removeCertDirPath',
      'validate'
    ]);
    spyGenerator.validate.and.returnValue(true);
    mock('../lib/utils/certs/generator', spyGenerator);
    return spyGenerator;
  }

  function spyOnOS() {
    const spyOS = jasmine.createSpyObj('os', ['type', 'homedir']);
    mock('os', spyOS);
    return spyOS;
  }

  function spyOnCertsOS(os) {
    const spyCertsOS = jasmine.createSpyObj('certs-os', ['trust', 'untrust']);
    mock(`../lib/utils/certs/os-${os}`, spyCertsOS);
    return spyCertsOS;
  }

  function getLib() {
    return mock.reRequire('../lib/certs');
  }

  async function runTest(action, osType, certsUtilFile) {
    const spyOS = spyOnOS();
    const spyExecute = spyOnExecute();
    const spyGenerator = spyOnGenerator();
    const spyCertsOS = spyOnCertsOS(certsUtilFile);

    spyOS.type.and.returnValue(osType);

    const argv = { _: ['certs', action] };
    const lib = getLib();
    await lib(argv);

    return {
      argv,
      spyExecute,
      spyGenerator,
      spyCertsOS
    };
  }

  async function runUninstallTest(osType, certsUtilFile) {
    const results = await runTest('uninstall', osType, certsUtilFile);

    expect(results.spyExecute).toHaveBeenCalledWith(
      'uninstall',
      'system',
      jasmine.any(Function)
    );
    expect(results.spyCertsOS.untrust).toHaveBeenCalledWith(results.argv);
    expect(results.spyGenerator.removeCertDirPath).toHaveBeenCalled();
  }

  async function runInstallTest(osType, certsUtilFile) {
    const results = await runTest('install', osType, certsUtilFile);

    if (osType !== 'Windows_NT') {
      expect(results.spyExecute).toHaveBeenCalledWith(
        'uninstall',
        'system',
        jasmine.any(Function)
      );
      expect(results.spyCertsOS.untrust).toHaveBeenCalledWith(results.argv);
      expect(results.spyGenerator.removeCertDirPath).toHaveBeenCalled();
    }

    expect(results.spyExecute).toHaveBeenCalledWith(
      'install',
      'system',
      jasmine.any(Function)
    );
    expect(results.spyGenerator.generate).toHaveBeenCalled();
    expect(results.spyCertsOS.trust).toHaveBeenCalledWith(results.argv);
  }

  async function runUnsupportedPlatformTest(action, actionMessage) {
    const spyOS = spyOnOS();
    const spyExecute = spyOnExecute();

    spyOS.type.and.returnValue('unsupported-platform');

    const lib = getLib();
    await lib({ _: ['certs', action] });

    expect(spyExecute).toHaveBeenCalledWith(
      'uninstall',
      'system',
      jasmine.any(Function)
    );
    expect(logger.error).toHaveBeenCalledWith(
      `Unsupported platform. You will need to manually ${actionMessage} the certificate.`
    );
  }

  it('should handle the generate action', () => {
    const spyGenerator = spyOnGenerator();
    const lib = getLib();
    lib({ _: ['certs', 'generate'] });
    expect(spyGenerator.generate).toHaveBeenCalled();
  });

  it('should handle the validate action', () => {
    const spyGenerator = spyOnGenerator();
    const lib = getLib();
    lib({ _: ['certs', 'validate'] });
    expect(spyGenerator.validate).toHaveBeenCalled();
  });

  it('should handle an unknown action', () => {
    const lib = getLib();
    lib({ _: ['certs', 'asdf'] });
    expect(logger.warn).toHaveBeenCalledWith(
      `Unknown action for the certs command.`
    );
    expect(logger.warn).toHaveBeenCalledWith(
      `Available actions are install and uninstall.`
    );
  });

  describe('install action', () => {
    it('should handle the Darwin (Mac) platform', async () => {
      await runInstallTest('Darwin', 'mac');
    });

    it('should handle the Linux platform', async () => {
      await runInstallTest('Linux', 'linux');
    });

    it('should handle the Windows_NT platform', async () => {
      await runInstallTest('Windows_NT', 'windows');
    });

    it('should handle an unsupported platform', async () => {
      await runUnsupportedPlatformTest('install', 'trust');
    });
  });

  describe('uninstall action', () => {
    it('should handle the Darwin (Mac) platform', async () => {
      await runUninstallTest('Darwin', 'mac');
    });

    it('should handle the Linux platform', async () => {
      await runUninstallTest('Linux', 'linux');
    });

    it('should handle the Windows_NT platform', async () => {
      await runUninstallTest('Windows_NT', 'windows');
    });

    it('should handle an unsupported platform', async () => {
      await runUnsupportedPlatformTest('uninstall', 'untrust');
    });
  });
});
