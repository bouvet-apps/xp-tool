
const fs = require("fs");
const fse = require("fs-extra");
const path = require("path");
const chokidar = require("chokidar");
const util = require("../../lib/util");
const subprojectUtil = require("../../lib/subproject");

const EXTEND_MARKER = "/* XP_TOOL_EXTEND_SOURCE */";

exports.run = () => {
  const baseProjectPath = path.resolve(subprojectUtil.subprojectDir, "../..");
  const subprojectPath = subprojectUtil.subprojectDir;
  const genPath = path.resolve(subprojectPath, "gen");
  const codePath = path.resolve(subprojectPath, "code");

  const fileWatcher = chokidar.watch(codePath, {
    delay: 200,
    events: ["add", "change", "unlink"],
    ignored: [],
    ignoreInitial: true,
    queue: true
  });
  util.printHeader(`Watching for changes/new files in ${codePath}\n`);

  fileWatcher.on("add", filePath => copyFile(filePath, genPath, baseProjectPath, subprojectPath));
  fileWatcher.on("change", filePath => copyFile(filePath, genPath, baseProjectPath, subprojectPath));
};

function copyFile(filePath, genPath, baseProjectPath, subprojectPath) {
  const relPath = (path.relative(subprojectPath, filePath));

  const sourceFilePath = path.join(baseProjectPath, relPath);
  const destinationPath = path.resolve(genPath, relPath);

  fse.ensureDirSync(path.dirname(destinationPath));

  let subprojectFile = fs.readFileSync(filePath, "utf8");
  const extendable = subprojectFile.indexOf(EXTEND_MARKER) !== -1;
  // Check if extendable and that file exists in source project
  if (extendable && fs.existsSync(sourceFilePath)) {
    const mainFile = fs.readFileSync(sourceFilePath, "utf8");
    subprojectFile = subprojectFile.replace(EXTEND_MARKER, mainFile);
    util.infoMessage(`COPY EXTENDED - ${relPath}`);
  } else {
    util.infoMessage(`COPY ---------- ${relPath}`);
  }
  fse.writeFileSync(destinationPath, subprojectFile);
}
