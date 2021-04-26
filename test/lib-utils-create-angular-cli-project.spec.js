const path = require('path');
const mock = require('mock-require');

describe('Create Angular CLI project', () => {
  let createAngularCliProject;
  let ejectedProjectPath;
  let projectName;
  let spawnSpy;

  function validateSpawn(strictMode) {
    createAngularCliProject(ejectedProjectPath, projectName, strictMode);

    expect(spawnSpy).toHaveBeenCalledWith(
      'ng',
      [
        'new',
        projectName,
        `--directory=${path.basename(ejectedProjectPath)}`,
        '--legacy-browsers',
        '--routing',
        `--strict=${strictMode}`,
        '--style=scss'
      ],
      {
        stdio: 'inherit'
      }
    );
  }

  beforeEach(() => {
    ejectedProjectPath = 'foo';
    projectName = 'projectName';
    spawnSpy = jasmine.createSpy('sync');

    mock('@blackbaud/skyux-logger', {
      info() {}
    });

    mock('cross-spawn', {
      sync: spawnSpy
    });

    createAngularCliProject = mock.reRequire('../lib/utils/eject/create-angular-cli-project');
  });

  afterEach(() => {
    mock.stopAll();
  });

  it('should create an Angular CLI project', () => {
    validateSpawn(false);
  });

  it('should use strict mode if specified', () => {
    validateSpawn(true);
  });
});
