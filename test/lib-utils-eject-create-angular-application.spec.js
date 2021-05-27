const path = require('path');
const mock = require('mock-require');

describe('Eject > Create Angular Application', () => {
  let createAngularCliProject;
  let ejectedProjectPath;
  let projectName;
  let runNgCommandSpy;

  function validateSpawn(strictMode) {
    createAngularCliProject(ejectedProjectPath, projectName, strictMode);

    expect(runNgCommandSpy).toHaveBeenCalledWith('new', [
      projectName,
      `--directory=${path.basename(ejectedProjectPath)}`,
      '--legacy-browsers',
      '--routing',
      `--strict=${strictMode}`,
      '--style=scss'
    ]);
  }

  beforeEach(() => {
    ejectedProjectPath = 'foo';
    projectName = 'projectName';
    runNgCommandSpy = jasmine.createSpy('runNgCommand');

    mock('@blackbaud/skyux-logger', {
      info() {}
    });

    mock('../lib/utils/run-ng-command', runNgCommandSpy);

    createAngularCliProject = mock.reRequire(
      '../lib/utils/eject/create-angular-application'
    );
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
