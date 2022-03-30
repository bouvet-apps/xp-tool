const propertiesReader = require("properties-reader");
const chalk = require("chalk");
const util = require("../../lib/util");

const PHRASES_DIR = `${util.SITE_DIR}/i18n`;

let config;

exports.run = (cfg) => {
  const results = analyze(cfg);

  if (config.verbose) util.printHeader("Validating phrases");

  if (results.numMissing > 0) {
    util.errorMessage("Inconsistencies found:");
    results.languages.forEach((language) => {
      if (results.missing[language.code].length > 0) {
        console.log(`      ${chalk.bold("Missing in ")}${chalk.bold.blue(language.filename)}:`);
        results.missing[language.code].forEach((key) => {
          console.log(`        - ${key}`);
        });
      }
    });
    process.exit(1);
  } else {
    util.successMessage("Phrase consistency tested ok.");
  }
};

function analyze(cfg) {
  config = cfg;

  const languages = util.getLanguages();

  const phrases = [];
  const missing = [];
  let numMissing = 0;

  // Compile complete list of phrases aggregated from all properties files
  languages.forEach((language) => {
    missing[language.code] = [];

    const properties = propertiesReader(`${PHRASES_DIR}/${language.filename}`);

    properties.each((key) => {
      if (!phrases.includes(key)) {
        phrases.push(key);
      }
    });
  });

  // Check consistency for each language
  languages.forEach((language) => {
    const properties = propertiesReader(`${PHRASES_DIR}/${language.filename}`);

    phrases.forEach((key) => {
      if (!properties.get(key)) {
        missing[language.code].push(key);
        numMissing++;
      }
    });
  });

  const results = {
    languages: languages,
    phrases: phrases,
    missing: missing,
    numMissing: numMissing
  };

  return results;
}
exports.analyze = analyze;
