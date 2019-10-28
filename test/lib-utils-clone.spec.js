const mock = require('mock-require');
const logger = require('@blackbaud/skyux-logger');

describe('clone utility', () => {

  let spyLoggerPromise;
  let spyGitClone;
  let clone;

  beforeEach(() => {
    spyLoggerPromise = jasmine.createSpyObj('logger', ['succeed','fail']);
    spyOn(logger, 'promise').and.returnValue(spyLoggerPromise);
    spyOn(logger, 'info');
    spyOn(logger, 'warn');
    spyOn(logger, 'error');

    spyGitClone = jasmine.createSpy('git-clone');
    mock('git-clone', spyGitClone);

    clone = mock.reRequire('../lib/utils/clone');
  });

  it('should pass the url, target, and default branch of master to git-clone', async (done) => {
    const url = 'my-url';
    const target = 'my-target';
    const checkout = 'master';

    spyGitClone.and.callFake((a, b, c, callback) => {
      expect(logger.info).toHaveBeenCalledWith(`Cloning ${url}#${checkout} into ${target}`);
      expect(url).toEqual(a);
      expect(target).toEqual(b);
      expect({ checkout }).toEqual(c);
      callback();
    });

    await clone(url, target, {});
    done();
  });

  it('should pass the url, target, and specified branch to git-clone', async (done) => {
    const url = 'my-url';
    const target = 'my-target';
    const checkout = 'my-branch';

    spyGitClone.and.callFake((a, b, c, callback) => {
      expect(logger.info).toHaveBeenCalledWith(`Cloning ${url}#${checkout} into ${target}`);
      expect(url).toEqual(a);
      expect(target).toEqual(b);
      expect({ checkout }).toEqual(c);
      callback();
    });

    await clone(url, target, { checkout });
    done();
  });

  it('should handle an error', async (done) => {
    const err = 'my-error';
    spyGitClone.and.callFake((a, b, c, callback) => {
      callback(err);
    });

    try {
      await clone('', '', {});
    } catch (errThrown) {
      expect(errThrown).toBe(err);
      done();
    }
  });

});