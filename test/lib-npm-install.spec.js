const mock = require('mock-require');
const logger = require('@blackbaud/skyux-logger');

describe('npm install library', () => {
  let mockFs;

  beforeEach(() => {
    mockFs = {
      existsSync() {},
      removeSync() {}
    };

    spyOn(logger, 'promise').and.returnValue({
      succeed: () => {},
      fail: () => {}
    });

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

    const npmInstall = mock.reRequire('../lib/npm-install');

    npmInstall(settings);

    return spawnArgs;
  }

  function getPromiseFromSpawn(exitCode) {
    const spySpawn = jasmine.createSpyObj('spawn', ['on']);
    mock('cross-spawn', () => spySpawn);

    const npmInstall = mock.reRequire('../lib/npm-install');
    const npmInstallPromise = npmInstall();

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
  });

  it('should listen for the exit event and resolve if exit code is 0', (done) => {
    getPromiseFromSpawn(0).then(() => {
      expect(logger.promise).toHaveBeenCalledWith('Running npm install (can take several minutes)');
      done();
    }, () => {});
  });

  it('should listen for the exit event and reject if exit code is not 0', (done) => {
    getPromiseFromSpawn(1).then(() => {}, (err) => {
      expect(err).toEqual('npm install failed.');
      done();
    });
  });

  it('should delete package-lock.json before running npm install', (done) => {
    spyOn(mockFs, 'existsSync').and.returnValue(true);

    const spy = spyOn(mockFs, 'removeSync').and.callThrough();

    getPromiseFromSpawn(0).then(() => {
      expect(spy).toHaveBeenCalledWith('package-lock.json');
      done();
    }, () => {});
  });

});
