const fs = require('fs-extra');
const path = require('path');

const writeJson = require('./write-json');

const CWD = process.cwd();

/**
 * Creates the NotFoundComponent if it doesn't exist.
 */
function ensureNotFoundComponent(ejectedProjectPath) {
  // If the user did not provide their own NotFoundComponent, create one.
  if (!fs.existsSync(path.join(CWD, 'src/app/not-found.component.ts'))) {
    fs.writeFileSync(
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
    fs.writeFileSync(
      path.join(ejectedProjectPath, 'src/app/not-found.component.html'),
      `<iframe
  src="https://app.blackbaud.com/errors/notfound"
  style="border:0;height:100vh;width:100%;"
  [title]="'skyux_page_not_found_iframe_title' | skyAppResources"
></iframe>
`
    );
    const resourcesJsonPath = path.join(
      ejectedProjectPath,
      'src/assets/locales/resources_en_US.json'
    );
    const resourcesJson = fs.existsSync(resourcesJsonPath)
      ? fs.readJsonSync(resourcesJsonPath)
      : {};

    resourcesJson['skyux_page_not_found_iframe_title'] = {
      message: 'Page not found',
      _description:
        'A string value to represent the Page Not Found iframe title attribute.'
    };

    writeJson(resourcesJsonPath, resourcesJson);
  }
}

module.exports = ensureNotFoundComponent;
