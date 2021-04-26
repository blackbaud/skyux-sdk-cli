const mock = require('mock-require');
const path = require('path');

describe('git utils', () => {

  let syncSpy;

  beforeEach(() => {
    syncSpy = jasmine.createSpy('sync').and.callFake(() => {
      return {
        stdout: {
          toString() {
            return 'https://github.com/';
          }
        }
      };
    });

    mock('cross-spawn', {
      sync: syncSpy
    });
  });

  afterEach(() => {
    mock.stopAll();
  });

  it('should return the git origin URL', () => {
    const util = mock.reRequire('../lib/utils/git-utils');
    const url = util.getOriginUrl();

    expect(url).toEqual('https://github.com/');

    expect(syncSpy).toHaveBeenCalledWith('git', [
      'config',
      '--get',
      'remote.origin.url'
    ], {
      cwd: path.join(process.cwd())
    });
  });

});
