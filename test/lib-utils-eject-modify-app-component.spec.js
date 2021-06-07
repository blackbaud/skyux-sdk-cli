const mock = require('mock-require');
const path = require('path');

describe('modifyAppComponent()', () => {
  let ejectedProjectPath;
  let modifyAppComponent;
  let writeFileSyncSpy;

  beforeEach(() => {
    ejectedProjectPath = 'foo';

    writeFileSyncSpy = jasmine.createSpy('writeFileSync');

    mock('fs-extra', {
      writeFileSync: writeFileSyncSpy
    });

    modifyAppComponent = mock.reRequire('../lib/utils/eject/modify-app-component');
  });

  it('should modify the app.component.html file', async () => {
    modifyAppComponent(ejectedProjectPath);

    expect(writeFileSyncSpy).toHaveBeenCalledWith(
      path.join(ejectedProjectPath, 'src/app/app.component.html'),
      `<router-outlet></router-outlet>`
    );

    expect(writeFileSyncSpy).toHaveBeenCalledWith(
      path.join(ejectedProjectPath, 'src/app/app.component.spec.ts'),
      jasmine.stringMatching(/describe\('AppComponent'/)
    );
  });

  it('should support ESLint rule disabling', async () => {
    modifyAppComponent(ejectedProjectPath, true);

    expect(writeFileSyncSpy).toHaveBeenCalledWith(
      path.join(ejectedProjectPath, 'src/app/app.component.html'),
      `<router-outlet></router-outlet>`
    );

    expect(writeFileSyncSpy).toHaveBeenCalledWith(
      path.join(ejectedProjectPath, 'src/app/app.component.spec.ts'),
      jasmine.stringMatching(/\/\/ eslint-disable-next-line @angular-eslint\/component-selector/)
    );
  });
});
