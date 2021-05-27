const path = require('path');
const mock = require('mock-require');

describe('writeJson', () => {
  let writeJson;
  let mockFsExtra;

  beforeEach(() => {
    mockFsExtra = jasmine.createSpyObj('fs-extra', [
      'ensureDirSync',
      'writeJsonSync'
    ]);

    mock('fs-extra', mockFsExtra);

    writeJson = mock.reRequire('../lib/utils/eject/write-json');
  });

  afterEach(() => {
    mock.stopAll();
  });

  it('should write the specified JSON with the epxected format options', () => {
    const filePath = path.join('foo', 'bar.json');
    const contents = {
      foo: 'bar'
    };

    writeJson(filePath, contents);

    expect(mockFsExtra.writeJsonSync).toHaveBeenCalledWith(filePath, contents, {
      spaces: 2
    });
  });

  it('should create the directory for the JSON file if it does not exist', () => {
    writeJson(path.join('foo', 'bar.json'), {
      foo: 'bar'
    });

    expect(mockFsExtra.ensureDirSync).toHaveBeenCalledWith('foo');
  });
});
