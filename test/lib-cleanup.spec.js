const mock = require('mock-require');

describe('Cleanup', () => {
  let fsExtraMock;
  let cleanup;

  beforeEach(() => {
    mock('@blackbaud/skyux-logger', {
      info() {}
    });

    fsExtraMock = {
      exists: jasmine.createSpy('exists'),
      unlink: jasmine.createSpy('unlink'),
      remove: jasmine.createSpy('remove')
    };

    mock('fs-extra', fsExtraMock);

    cleanup = mock.reRequire('../lib/cleanup');
  });

  afterEach(() => {
    mock.stopAll();
  });

  it('should delete the package-lock.json file and node_modules folder', async () => {
    fsExtraMock.exists.and.returnValue(true);

    await cleanup.deleteDependencies();

    expect(fsExtraMock.unlink).toHaveBeenCalledWith('package-lock.json');
    expect(fsExtraMock.remove).toHaveBeenCalledWith('node_modules');
  });

  it('should not delete the package-lock.json file and node_modules folder if they do not exist', async () => {
    fsExtraMock.exists.and.returnValue(false);

    await cleanup.deleteDependencies();

    expect(fsExtraMock.unlink).not.toHaveBeenCalledWith('package-lock.json');
    expect(fsExtraMock.remove).not.toHaveBeenCalledWith('node_modules');
  });

});
