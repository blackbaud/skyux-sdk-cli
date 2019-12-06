

const mock = require('mock-require');
const logger = require('@blackbaud/skyux-logger');

describe('cert utils shared', () => {

  beforeEach(() => {
    spyOn(logger, 'info');
    spyOn(logger, 'error');
  });

  function getLib() {
    return mock.reRequire('../lib/utils/certs/shared');
  }

  it('should expose a public API', () => {
    const lib = getLib();
    const methods = [
      'execute'
    ];
    methods.forEach(method => expect(lib[method]).toBeDefined());
  });

  it('should handle a successful execute', async () => {
    const action = 'action';
    const level = 'level';
    const spyCB = jasmine.createSpy('cb').and.returnValue(Promise.resolve());

    const lib = getLib();
    await lib.execute(action, level, spyCB);

    expect(logger.info).toHaveBeenCalledWith(
      `Automatically ${action}ing the SKY UX certificates at the ${level} level.`
    );
    expect(logger.info).toHaveBeenCalledWith(
      `Successfully ${action}ed the SKY UX certificates at the ${level} level.`
    );
  });

  it('should handle a unsuccessful execute', async () => {
    const action = 'action';
    const level = 'level';
    const err = 'error';
    const spyCB = jasmine.createSpy('cb').and.returnValue(Promise.reject(err));
    const lib = getLib();

    await expectAsync(lib.execute(action, level, spyCB)).toBeRejectedWith(err);

    expect(logger.info).toHaveBeenCalledWith(
      `Automatically ${action}ing the SKY UX certificates at the ${level} level.`
    );
    expect(logger.error).toHaveBeenCalledWith(
      `Unsuccessfully ${action}ed the SKY UX certificates at the ${level} level. ${err}`
    );
  });

});