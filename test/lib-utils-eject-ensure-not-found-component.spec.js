const path = require('path');
const mock = require('mock-require');

describe('ensureNotFoundComponent', () => {
  let ejectedProjectPath;
  let ensureNotFoundComponent;
  let mockFsExtra;
  let notFoundComponentExists;
  let resourcesFileExists;
  let writeJsonSpy;

  beforeEach(() => {
    ejectedProjectPath = 'foo';
    notFoundComponentExists = false;
    resourcesFileExists = false;

    mockFsExtra = jasmine.createSpyObj('fs-extra', [
      'existsSync',
      'readJsonSync',
      'writeFileSync',
      'writeJsonSync'
    ]);

    mockFsExtra.readJsonSync.and.callFake((filePath) => {
      switch (path.basename(filePath)) {
        case 'resources_en_US.json':
          return resourcesFileExists ? {} : undefined;
      }
    });

    mockFsExtra.existsSync.and.callFake((filePath) => {
      switch (path.basename(filePath)) {
        case 'not-found.component.ts':
          return notFoundComponentExists;
        case 'resources_en_US.json':
          return resourcesFileExists;
      }
    });

    mock('fs-extra', mockFsExtra);

    writeJsonSpy = jasmine.createSpy('writeJson');

    mock('../lib/utils/eject/write-json', writeJsonSpy);

    ensureNotFoundComponent = mock.reRequire(
      '../lib/utils/eject/ensure-not-found-component'
    );
  });

  afterEach(() => {
    mock.stopAll();
  });

  it('should create a NotFoundComponent if it does not exist', async () => {
    notFoundComponentExists = false;
    resourcesFileExists = true;

    ensureNotFoundComponent(ejectedProjectPath);

    expect(mockFsExtra.writeFileSync).toHaveBeenCalledWith(
      path.join(ejectedProjectPath, 'src/app/not-found.component.ts'),
      `import {
  Component
} from '@angular/core';

@Component({
  selector: 'app-not-found',
  templateUrl: './not-found.component.html'
})
export class NotFoundComponent { }
`
    );
    expect(mockFsExtra.writeFileSync).toHaveBeenCalledWith(
      path.join(ejectedProjectPath, 'src/app/not-found.component.html'),
      `<iframe
  src="https://app.blackbaud.com/errors/notfound"
  style="border:0;height:100vh;width:100%;"
  [title]="'skyux_page_not_found_iframe_title' | skyAppResources"
></iframe>
`
    );
  });

  it('should not create a NotFoundComponent if it exists', async () => {
    notFoundComponentExists = true;
    resourcesFileExists = true;

    ensureNotFoundComponent(ejectedProjectPath);

    expect(mockFsExtra.writeFileSync).not.toHaveBeenCalledWith(
      path.join(ejectedProjectPath, 'src/app/not-found.component.ts'),
      jasmine.any(String)
    );
  });

  it('should create a resources file if it does not exist', async () => {
    notFoundComponentExists = false;
    resourcesFileExists = false;

    ensureNotFoundComponent(ejectedProjectPath);

    expect(writeJsonSpy).toHaveBeenCalledOnceWith(
      path.join(ejectedProjectPath, 'src/assets/locales/resources_en_US.json'),
      {
        skyux_page_not_found_iframe_title: {
          message: 'Page not found',
          _description:
            'A string value to represent the Page Not Found iframe title attribute.'
        }
      }
    );
  });
});
