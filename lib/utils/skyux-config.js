const logger = require('@blackbaud/skyux-logger');
const glob = require('glob');
const jsonUtils = require('./json-utils');
const pact = require('./pact');

/**
 * Makes necessary changes to the skyuxconfig.json file.
 */
async function validateSkyUxConfigJson() {

  logger.info('Validating SKY UX config...');

  const configFiles = ['skyuxconfig.json'].concat(glob.sync('skyuxconfig.*.json'));
  const readPromises = configFiles.map((file) => {
    return jsonUtils.readJson(file);
  });

  const hasPactConfig = await pact.configExists();
  const contents = await Promise.all(readPromises);

  contents.forEach((skyuxJson, index) => {
    // Modify omnibar config.
    if (skyuxJson.omnibar) {
      delete skyuxJson.omnibar.experimental;
    }

    // Remove SKY stylesheet (it is provided by Builder).
    if (skyuxJson.app && skyuxJson.app.styles) {
      const index = skyuxJson.app.styles.indexOf('@skyux/theme/css/sky.css');
      if (index > -1) {
        skyuxJson.app.styles.splice(index, 1);
      }
    }

    if (configFiles[index] === 'skyuxconfig.json') {
      // Add frame options.
      if (!skyuxJson.host || !skyuxJson.host.frameOptions) {
        skyuxJson.host = skyuxJson.host || {};
        skyuxJson.host.frameOptions = {
          none: true
        };
      }

      // Add Pact Builder plugin.
      if (hasPactConfig) {
        skyuxJson.plugins = skyuxJson.plugins || [];
        if (skyuxJson.plugins.indexOf('@skyux-sdk/builder-plugin-pact') === -1) {
          skyuxJson.plugins.push('@skyux-sdk/builder-plugin-pact');
        }
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