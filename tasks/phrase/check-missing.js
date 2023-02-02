const xmlconvert = require("xml-js");
const fs = require("fs");
const path = require("path");
const glob = require("glob");
const util = require("../../lib/util");

const XML_FILE_ENCODING = "utf8";
const XML_OPTIONS = { compact: false, spaces: 4 };

const XML_DESCRIPTORS = [
  {
    type: "content-type",
    files: util.getContentTypes()
  },
  {
    type: "layout",
    files: util.getLayouts()
  },
  {
    type: "part",
    files: util.getParts()
  },
  {
    type: "x-data",
    files: util.getXData()
  },
  {
    type: "mixin",
    files: util.getMixins()
  },
  {
    type: "pages",
    files: util.getPages()
  },
  {
    type: "site configuration",
    files: util.getSite()
  }
];

/**
 * Task entry point
 */
exports.run = (cfg) => {
  const results = analyze(cfg);

  // Print summary
  util.printHeader("Summary");

  // Warnings
  if (results.phrasesNotUsed.length > 0) {
    util.printHeader(`Phrases not used (${results.phrasesNotUsed.length}):`);
    results.phrasesNotUsed.forEach((p) => {
      util.warningMessage(`'${p}' not in use`);
    });
  }

  // Errors
  if (results.missingAttributes.length > 0 || results.missingPhrases.length > 0) {
    if (results.missingAttributes.length > 0) {
      util.printHeader(`Missing i18n attributes (${results.missingAttributes.length}):`);
      results.missingAttributes.forEach(attribute => util.errorMessage(attribute));
    }

    if (results.missingPhrases.length > 0) {
      util.printHeader(`Missing phrases (${results.missingPhrases.length}):`);
      results.missingPhrases.forEach(phrase => util.errorMessage(phrase));
    }

    process.exit(1);
  } else {
    util.successMessage("Missing i18n phrases checked ok.");
  }
};

let phrases;
let config;
const results = {
  missingAttributes: [],
  missingPhrases: [],
  phrasesUsed: [],
  phrasesNotUsed: [],
  errors: 0
};

function analyze(cfg) {
  config = cfg;

  let language = "en";
  if (cfg.args.language) language = cfg.args.language;

  // Get phrases.properties. All languages should have the same set of phrases if
  // the consistency check is run
  phrases = util.getPhrases(language);

  util.printHeader("Analyzing missing i18n tags/phrases");

  XML_DESCRIPTORS.forEach((d) => {
    // log.info(JSON.stringify(d));
    d.files.forEach((f) => {
      if (config.verbose) util.printHeader(`Processing ${d.type} '${f.name}'`);
      checkXml(f.filename, f.path, f.name, f.buildPath);
    });
  });

  // Check javascript using @phrases comment
  let jsPaths = [
    `${util.BASE_DIR}/code/src/frontend/scripts/**/*.+(es6|js|vue|jsx)`, // Frontend
    `${util.RESOURCE_DIR}/**/*.+(es6|js)` // Backend
  ];

  jsPaths.forEach((globPath) => {
    checkJavascriptComments(globPath);
  });

  // Check javascript. Only checks phrases defined in **phrases.es6 files.
  jsPaths = [
    `${util.BASE_DIR}/code/src/frontend/scripts/**/*phrases.+(es6|js)`, // Frontend
    `${util.RESOURCE_DIR}/**/*phrases.+(es6|js)` // Backend
  ];

  jsPaths.forEach((globPath) => {
    checkJavascriptPhrasesFiles(globPath);
  });

  checkFreemarkerTemplates();

  // Check phrases in use
  const allPhrases = Object.keys(phrases.getAllProperties()).map(key => key);
  results.phrasesNotUsed = allPhrases.filter((p) => {
    const used = results.phrasesUsed.includes(p);
    return !used;
  });

  return results;
}
exports.analyze = analyze;


/**
 * Checks XML file
 *
 * @param {*} filename Filename of XML file
 * @param {*} filePath Path to XML file
 * @param {*} name Display name for XML file
 * @param {*} buildPath Build Path to XML file, used if the file does not exist in filePath
 */
function checkXml(filename, filePath, name, buildPath) {
  // console.log(filename);
  const filenameWithPath = path.resolve(filePath, filename);

  // Save error counter for comparison
  const counter = results.errors;

  let xml;

  try {
    xml = xmlconvert.xml2js(fs.readFileSync(filenameWithPath, XML_FILE_ENCODING), XML_OPTIONS);
  } catch (error) {
    if (buildPath) {
      const buildFilenameWithPath = path.resolve(buildPath, filename);
      xml = xmlconvert.xml2js(fs.readFileSync(buildFilenameWithPath, XML_FILE_ENCODING), XML_OPTIONS);
    } else {
      util.infoMessage(`error: ${error}`);
    }
  }
  // Recursively check XML
  checkElement(xml, name);

  // If we haven't produced any new errors, display success message
  if (config.verbose && counter === results.errors) util.successMessage("Ok");
}


/**
 * Check all javascript files for @phrases comments and add them to the results.
 *
 * @param {*} globPath Glob path to check
 */
function checkJavascriptComments(globPath) {
  const jsFiles = glob.sync(globPath);
  jsFiles.forEach((js) => {
    if (config.verbose) util.printHeader(`Processing file ${js}`);

    if (fs.statSync(js).size < 60000) {
      const jsFile = fs.readFileSync(js, "utf8");

      const regex = /.*@phrases\s+\[(([^\]]|\n)*)\]/gim;

      let match;
      while ((match = regex.exec(jsFile)) != null) {
        if (!match[1].startsWith()) {
          phraseCommentToArray(match[1]).forEach((phrase) => {
            validatePhrase(phrase.replace(/['"]+/g, ""));
          });
        }
      }
    } else {
      util.warningMessage(`Skipping file ${js} due to size.`);
    }
  });
}


/**
 * Check javascript phrases files and add them to the results.
 *
 * @param {*} globPath Glob path to check
 */
function checkJavascriptPhrasesFiles(globPath) {
  const jsFiles = glob.sync(globPath);

  jsFiles.forEach((js) => {
    if (config.verbose) util.printHeader(`Processing frontend script '${js}'`);

    // Get phrases list from file
    let jsPhrases = [];
    const jsFile = fs.readFileSync(js, "utf8");

    // Get default export
    const exportRegex = /^\s*export\s+default\s+([^;]*);*.*$/gm;
    let jsExport = exportRegex.exec(jsFile);
    if (jsExport && jsExport.length > 0) jsExport = jsExport[1];

    // Get array from default export variable.
    const arrayRegex = new RegExp(`^.*${jsExport}\\s+.*\\[([^\\]]*)`, "gm");
    let jsArray = arrayRegex.exec(jsFile);
    if (jsArray && jsArray.length > 0) jsArray = `[ ${jsArray[1]} ]`;
    jsPhrases = JSON.parse(jsArray);

    jsPhrases.forEach((phraseKey) => {
      validatePhrase(phraseKey);
    });
  });
}

/**
 * Check Freemarker templates and add them to the results.
 *
 * [@localize locale=locale key='error.button'/] tags are checked.
 */
function checkFreemarkerTemplates() {
  const ftlFiles = glob.sync(`${util.SITE_DIR}/**/*.ftl`);

  const localizeRegex = /\[@localize.*key=["'](.*)["'].*\]/gm;
  ftlFiles.forEach((ftlPath) => {
    const filename = path.basename(ftlPath);
    if (config.verbose) util.printHeader(`Processing Freemarker template '${filename}'`);

    const ftlFile = fs.readFileSync(ftlPath, "utf8");

    const counter = results.missingPhrases.length;

    let match;
    while ((match = localizeRegex.exec(ftlFile)) != null) {
      validatePhrase(match[1]);
    }

    if (config.verbose && counter === results.missingPhrases.length) util.successMessage("Ok");
  });
}


/**
 * Recursively check element for i18n attributes and validate them.
 *
 * @param {object} element Element to check
 * @param {string} xmlPath Path to element
 */
function checkElement(element, xmlPath = "") {
  if (element.name === "label"
    || element.name === "display-name"
    || element.name === "help-text"
    || (element.name === "option" && xmlPath.endsWith("config/option"))) {
    if (element.attributes && element.attributes.i18n) {
      const phraseKey = element.attributes.i18n;
      validatePhrase(phraseKey);
    } else {
      const xp = `${xmlPath}/${getText(element)}`;
      const lettersRegex = /[a-zA-Z\u00C0-\u024F\u1E00-\u1EFF]/g;
      if ((getText(element).match(lettersRegex) || []).length === 0) {
        if (config.verbose) util.warningMessage(`Ignoring missing i18n attribute for '${xp}' as it does not contain any letters`);
      } else if (xmlPath.endsWith("mixin/display-name")) {
        // Ignore display-name for mixins, they are never used.
        if (config.verbose) util.infoMessage(`Ignoring ${xmlPath} as mixin display-names are never used`);
      } else {
        if (config.verbose) util.errorMessage(`Missing i18n attribute for '${xp}'`);
        results.errors++;
        results.missingAttributes.push(xp);
      }
    }
  }
  // Check children
  if (element.elements) {
    element.elements.forEach((elm) => {
      checkElement(elm, `${xmlPath}/${elm.name}`);
    });
  }
}

/**
 * Convert @phrase comment to array of phrase key strings.
 *
 * @param {string} comment Comment string
 */
function phraseCommentToArray(comment) { return comment.replace(/[*\s]*/g, "").split(","); }

/**
 * Validate phrase and add to results.
 *
 * @param {string} phraseKey Phrase key to validate
 */
function validatePhrase(phraseKey) {
  const phrase = phrases.get(phraseKey);

  if (phrase) {
    if (config.verbose) util.successMessage(`Phrase '${phraseKey}' found`);
    if (!results.phrasesUsed.includes(phraseKey)) results.phrasesUsed.push(phraseKey);
  } else {
    if (config.verbose) util.errorMessage(`No phrase found for key '${phraseKey}'`);
    results.errors++;
    if (!results.missingPhrases.includes(phraseKey)) results.missingPhrases.push(phraseKey);
  }
}

/**
 * Get text content from element.
 *
 * @param {object} element Element to get text from
 */
function getText(element) {
  const textElements = element.elements ? element.elements.filter(e => e.type === "text") : [];
  if (textElements && textElements.length > 0) return textElements[0].text;
  return "[No name]";
}
