const mock = require('mock-require');

describe('npm audit library', () => {
  let spawnSpy;

  beforeEach(() => {
    spawnSpy = jasmine.createSpy('spawn');
    mock('../lib/utils/spawn', spawnSpy);
  });

  afterEach(() => {
    mock.stopAll();
  });

  it('should spawn `npm audit fix`', async () => {
    const npmAudit = mock.reRequire('../lib/utils/npm-audit');
    await npmAudit();
    expect(spawnSpy).toHaveBeenCalledWith('npm', 'audit', 'fix');
  });

});
