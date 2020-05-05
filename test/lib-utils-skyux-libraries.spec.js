const mock = require('mock-require');

describe('SKY UX libraries util', function () {
  let fsExtraMock;

  beforeEach(() => {
    fsExtraMock = {
      remove: () => Promise.resolve(),
      copyFile: () => Promise.resolve(),
      pathExists: () => Promise.resolve(false)
    };

    mock('fs-extra', fsExtraMock);
  });

  afterEach(() => {
    mock.stopAll();
  });

  it('should rename entry point to public_api.ts', async () => {
    spyOn(fsExtraMock, 'pathExists').and.callFake((fileName) => {
      if (fileName === 'src/app/public/index.ts') {
        return Promise.resolve(true);
      }
      return Promise.resolve(false);
    });

    const util = mock.reRequire('../lib/utils/skyux-libraries');
    const copySpy = spyOn(fsExtraMock, 'copyFile').and.callThrough();
    await util.fixEntryPoints();
    expect(copySpy.calls.allArgs()).toEqual([
      [
        'src/app/public/index.ts',
        'src/app/public/public_api.ts'
      ]
    ]);
  });

  it('should rename testing entry point to testing/public_api.ts', async () => {
    spyOn(fsExtraMock, 'pathExists').and.returnValue(Promise.resolve(true));
    const util = mock.reRequire('../lib/utils/skyux-libraries');
    const copySpy = spyOn(fsExtraMock, 'copyFile').and.callThrough();
    await util.fixEntryPoints();
    expect(copySpy.calls.allArgs()).toEqual([
      [
        'src/app/public/index.ts',
        'src/app/public/public_api.ts'
      ],
      [
        'src/app/public/testing/index.ts',
        'src/app/public/testing/public_api.ts'
      ]
    ]);
  });

  it('should abort if not a library', async () => {
    const util = mock.reRequire('../lib/utils/skyux-libraries');
    const copySpy = spyOn(fsExtraMock, 'copyFile').and.callThrough();
    await util.fixEntryPoints();
    expect(copySpy).not.toHaveBeenCalled();
  });

  it('should remove certain properties from package.json', () => {
    const util = mock.reRequire('../lib/utils/skyux-libraries');
    const modified = util.validatePackageJson({
      main: 'index.js',
      module: 'index.ts'
    });
    expect(modified).toEqual({});
  });

});
