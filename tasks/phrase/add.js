const util = require("../../lib/util");

exports.getConfig = () => [
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

exports.run = (config) => {
  util.addPhrase(config.key, config.phrase);
};
