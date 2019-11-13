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

  function setupTest(cbEvent, cbParam) {
    const spyChildProcess = jasmine.createSpyObj('child_process', ['spawn']);
    const spySpawnOn = jasmine.createSpyObj('spawn', ['on']);

    mock('child_process', spyChildProcess);
    spyChildProcess.spawn.and.returnValue(spySpawnOn);
    spySpawnOn.on.and.callFake((evt, cb) => {
      if (evt === cbEvent) {
        cb(cbParam);
      }
    });

    return {
      spyChildProcess,
      spySpawnOn
    };
  }

  async function runTest(cbEvent, cbParam) {
    const spies = setupTest(cbEvent, cbParam);
    const spawn = getLib();
    await spawn('a', 'b', 'c');
    return spies;
  }

  it('should call spawn and resolve', async () => {
    await runTest('exit', 0);
    expect()
    expect(logger.info).toHaveBeenCalledWith(
      'Executing: `a b c`'
    );
  });

  it('should handle a catastrophic error', async () => {
    const expectedErr = 'custom-error';
    try {
      await runTest('error', expectedErr);
    } catch (err) {
      expect(err).toBe(expectedErr);
      expect(logger.error).toHaveBeenCalledWith(
        '\nError executing (code 0): `a b c`'
      );
    }
  });

  it('should handle an graceful error', async () => {
    try {
      await runTest('exit', 1);
    } catch (code) {
      expect(code).toBe(1);
      expect(logger.error).toHaveBeenCalledWith(
        '\nError executing (code 1): `a b c`'
      );
    }
  });

  describe('spawnWithOptions', () => {
    it('should expose spawnWithOptions', async () => {
      const spawn = getLib();
      expect(spawn.spawnWithOptions).toBeDefined();
    });
  
    it('should default to `stdio: inherit`', async () => {
      const spies = setupTest('exit', 0);
      const spawn = getLib();
      await spawn('a', 'b', 'c');

      const [ spawnCommand, spawnArgs, spawnOptions ] = spies.spyChildProcess.spawn.calls.argsFor(0);
      expect(spawnCommand).toEqual('a');
      expect(spawnArgs).toEqual(['b', 'c']);
      expect(spawnOptions).toEqual(
        jasmine.objectContaining({
          stdio: 'inherit'
        })
      );
    });

    it('should accept custom options', async () => {
      const options = { custom: true };
      const spies = setupTest('exit', 0);
      const spawn = getLib();
      await spawn.spawnWithOptions(options, 'a', 'b', 'c');

      const [ spawnCommand, spawnArgs, spawnOptions ] = spies.spyChildProcess.spawn.calls.argsFor(0);
      expect(spawnCommand).toEqual('a');
      expect(spawnArgs).toEqual(['b', 'c']);
      expect(spawnOptions).toEqual(
        jasmine.objectContaining(options)
      );
    });
  });

});