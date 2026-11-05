import fs from "fs";
import fse from "fs-extra";
import Markdownit from "markdown-it";
import handlebars from "handlebars";
import propertiesReader from "properties-reader";
import path from "path";
import markdownItAnchor from "markdown-it-anchor";
import markdownItTableOfContents from "markdown-it-table-of-contents";
import markdownItAttrs from "markdown-it-attrs";
import markdownItDiv from "markdown-it-div";
import yaml from "js-yaml";
import { fileURLToPath } from "url";
import * as util from "../../lib/util/index.js";
import { extractDocComments } from "../../lib/util/yaml-comments.js";
import { buildFieldModel } from "../../lib/util/yaml-model.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

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

const fileEncoding = "utf8";

let phrases;
let userdocPhrases;

let mixins;
let xdata;

const config = util.getConfig();

export function run({ build = true } = {}) {
  const languageCode = "no";

  util.printHeader("Generating documentation");

  // Load project phrases and tool phrases
  phrases = util.getPhrases(languageCode);
  userdocPhrases = propertiesReader(path.resolve(__dirname, `../../i18n/userdoc${languageCode === "en" ? "" : `_${languageCode}`}.properties`));

  const model = {
    contentTypes: [],
    parts: [],
    site: { fields: [] }
  };

  // Load mixins
  mixins = util.getMixins({ build }).map((m) => {
    const { text, doc } = readDescriptor(m.path, m.filename);
    util.infoMessage(`Processing mixin '${resolveDisplayName(doc, languageCode)}'`);
    return {
      name: m.name,
      mixin: {
        displayName: resolveDisplayName(doc, languageCode),
        fields: buildFields(doc, text, languageCode)
      }
    };
  });

  // Load form-fragments
  xdata = util.getFormFragments({ build }).map((x) => {
    const { text, doc } = readDescriptor(x.path, x.filename);
    util.infoMessage(`Processing form-fragment '${resolveDisplayName(doc, languageCode)}'`);
    return {
      name: x.name,
      xdata: {
        displayName: resolveDisplayName(doc, languageCode),
        fields: buildFields(doc, text, languageCode)
      },
      allowContentTypes: (doc && doc.allowContentType) || []
    };
  });

  // Content types
  model.contentTypes = util.getContentTypes({ build }).map((ct) => {
    const { text, doc } = readDescriptor(ct.path, ct.filename);
    return generateContentTypeModel(doc, text, ct.name, languageCode);
  });

  // Parts
  model.parts = util.getParts({ build }).map((part) => {
    const { text, doc } = readDescriptor(part.path, part.filename);
    return generatePartModel(doc, text, languageCode);
  });

  // Layouts
  model.layouts = util.getLayouts({ build }).map((layout) => {
    const { text, doc } = readDescriptor(layout.path, layout.filename);
    return generateLayoutModel(doc, text, languageCode);
  });

  // Site descriptor
  const [siteDescriptor] = util.getSite({ build });
  if (siteDescriptor) {
    const { text, doc } = readDescriptor(siteDescriptor.path, siteDescriptor.filename);
    model.site = generateSiteModel(doc, text, languageCode);
  } else {
    util.warningMessage("No site descriptor found in /site or /cms");
  }

  // Sort models by resolved display names.
  model.contentTypes = model.contentTypes.sort(compareDisplayName);
  model.parts = model.parts.sort(compareDisplayName);

  copyImages();
  renderTemplate(model, languageCode);
}

/**
 * Read a descriptor file and return both the raw text (for comment extraction)
 * and the parsed YAML document.
 */
function readDescriptor(dir, filename) {
  const text = fs.readFileSync(path.resolve(dir, filename), fileEncoding);
  return { text, doc: yaml.load(text) };
}

/**
 * Resolve the display name from a YAML `title` (string or {text, i18n}).
 */
function resolveDisplayName(doc, language) {
  const title = doc && doc.title;
  if (!title) return "";
  if (typeof title === "string") return title;
  if (title.i18n) {
    const phrase = phrases.get(title.i18n);
    if (phrase) return phrase;
  }
  return title.text || "";
}

/**
 * Build the fields array for a descriptor from its parsed form + raw comments.
 */
function buildFields(doc, rawText, language) {
  const comments = extractDocComments(rawText);
  const form = (doc && Array.isArray(doc.form)) ? doc.form : [];
  return form.map((f) => buildFieldModel(f, comments, language, phrases, userdocPhrases));
}

/**
 * Get the top-level (document root) summary/description comment, if any.
 */
function getTopLevelComment(rawText, tag, language) {
  const comments = extractDocComments(rawText);
  const match = comments.find(c => c.field === null && c.tag === tag && c.language === language);
  return match ? match.text : "";
}

function generateContentTypeModel(doc, rawText, name, language) {
  const model = {
    displayName: resolveDisplayName(doc, language),
    fields: []
  };

  util.infoMessage(`Processing content-type '${model.displayName}'`);

  model.summary = getTopLevelComment(rawText, "summary", language);

  // displayName field (always first)
  model.fields.push({
    name: userdocPhrases.get("displayName"),
    description: userdocPhrases.get("displayNameDescription"),
    max: 1,
    min: 1,
    requiredText: userdocPhrases.get("yes"),
    type: userdocPhrases.get("displayName")
  });

  model.fields.push(...buildFields(doc, rawText, language));

  // Apply form-fragments that allow this content type
  xdata.forEach((xd) => {
    if (xd.allowContentTypes.includes(name)) {
      util.infoMessage(`${xd.name} form-fragment is allowed in ${name}, applying it`);
      model.fields.push({
        min: 0,
        max: 1,
        type: "FieldSet",
        name: xd.xdata.displayName,
        items: xd.xdata.fields
      });
    }
  });

  return model;
}

function generatePartModel(doc, rawText, language) {
  const model = {
    displayName: resolveDisplayName(doc, language),
    fields: []
  };

  util.infoMessage(`Processing part '${model.displayName}'`);

  model.summary = getTopLevelComment(rawText, "summary", language);
  model.fields = buildFields(doc, rawText, language);

  return model;
}

function generateLayoutModel(doc, rawText, language) {
  const model = {
    displayName: resolveDisplayName(doc, language),
    fields: []
  };

  util.infoMessage(`Processing layout '${model.displayName}'`);

  model.summary = getTopLevelComment(rawText, "summary", language);
  model.fields = buildFields(doc, rawText, language);

  return model;
}

function generateSiteModel(doc, rawText, language) {
  const model = {
    fields: []
  };

  util.infoMessage("Processing site descriptor");

  const form = (doc && Array.isArray(doc.form)) ? doc.form : [];
  if (form.length === 0) {
    util.warningMessage("Config/form element does not exist or is empty in site descriptor");
  }
  model.fields = buildFields(doc, rawText, language);

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
  templates.forEach(file => handlebars.registerPartial(file.name, fs.readFileSync(`${file.path}/${file.name}`, fileEncoding)));

  const mainTemplate = templates.filter(file => file.name === mainTemplateFilename);

  let output;
  if (mainTemplate.length > 0) {
    const template = handlebars.compile(fs.readFileSync(`${mainTemplate[0].path}/${mainTemplate[0].name}`, fileEncoding));
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
  }).use(markdownItAnchor, {})
    .use(markdownItTableOfContents, {
      includeLevel: [2, 3],
      format: heading => `${heading}<span class="header-extra"></span>`
    })
    .use(markdownItAttrs)
    .use(markdownItDiv);

  fse.writeFileSync(`${destination.adminToolDirectory}/${destination.adminToolFilename}`, md.render(output));
  util.successMessage("Rendered HTML documentation");
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
  if (!fs.existsSync(directory)) {
    return [];
  }
  let files = fs.readdirSync(directory);
  files = files.filter(file => file.endsWith(".md"))
    .map(file => ({ name: file, path: directory }));
  return files;
}
