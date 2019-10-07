const mock = require('mock-require');
const logger = require('@blackbaud/skyux-logger');

describe('npm install library', () => {
  let mockFs;
  let spyLoggerPromise;

  beforeEach(() => {
    mockFs = {
      existsSync() {},
      removeSync() {}
    };

    spyLoggerPromise = jasmine.createSpyObj('logger', ['succeed','fail']);
    spyOn(logger, 'promise').and.returnValue(spyLoggerPromise);
    spyOn(logger, 'warn');
    spyOn(logger, 'error');

    mock('fs-extra', mockFs);
  });

  afterEach(() => {
    mock.stopAll();
  });

  function getArgsFromSpawn(settings) {
    let spawnArgs;

    mock('cross-spawn', (command, flags, args) => {
      spawnArgs = args;
      return jasmine.createSpyObj('spawn', ['on']);
    });

    const npmInstall = mock.reRequire('../lib/utils/npm-install');

    npmInstall(settings);

    return spawnArgs;
  }

  function getPromiseFromSpawn(exitCode, customError) {
    const spySpawnStderr = jasmine.createSpyObj('stderr', ['on']);
    const spySpawn = jasmine.createSpyObj('spawn', ['on', 'stderr']);

    spySpawn.stderr = spySpawnStderr;
    mock('cross-spawn', () => spySpawn);

    const npmInstall = mock.reRequire('../lib/utils/npm-install');
    const npmInstallPromise = npmInstall();

    if (customError) {
      spySpawnStderr.on.calls.argsFor(0)[1](Buffer.from(customError));
    }

    spySpawn.on.calls.argsFor(0)[1](exitCode);

    return npmInstallPromise;
  }

  it('should not set cwd in path if not passed in the settings', () => {
    expect(getArgsFromSpawn({})).toEqual({});
  });

  it('should set cwd in path if not passed in the settings', () => {
    const myCustomPath = 'my-custom-path';
    expect(getArgsFromSpawn({ path: myCustomPath })).toEqual({
      cwd: myCustomPath
    });
  });

  it('should set child spawn stdio if passed in the settings', () => {
    expect(getArgsFromSpawn({
      stdio: 'foobar'
    })).toEqual({
      stdio: 'foobar'
    });
    expect(logger.promise).toHaveBeenCalledWith(
      'Running npm install. This step can take several minutes. Add `--logLevel verbose` for realtime output.'
    );
  });

  it('should not log verbose suggestion if stdio is inherit', () => {
    getArgsFromSpawn({ stdio: 'inherit' });
    expect(logger.promise).toHaveBeenCalledWith(
      'Running npm install. This step can take several minutes.'
    );
  })

  it('should reject with any error caught from npm install', (done) => {
    const error = 'custom error it failed';
    getPromiseFromSpawn(1, error).catch(err => {
      expect(err).toEqual(error);
      expect(logger.promise).toHaveBeenCalledWith('Running npm install. This step can take several minutes.');
      expect(spyLoggerPromise.fail).toHaveBeenCalled();
      done();
    });
  });

  it('should listen for the exit event and reject if exit code is not 0', (done) => {
    getPromiseFromSpawn(1).catch((err) => {
      expect(err).toEqual('Unknown error occured. `npm install` has failed.  Run `skyux install --logLevel verbose` for more information.');
      expect(spyLoggerPromise.fail).toHaveBeenCalled();
      done();
    });
  });

  it('should listen for the exit event and resolve if exit code is 0', (done) => {
    getPromiseFromSpawn(0).then(() => {
      expect(spyLoggerPromise.succeed).toHaveBeenCalled();
      done();
    });
  });

  it('should log npm warnings from stdout and stderr', (done) => {
    const output = `
npm WARN warning should show
npm something else that does not show
npm WARN another warning
`;
    getPromiseFromSpawn(0, output).then(() => {
      expect(logger.warn).toHaveBeenCalledWith(
        '\nYou may need to address the following warnings:\n'
      );
      expect(logger.warn).toHaveBeenCalledWith(
        'npm WARN warning should show'
      );
      expect(logger.warn).toHaveBeenCalledWith(
        'npm WARN another warning'
      );
      expect(logger.warn).toHaveBeenCalledWith(
        '\n'
      );
      done();
    })
  });

});
