const fs = require("fs");
const path = require("path");
const util = require("../../lib/util");

let config;

exports.run = (cfg) => {
  util.printHeader("Tidying phrases files");

  tidy(cfg);
};

function tidy(cfg, exclude = []) {
  config = cfg;
  util.getLanguages().forEach((language) => {
    if (config.verbose) util.printHeader(`Processing ${language.filename}`);

    const phrases = util.getPhrases(language.code);
    const sorted = Object.keys(phrases.getAllProperties()).sort();
    const types = extractGlossary(sorted);

    let fileContent = "";

    types.glossary.forEach((key) => {
      fileContent += `${key} = ${phrases.get(key)}\n`;
    });
    if (types.glossary.length > 0) fileContent += "\n";

    types.mimeTypes.forEach((key) => {
      fileContent += `${key} = ${phrases.get(key)}\n`;
    });

    let previousGroup = "";
    types.regular.forEach((key) => {
      // Exclude (delete) keys that are in the exclude list
      if (!exclude.includes(key)) {
        const currentGroup = getPhraseGroup(key);
        if (previousGroup !== currentGroup) fileContent += "\n";
        fileContent += `${key} = ${phrases.get(key)}\n`;
        previousGroup = currentGroup;
      } else util.warningMessage(`Deleted phrase with key ${key}`);
    });

    const filename = path.resolve(language.path, language.filename);

    fs.writeFileSync(filename, fileContent, { encoding: "utf8" });
    util.successMessage(`${language.filename} tidied up.`);
  });
}
exports.tidy = tidy;

function extractGlossary(keys) {
  const glossary = [];
  const regular = [];
  const mimeTypes = [];

  keys.forEach((key) => {
    if (isMimeType(key)) mimeTypes.push(key);
    else if (countKeySegments(key) > 1) regular.push(key);
    else glossary.push(key);
  });

  return { glossary: glossary, regular: regular, mimeTypes: mimeTypes };
}

function getPhraseGroup(phrase) {
  if (phrase.indexOf(".") === -1) return phrase;
  return phrase.split(".")[0];
}

function countKeySegments(key) {
  const segments = key.split(".").length;
  return segments;
}

function isMimeType(key) {
  const singleSegmentMimeTypes = ["document", "spreadsheet", "presentation"];
  if (singleSegmentMimeTypes.includes(key)) return true;
  return key.startsWith("application/");
}
