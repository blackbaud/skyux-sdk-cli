const path = require('path');
const mock = require('mock-require');

describe('Create Angular CLI project', () => {
  let createAngularCliProject;
  let ejectedProjectPath;
  let projectName;
  let spawnSpy;

  function validateSpawn(strictMode) {
    expect(spawnSpy).toHaveBeenCalledWith(
      'ng',
      [
        'new',
        projectName,
        `--directory=${path.basename(ejectedProjectPath)}`,
        '--legacy-browsers',
        '--routing',
        '--style=scss',
        `--strict-${strictMode}`
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

  it('should create an Angular CLI project', async () => {
    createAngularCliProject(ejectedProjectPath, projectName, false);

    validateSpawn('false');
  });

  it('should use strict mode if specified', async () => {
    createAngularCliProject(ejectedProjectPath, projectName, true);

    validateSpawn('true');
  });
});
