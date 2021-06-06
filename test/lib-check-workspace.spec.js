const mock = require('mock-require');
const path = require('path');

describe('Check workspace', () => {
  let mockAngularJson;
  let mockBrowserslistrc;
  let mockBuildToolName;
  let mockTsConfig;

  let browserslistrcExists;
  let packageLockExists;

  let errorSpy;
  let verboseSpy;
  let warnSpy;

  beforeEach(() => {
    mockAngularJson = {
      projects: {
        'my-app': {
          projectType: 'application',
          architect: {
            build: {
              builder: '@blackbaud-internal/skyux-angular-builders:browser',
              options: {
                tsConfig: 'tsconfig.app.json'
              },
              configurations: {
                production: {
                  outputHashing: 'bundles'
                }
              }
            },
            serve: {
              builder: '@blackbaud-internal/skyux-angular-builders:dev-server'
            },
            test: {
              builder: '@blackbaud-internal/skyux-angular-builders:karma'
            }
          }
        },
        'my-lib': {
          projectType: 'library',
          architect: {
            test: {
              builder: '@blackbaud-internal/skyux-angular-builders:karma'
            }
          }
        }
      },
      defaultProject: 'my-app'
    };

    mockBrowserslistrc = [
      'last 1 Chrome version',
      'last 1 Firefox version',
      'last 2 Edge major versions',
      'last 2 Safari major versions',
      'last 2 iOS major versions',
      'Firefox ESR',
      'IE 11'
    ];

    mockBuildToolName = '@blackbaud-internal/skyux-angular-builders';

    mockTsConfig = {
      compilerOptions: {
        target: 'es5'
      }
    };

    browserslistrcExists = true;
    packageLockExists = true;

    errorSpy = jasmine.createSpy('error');
    verboseSpy = jasmine.createSpy('verbose');
    warnSpy = jasmine.createSpy('warn');

    spyOn(process, 'exit');

    mock('@blackbaud/skyux-logger', {
      error: errorSpy,
      info() {},
      verbose: verboseSpy,
      warn: warnSpy
    });

    mock('fs-extra', {
      existsSync(filePath) {
        const fileName = path.basename(filePath);
        switch (fileName) {
          case '.browserslistrc':
            return browserslistrcExists;
          case 'package-lock.json':
            return packageLockExists;
          default:
            return true;
        }
      },
      readFileSync(filePath) {
        const fileName = path.basename(filePath);
        switch (fileName) {
          case '.browserslistrc':
            return mockBrowserslistrc.join('\n');
          case 'angular.json':
            return JSON.stringify(mockAngularJson);
          case 'tsconfig.app.json':
            return JSON.stringify(mockTsConfig);
        }
      }
    });

    mock('../lib/utils/get-build-tool-metadata', () => {
      return {
        name: mockBuildToolName
      };
    });
  });

  afterEach(() => {
    mock.stopAll();
  });

  function getUtil() {
    return mock.reRequire('../lib/check-workspace');
  }

  it('should not run for `@skyux-sdk/builder` projects', async () => {
    mockBuildToolName = '@skyux-sdk/builder';

    const checkWorkspace = getUtil();
    await checkWorkspace();

    expect(warnSpy).toHaveBeenCalledWith(
      'The `check-workspace` command is not available for ' +
        '`@skyux-sdk/builder` projects. Skipping.'
    );
  });

  describe('> tsconfig.json validator', () => {
    it('should throw an error if build target is not "es5"', async () => {
      mockTsConfig.compilerOptions = {
        target: 'es2015' // <-- invalid target
      };

      const checkWorkspace = getUtil();
      await checkWorkspace();

      expect(errorSpy).toHaveBeenCalledWith(
        '[skyux check-workspace] Error: The "/tsconfig.app.json" file specifies an invalid compile target of "es2015". A compiler target of "es5" is required.'
      );
    });

    xit('should handle tsconfig files without a target', async () => {
      mockTsConfig.compilerOptions = {};

      const checkWorkspace = getUtil();
      await checkWorkspace();

      expect(errorSpy).not.toHaveBeenCalled();
    });

    it('should skip validation for libraries', async () => {
      mockAngularJson.defaultProject = 'my-lib';

      const checkWorkspace = getUtil();

      await checkWorkspace({
        projectType: 'library'
      });

      expect(verboseSpy).toHaveBeenCalledWith(
        'Angular library project detected. Skipping tsconfig build target validation.'
      );
    });
  });

  describe('> browserslistrc validator', () => {
    it('should throw error if browser definition is missing', async () => {
      mockBrowserslistrc.pop(); // Remove the last definition.

      const checkWorkspace = getUtil();
      await checkWorkspace();

      expect(errorSpy).toHaveBeenCalledWith(
        `[skyux check-workspace] Error: The ".browserslistrc" file is missing the following required browser definition(s):
---
IE 11.
---
`
      );
    });

    it('should throw error if .browserslistrc does not exist', async () => {
      browserslistrcExists = false;

      const checkWorkspace = getUtil();
      await checkWorkspace();

      expect(errorSpy).toHaveBeenCalledWith(
        '[skyux check-workspace] Error: Expected file ".browserslistrc" to ' +
        'exist but it was not found.'
      );
    });

    it('should skip validating .browserslistrc for libraries', async () => {
      mockAngularJson.defaultProject = 'my-lib';

      const checkWorkspace = getUtil();

      await checkWorkspace({
        projectType: 'library'
      });

      expect(verboseSpy).toHaveBeenCalledWith(
        'Angular library project detected. Skipping browser list validation.'
      );
    });
  });

  describe('> angular.json validator', () => {
    it('should throw an error if app does not use our builder', async () => {
      mockAngularJson.projects['my-app'].architect.build.builder = '@angular-devkit/build-angular:browser';

      const checkWorkspace = getUtil();
      await checkWorkspace();

      expect(errorSpy).toHaveBeenCalledWith(
        '[skyux check-workspace] Error: The "projects/my-app/architect/build/builder" node ' +
          'in angular.json specifies an unsupported builder "@angular-devkit/build-angular:browser". ' +
          'A builder from the "@blackbaud-internal/skyux-angular-builders" package is required.'
      );
    });

    it('should throw an error if library does not use our builder', async () => {
      mockAngularJson.projects['my-lib'].architect.test.builder = '@angular-devkit/build-angular:karma';

      const checkWorkspace = getUtil();
      await checkWorkspace();

      expect(errorSpy).toHaveBeenCalledWith(
        '[skyux check-workspace] Error: The "projects/my-lib/architect/test/builder" node ' +
        'in angular.json specifies an unsupported builder "@angular-devkit/build-angular:karma". ' +
        'A builder from the "@blackbaud-internal/skyux-angular-builders" package is required.'
      );
    });

    it('should throw an error if build incorrectly sets outputHashing', async () => {
      mockAngularJson.projects['my-app'].architect.build.configurations.production.outputHashing = 'all';

      const checkWorkspace = getUtil();
      await checkWorkspace();

      expect(errorSpy).toHaveBeenCalledWith(
        '[skyux check-workspace] Error: The "projects/my-app/architect/build/configurations/production/outputHashing" node in angular.json is set to "all" but a value of "bundles" is required.'
      );
    });
  });

  describe('> package-lock.json validator', () => {
    it('should throw an error if the package-lock is missing', async () => {
      packageLockExists = false;

      const checkWorkspace = getUtil();
      await checkWorkspace();

      expect(errorSpy).toHaveBeenCalledWith(
        '[skyux check-workspace] Error: A valid package-lock.json file was not found. ' +
          'Run `npm install` to generate a new package-lock.json file and confirm it is not ' +
          'listed in your project\'s .gitignore file.'
      );
    });
  });
});
