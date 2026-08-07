import fse from "fs-extra";
import path from "path";
import * as util from "../../lib/util/index.js";

const SITE_DIR = util.SITE_DIR;

const type = "content-type";

export function getConfig() {
  return [
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
}

export function run(config) {
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
    util.renderTemplate(type, "yaml", model, path.resolve(targetDirectory, `${name}.yaml`));

    util.addPhrase(model.displayName_i18n, displayName);
  });
}
