const logger = require('@blackbaud/skyux-logger');
const jsonUtils = require('./json-utils');
const pact = require('./pact');

/**
 * Makes necessary changes to the skyuxconfig.json file.
 */
async function validateSkyUxConfigJson() {

  // TODO: Need to loop through ALL skyuxconfig.json files!

  let skyuxJson = await jsonUtils.readJson('skyuxconfig.json');

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

  // Add frame options.
  if (!skyuxJson.host || !skyuxJson.host.frameOptions) {
    skyuxJson.host = skyuxJson.host || {};
    skyuxJson.host.frameOptions = {
      none: true
    };
  }

  // Add Pact Builder plugin.
  const hasPactConfig = await pact.configExists();
  if (hasPactConfig) {
    skyuxJson.plugins = skyuxJson.plugins || [];
    if (skyuxJson.plugins.indexOf('@skyux-sdk/builder-plugin-pact') === -1) {
      skyuxJson.plugins.push('@skyux-sdk/builder-plugin-pact');
    }
  }

  await jsonUtils.writeJson('skyuxconfig.json', skyuxJson);

  logger.info(`Done.`);
}

module.exports = {
  validateSkyUxConfigJson
};