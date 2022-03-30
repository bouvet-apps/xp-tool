const xmlconvert = require("xml-js");
const fs = require("fs");
const fse = require("fs-extra");
const Markdownit = require("markdown-it");
const handlebars = require("handlebars");
const propertiesReader = require("properties-reader");
const path = require("path");
const util = require("../../lib/util");

// TODO: Move to config file
/* const destination = {
  markdownDirectory: "../code/build/docs/documentation.md",
  markdownFilename: "documentation.md",
  adminToolDirectory: "../code/build/resources/main/admin/tools/userdoc",
  adminToolFilename: "documentation.html",
  adminToolImageDirectory: "../code/build/resources/main/assets/images/userdoc"
};
*/
const destination = {
  markdownDirectory: path.resolve(util.BASE_DIR, "code/build/docs/documentation.md"),
  markdownFilename: "documentation.md",
  adminToolDirectory: path.resolve(util.BASE_DIR, "code/build/resources/main/admin/tools/userdoc"),
  adminToolFilename: "documentation.html",
  adminToolImageDirectory: path.resolve(util.BASE_DIR, "code/build/resources/main/assets/images/userdoc")
};

const xmlFileEncoding = "utf8";

let phrases;
let userdocPhrases;

let mixins;
let xdata;

const config = util.getConfig();

exports.run = ({ build = true }) => {
  const languageCode = "no";
  // let languageCode = "en";

  const xmlOptions = { compact: false, spaces: 4 };

  util.printHeader("Generating documentation");

  // Load project phrases and tool phrases
  phrases = util.getPhrases(languageCode);
  userdocPhrases = propertiesReader(path.resolve(__dirname, `../../i18n/userdoc${languageCode === "en" ? "" : `_${languageCode}`}.properties`));

  const model = {
    contentTypes: [],
    parts: []
  };

  // Load mixins
  const mixinsXml = util.getMixins({ build }).map((m) => {
    const mixin = {
      name: m.name,
      mixin: fs.readFileSync(path.resolve(m.path, m.filename), xmlFileEncoding)
    };
    return mixin;
  });

  mixins = mixinsXml.map((xml) => {
    const mixin = {
      name: xml.name,
      mixin: processMixins(xmlconvert.xml2js(xml.mixin, xmlOptions), languageCode)
    };
    return mixin;
  });

  // Load xdata
  const xdataXml = util.getXData({ build }).map((x) => {
    const xd = {
      name: x.name,
      xdata: fs.readFileSync(path.resolve(x.path, x.filename), xmlFileEncoding)
    };
    return xd;
  });

  xdata = xdataXml.map((xml) => {
    const x = processXData(xmlconvert.xml2js(xml.xdata, xmlOptions), languageCode);
    const xd = {
      name: xml.name,
      xdata: x,
      allowContentTypes: x.allowContentTypes
    };
    return xd;
  });

  // process.exit();

  const contentTypeXml = util.getContentTypes({ build }).map(ct => ({
    name: ct.name,
    xml: fs.readFileSync(`${ct.path}/${ct.filename}`, xmlFileEncoding)
  }));
  model.contentTypes = contentTypeXml.map(
    ct => generateContentTypeModel(
      xmlconvert.xml2js(ct.xml, xmlOptions),
      ct.name,
      languageCode
    )
  );

  const partXml = util.getParts({ build }).map(part => fs.readFileSync(`${part.path}/${part.filename}`, xmlFileEncoding));
  model.parts = partXml.map(
    xml => generatePartModel(
      xmlconvert.xml2js(xml, xmlOptions),
      languageCode
    )
  );

  const layoutXml = util.getLayouts({ build }).map(layout => fs.readFileSync(`${layout.path}/${layout.filename}`, xmlFileEncoding));
  model.layouts = layoutXml.map(
    xml => generateLayoutModel(
      xmlconvert.xml2js(xml, xmlOptions),
      languageCode
    )
  );

  model.site = generateSiteModel(
    xmlconvert.xml2js(fs.readFileSync(path.resolve(build ? util.BUILD_SITE_DIR : util.SITE_DIR, "site.xml"), xmlFileEncoding), xmlOptions),
    languageCode
  );

  // Sort models by resolved i18n display names.
  model.contentTypes = model.contentTypes.sort(compareDisplayName);
  model.parts = model.parts.sort(compareDisplayName);

  copyImages();
  renderTemplate(model, languageCode);

  /*
  TODO: ContentSelector allowContentType
  TODO: Double, Long min max
  TODO: allowPath+++ for all selector types
  TODO: max-length for textarea, textline
  */
};

function processMixins(mixin, language) {
  const model = {
    fields: []
  };

  const mixinElement = getElementByName(mixin, "mixin");

  // Get fallback text for displayName
  const displayNameElement = getElementByName(mixinElement, "display-name");
  model.displayName = displayNameElement.elements[0].text;

  util.infoMessage(`Processing mixin '${model.displayName}'`);

  let itemsElement = getElementByName(mixinElement, "form"); // XP7
  if (itemsElement === undefined) itemsElement = getElementByName(mixinElement, "items"); // XP6

  if (itemsElement.elements) {
    itemsElement.elements.forEach((element) => {
      // const field = getField(element, language);
      model.fields.push(...[].concat(getField(element, language)));
    });
  }

  return model;
}

function processXData(xd, language) {
  const model = {
    fields: []
  };

  const xdataElement = getElementByName(xd, "x-data");

  // Get fallback text for displayName
  const displayNameElement = getElementByName(xdataElement, "display-name");
  model.displayName = displayNameElement.elements[0].text;

  util.infoMessage(`Processing x-data '${model.displayName}'`);

  model.allowContentTypes = getElementArrayByName(xdataElement, "allowContentType").map(i => i.elements[0].text);

  let itemsElement = getElementByName(xdataElement, "form"); // XP7
  if (itemsElement === undefined) itemsElement = getElementByName(xdataElement, "items");

  if (itemsElement.elements) {
    itemsElement.elements.forEach((element) => {
      // const field = getField(element, language);
      model.fields.push(...[].concat(getField(element, language)));
    });
  }

  return model;
}

function generateContentTypeModel(contentType, name, language) {
  const model = {
    fields: []
  };

  const contentTypeNode = getElementByName(contentType, "content-type");

  // Get fallback text for displayName
  const displayNameNode = getElementByName(contentTypeNode, "display-name");
  model.displayName = displayNameNode.elements[0].text;

  util.infoMessage(`Processing content-type '${model.displayName}'`);

  const phrase = getI18nText(displayNameNode, language);
  if (phrase && phrase.length > 0) model.displayName = getI18nText(displayNameNode, language);

  const displayNameField = {
    name: userdocPhrases.get("displayName"),
    description: userdocPhrases.get("displayNameDescription"),
    max: 1,
    min: 1,
    requiredText: userdocPhrases.get("yes"),
    type: userdocPhrases.get("displayName")
  };
  model.fields.push(displayNameField);

  model.summary = getTagContents(contentType, "summary", language);
  model.image = getTagContents(contentType, "image");

  // Loop through all fields in the content type
  const formElement = getElementByName(contentTypeNode, "form");

  if (formElement.elements) {
    formElement.elements.forEach((element) => {
      // const field = getField(element, language);
      model.fields.push(...[].concat(getField(element, language)));
    });
  }

  // Apply x-data
  // Check if any x-data applies to this content type
  const xdataMatches = [];

  // TODO: Proper matching that includes Enonic's weird wildcard implementation
  xdata.forEach((xd) => {
    if (xd.allowContentTypes.includes(name)) {
      xdataMatches.push(xd);
      util.infoMessage(`${xd.name} x-data is allowed in ${name}, applying it`);
    }
  });

  if (xdataMatches.length > 0) {
    xdataMatches.forEach((xd) => {
      // Create a dummy field-set to mimic how the xdata actually works
      const fieldset = {
        min: 0,
        max: 1,
        type: "FieldSet",
        name: xd.xdata.displayName,
        items: xd.xdata.fields
      };
      model.fields.push(fieldset);
    });
  }

  return model;
}


/**
 * Generate model for a part.
 *
 * @param {*} part Xml2json object containing the part
 * @param {*} language Language code
 */
function generatePartModel(part, language) {
  const model = {
    fields: []
  };

  const partElement = getElementByName(part, "part");

  // Get fallback text for displayName
  const displayNameElement = getElementByName(partElement, "display-name");
  model.displayName = displayNameElement.elements[0].text;

  util.infoMessage(`Processing part '${model.displayName}'`);

  const phrase = getI18nText(displayNameElement, language);
  if (phrase && phrase.length > 0) model.displayName = getI18nText(displayNameElement, language);

  model.summary = getTagContents(part, "summary", language);
  model.image = getTagContents(part, "image");

  // Loop through all fields in the content type
  let formElement = getElementByName(partElement, "form"); // XP7
  if (formElement === undefined) formElement = getElementByName(partElement, "config"); // XP6

  if (formElement.elements) {
    formElement.elements.forEach((element) => {
      // const field = getField(element, language);
      model.fields.push(...[].concat(getField(element, language)));
    });
  }

  return model;
}

function generateLayoutModel(layout, language) {
  const model = {
    fields: []
  };

  const layoutElement = getElementByName(layout, "layout");

  // Get fallback text for displayName
  const displayNameElement = getElementByName(layoutElement, "display-name");
  model.displayName = displayNameElement.elements[0].text;

  util.infoMessage(`Processing layout '${model.displayName}'`);

  const phrase = getI18nText(displayNameElement, language);
  if (phrase && phrase.length > 0) model.displayName = getI18nText(displayNameElement, language);

  model.summary = getTagContents(layout, "summary", language);
  model.image = getTagContents(layout, "image");

  // Loop through all config fields in the layout
  let configElement = getElementByName(layoutElement, "form"); // XP7
  if (configElement === undefined) configElement = getElementByName(layoutElement, "config"); // XP6

  if (configElement.elements) {
    configElement.elements.forEach((element) => {
      // const field = getField(element, language);
      model.fields.push(...[].concat(getField(element, language)));
    });
  }

  return model;
}

function generateSiteModel(site, language) {
  const model = {
    fields: []
  };

  const siteElement = getElementByName(site, "site");

  util.infoMessage("Processing site.xml");

  // Loop through all config fields in the site
  let configElement = getElementByName(siteElement, "form"); // XP7
  if (configElement === undefined) configElement = getElementByName(siteElement, "config"); // XP6

  if (configElement && configElement.elements) {
    configElement.elements.forEach((element) => {
      // const field = getField(element, language);
      model.fields.push(...[].concat(getField(element, language)));
    });
  } else {
    util.warningMessage("Config/form element does not exist or is empty in site.xml");
  }

  return model;
}

// eslint-disable-next-line no-nested-ternary
function compareDisplayName(a, b) { return (a.displayName < b.displayName) ? -1 : (a.displayName > b.displayName) ? 1 : 0; }

/**
 * Copies images from source directory to build output directory.
 */
function copyImages() {
  // Translate path from config, it is relative to project root directory
  const sourcePath = path.resolve(util.BASE_DIR, config.userDocumentation.imagePath);

  if (fs.existsSync(sourcePath)) {
    fse.ensureDirSync(destination.adminToolImageDirectory);
    fse.copySync(sourcePath, destination.adminToolImageDirectory);
    util.successMessage("Image assets copied to admin tool");
  } else {
    util.infoMessage("No image assets to copy");
  }
}


/**
 * Renders templates to markdown and html.
 *
 * @param {*} model
 * @param {*} language
 */
function renderTemplate(model, language) {
  const mainTemplateFilename = "main.md";

  const templates = getAllTemplates(language);

  // Ensure build output directories exist
  fse.ensureDirSync(destination.markdownDirectory);
  fse.ensureDirSync(destination.adminToolDirectory);

  // Register all partials.
  templates.forEach(file => handlebars.registerPartial(file.name, fs.readFileSync(`${file.path}/${file.name}`, xmlFileEncoding)));

  const mainTemplate = templates.filter(file => file.name === mainTemplateFilename);

  let output;
  if (mainTemplate.length > 0) {
    const template = handlebars.compile(fs.readFileSync(`${mainTemplate[0].path}/${mainTemplate[0].name}`, xmlFileEncoding));
    output = template(model);
  } else {
    util.errorMessage(`Main template '${mainTemplateFilename}' not found.`);
  }

  fse.writeFileSync(`${destination.markdownDirectory}/${destination.markdownFilename}`, output);
  util.successMessage("Rendered markdown documentation");

  const md = new Markdownit({
    html: true,
    breaks: true,
    xhtmlOut: true,
    typographer: true
  }).use(require("markdown-it-anchor"), {})
    .use(require("markdown-it-table-of-contents"), {
      includeLevel: [2, 3],
      format: heading => `${heading}<span class="header-extra"></span>`
    })
    .use(require("markdown-it-attrs"))
    .use(require("markdown-it-div"));

  fse.writeFileSync(`${destination.adminToolDirectory}/${destination.adminToolFilename}`, md.render(output));
  util.successMessage("Rendered HTML documentation");
}

/**
 * Get an element by name from the current root object.
 *
 * @returns {*} Element with the supplied name
 * @param {*} document Root object structure
 * @param {string} elementName Element name
 */
function getElementByName(document, elementName) {
  if (document.elements) {
    const result = document.elements.filter(item => item.name === elementName);
    return result[0];
  }
  return "";
}

/**
 * Returns field, with optional children. Runs recursively.
 *
 * @param {*} element Root object structure
 * @param {*} language Language code
 */
function getField(element, language) {
  const field = {
    min: 0, // XP default
    max: 1 // XP default
  };

  if (element.name === "option-set") {
    field.type = "OptionSet";
    if (element.elements && element.elements.length > 0) {
      field.options = [];

      const optionsElement = getElementByName(element, "options");

      // Loop through options-elements
      optionsElement.elements.forEach((optionElement) => {
        const option = {
          fields: []
        };

        option.label = getI18nText(getElementByName(optionElement, "label"), language);
        option.description = getTagContents(optionElement, "description", language);
        option.image = getTagContents(optionElement, "image");

        const itemsElement = getElementByName(optionElement, "items");
        if (itemsElement) {
          itemsElement.elements.forEach(
            inputElement => option.fields.push(...[].concat(getField(inputElement, language)))
          );
        }

        field.options.push(option);
      });
    }
  } else if (element.name === "field-set") {
    field.type = "FieldSet";

    if (element.elements && element.elements.length > 0) {
      field.items = [];

      const itemsElement = getElementByName(element, "items");

      itemsElement.elements.forEach(
        inputElement => field.items.push(...[].concat(getField(inputElement, language)))
      );
    }
  } else if (element.name === "item-set") {
    field.type = "ItemSet";

    if (element.elements && element.elements.length > 0) {
      field.items = [];

      const itemsElement = getElementByName(element, "items");

      itemsElement.elements.forEach(
        inputElement => field.items.push(...[].concat(getField(inputElement, language)))
      );
    }
  } else if (element.name === "inline") {
    field.type = "Mixin";
    let mixinName;
    if (element.attributes && element.attributes.mixin) {
      mixinName = element.attributes.mixin;
    }
    const mixin = mixins.filter(v => v.name === mixinName);
    return mixin[0].mixin.fields; // Returns an array of fields.
  }

  field.description = getTagContents(element, "description", language);
  field.image = getTagContents(element, "image");
  // field.name = getI18nText(getElementByName(element, "label"));
  const labelElement = getElementByName(element, "label");
  if (labelElement) {
    field.name = getI18nText(labelElement);
  }

  // Check required
  const occurrencesNode = getElementByName(element, "occurrences");

  if (occurrencesNode) {
    const minOccurrences = occurrencesNode.attributes.minimum;
    const maxOccurrences = occurrencesNode.attributes.maximum;

    if (minOccurrences === maxOccurrences && minOccurrences > 0) {
      field.other = userdocPhrases.get("required");
      field.requiredText = userdocPhrases.get("yes");
    } else {
      field.requiredText = userdocPhrases.get("no");
    }
    if (minOccurrences === maxOccurrences && minOccurrences === 0) field.other = userdocPhrases.get("infinite");
    field.max = (maxOccurrences === 0) ? userdocPhrases.get("infinite") : maxOccurrences;
    field.min = minOccurrences;
  }

  // Get type
  if (!field.type) field.type = (element.attributes && element.attributes.type) ? element.attributes.type : "";

  // Process RadioButton options
  if (field.type.toLowerCase() === "radiobutton" || field.type.toLowerCase() === "combobox") {
    let configElement = getElementByName(element, "form"); // XP7
    if (configElement === undefined) configElement = getElementByName(element, "config"); // XP6
    const defaultElement = getElementByName(element, "default");

    let defaultOption = "";
    if (defaultElement && defaultElement.elements && defaultElement.elements[0].text) {
      defaultOption = defaultElement.elements[0].text;
    }

    if (configElement.elements && configElement.elements.length > 0) {
      field.configOptions = [];
      let description = "";

      configElement.elements.forEach((option) => {
        if (option.name === "option") {
          const optionTitle = `${option.elements[0].text}${option.attributes && option.attributes.value === defaultOption ? " (standard)" : ""}`;

          field.configOptions.push({ option: optionTitle, description: description });

          // Reset documentation comment, we've hit the actual option here.
          description = "";
        } else if (option.type === "comment") {
          const tag = getTag("description", language);

          // Check if we have the correct language
          if (option.comment && option.comment.length > 0 && option.comment.indexOf(tag) > -1) {
            description = option.comment.replace(tag, "").replace(/^\s*/gm, "");
          }
        }
      });
    }
  }

  return field;
}

/**
 * Get equally named elements by name from the current root object and return an array.
 *
 * @returns {*} Element array with the supplied name
 * @param {*} document Root object structure
 * @param {string} elementName Element name
 */
function getElementArrayByName(document, elementName) {
  if (document.elements) {
    const result = document.elements.filter(item => item.name === elementName);
    return result;
  }
  return [];
}

/**
 * Get i18n translated text for the current element with an i18n attribute.
 *
 * @param {*} element Element object
 */
function getI18nText(element) {
  if (!(element.attributes && element.attributes.i18n)) {
    if (!element.elements) return "";
    util.warningMessage(`WARNING: No i18n field for '${element.elements[0].text}'`);
    return element.elements[0].text;
  }

  const phrase = phrases.get(element.attributes.i18n);
  if (!phrase) {
    util.warningMessage(`WARNING: i18n key '${element.attributes.i18n}' not found for language in '${element.elements[0].text}'`);
    return element.elements[0].text;
  }
  return phrase;
}

/**
 * Get documentation comment tag contents from the current root object with the specified tag
 * name and optional language.
 *
 * @returns {string} Contents of documentation tag
 * @param {*} element Root object structure
 * @param {*} tag Tag name
 * @param {*} language Optional language code
 */
function getTagContents(element, tag, language) {
  const _tag = getTag(tag, language);
  if (element.elements) {
    const result = element.elements.filter((item) => {
      if (item.type !== "comment") return false;
      return (item.comment.indexOf(_tag) !== -1);
    }).map(item => item.comment.replace(_tag, "").replace(/^\s*/gm, ""));

    if (tag === "image" && result.length > 0) return result;
    if (result[0]) return result[0];
  }
  util.warningMessage(`WARNING: No ${tag} documentation comment.`);
  return "";
}

/**
 * Format a documentation tag.
 *
 * @returns Documentation tag string.
 * @param {*} tag
 * @param {*} language
 */
function getTag(tag, language) {
  if (language) return `@${tag}[${language}]:`;
  return `@${tag}:`;
}

/**
* Returns a list of all templates for the specified language.
* Templates in the project folder will take precedence over default templates.
*
* @returns {Array} Array of objects with 'name' and 'path' properties.
* @param {*} language
*/
function getAllTemplates(language) {
  const projectDirectory = path.resolve(util.BASE_DIR, `${config.userDocumentation.sourcePath}/${language}`);
  const defaultDirectory = path.resolve(__dirname, `../../templates/documentation/userdoc/${language}`);
  let files = getTemplates(projectDirectory);

  let defaultFiles = getTemplates(defaultDirectory);

  // Add templates that are missing in project source from default template folder
  defaultFiles = defaultFiles.filter(file => files.filter(f => f.name === file.name).length === 0);

  files = files.concat(defaultFiles);

  return files;
}

/**
 * Gets all template (*.md) files from the specified directory.
 * @returns {object} Object with 'name' and 'path' properties.
 * @param {*} directory Directory to get templates from
 */
function getTemplates(directory) {
  let files = fs.readdirSync(directory);
  files = files.filter(file => file.endsWith(".md"))
    .map(file => ({ name: file, path: directory }));
  return files;
}
