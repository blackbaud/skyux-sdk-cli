const fs = require('fs-extra');
const glob = require('glob');
const path = require('path');

const writeJson = require('./write-json');

const supportedInternalSkyuxConfigProps = {
  app: {
    externals: true,
    theming: true
  },
  appSettings: true,
  auth: true,
  codeCoverageThreshold: true,
  experiments: true,
  help: true,
  host: true,
  omnibar: true,
  params: true,
  routes: true
};

const supportedPublicSkyuxConfigProps = {
  codeCoverageThreshold: true
};

function migrateKnownPlugins(existingConfig, newConfig) {
  const plugins = existingConfig.plugins;

  if (plugins) {
    for (const plugin of plugins) {
      switch (plugin) {
        case '@blackbaud/skyux-builder-plugin-auth-email-whitelist':
          newConfig.experiments = newConfig.experiments || {};
          newConfig.experiments.blackbaudEmployee = true;
          break;
      }
    }
  }
}

function applySupportedSkyuxConfigProps(
  supportedProps,
  existingConfig,
  newConfig
) {
  for (const key of Object.keys(supportedProps)) {
    if (Object.prototype.hasOwnProperty.call(existingConfig, key)) {
      if (supportedProps[key] === true) {
        newConfig[key] = existingConfig[key];
        continue;
      }

      /* istanbul ignore else */
      if (typeof supportedProps[key] === 'object') {
        newConfig[key] = {};
        applySupportedSkyuxConfigProps(
          supportedProps[key],
          existingConfig[key],
          newConfig[key]
        );
      }
    }
  }
}

/**
 * Migrates skyuxconfig.*.json files; only includes supported properties.
 */
function migrateSkyuxConfigFiles(ejectedProjectPath, isInternal = true) {
  const files = glob.sync('skyuxconfig?(.*).json');

  for (const file of files) {
    const contents = fs.readJsonSync(file);
    const newJson = {
      $schema: isInternal
        ? './node_modules/@blackbaud-internal/skyux-angular-builders/skyuxconfig-schema.json'
        : './node_modules/@skyux-sdk/angular-builders/skyuxconfig-schema.json'
    };

    const supportedProps = isInternal
      ? supportedInternalSkyuxConfigProps
      : supportedPublicSkyuxConfigProps;

    migrateKnownPlugins(contents, newJson);
    applySupportedSkyuxConfigProps(supportedProps, contents, newJson);

    writeJson(path.join(ejectedProjectPath, file), newJson);
  }
}

module.exports = migrateSkyuxConfigFiles;
