import fse from "fs-extra";
import path from "path";
import * as util from "../../lib/util/index.js";

const type = "task";

export function getConfig() {
  return [
    {
      argument: "name",
      type: "string",
      message: "Enter name (no spaces)",
      validate: util.VALIDATORS.nospace
    }, {
      argument: "description",
      type: "string",
      message: "Enter description"
    }
  ];
}

export function run(config) {
  const name = config.name;
  const description = config.description;

  const targetDirectory = path.resolve(util.RESOURCE_DIR, `tasks/${name}`);

  util.executeIfPathAvailable(targetDirectory, () => {
    util.printHeader(`Creating ${type} '${name}' in ${targetDirectory}`);

    fse.ensureDirSync(targetDirectory);

    // Create model for template
    const model = {
      name: name,
      description: description
    };

    // Render templates
    util.renderTemplate(type, "xml", model, `${targetDirectory}/${name}.xml`);
    util.renderTemplate(type, "es6", model, `${targetDirectory}/${name}.es6`);
  });
}
