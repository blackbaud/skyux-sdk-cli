const mock = require('mock-require');
const logger = require('@blackbaud/skyux-logger');

describe('skyux certs command', () => {
  beforeEach(() => {
    spyOn(logger, 'error');
    spyOn(logger, 'warn');
    spyOn(logger, 'info');
  });

  function spyOnCertUtils() {
    const spyCertUtils = jasmine.createSpyObj('certUtils', [
      'generate',
      'getCertCommonName',
      'getCertName',
      'getKeyName',
      'getCertPath',
      'getKeyPath',
      'remove',
      'validate'
    ]);
    mock('../lib/utils/cert-utils', spyCertUtils);
    return spyCertUtils;
  }

  function getLib() {
    return mock.reRequire('../lib/certs');
  }

  function setupPlatformTest(action, platform, includeNoPause) {
    const argv = { _: ['certs', action]};

    // minimist converts --no-pause to pause: false
    if (includeNoPause) {
      argv.pause = false;
    }

    const spySpawn = jasmine.createSpy('spawn');
    spySpawn.and.callFake(() => Promise.resolve());
    mock('../lib/utils/spawn', spySpawn);

    const spyOS = jasmine.createSpyObj('os', ['type', 'homedir']);
    spyOS.type.and.returnValue(platform);
    mock('os', spyOS);

    const spyCertUtils = spyOnCertUtils();

    const lib = getLib();

    return {
      argv,
      lib,
      spySpawn,
      spyOn,
      spyCertUtils
    };
  }

  async function runPlatformTest(action, platform, includeNoPause) {
    const setup = setupPlatformTest(action, platform, includeNoPause);
    await setup.lib(setup.argv);

    if (action === 'install') {
      expect(setup.spyCertUtils.generate).toHaveBeenCalled();
    }
    if (action === 'uninstall') {
      expect(setup.spyCertUtils.remove).toHaveBeenCalled();
    }
    expect(setup.spySpawn).toHaveBeenCalled();
    return setup;
  }

  function runActionTests(action) {
    it('should handle the Darwin (mac) platform', async () => {
      await runPlatformTest(action, 'Darwin');
    });

    it('should handle an error on the Darwin (mac) platform', async () => {
      const err = 'custom-error';
      const setup = setupPlatformTest(action, 'Darwin');

      setup.spySpawn.and.throwError(err);
      await setup.lib(setup.argv)

      expect(logger.error).toHaveBeenCalledWith(`Unsuccessful in completing last task: ${new Error(err)}`);
    });
  
    it('should handle the Linux platform', async () => {
      await runPlatformTest(action, 'Linux');
    });

    it('should handle an error on the Linux platform', async () => {
      const err = 'custom-error';
      const setup = setupPlatformTest(action, 'Linux');
      
      setup.spySpawn.and.throwError(err);
      await setup.lib(setup.argv)

      expect(logger.error).toHaveBeenCalledWith(`Unsuccessful in completing last task: ${new Error(err)}`);
    });
  
    it('should handle the Windows platform', async () => {
      const spies = await runPlatformTest(action, 'Windows_NT');
      expect(spies.spySpawn.calls.argsFor(0)[1].indexOf('PAUSE')).not.toEqual(-1);
    });

    it('should handle an error on the Windows platform', async () => {
      const err = 'custom-error';
      const setup = setupPlatformTest(action, 'Windows_NT');
      
      setup.spySpawn.and.throwError(err);
      await setup.lib(setup.argv)

      expect(logger.error).toHaveBeenCalledWith(`Unsuccessful in completing last task: ${new Error(err)}`);
    });

    it('should handle the Windows platform (with --no-pause)', async () => {
      const spies = await runPlatformTest(action, 'Windows_NT', true);
      expect(spies.spySpawn.calls.argsFor(0)[1].indexOf('PAUSE')).toEqual(-1);
    });

    it('should handle an unknown platform', async () => {
      const setup = await setupPlatformTest(action, 'unknown-platform');
      await setup.lib(setup.argv);

      expect(logger.error).toHaveBeenCalledWith(
        `Unable to automatically ${action} based on your OS.`
      )
    });

    it('should handle an error when generating', async () => {
      // Any support platform
      const setup = setupPlatformTest(action, 'Windows_NT');
      const err = 'custom-error';

      // Handles the install action
      setup.spyCertUtils.generate.and.throwError(err);

      // Handles the uninstall action
      setup.spyCertUtils.remove.and.throwError(err);
      
      await setup.lib(setup.argv);
      expect(logger.error).toHaveBeenCalledWith(
        `Unable to ${action} the SKY UX certificate.`
      )
    });
  }

  describe('install action', () => {
    runActionTests('install');
  });

  describe('uninstall action', () => {
    runActionTests('uninstall');
  });

  it('should handle the generate action', () => {
    const argv = { _: ['certs', 'generate']};
    const spyCertUtils = spyOnCertUtils();
    const lib = getLib();
    
    lib(argv);
    expect(spyCertUtils.generate).toHaveBeenCalled();    
  });

  it('should handle the validate action', () => {
    const argv = { _: ['certs', 'validate']};
    const spyCertUtils = spyOnCertUtils();
    const lib = getLib();
    
    lib(argv);
    expect(spyCertUtils.validate).toHaveBeenCalled();
  });

  it('should handle an unknown action', () => {
    const lib = getLib();
    lib({ _: ['certs', 'asdf']});
    expect(logger.warn).toHaveBeenCalledWith(`Unknown action for the certs command.`);
    expect(logger.warn).toHaveBeenCalledWith(`Available actions are install and uninstall.`);
  });
});