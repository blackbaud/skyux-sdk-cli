const mock = require('mock-require');

describe('Stylesheets util', function () {
  let loggerMock;
  let findInFilesMock;
  let fsExtraMock;

  beforeEach(() => {
    loggerMock = {
      info() {}
    };

    findInFilesMock = {
      find() {
        return {
          'foo.scss': {},
          'bar.scss': {}
        };
      }
    };

    fsExtraMock = {
      readFile: () => Promise.resolve(''),
      writeFile: () => Promise.resolve()
    };

    mock('@blackbaud/skyux-logger', loggerMock);
    mock('find-in-files', findInFilesMock);
    mock('fs-extra', fsExtraMock);
  });

  afterEach(() => {
    mock.stopAll();
  });

  it('should replace /deep/ with ::ng-deep', async () => {
    spyOn(fsExtraMock, 'readFile').and.callFake((fileName) => {
      if (fileName === 'foo.scss') {
        return Promise.resolve('/deep/ p {}');
      }
      return Promise.resolve('p >>> a {}');
    });

    const util = mock.reRequire('../lib/utils/stylesheets');
    const writeSpy = spyOn(fsExtraMock, 'writeFile').and.callThrough();

    await util.fixSassDeep();

    expect(writeSpy.calls.allArgs()).toEqual([
      [ 'foo.scss', '::ng-deep p {}' ],
      [ 'bar.scss', 'p ::ng-deep a {}' ]
    ]);
  });

  it('should abort if no files found', async () => {
    spyOn(findInFilesMock, 'find').and.returnValue({});

    const util = mock.reRequire('../lib/utils/stylesheets');
    const writeSpy = spyOn(fsExtraMock, 'writeFile').and.callThrough();

    await util.fixSassDeep();

    expect(writeSpy).not.toHaveBeenCalled();
  });

});
