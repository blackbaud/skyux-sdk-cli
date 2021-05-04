const mock = require('mock-require');
const path = require('path');

describe('modifyGitignore', () => {

  let writeFileSyncSpy;

  beforeEach(() => {
    writeFileSyncSpy = jasmine.createSpy('writeFileSync');

    mock('fs-extra', {
      readFileSync() {
        return 'MOCK_GITIGNORE_CONTENTS\n';
      },
      writeFileSync: writeFileSyncSpy
    });
  });

  afterEach(() => {
    mock.stopAll();
  });

  it('should modify the .gitignore file', () => {
    const modifyGitignore = mock.reRequire('../lib/utils/eject/modify-gitignore');
    modifyGitignore('EJECTED_PROJECT_PATH', [
      '/foobar'
    ]);
    expect(writeFileSyncSpy).toHaveBeenCalledWith(
      path.join('EJECTED_PROJECT_PATH/.gitignore'),
      `MOCK_GITIGNORE_CONTENTS

# SKY UX files
/foobar
`,
      { encoding: 'utf-8' }
    );
  });

});
