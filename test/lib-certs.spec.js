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
      'getCertName',
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

  async function setupPlatformTest(action, platform) {
    const argv = { _: ['certs', action]};

    const spySpawn = jasmine.createSpy('spawn');
    spySpawn.and.callFake(() => Promise.resolve());
    mock('../lib/utils/spawn', spySpawn);

    const spyOS = jasmine.createSpyObj('os', ['type', 'homedir']);
    spyOS.type.and.returnValue(platform);
    mock('os', spyOS);

    const spyCertUtils = spyOnCertUtils();

    const lib = getLib();
    await lib(argv);

    return {
      spySpawn,
      spyOn,
      spyCertUtils
    };
  }

  async function runPlatformTest(action, platform) {
    const spies = await setupPlatformTest(action, platform);
    if (action === 'trust') {
      expect(spies.spyCertUtils.generate).toHaveBeenCalled();
    }
    if (action === 'untrust') {
      expect(spies.spyCertUtils.remove).toHaveBeenCalled();
    }
    expect(spies.spySpawn).toHaveBeenCalled();
  }

  function runActionTests(action) {
    it('should handle the Darwin (mac) platform', async () => {
      await runPlatformTest(action, 'Darwin');
    });
  
    it('should handle the Linux platform', async () => {
      await runPlatformTest(action, 'Linux');
    });
  
    it('should handle the Windows platform', async () => {
      await runPlatformTest(action, 'Windows_NT');
    });

    it('should handle an unknown platform', async () => {
      await setupPlatformTest(action, 'unknown-platform');
      expect(logger.error).toHaveBeenCalledWith(
        `Unable to automatically ${action} based on your OS.`
      )
    });
  }

  describe('trust action', () => {
    runActionTests('trust');
  });

  describe('untrust action', () => {
    runActionTests('untrust');
  });

  it('should handle the validate action', () => {
    const argv = { _: ['certs', 'validate']};
    const spyCertUtils = spyOnCertUtils();
    const lib = getLib();
    
    lib(argv);
    expect(spyCertUtils.validate).toHaveBeenCalledWith(argv);
  });

  it('should handle an unknown action', () => {
    const lib = getLib();
    lib({ _: ['certs', 'asdf']});
    expect(logger.warn).toHaveBeenCalledWith(`Unknown action for the certs command.`);
    expect(logger.warn).toHaveBeenCalledWith(`Available actions are trust, untrust, and validate.`);
  });

  it('should handle an error', () => {
    const err = 'fake-error';
    const argv = { _: ['certs', 'validate']};
    const spyCertUtils = spyOnCertUtils();
    spyCertUtils.validate.and.callFake(() => {
      throw err;
    });
    const lib = getLib();
    
    lib(argv);
    expect(logger.error).toHaveBeenCalledWith(`Command exited with error: ${err}`);
  })
});