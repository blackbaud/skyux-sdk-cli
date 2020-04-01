const mock = require('mock-require');
const EventEmitter = require('events').EventEmitter;

let emitter;
let logger;
let npmInstallSpy;

describe('skyux install command', () => {

  let cleanupMock;

  beforeEach(() => {
    logger = {
      error: jasmine.createSpy('error')
    }

    mock('@blackbaud/skyux-logger', logger);

    emitter = new EventEmitter();

    mock('cross-spawn', (cmd, args) => {
      emitter.emit('spawnCalled', cmd, args);
      return emitter;
    });

    npmInstallSpy = jasmine.createSpy('npmInstall');

    mock('../lib/utils/npm-install', npmInstallSpy);

    cleanupMock = {
      deleteDependencies: jasmine.createSpy('deleteDependencies')
    };
    mock('../lib/cleanup', cleanupMock);
  });

  afterEach(() => {
    mock.stopAll();
  });

  it('should delete node_modules, package-lock.json, and run npm install', async () => {
    const install = mock.reRequire('../lib/install');

    await install();
    expect(cleanupMock.deleteDependencies).toHaveBeenCalledTimes(1);
    expect(npmInstallSpy).toHaveBeenCalledWith();
  });

  it('should handle successfully deleting node_modules', async () => {
    const install = mock.reRequire('../lib/install');
    await install();
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('should handle unsuccessfully deleting node_modules', async () => {
    const err = 'custom-error';
    const install = mock.reRequire('../lib/install');

    cleanupMock.deleteDependencies.and.returnValue(Promise.reject(err));
    await install();
    expect(logger.error).toHaveBeenCalledWith(err);
  });

});
