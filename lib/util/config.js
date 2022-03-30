const deepmerge = require("deepmerge");
const fs = require("fs");

const { CONFIG_FILENAME } = require("./constants");
const { SETTINGS_DIR } = require("./paths");

let config = {
  userDocumentation: {
    sourcePath: "code/src/docs",
    imagePath: "code/src/docs/images"
  }
};
let configLoaded;

/**
 * Loads configuration from BASE_DIR/.xptool/config.json if it exists, otherwise returns defaults.
 */
function getConfig() {
  if (configLoaded) return config;

  // console.log(`Loading config from ${SETTINGS_DIR}...`);
  const filename = `${SETTINGS_DIR}/${CONFIG_FILENAME}`;
  if (fs.existsSync(filename)) {
    config = deepmerge(config, JSON.parse(fs.readFileSync(filename)));
  } else {
    console.log("No config file in project, using defaults");
  }
  return config;
}

module.exports = {
  getConfig
};
