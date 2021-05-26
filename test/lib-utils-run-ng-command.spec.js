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

  it('should execute an Angular 12 command', () => {
    runNgCommand('new', ['--strict']);
    expect(spawnSyncSpy).toHaveBeenCalledWith(
      'npx',
      [
        '-p', '@angular/cli@12',
        'ng', 'new',
        '--strict'
      ],
      {
        stdio: 'inherit'
      }
    );
  });
});
