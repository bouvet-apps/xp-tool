import fse from "fs-extra";
import path from "path";
import * as util from "../../lib/util/index.js";

const type = "api";

export function getConfig() { return [{ argument: "name", type: "string", message: "Enter name (no spaces)" }]; }

export function run(config) {
  const name = config.name;

  const targetDirectory = path.resolve(util.RESOURCE_DIR, `apis/${name}`);

  util.executeIfPathAvailable(targetDirectory, () => {
    util.printHeader(`Creating ${type} '${name}' in ${targetDirectory}`);

    fse.ensureDirSync(targetDirectory);

    // Create model for template
    const model = {
      name: name
    };

    // Render templates
    util.renderTemplate(type, "yaml", model, `${targetDirectory}/${name}.yaml`);
    util.renderTemplate(type, "es6", model, `${targetDirectory}/${name}.es6`);
  });
}
