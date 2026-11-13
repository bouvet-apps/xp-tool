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
import { buildFieldModel, getImages } from "../../lib/util/yaml-model.js";

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
let formFragments;

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

  // Form-fragments are inlined wherever a `type: FormFragment` field references them
  formFragments = {};
  withDescriptor(util.getFormFragments({ build })).forEach((f) => {
    formFragments[f.name] = readDescriptor(f.path, f.filename);
  });

  const [siteDescriptor] = util.getSite({ build });
  const site = siteDescriptor ? readDescriptor(siteDescriptor.path, siteDescriptor.filename) : null;
  const mixinMappings = (site && site.doc && Array.isArray(site.doc.mixins)) ? site.doc.mixins : [];
  const appName = propertiesReader(path.resolve(util.CODE_DIR, "gradle.properties")).get("appName");

  // Only mixins mapped in the site descriptor are shown in Content Studio
  mixins = withDescriptor(util.getMixins({ build })).flatMap((m) => {
    const mapping = mixinMappings.find((mm) => localName(mm.name) === m.name);
    if (!mapping) return [];

    const { text, doc } = readDescriptor(m.path, m.filename);
    const displayName = resolveDisplayName(doc);
    util.infoMessage(`Processing mixin '${displayName}'`);
    return [{
      name: m.name,
      displayName,
      fields: buildFields(doc, text, languageCode),
      // XP8 matches `allowContentTypes` against the qualified content-type name
      allows: (contentType) => !mapping.allowContentTypes
        || new RegExp(`^(?:${mapping.allowContentTypes})$`).test(`${appName}:${contentType}`)
    }];
  });

  // Content types
  model.contentTypes = withDescriptor(util.getContentTypes({ build })).map((ct) => {
    const { text, doc } = readDescriptor(ct.path, ct.filename);
    return generateContentTypeModel(doc, text, ct.name, languageCode);
  });

  // Parts
  model.parts = withDescriptor(util.getParts({ build })).map((part) => {
    const { text, doc } = readDescriptor(part.path, part.filename);
    return generatePartModel(doc, text, languageCode);
  });

  // Layouts
  model.layouts = withDescriptor(util.getLayouts({ build })).map((layout) => {
    const { text, doc } = readDescriptor(layout.path, layout.filename);
    return generateLayoutModel(doc, text, languageCode);
  });

  // Site descriptor
  if (site) {
    model.site = generateSiteModel(site.doc, site.text, languageCode);
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
 * Drop objects without a descriptor file, e.g. a `.jsx` component that has not been compiled yet.
 */
function withDescriptor(objects) {
  return objects.filter((o) => {
    if (fs.existsSync(path.resolve(o.path, o.filename))) return true;
    util.warningMessage(`No descriptor found for '${o.name}', skipping (run 'xptool jsx-yaml build' first if it is a .jsx)`);
    return false;
  });
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
function resolveDisplayName(doc) {
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
  const usedFragments = new Set();
  const form = expandFormFragments((doc && Array.isArray(doc.form)) ? doc.form : [], usedFragments);
  const comments = [rawText, ...[...usedFragments].map((f) => f.text)].flatMap(extractDocComments);
  return form.map((f) => buildFieldModel(f, comments, language, phrases, userdocPhrases));
}

/** `app:name` or `name` → `name` */
function localName(name) { return String(name).split(":").pop(); }

/**
 * Replace `type: FormFragment` items with the fragment's own form items, recursively.
 */
function expandFormFragments(items, usedFragments) {
  return items.flatMap((item) => {
    if (!item || typeof item !== "object") return [item];

    if (item.type === "FormFragment") {
      const fragment = formFragments[localName(item.name)];
      if (!fragment) {
        util.warningMessage(`Form-fragment '${item.name}' not found`);
        return [];
      }
      usedFragments.add(fragment);
      const fragmentForm = (fragment.doc && Array.isArray(fragment.doc.form)) ? fragment.doc.form : [];
      return expandFormFragments(fragmentForm, usedFragments);
    }

    const expanded = { ...item };
    if (Array.isArray(item.items)) expanded.items = expandFormFragments(item.items, usedFragments);
    if (Array.isArray(item.options)) {
      expanded.options = item.options.map((opt) => (Array.isArray(opt.items)
        ? { ...opt, items: expandFormFragments(opt.items, usedFragments) }
        : opt));
    }
    return [expanded];
  });
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
    displayName: resolveDisplayName(doc),
    fields: []
  };

  util.infoMessage(`Processing content-type '${model.displayName}'`);

  model.summary = getTopLevelComment(rawText, "summary", language);
  model.image = getImages(extractDocComments(rawText), null);

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

  // Apply mixins mapped to this content type
  mixins.forEach((mixin) => {
    if (mixin.allows(name)) {
      util.infoMessage(`${mixin.name} mixin is allowed in ${name}, applying it`);
      model.fields.push({
        min: 0,
        max: 1,
        type: "FieldSet",
        name: mixin.displayName,
        items: mixin.fields
      });
    }
  });

  return model;
}

function generatePartModel(doc, rawText, language) {
  const model = {
    displayName: resolveDisplayName(doc),
    fields: []
  };

  util.infoMessage(`Processing part '${model.displayName}'`);

  model.summary = getTopLevelComment(rawText, "summary", language);
  model.image = getImages(extractDocComments(rawText), null);
  model.fields = buildFields(doc, rawText, language);

  return model;
}

function generateLayoutModel(doc, rawText, language) {
  const model = {
    displayName: resolveDisplayName(doc),
    fields: []
  };

  util.infoMessage(`Processing layout '${model.displayName}'`);

  model.summary = getTopLevelComment(rawText, "summary", language);
  model.image = getImages(extractDocComments(rawText), null);
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
