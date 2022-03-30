const fs = require("fs");
const path = require("path");
const propertiesReader = require("properties-reader");
const cldr = require("cldr");

const { SITE_DIR } = require("./paths");
const { successMessage, infoMessage } = require("./console");

/**
 * Get available languages based on existing phrases files.
 */
function getLanguages() {
  const phrasesDirectory = path.resolve(SITE_DIR, "i18n");

  const files = fs.readdirSync(phrasesDirectory)
    .filter(fn => fn.startsWith("phrases"))
    .filter(fn => fn.endsWith(".properties"));

  const languages = files.map((filename) => {
    const code = filename === "phrases.properties" ? "en" : filename.replace(/phrases_(.*)\.properties/, "$1");
    const name = cldr.extractLanguageDisplayNames("en")[code];

    return {
      code: code,
      name: name,
      filename: filename,
      path: phrasesDirectory
    };
  });
  return languages;
}

function getPhrases(languageCode) {
  const phrasesDirectory = path.resolve(SITE_DIR, "i18n");
  const suffix = languageCode === "en" ? "" : `_${languageCode}`;
  const phrasesFilename = path.resolve(phrasesDirectory, `phrases${suffix}.properties`);

  return propertiesReader(phrasesFilename);
}

/**
 * Add phrase to i18n
 * @param {string} key Phrase key
 * @param {object} phrases Object with language keys and text to add
 */
function addPhrase(key, phrases) {
  const phrasesDirectory = path.resolve(SITE_DIR, "i18n");

  Object.keys(phrases).forEach((code) => {
    const suffix = code === "en" ? "" : `_${code}`;
    const phrasesFilename = path.resolve(phrasesDirectory, `phrases${suffix}.properties`);
    // console.log(`Reading properties file ${phrasesFilename}`);
    const properties = propertiesReader(phrasesFilename);

    if (properties.get(key)) {
      infoMessage(`Phrase with key "${key}" already exists in ${phrasesFilename}`);
    } else {
      fs.appendFileSync(phrasesFilename, `\r\n${key} = ${phrases[code]}`);
      successMessage(`Added phrase "${phrases[code]}" with key "${key}" to ${phrasesFilename}`);
    }
  });
}

module.exports = {
  getLanguages,
  getPhrases,
  addPhrase
};
