const mock = require('mock-require');
const path = require('path');

const { REQUIRED_BROWSERS_LIST } = require('../lib/utils/check-workspace/constants');
const createWorkspaceState = require('../lib/utils/check-workspace/create-workspace-state');

fdescribe('Check workspace > Validate browserslistrc', () => {
  let browserslistrcExists;
  let mockBrowserslistrc;
  let mockProject;
  let mockWorkspaceState;

  beforeEach(() => {
    mockProject = {
      projectDefinition: {
        projectType: 'application',
        root: 'projects/my-app'
      },
      projectName: 'my-app'
    };

    mockWorkspaceState = createWorkspaceState();

    browserslistrcExists = true;

    mockBrowserslistrc = REQUIRED_BROWSERS_LIST;

    mock('fs-extra', {
      existsSync(filePath) {
        const fileName = path.basename(filePath);
        switch (fileName) {
          case '.browserslistrc':
            return browserslistrcExists;
        }
      },
      readFileSync(filePath) {
        const fileName = path.basename(filePath);
        switch (fileName) {
          case '.browserslistrc':
            return mockBrowserslistrc.join('\n');
        }
      }
    });
  });

  afterEach(() => {
    mock.stopAll();
  });

  function getUtil() {
    return mock.reRequire('../lib/utils/check-workspace/validate-browserslistrc');
  }

  it('should confirm supported browsers listed in .browserslistrc', () => {
    const validateBrowserslistrc = getUtil();
    validateBrowserslistrc(mockProject, mockWorkspaceState);

    expect(mockWorkspaceState.messages).toEqual([
      {
        message: 'The .browserslistrc file includes all supported browsers.',
        status: 'passed'
      }
    ]);
  });

  it('should confirm .browserslistrc file exists', () => {
    browserslistrcExists = false;

    const validateBrowserslistrc = getUtil();
    validateBrowserslistrc(mockProject, mockWorkspaceState);

    expect(mockWorkspaceState.messages).toEqual([
      {
        message: 'Expected file ".browserslistrc" to exist but it was not found.',
        status: 'failed'
      }
    ]);
  });

  it('should check missing browsers in .browserslistrc', () => {
    mockBrowserslistrc = [];

    const validateBrowserslistrc = getUtil();
    validateBrowserslistrc(mockProject, mockWorkspaceState);

    expect(mockWorkspaceState.messages).toEqual([
      {
        message: `The ".browserslistrc" file is missing the following required browser definition(s):
           ---
           last 1 Chrome version
           last 1 Firefox version
           last 2 Edge major versions
           last 2 Safari major versions
           last 2 iOS major versions
           Firefox ESR
           IE 11
           ---`,
        status: 'failed'
      }
    ]);
  });

  // it('should check if app uses our builder', () => {
  //   mockProject.projectDefinition.architect.build.builder = '@angular-devkit/build-angular:browser';

  //   const checkWorkspace = getUtil();
  //   checkWorkspace(mockProject, mockBuildTool, mockWorkspaceState);

  //   expect(mockWorkspaceState.messages).toEqual([
  //     {
  //       message: 'The "projects/my-app/architect/build/builder" node in angular.json specifies an unsupported builder "@angular-devkit/build-angular:browser". A builder from the "@blackbaud-internal/skyux-angular-builders" package is required.',
  //       status: 'failed'
  //     },
  //     {
  //       message: 'The "serve" target in angular.json specifies the builder "@blackbaud-internal/skyux-angular-builders:dev-server".',
  //       status: 'passed'
  //     },
  //     {
  //       message: 'The "test" target in angular.json specifies the builder "@blackbaud-internal/skyux-angular-builders:karma".',
  //       status: 'passed'
  //     }
  //   ]);
  // });

  // it('should check if library uses our builder', () => {
  //   mockProject.projectDefinition = {
  //     architect: {
  //       test: {
  //         builder: '@angular-devkit/build-angular:karma'
  //       }
  //     },
  //     projectType: 'library'
  //   };

  //   mockProject.projectName = 'my-lib';

  //   const checkWorkspace = getUtil();
  //   checkWorkspace(mockProject, mockBuildTool, mockWorkspaceState);

  //   expect(mockWorkspaceState.messages).toEqual([
  //     {
  //       message: 'The "projects/my-lib/architect/test/builder" node in angular.json specifies an unsupported builder "@angular-devkit/build-angular:karma". A builder from the "@blackbaud-internal/skyux-angular-builders" package is required.',
  //       status: 'failed'
  //     }
  //   ]);
  // });

  // it('should check build target correctly sets outputHashing', () => {
  //   mockProject.projectDefinition.architect.build.configurations.production.outputHashing = 'all';

  //   const checkWorkspace = getUtil();
  //   checkWorkspace(mockProject, mockBuildTool, mockWorkspaceState);

  //   expect(mockWorkspaceState.messages).toEqual(jasmine.arrayContaining([
  //     {
  //       message: 'The "projects/my-app/architect/build/configurations/production/outputHashing" node in angular.json is set to "all" but a value of "bundles" is required.',
  //       status: 'failed'
  //     }
  //   ]));
  // });

  // it('should check if build target does not set outputHashing', () => {
  //   delete mockProject.projectDefinition.architect.build.configurations.production.outputHashing;

  //   const checkWorkspace = getUtil();
  //   checkWorkspace(mockProject, mockBuildTool, mockWorkspaceState);

  //   expect(mockWorkspaceState.messages).toEqual(jasmine.arrayContaining([
  //     {
  //       message: 'The "projects/my-app/architect/build/configurations/production/outputHashing" node in angular.json is not defined but a value of "bundles" is required.',
  //       status: 'failed'
  //     }
  //   ]));
  // });
});
