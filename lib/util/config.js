import deepmerge from "deepmerge";
import fs from "fs";

import { CONFIG_FILENAME } from "./constants.js";
import { SETTINGS_DIR } from "./paths.js";

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

  const filename = `${SETTINGS_DIR}/${CONFIG_FILENAME}`;
  if (fs.existsSync(filename)) {
    config = deepmerge(config, JSON.parse(fs.readFileSync(filename)));
  } else {
    console.log("No config file in project, using defaults");
  }
  return config;
}

export { getConfig };
