const mock = require('mock-require');
const logger = require('@blackbaud/skyux-logger');

describe('spawn util', () => {
  beforeEach(() => {
    spyOn(logger, 'error');
    spyOn(logger, 'warn');
    spyOn(logger, 'info');
  });

  function getLib() {
    return mock.reRequire('../lib/utils/spawn');
  }

  async function setupTest(exitCode) {
    const spyChildProcess = jasmine.createSpyObj('child_process', ['spawn']);
    const spySpawnOn = jasmine.createSpyObj('spawn', ['on']);

    mock('child_process', spyChildProcess);
    spyChildProcess.spawn.and.returnValue(spySpawnOn);
    spySpawnOn.on.and.callFake((evt, cb) => {
      cb(exitCode)
    });

    const spawn = getLib();
    return await spawn('a', 'b', 'c');
  }

  it('should call spawn and resolve', async () => {
    await setupTest(0);
    expect(logger.info).toHaveBeenCalledWith(
      'Executing: `a b c`'
    );
  });

  it('should handle an error', async () => {
    try {
      await setupTest(1);
    } catch (code) {
      expect(code).toBe(1);
      expect(logger.error).toHaveBeenCalledWith(
        '\nError executing: `a b c`'
      );
    }
  });

});