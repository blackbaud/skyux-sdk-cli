const mock = require('mock-require');
const path = require('path');

describe('Eject Libraries > Modify root README', () => {
  let writeFileSyncSpy;

  beforeEach(() => {
    writeFileSyncSpy = jasmine.createSpy('writeFileSync');
    mock('fs-extra', {
      writeFileSync: writeFileSyncSpy
    });
  });

  afterEach(() => {
    mock.stopAll();
  });

  it('should modify the root README file', () => {
    const modifyRootReadme = mock.reRequire('../lib/utils/eject/libraries/modify-root-readme');
    const mockEjectedPath = 'mock/ejected/path';
    const mockProjectDirectory = 'my-lib';
    const mockPackageName = '@blackbaud/foobar';
    modifyRootReadme(mockEjectedPath, mockProjectDirectory, mockPackageName);
    expect(writeFileSyncSpy).toHaveBeenCalledWith(
      path.join(mockEjectedPath, 'README.md'),
      `# ${mockPackageName} Workspace

For information about \`${mockPackageName}\` please visit the library's README file, located at \`projects/${mockProjectDirectory}/README.md\`.
`
    );
  });
});
