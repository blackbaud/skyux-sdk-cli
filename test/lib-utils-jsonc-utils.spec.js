const mock = require('mock-require');

describe('JSONC utils', () => {
  let fileExists;

  beforeEach(() => {
    fileExists = true;

    mock('fs-extra', {
      existsSync() {
        return fileExists;
      },
      readFileSync() {
        return Buffer.from('// My file.\n{"foo":true}');
      }
    });
  });

  afterEach(() => {
    mock.stopAll();
  });

  function getUtil() {
    return mock.reRequire('../lib/utils/jsonc-utils');
  }

  it('should return file contents', () => {
    const { readJsonC } = getUtil();

    const result = readJsonC('foo.json');

    expect(result).toEqual({
      foo: true
    });
  });

  it('should throw error if file not found', () => {
    fileExists = false;

    const { readJsonC } = getUtil();

    try {
      readJsonC('foo.json');
      fail('Expected test to fail.');
    } catch (err) {
      expect(err.message).toEqual(
        'File "foo.json" not found or is unreadable.'
      );
    }
  });
});
