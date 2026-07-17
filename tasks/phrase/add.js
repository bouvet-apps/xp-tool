import * as util from "../../lib/util/index.js";

export function getConfig() {
  return [
    {
      argument: "key",
      type: "string",
      message: "Enter key for phrase (no spaces)",
      validate: util.VALIDATORS.nospace
    }, {
      argument: "phrase",
      type: "phrase",
      message: "Enter phrase"
    }
  ];
}

export function run(config) {
  util.addPhrase(config.key, config.phrase);
}
