
const fs = require("fs");
const fse = require("fs-extra");
const path = require("path");
const util = require("../../lib/util");
const subprojectUtil = require("../../lib/subproject");

const EXTEND_MARKER = "/* XP_TOOL_EXTEND_SOURCE */";

exports.run = () => {
  const baseProjectPath = path.resolve(subprojectUtil.subprojectDir, "../..");
  const subprojectPath = subprojectUtil.subprojectDir;
  const genPath = path.resolve(subprojectPath, "gen");

  const subprojectConfig = getSubprojectConfig(subprojectPath);

  fse.ensureDirSync(genPath);
  fse.copySync(path.resolve(subprojectPath, "code"), path.resolve(genPath, "code"));

  subprojectConfig.base.forEach((entry) => {
    util.printHeader(`Subproject Entry ${entry.path}`);
    copyFromBaseProject(entry.path, baseProjectPath, genPath, subprojectPath, entry, 0);
  });
};

function getSubprojectConfig(subprojectPath) { return JSON.parse(fs.readFileSync(path.resolve(subprojectPath, ".subproject.json"))); }

function copyFromBaseProject(localPath, baseProjectPath, buildPath, subprojectPath, config, level) {
  const sourceFilePath = path.join(baseProjectPath, localPath);
  const destinationPath = path.resolve(buildPath, localPath);

  // Check if file exists in source project
  if (fs.existsSync(sourceFilePath)) {
    const resolvedSourceFilePath = path.resolve(sourceFilePath);
    const sourceFileStat = fse.lstatSync(resolvedSourceFilePath);

    // If file is a directory, process all children individually if level == 0 or recursive == true
    if (sourceFileStat.isDirectory()) {
      if (config.recursive || level === 0) {
        util.successMessage(`Create directory ${destinationPath}`);
        fse.ensureDirSync(destinationPath);

        fse.readdirSync(resolvedSourceFilePath).forEach((file) => {
          const filePath = path.join(localPath, file);
          if (!globalIgnoreFilter(file) && includedByFilter(filePath, config)) {
            copyFromBaseProject(filePath, baseProjectPath, buildPath,
              subprojectPath, config, level + 1);
          } else util.infoMessage(`Ignored ${filePath}`);
        });
      }
    } else {
      // Check if file exists in subproject, do not copy if that is the case
      // eslint-disable-next-line no-lonely-if
      if (fs.existsSync(path.resolve(subprojectPath, localPath))) {
        util.infoMessage(`File ${localPath} is overriden by subproject`);

        const subprojectFile = fs.readFileSync(path.resolve(subprojectPath, localPath), "utf8");
        const extendable = subprojectFile.indexOf(EXTEND_MARKER) !== -1;
        if (extendable) {
          const mainFile = fs.readFileSync(sourceFilePath, "utf8");
          const extendedFile = subprojectFile.replace(EXTEND_MARKER, mainFile);
          fse.writeFileSync(destinationPath, extendedFile);
        }
      } else if (includedByFilter(localPath, config)) {
        util.successMessage(`Copy file ${localPath}`);
        fse.copyFileSync(sourceFilePath, destinationPath);
      } else util.infoMessage(`Ignored ${localPath}`);
    }
  } else {
    util.errorMessage(`Path ${localPath} does not exist in base project`);
  }
}

function globalIgnoreFilter(file) {
  const folders = ["node_modules", "build", ".gradle", ".settings"];
  return folders.includes(file);
}

function includedByFilter(filename, config) {
  const filterBase = config.path;
  const filterFilename = filename.replace(new RegExp(`^${filterBase}`), "");

  if ("filter" in config) {
    if (!("type" in config.filter)) throw new Error("filter type is not set");

    if (config.filter.type === "exclude") {
      let included = true;
      config.filter.entries.forEach((entry) => {
        const filter = new RegExp(entry);
        if (filter.test(filterFilename)) included = false;
      });
      return included;
    }

    if (config.filter.type === "include") {
      let included = false;
      config.filter.entries.forEach((entry) => {
        const filter = new RegExp(entry);
        if (filter.test(filterFilename)) included = true;
      });
      return included;
    }
    throw new Error(`Unsupported filter type '${config.filter.type}'`);
  }
  return true;
}
