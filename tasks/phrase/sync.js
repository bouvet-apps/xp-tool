const propertiesReader = require("properties-reader");
const util = require("../../lib/util");
const validatePhrases = require("./validate");

const PHRASES_DIR = `${util.SITE_DIR}/i18n`;

let config;

exports.run = (cfg) => {
  config = cfg;

  if (config.verbose) util.printHeader("Sync phrases files");

  const results = validatePhrases.analyze(cfg);

  results.languages.forEach((language) => {
    if (results.missing[language.code] && results.missing[language.code].length > 0) {
      util.printHeader(`Adding missing phrases for language ${language.name}`);
      results.missing[language.code].forEach((missing) => {
        const phrase = `[TODO] ${getPhrase(missing, results.languages)}`;

        const phraseObj = {};
        phraseObj[language.code] = phrase;

        util.addPhrase(missing, phraseObj);
      });
    }
  });

  util.successMessage("Done");
};

function getPhrase(key, languages) {
  let phrase = "";
  languages.some((language) => {
    const properties = propertiesReader(`${PHRASES_DIR}/${language.filename}`);
    phrase = properties.get(key);
    return phrase != null;
  });
  return phrase;
}
