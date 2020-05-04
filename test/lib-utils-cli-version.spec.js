const mock = require('mock-require');

describe('CLI version', function () {
  let jsonUtilsMock;
  let latestVersionMock;

  beforeEach(() => {
    latestVersionMock = () => {
      return Promise.resolve();
    }

    jsonUtilsMock = {
      readJson: () => Promise.resolve({})
    };

    mock('latest-version', latestVersionMock);
    mock('../lib/utils/json-utils', jsonUtilsMock);
  });

  afterEach(() => {
    mock.stopAll();
  });

});
