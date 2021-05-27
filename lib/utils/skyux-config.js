const logger = require('@blackbaud/skyux-logger');
const glob = require('glob');
const jsonUtils = require('./json-utils');
const pact = require('./pact');

/**
 * Makes necessary changes to the skyuxconfig.json file.
 */
async function validateSkyUxConfigJson() {
  logger.info('Validating SKY UX config...');

  await pact.validateConfig();

  const configFiles = ['skyuxconfig.json'].concat(
    glob.sync('skyuxconfig.*.json')
  );
  const readPromises = configFiles.map((file) => {
    return jsonUtils.readJson(file);
  });

  const contents = await Promise.all(readPromises);

  contents.forEach((skyuxJson, i) => {
    // Modify omnibar config.
    if (skyuxJson.omnibar) {
      delete skyuxJson.omnibar.experimental;
    }

    // Remove SKY stylesheet (it is provided by Builder).
    if (skyuxJson.app && skyuxJson.app.styles) {
      const index = skyuxJson.app.styles.indexOf('@skyux/theme/css/sky.css');
      /* istanbul ignore else */
      if (index > -1) {
        skyuxJson.app.styles.splice(index, 1);
      }
    }

    // Add schema reference.
    skyuxJson['$schema'] =
      './node_modules/@skyux/config/skyuxconfig-schema.json';

    // Remove deprecated properties.
    delete skyuxJson.skyuxModules;

    // Make adjustments only to the primary config file.
    if (configFiles[i] === 'skyuxconfig.json') {
      // Add frame options.
      if (!skyuxJson.host || !skyuxJson.host.frameOptions) {
        skyuxJson.host = skyuxJson.host || {};
        skyuxJson.host.frameOptions = {
          none: true
        };
      }
    }
  });

  const writePromises = configFiles.map((fileName, index) => {
    return jsonUtils.writeJson(fileName, contents[index]);
  });

  await Promise.all(writePromises);

  logger.info(`Done.`);
}

module.exports = {
  validateSkyUxConfigJson
};
