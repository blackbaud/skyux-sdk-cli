const mock = require('mock-require');

describe('JSON utils', () => {
  let jsonUtils;
  let fsExtraMock;

  beforeEach(() => {
    fsExtraMock = {
      readJson: jasmine.createSpy('readJson'),
      writeJson: jasmine.createSpy('writeJson'),
      exists: jasmine.createSpy('exists').and.returnValue(true)
    };

    mock('fs-extra', fsExtraMock);

    jsonUtils = mock.reRequire('../lib/utils/json-utils');
  });

  afterEach(() => {
    mock.stopAll();
  });

  describe('readJson() method', () => {
    it('should read a JSON file', async () => {
      fsExtraMock.readJson.and.callFake(async () => {
        return {
          foo: 'bar'
        };
      });

      const result = await jsonUtils.readJson('file1.json');

      expect(result).toEqual({
        foo: 'bar'
      });
    });

    it('should return undefined if the file does not exist', async () => {
      fsExtraMock.exists.and.returnValue(false);

      const result = await jsonUtils.readJson('file1.json');

      expect(result).toBeUndefined();
    });
  });

  describe('writeJson() method', () => {
    it('should write a JSON file with indentation of 2 spaces', async () => {
      await jsonUtils.writeJson('file1.json', {
        foo: 'bar'
      });

      expect(fsExtraMock.writeJson).toHaveBeenCalledWith(
        'file1.json',
        {
          foo: 'bar'
        },
        {
          spaces: 2
        }
      );
    });
  });
});
