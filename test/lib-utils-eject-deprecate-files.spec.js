const path = require('path');
const mock = require('mock-require');

describe('deprecateFiles', () => {
  let ejectedProjectPath;

  let deprecateFiles;
  let mockFsExtra;

  let appExtrasContents;
  let appExtrasPath;
  let appSkyContents;
  let appSkyPath;

  function getModuleFilePath(fileName) {
    return path.join(ejectedProjectPath, 'src', 'app', fileName);
  }

  beforeEach(() => {
    ejectedProjectPath = 'foo';

    appExtrasPath = getModuleFilePath('app-extras.module.ts');
    appSkyPath = getModuleFilePath('app-sky.module.ts');

    appExtrasContents = '@NgModule() export class AppExtrasModule {}';
    appSkyContents = '@NgModule() export class AppSkyModule {}';

    mockFsExtra = jasmine.createSpyObj('fs-extra', [
      'readFileSync',
      'writeFileSync'
    ]);

    mockFsExtra.readFileSync.and.callFake((filePath) => {
      switch (filePath) {
        case appExtrasPath:
          return appExtrasContents;
        case appSkyPath:
          return appSkyContents;
      }

      return undefined;
    });

    mock('fs-extra', mockFsExtra);

    deprecateFiles = mock.reRequire('../lib/utils/eject/deprecate-files');
  });

  it('should add a deprecation JSDoc comment to each file', () => {
    deprecateFiles(ejectedProjectPath);

    expect(mockFsExtra.writeFileSync).toHaveBeenCalledWith(
      appExtrasPath,
      `/**
 * @deprecated Provided services, imported modules, etc. should be moved to
 * their respective feature modules, and this module should be removed.
 */
${appExtrasContents}`,
      {
        encoding: 'utf-8'
      }
    );

    expect(mockFsExtra.writeFileSync).toHaveBeenCalledWith(
      appSkyPath,
      `/**
 * @deprecated Each SKY UX module should be imported into each feature module
 * that references the SKY UX module, and this module should be removed.
 */
${appSkyContents}`,
      {
        encoding: 'utf-8'
      }
    );
  });

  it('should not add a deprecation warning to an already-deprecated module', () => {
    appExtrasContents = `/**
 * @deprecated
 */
${appExtrasContents}`;

    deprecateFiles(ejectedProjectPath);

    expect(mockFsExtra.writeFileSync).not.toHaveBeenCalledWith(
      appExtrasPath,
      jasmine.any(Object),
      jasmine.any(Object)
    );
  });
});
