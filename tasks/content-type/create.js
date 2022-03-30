const fse = require("fs-extra");
const path = require("path");
const util = require("../../lib/util");

const SITE_DIR = util.SITE_DIR;

const type = "content-type";

exports.getConfig = () => [
  {
    argument: "name",
    type: "string",
    message: "Enter name (no spaces)",
    validate: util.VALIDATORS.nospace
  }, {
    argument: "displayName",
    type: "phrase",
    message: "Enter displayName"
  }
];

exports.run = (config) => {
  const name = config.name;
  const displayName = config.displayName;

  const targetDirectory = path.resolve(SITE_DIR, `content-types/${name}`);

  util.executeIfPathAvailable(targetDirectory, () => {
    util.printHeader(`Creating ${type} '${name}' in ${targetDirectory}`);

    // Create directory for content type
    fse.ensureDirSync(targetDirectory);

    // TODO: Prompt user if directory already exists.

    util.copyTemplateFile(type, "png", path.resolve(targetDirectory, `${name}.png`));

    // Render template
    const model = {
      name: name,
      displayName: displayName && displayName.en ? displayName.en : name,
      displayName_i18n: `${name}.displayName`
    };
    util.renderTemplate(type, "xml", model, path.resolve(targetDirectory, `${name}.xml`));

    util.addPhrase(model.displayName_i18n, displayName);
  });
};
