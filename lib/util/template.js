import fs from "fs";
import path from "path";
import os from "os";
import fse from "fs-extra";
import handlebars from "handlebars";
import { fileURLToPath } from "url";

import { SETTINGS_DIR } from "./paths.js";
import { successMessage } from "./console.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

/**
 * Resolve template filename.
 * @param {string} name Name of template
 * @param {string} type File type
 */
function resolveTemplate(name, type) {
  let templatePath = "";
  const fileType = type.startsWith(".") ? type.substring(1) : type;

  const locations = [
    path.resolve(SETTINGS_DIR, `/templates/${name}/${name}.${fileType}`), // Project-specific templates
    path.resolve(os.homedir(), `/.xptool/templates/${name}/${name}.${fileType}`), // User-default templates
    path.resolve(__dirname, `../../templates/${name}/${name}.${fileType}`) // Tool-default templates
  ];

  for (let i = 0; i < locations.length; i++) {
    const location = locations[i];
    if (fs.existsSync(location)) {
      templatePath = location;
      break;
    }
  }
  return templatePath;
}

/**
 * Copies a template file to destination file.
 * @param {string} name Name of template
 * @param {string} type File type
 * @param {string} destination Destination path/filename
 */
function copyTemplateFile(name, type, destination) {
  const filename = resolveTemplate(name, type);
  fs.copyFileSync(filename, destination);
  successMessage(`Copied ${type} template`);
}

/**
 * Renders a template to destination file.
 * @param {string} name Name of template
 * @param {string} type File type
 * @param {object} model Model object for rendering
 * @param {string} destination Destination path/filename
 */
function renderTemplate(name, type, model, destination) {
  const filename = resolveTemplate(name, type);

  const template = handlebars.compile(fse.readFileSync(filename, "utf8"));

  const output = template(model);

  if (destination) {
    fse.writeFileSync(destination, output);
    successMessage(`Rendered ${type} template`);
  }
  return output;
}

export { resolveTemplate, copyTemplateFile, renderTemplate };
