import fs from "fs";
import path from "path";
import propertiesReader from "properties-reader";
import cldr from "cldr";

import { RESOURCE_DIR } from "./paths.js";
import { successMessage, infoMessage } from "./console.js";

/**
 * Get available languages based on existing phrases files.
 */
function getLanguages() {
  const phrasesDirectory = path.resolve(RESOURCE_DIR, "i18n");

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
  const phrasesDirectory = path.resolve(RESOURCE_DIR, "i18n");
  const suffix = languageCode === "en" ? "" : `_${languageCode}`;
  const phrasesFilename = path.resolve(phrasesDirectory, `phrases${suffix}.properties`);

  // Fall back to the default phrases file if the language-specific one
  // does not exist (e.g. a project that only ships `phrases.properties`).
  if (suffix && !fs.existsSync(phrasesFilename)) {
    const fallback = path.resolve(phrasesDirectory, "phrases.properties");
    if (fs.existsSync(fallback)) {
      return propertiesReader(fallback);
    }
  }

  return propertiesReader(phrasesFilename);
}

/**
 * Add phrase to i18n
 * @param {string} key Phrase key
 * @param {object} phrases Object with language keys and text to add
 */
function addPhrase(key, phrases) {
  const phrasesDirectory = path.resolve(RESOURCE_DIR, "i18n");

  Object.keys(phrases).forEach((code) => {
    const suffix = code === "en" ? "" : `_${code}`;
    const phrasesFilename = path.resolve(phrasesDirectory, `phrases${suffix}.properties`);
    const properties = propertiesReader(phrasesFilename);

    if (properties.get(key)) {
      infoMessage(`Phrase with key "${key}" already exists in ${phrasesFilename}`);
    } else {
      fs.appendFileSync(phrasesFilename, `\r\n${key} = ${phrases[code]}`);
      successMessage(`Added phrase "${phrases[code]}" with key "${key}" to ${phrasesFilename}`);
    }
  });
}

export { getLanguages, getPhrases, addPhrase };
