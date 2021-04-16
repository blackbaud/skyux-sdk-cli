const fs = require('fs-extra');
const glob = require('glob');
const path = require('path');

const writeJson = require('./write-json');

const supportedSkyuxConfigProps = {
  app: {
    externals: true,
    theming: true
  },
  appSettings: true,
  auth: true,
  codeCoverageThreshold: true,
  help: true,
  host: true,
  omnibar: true,
  params: true,
  routes: true
};

function applySupportedSkyuxConfigProps(supportedProps, existingConfig, newConfig) {
  for (const key of Object.keys(supportedProps)) {
    if (Object.prototype.hasOwnProperty.call(existingConfig, key)) {
      if (supportedProps[key] === true) {
        newConfig[key] = existingConfig[key];
        continue;
      }

      /* istanbul ignore else */
      if (typeof supportedProps[key] === 'object') {
        newConfig[key] = {};
        applySupportedSkyuxConfigProps(supportedProps[key], existingConfig[key], newConfig[key]);
      }
    }
  }
}

/**
 * Migrates skyuxconfig.*.json files; only includes supported properties.
 */
function migrateSkyuxConfigFiles(ejectedProjectPath) {
  const files = glob.sync('skyuxconfig?(.*).json');

  for (const file of files) {
    const contents = fs.readJsonSync(file);
    const newJson = {
      $schema: './node_modules/@skyux-sdk/angular-builders/skyuxconfig-schema.json'
    };

    applySupportedSkyuxConfigProps(supportedSkyuxConfigProps, contents, newJson);

    writeJson(
      path.join(ejectedProjectPath, file),
      newJson
    );
  }
}

module.exports = migrateSkyuxConfigFiles;
