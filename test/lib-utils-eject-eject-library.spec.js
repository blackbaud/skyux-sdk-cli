const mock = require('mock-require');
const path = require('path');

const constants = require('../lib/utils/eject/constants');

describe('Eject > Library', () => {

  let npmInstallSpy;
  let copyRootFilesSpy;
  let copySourceFilesSpy;
  let createAngularLibrarySpy;
  let createAngularWorkspaceSpy;
  let modifyLibraryPackageJsonSpy;
  let backupSourceFilesSpy;
  let installAngularBuildersSpy;
  let migrateSkyuxConfigFilesSpy;
  let modifyGitignoreSpy;
  let modifyRootReadmeSpy;
  let modifyWorkspacePackageJson;
  let moveEjectedFilesSpy;

  let mockEjectedProjectPath;
  let mockLibrarySourcePath;

  let mockIsInternal;
  let mockStrictMode;

  beforeEach(() => {
    mockEjectedProjectPath = path.join('mock/ejected/path');
    mockLibrarySourcePath = path.join('mock/src/app/public');

    mockIsInternal = true;
    mockStrictMode = false;


    mock('@blackbaud/skyux-logger', {
      info() {}
    });

    mock('fs-extra', {
      readJsonSync() {
        return {
          name: '@blackbaud-internal/my-lib'
        };
      }
    });

    npmInstallSpy = jasmine.createSpy('npmInstall');
    mock('../lib/utils/npm-install', npmInstallSpy);

    copyRootFilesSpy = jasmine.createSpy('copyRootFiles');
    copySourceFilesSpy = jasmine.createSpy('copySourceFiles');
    mock('../lib/utils/eject/libraries/copy-files', {
      copyRootFiles: copyRootFilesSpy,
      copySourceFiles: copySourceFilesSpy
    });

    createAngularLibrarySpy = jasmine.createSpy('createAngularLibrary');
    mock('../lib/utils/eject/libraries/create-angular-library', createAngularLibrarySpy);

    createAngularWorkspaceSpy = jasmine.createSpy('createAngularWorkspace');
    mock('../lib/utils/eject/libraries/create-angular-workspace', createAngularWorkspaceSpy);

    modifyLibraryPackageJsonSpy = jasmine.createSpy('modifyLibraryPackageJson');
    mock('../lib/utils/eject/libraries/modify-library-package-json', modifyLibraryPackageJsonSpy);

    modifyRootReadmeSpy = jasmine.createSpy('modifyRootReadme');
    mock('../lib/utils/eject/libraries/modify-root-readme', modifyRootReadmeSpy);

    backupSourceFilesSpy = jasmine.createSpy('backupSourceFiles');
    mock('../lib/utils/eject/backup-source-files', backupSourceFilesSpy);

    installAngularBuildersSpy = jasmine.createSpy('installAngularBuilders');
    mock('../lib/utils/eject/install-angular-builders', installAngularBuildersSpy);

    migrateSkyuxConfigFilesSpy = jasmine.createSpy('migrateSkyuxConfigFiles');
    mock('../lib/utils/eject/migrate-skyux-config-files', migrateSkyuxConfigFilesSpy);

    modifyGitignoreSpy = jasmine.createSpy('modifyGitignore');
    mock('../lib/utils/eject/modify-gitignore', modifyGitignoreSpy);

    modifyWorkspacePackageJson = jasmine.createSpy('modifyWorkspacePackageJson');
    mock('../lib/utils/eject/modify-package-json', modifyWorkspacePackageJson);

    moveEjectedFilesSpy = jasmine.createSpy('moveEjectedFiles');
    mock('../lib/utils/eject/move-ejected-files', moveEjectedFilesSpy);
  });

  afterEach(() => {
    mock.stopAll();
  });

  function ejectLibrary() {
    const util = mock.reRequire('../lib/utils/eject/eject-library');
    return util(
      mockLibrarySourcePath,
      mockEjectedProjectPath,
      mockIsInternal,
      mockStrictMode
    );
  }

  it('should backup source files', async () => {
    await ejectLibrary();

    expect(backupSourceFilesSpy).toHaveBeenCalledWith(
      mockEjectedProjectPath,
      constants.SOURCE_CODE_BACKUP_DIR
    );
  });

  it('should create an Angular workspace and library', async () => {
    await ejectLibrary();

    expect(createAngularWorkspaceSpy).toHaveBeenCalledWith(
      mockEjectedProjectPath,
      'my-lib-workspace',
      mockStrictMode
    );

    expect(createAngularLibrarySpy).toHaveBeenCalledWith(
      mockEjectedProjectPath,
      'my-lib'
    );
  });

  it('should copy source files to the ejected project', async () => {
    await ejectLibrary();

    expect(migrateSkyuxConfigFilesSpy).toHaveBeenCalledWith(
      mockEjectedProjectPath,
      mockIsInternal
    );

    expect(copyRootFilesSpy).toHaveBeenCalledWith(
      mockEjectedProjectPath,
      'my-lib'
    );

    expect(copySourceFilesSpy).toHaveBeenCalledWith(
      mockLibrarySourcePath,
      mockEjectedProjectPath,
      'my-lib'
    );

    expect(modifyGitignoreSpy).toHaveBeenCalledWith(
      mockEjectedProjectPath, [
        constants.SOURCE_CODE_BACKUP_DIR,
        '/screenshots-baseline-local',
        '/screenshots-diff-local'
      ]
    );
  });

  it('should modify the ejected library and workspace package.json', async () => {
    await ejectLibrary();

    expect(modifyLibraryPackageJsonSpy).toHaveBeenCalledWith(
      mockEjectedProjectPath,
      'my-lib'
    );

    expect(modifyWorkspacePackageJson).toHaveBeenCalledWith(
      mockEjectedProjectPath
    );
  });

  it('should install the Angular builders package', async () => {
    await ejectLibrary();

    expect(installAngularBuildersSpy).toHaveBeenCalledWith(
      mockEjectedProjectPath,
      mockIsInternal
    );
  });

  it('should move ejected files to current working directory', async () => {
    await ejectLibrary();

    expect(moveEjectedFilesSpy).toHaveBeenCalledWith(
      mockEjectedProjectPath
    );
  });

  it('should run `npm install`', async () => {
    await ejectLibrary();

    expect(npmInstallSpy).toHaveBeenCalled();
  });

});
