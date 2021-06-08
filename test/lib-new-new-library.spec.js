const mock = require('mock-require');

describe('new library', () => {
  let mockCreateAngularLibrary;
  let mockCreateAngularWorkspace;
  let mockModifyGitignore;
  let mockModifyRootReadme;
  let mockLogger;
  let newLibrary;

  beforeEach(() => {
    mockCreateAngularLibrary = jasmine.createSpy('createAngularLibrary');
    mockCreateAngularWorkspace = jasmine.createSpy('createAngularWorkspace');
    mockModifyGitignore = jasmine.createSpy('modifyGitignore');
    mockModifyRootReadme = jasmine.createSpy('modifyRootReadme');

    mockLogger = jasmine.createSpyObj(
      'logger',
      ['info']
    );

    mock('@blackbaud/skyux-logger', mockLogger);
    mock('../lib/utils/eject/libraries/create-angular-library', mockCreateAngularLibrary);
    mock('../lib/utils/eject/libraries/create-angular-workspace', mockCreateAngularWorkspace);
    mock('../lib/utils/eject/libraries/modify-root-readme', mockModifyRootReadme);
    mock('../lib/utils/eject/modify-gitignore', mockModifyGitignore);

    newLibrary = mock.reRequire('../lib/utils/new/new-library');
  });

  it('should create a new library', async () => {
    await newLibrary('foo', 'bar', '@foo/bar');

    expect(mockCreateAngularWorkspace).toHaveBeenCalledWith('foo', 'bar-workspace', true);
    expect(mockCreateAngularLibrary).toHaveBeenCalledWith('foo', 'bar');
    expect(mockModifyRootReadme).toHaveBeenCalledWith('foo', 'bar', '@foo/bar');
    expect(mockModifyGitignore).toHaveBeenCalledWith('foo', [
      '/screenshots-baseline-local',
      '/screenshots-diff-local'
    ]);
  });

});
