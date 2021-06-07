const mock = require('mock-require');

const { REQUIRED_OUTPUT_HASHING_VALUE } = require('../lib/utils/check-workspace/constants');
const createWorkspaceState = require('../lib/utils/check-workspace/create-workspace-state');

describe('Check workspace > Validate angular.json', () => {
  const mockBuildTool = {
    name: '@blackbaud-internal/skyux-angular-builders'
  };

  let mockProject;
  let mockWorkspaceState;

  beforeEach(() => {
    mockProject = {
      projectDefinition: {
        projectType: 'application',
        architect: {
          build: {
            builder: '@blackbaud-internal/skyux-angular-builders:browser',
            configurations: {
              production: {
                outputHashing: REQUIRED_OUTPUT_HASHING_VALUE
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
      projectName: 'my-app'
    };

    mockWorkspaceState = createWorkspaceState();
  });

  afterEach(() => {
    mock.stopAll();
  });

  function getUtil() {
    return mock.reRequire('../lib/utils/check-workspace/validate-angular-json');
  }

  it('should check if app uses our builder', () => {
    mockProject.projectDefinition.architect.build.builder = '@angular-devkit/build-angular:browser';

    const checkWorkspace = getUtil();
    checkWorkspace(mockProject, mockBuildTool, mockWorkspaceState);

    expect(mockWorkspaceState.messages).toEqual([
      {
        message: 'The "projects/my-app/architect/build/builder" node in angular.json specifies an unsupported builder "@angular-devkit/build-angular:browser". A builder from the "@blackbaud-internal/skyux-angular-builders" package is required.',
        status: 'failed'
      },
      {
        message: 'The "serve" target in angular.json specifies the builder "@blackbaud-internal/skyux-angular-builders:dev-server".',
        status: 'passed'
      },
      {
        message: 'The "test" target in angular.json specifies the builder "@blackbaud-internal/skyux-angular-builders:karma".',
        status: 'passed'
      }
    ]);
  });

  it('should check if library uses our builder', () => {
    mockProject.projectDefinition = {
      architect: {
        test: {
          builder: '@angular-devkit/build-angular:karma'
        }
      },
      projectType: 'library'
    };

    mockProject.projectName = 'my-lib';

    const checkWorkspace = getUtil();
    checkWorkspace(mockProject, mockBuildTool, mockWorkspaceState);

    expect(mockWorkspaceState.messages).toEqual([
      {
        message: 'The "projects/my-lib/architect/test/builder" node in angular.json specifies an unsupported builder "@angular-devkit/build-angular:karma". A builder from the "@blackbaud-internal/skyux-angular-builders" package is required.',
        status: 'failed'
      }
    ]);
  });

  it('should check build target correctly sets outputHashing', () => {
    mockProject.projectDefinition.architect.build.configurations.production.outputHashing = 'all';

    const checkWorkspace = getUtil();
    checkWorkspace(mockProject, mockBuildTool, mockWorkspaceState);

    expect(mockWorkspaceState.messages).toEqual(jasmine.arrayContaining([
      {
        message: 'The "projects/my-app/architect/build/configurations/production/outputHashing" node in angular.json is set to "all" but a value of "bundles" is required.',
        status: 'failed'
      }
    ]));
  });

  it('should check if build target does not set outputHashing', () => {
    delete mockProject.projectDefinition.architect.build.configurations.production.outputHashing;

    const checkWorkspace = getUtil();
    checkWorkspace(mockProject, mockBuildTool, mockWorkspaceState);

    expect(mockWorkspaceState.messages).toEqual(jasmine.arrayContaining([
      {
        message: 'The "projects/my-app/architect/build/configurations/production/outputHashing" node in angular.json is not defined but a value of "bundles" is required.',
        status: 'failed'
      }
    ]));
  });
});
