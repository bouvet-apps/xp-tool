const fse = require("fs-extra");
const path = require("path");
const util = require("../../lib/util");

const { SITE_DIR } = util;

const type = "part";

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

  const targetDirectory = path.resolve(SITE_DIR, `parts/${name}`);

  util.executeIfPathAvailable(targetDirectory, () => {
    util.printHeader(`Creating ${type} '${name}' in ${targetDirectory}`);

    fse.ensureDirSync(targetDirectory);

    // Create model for template
    const model = {
      name: name,
      displayName: displayName && displayName.en ? displayName.en : name,
      displayName_i18n: `${name}.displayName`
    };

    // Render templates
    util.renderTemplate(type, "xml", model, `${targetDirectory}/${name}.xml`);
    util.renderTemplate(type, "es6", model, `${targetDirectory}/${name}.es6`);
    util.renderTemplate(type, "ftl", model, `${targetDirectory}/${name}.ftl`);

    util.addPhrase(model.displayName_i18n, displayName);
  });
};
