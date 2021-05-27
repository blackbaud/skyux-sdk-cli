const mock = require('mock-require');

describe('npm audit library', () => {
  let spawnSpy;

  beforeEach(() => {
    spawnSpy = jasmine.createSpy('spawn');
    mock('cross-spawn', {
      sync: spawnSpy
    });
  });

  afterEach(() => {
    mock.stopAll();
  });

  it('should spawn `npm audit fix`', async () => {
    const npmAudit = mock.reRequire('../lib/utils/npm-audit');
    await npmAudit();
    expect(spawnSpy).toHaveBeenCalledWith('npm', ['audit', 'fix'], {
      stdio: 'inherit'
    });
  });
});
