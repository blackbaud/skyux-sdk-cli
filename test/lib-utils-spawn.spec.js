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

  async function setupTest(cbEvent, cbParam) {
    const spyChildProcess = jasmine.createSpyObj('child_process', ['spawn']);
    const spySpawnOn = jasmine.createSpyObj('spawn', ['on']);

    mock('child_process', spyChildProcess);
    spyChildProcess.spawn.and.returnValue(spySpawnOn);
    spySpawnOn.on.and.callFake((evt, cb) => {
      if (evt === cbEvent) {
        cb(cbParam);
      }
    });

    const spawn = getLib();
    return await spawn('a', 'b', 'c');
  }

  it('should call spawn and resolve', async () => {
    await setupTest('exit', 0);
    expect(logger.info).toHaveBeenCalledWith(
      'Executing: `a b c`'
    );
  });

  it('should handle a catastrophic error', async () => {
    const expectedErr = 'custom-error';
    try {
      await setupTest('error', expectedErr);
    } catch (err) {
      expect(err).toBe(expectedErr);
      expect(logger.error).toHaveBeenCalledWith(
        '\nError executing (code 0): `a b c`'
      );
    }
  });

  it('should handle an graceful error', async () => {
    try {
      await setupTest('exit', 1);
    } catch (code) {
      expect(code).toBe(1);
      expect(logger.error).toHaveBeenCalledWith(
        '\nError executing (code 1): `a b c`'
      );
    }
  });

});