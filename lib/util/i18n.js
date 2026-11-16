import fs from "fs";
import path from "path";
import propertiesReader from "properties-reader";
import cldr from "cldr";

import { RESOURCE_DIR } from "./paths.js";
import { successMessage, infoMessage, errorMessage } from "./console.js";

/**
 * Resolve the XP8 phrases directory, exiting with a clear message if it does not exist.
 */
function getPhrasesDirectory() {
  const phrasesDirectory = path.resolve(RESOURCE_DIR, "i18n");
  if (fs.existsSync(phrasesDirectory)) return phrasesDirectory;

  errorMessage(`No phrases directory found at ${phrasesDirectory}`);
  const legacyDirectories = ["cms/i18n", "site/i18n"].filter((dir) => fs.existsSync(path.resolve(RESOURCE_DIR, dir)));
  if (legacyDirectories.length) {
    errorMessage(`Found phrases in ${legacyDirectories.join(", ")}: XP8 only loads /i18n/phrases by default, move them to src/main/resources/i18n`);
  }
  return process.exit(1);
}

/**
 * Get available languages based on existing phrases files.
 */
function getLanguages() {
  const phrasesDirectory = getPhrasesDirectory();

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
  const phrasesDirectory = getPhrasesDirectory();
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
  const phrasesDirectory = getPhrasesDirectory();

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
