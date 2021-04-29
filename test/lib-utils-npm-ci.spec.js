const mock = require('mock-require');

describe('npm ci', () => {
  let spawnSpy;

  beforeEach(() => {
    mock('@blackbaud/skyux-logger', {
      info() {}
    });

    spawnSpy = jasmine.createSpy('spawn');
    mock('cross-spawn', {
      sync: spawnSpy
    });
  });

  afterEach(() => {
    mock.stopAll();
  });

  it('should spawn `npm ci`', async () => {
    const npmCi = mock.reRequire('../lib/utils/npm-ci');
    await npmCi();
    expect(spawnSpy).toHaveBeenCalledWith(
      'npm',
      ['ci'],
      { stdio: 'pipe' }
    );
  });

});
