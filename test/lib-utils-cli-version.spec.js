const mock = require('mock-require');

describe('CLI version', function () {
  let jsonUtilsMock;
  let latestVersionMock;
  let testPackageJson;

  beforeEach(() => {
    latestVersionMock = (name, config) => {
      if (config.version === 'next') {
        return Promise.resolve('4.0.0-rc.1');
      }
      return Promise.resolve('1.2.3');
    }

    testPackageJson = {
      name: '@skyux-sdk/cli',
      version: '1.2.3'
    };

    jsonUtilsMock = {
      readJson: () => Promise.resolve(testPackageJson)
    };

    mock('latest-version', latestVersionMock);
    mock('../lib/utils/json-utils', jsonUtilsMock);
  });

  afterEach(() => {
    mock.stopAll();
  });

  it('should not throw an error when the current version matches the latest published version', async () => {
    let errMessage;

    const cliVersion = mock.reRequire('../lib/utils/cli-version');

    // Jasmine's toThrowError() matcher doesn't work on async functions.
    try {
      await cliVersion.verifyLatestVersion();
    } catch (err) {
      errMessage = err.message;
    }

    expect(errMessage).toBeUndefined();
  });

  it('should throw an error when the current version does not match the "latest" published version', async () => {
    testPackageJson.version = '1.2.2';

    let errMessage;

    const cliVersion = mock.reRequire('../lib/utils/cli-version');

    // Jasmine's toThrowError() matcher doesn't work on async functions.
    try {
      await cliVersion.verifyLatestVersion();
    } catch (err) {
      errMessage = err.message;
    }

    expect(errMessage).toBe(
      `You are using an outdated version of the SKY UX CLI.
Please upgrade the CLI by running: \`npm i -g @skyux-sdk/cli@latest\`, then try running the CLI command again.
Version installed: 1.2.2
Version wanted: 1.2.3`
    );
  });

  it('should throw an error when the current version does not match the "next" published version', async () => {
    testPackageJson.version = '4.0.0-rc.0';

    let errMessage;

    const cliVersion = mock.reRequire('../lib/utils/cli-version');

    // Jasmine's toThrowError() matcher doesn't work on async functions.
    try {
      await cliVersion.verifyLatestVersion();
    } catch (err) {
      errMessage = err.message;
    }

    expect(errMessage).toBe(
      `You are using an outdated version of the SKY UX CLI.
Please upgrade the CLI by running: \`npm i -g @skyux-sdk/cli@next\`, then try running the CLI command again.
Version installed: 4.0.0-rc.0
Version wanted: 4.0.0-rc.1`
    );
  });

});
