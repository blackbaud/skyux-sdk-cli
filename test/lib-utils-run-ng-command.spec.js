const mock = require('mock-require');

describe('Run ng command', () => {
  let runNgCommand;
  let spawnSyncSpy;

  beforeEach(() => {
    spawnSyncSpy = jasmine.createSpy('spawnSync');

    mock('cross-spawn', {
      sync: spawnSyncSpy
    });

    runNgCommand = mock.reRequire('../lib/utils/run-ng-command');
  });

  afterEach(() => {
    mock.stopAll();
  });

  function verifySpawn(
    command,
    args = [],
    config = {
      stdio: 'inherit'
    }
  ) {
    expect(spawnSyncSpy).toHaveBeenCalledWith(
      'npx',
      [
        '-p', '@angular/cli@12',
        'ng', command,
        ...args
      ],
      config
    );
  }

  it('should execute an Angular 12 command', () => {
    const args = ['--strict'];

    runNgCommand('new', args);
    verifySpawn('new', args);
  });

  it('should allow overwriting the spawn config', () => {
    const config = {
      stdio: 'pipe'
    };

    runNgCommand('new', undefined, config);
    verifySpawn('new', undefined, config);
  });
});
