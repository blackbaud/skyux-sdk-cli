const mock = require('mock-require');
const EventEmitter = require('events').EventEmitter;

let emitter;
let logger;
let npmInstallSpy;

describe('skyux install command', () => {

  let spyLoggerPromise;

  beforeEach(() => {
    logger = jasmine.createSpyObj(
      'logger',
      [
        'info',
        'warn',
        'error',
        'verbose',
        'promise'
      ]
    );

    spyLoggerPromise = jasmine.createSpyObj('promise', ['fail', 'succeed']);
    logger.promise.and.returnValue(spyLoggerPromise);

    mock('@blackbaud/skyux-logger', logger);

    emitter = new EventEmitter();

    mock('cross-spawn', (cmd, args) => {
      emitter.emit('spawnCalled', cmd, args);
      return emitter;
    });

    npmInstallSpy = jasmine.createSpy('npmInstall');

    mock('../lib/utils/npm-install', npmInstallSpy);
  });

  afterEach(() => {
    mock.stopAll();
  });

  function spyOnFS() {
    const spyFS = jasmine.createSpyObj('fs-extra', ['remove']);
    spyFS.remove.and.returnValue(Promise.resolve());
    mock('fs-extra', spyFS);
    return spyFS;
  }

  it('should delete node_modules and run npm install', (done) => {
    const spyFS = spyOnFS();
    const install = mock.reRequire('../lib/install');

    install().then(() => {
      expect(spyFS.remove).toHaveBeenCalled();
      expect(npmInstallSpy).toHaveBeenCalledWith({});

      done();
    });
  });

  it('should pass stdio: inherit to spawn when logLevel is verbose', (done) => {
    logger.logLevel = 'verbose';
    spyOnFS();
    const install = mock.reRequire('../lib/install');

    install().then(() => {
      expect(npmInstallSpy).toHaveBeenCalledWith({
        stdio: 'inherit'
      });

      done();
    });

  });

  it('should delete node_modules, package-lock.json, and run npm install', (done) => {
    const spyFS = spyOnFS();
    const install = mock.reRequire('../lib/install');

    install().then(() => {
      expect(spyFS.remove).toHaveBeenCalledWith('node_modules');
      expect(spyFS.remove).toHaveBeenCalledWith('package-lock.json');
      expect(npmInstallSpy).toHaveBeenCalledWith({});

      done();
    });
  });

  it('should handle successfully deleting node_modules', (done) => {
    spyOnFS();
    const install = mock.reRequire('../lib/install');
    install().then(() => {
      expect(spyLoggerPromise.succeed).toHaveBeenCalled();
      done();
    });
  });

  it('should handle unsuccessfully deleting node_modules', (done) => {
    const err = 'custom-error';
    const spyFS = spyOnFS();
    const install = mock.reRequire('../lib/install');

    spyFS.remove.and.returnValue(Promise.reject(err))
    install().then(() => {
      expect(spyLoggerPromise.fail).toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith(err);
      done();
    });
  });

});
