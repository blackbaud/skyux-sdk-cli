const mock = require('mock-require');

describe('skyux bin', () => {

  const cliExpectedArgs = {
    _: [],
    0: 'TEST1',
    1: 'TEST2'
  };
  let notifierArgs;
  let notifyArgs;
  let cliArgs;

  beforeEach(() => {
    notifierArgs = null;
    notifyArgs = null;
    cliArgs = null;

    mock('minimist', () => {
      return cliExpectedArgs;
    });

    mock('update-notifier', (args) => {
      notifierArgs = args;
      return {
        notify: (nargs) => {
          notifyArgs = nargs;
        }
      };
    });

    mock('../index', (args) => {
      cliArgs = args;
    });
  });

  afterEach(() => {
    mock.stopAll();
  });

  it('should pass package.json to update-notifier and set isGlobal', () => {
    const pkg = {
      name: 'Test-Package',
      version: 'Test-Version'
    };

    mock('../package.json', () => (pkg));
    require('../bin/skyux');

    expect(notifierArgs.pkg()).toEqual(pkg);
    expect(notifyArgs.isGlobal).toEqual(true);
    expect(notifyArgs.defer).toEqual(false);
    expect(cliArgs).toEqual(cliExpectedArgs);
  });
});
