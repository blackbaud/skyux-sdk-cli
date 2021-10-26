const mock = require('mock-require');

describe('Eject', () => {
  let loggerSpyObj;

  beforeEach(() => {
    loggerSpyObj = jasmine.createSpyObj('logger', ['warn']);

    mock('@blackbaud/skyux-logger', loggerSpyObj);
  });

  afterEach(() => {
    mock.stopAll();
  });

  function getUtil() {
    return mock.reRequire('../lib/eject');
  }

  it('should log a warning', () => {
    const eject = getUtil()
    eject();
    expect(loggerSpyObj.warn).toHaveBeenCalledWith('The "eject" command is not available in this version of SKY UX CLI.')
  })
});
