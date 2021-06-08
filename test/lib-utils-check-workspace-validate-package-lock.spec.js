const mock = require('mock-require');
const path = require('path');

const createWorkspaceState = require('../lib/utils/check-workspace/create-workspace-state');

describe('Check workspace > Validate package-lock.json', () => {
  let packageLockExists;
  let mockWorkspaceState;

  beforeEach(() => {
    mockWorkspaceState = createWorkspaceState();

    packageLockExists = true;

    mock('fs-extra', {
      existsSync(filePath) {
        const fileName = path.basename(filePath);
        switch (fileName) {
          case 'package-lock.json':
            return packageLockExists;
        }
      }
    });
  });

  afterEach(() => {
    mock.stopAll();
  });

  function getUtil() {
    return mock.reRequire('../lib/utils/check-workspace/validate-package-lock');
  }

  it('should confirm package-lock.json file exists', () => {
    packageLockExists = true;

    const validatePackageLock = getUtil();
    validatePackageLock(mockWorkspaceState);

    expect(mockWorkspaceState.messages).toEqual([
      {
        message: 'A valid package-lock.json file exists.',
        status: 'passed'
      }
    ]);

    packageLockExists = false;
    mockWorkspaceState.messages = [];

    validatePackageLock(mockWorkspaceState);

    expect(mockWorkspaceState.messages).toEqual([
      {
        message: 'A valid package-lock.json file was not found. Run `npm install` to generate a new package-lock.json file and confirm it is not listed in your project\'s .gitignore file.',
        status: 'failed'
      }
    ]);
  });
});
