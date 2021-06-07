const mock = require('mock-require');
const path = require('path');

describe('Check workspace', () => {
  let mockAngularJson;
  let mockBuildToolName;

  let errorSpy;
  let infoSpy;
  let validateAngularJsonSpy;
  let validateBrowserslistrcSpy;
  let validateCompilerTargetSpy;
  let validatePackageLockSpy;
  let warnSpy;

  beforeEach(() => {
    mockAngularJson = {
      projects: {
        'my-app': {
          projectType: 'application',
          architect: {}
        },
        'my-lib': {
          projectType: 'library',
          architect: {}
        }
      },
      defaultProject: 'my-app'
    };

    mockBuildToolName = '@blackbaud-internal/skyux-angular-builders';

    errorSpy = jasmine.createSpy('error');
    infoSpy = jasmine.createSpy('info');
    warnSpy = jasmine.createSpy('warn');

    spyOn(process, 'exit');

    mock('@blackbaud/skyux-logger', {
      error: errorSpy,
      info: infoSpy,
      warn: warnSpy
    });

    mock('../lib/utils/jsonc-utils', {
      readJsonC(filePath) {
        const fileName = path.basename(filePath);
        switch (fileName) {
          case 'angular.json':
            return mockAngularJson;
        }
      }
    });

    mock('../lib/utils/get-build-tool-metadata', () => {
      return {
        name: mockBuildToolName
      };
    });

    validateAngularJsonSpy = jasmine.createSpy('validateAngularJson');
    mock(
      '../lib/utils/check-workspace/validate-angular-json',
      validateAngularJsonSpy
    );

    validateBrowserslistrcSpy = jasmine.createSpy('validateAngularJson');
    mock(
      '../lib/utils/check-workspace/validate-browserslistrc',
      validateBrowserslistrcSpy
    );

    validateCompilerTargetSpy = jasmine.createSpy('validateCompilerTarget');
    mock(
      '../lib/utils/check-workspace/validate-compiler-target',
      validateCompilerTargetSpy
    );

    validatePackageLockSpy = jasmine.createSpy('validatePackageLock');
    mock(
      '../lib/utils/check-workspace/validate-package-lock',
      validatePackageLockSpy
    );
  });

  afterEach(() => {
    mock.stopAll();
  });

  function getUtil() {
    return mock.reRequire('../lib/check-workspace');
  }

  it('should run validators for applications by default', async () => {
    const checkWorkspace = getUtil();

    await checkWorkspace();

    expect(validateAngularJsonSpy).toHaveBeenCalled();
    expect(validateBrowserslistrcSpy).toHaveBeenCalled();
    expect(validateCompilerTargetSpy).toHaveBeenCalled();
    expect(validatePackageLockSpy).toHaveBeenCalled();
  });

  it('should run validators for libraries', async () => {
    const checkWorkspace = getUtil();

    mockAngularJson.defaultProject = 'my-lib';

    await checkWorkspace({
      projectType: 'library'
    });

    expect(validateAngularJsonSpy).toHaveBeenCalled();
    expect(validateBrowserslistrcSpy).not.toHaveBeenCalled();
    expect(validateCompilerTargetSpy).not.toHaveBeenCalled();
    expect(validatePackageLockSpy).toHaveBeenCalled();
  });

  it('should not run for `@skyux-sdk/builder` projects', async () => {
    mockBuildToolName = '@skyux-sdk/builder';

    const checkWorkspace = getUtil();
    await checkWorkspace();

    expect(warnSpy).toHaveBeenCalledWith(
      'The `check-workspace` command is only available for Angular CLI projects. Skipping.'
    );
  });

  it('should throw an error if default project undefined', async () => {
    delete mockAngularJson.defaultProject;

    const checkWorkspace = getUtil();
    await checkWorkspace();

    expect(errorSpy).toHaveBeenCalledWith(
      '[skyux check-workspace] Error: A default project was not defined in "angular.json".'
    );
  });

  it('should throw an error if default project type does not match required project type', async () => {
    const checkWorkspace = getUtil();

    await checkWorkspace({
      projectType: 'library'
    });

    expect(errorSpy).toHaveBeenCalledWith(
      '[skyux check-workspace] Error: The default project "my-app" defined ' +
        'in angular.json is of type "application" but a project type of ' +
        '"library" is required.'
    );
  });

  it('should print failing and passing checks', async () => {
    validatePackageLockSpy.and.callFake((workspaceState) => {
      workspaceState.addPassed('The angular.json file is valid.');
      workspaceState.addFailed('The package-lock.json file does not exist.');
    });

    const checkWorkspace = getUtil();

    await checkWorkspace();

    expect(errorSpy).toHaveBeenCalledWith(
      '[skyux check-workspace] Error: Workspace did not pass validation checks.'
    );

    expect(errorSpy).toHaveBeenCalledWith(
      ' ✘ FAILED  The package-lock.json file does not exist.'
    );

    expect(infoSpy).toHaveBeenCalledWith(
      ' ✔ PASSED  The angular.json file is valid. OK.'
    );
  });
});
