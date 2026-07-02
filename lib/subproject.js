import findParentDir from "find-parent-dir";

const SUBPROJECT_BASE_PATH = "subprojects/";

function findSubprojectDir() {
  let baseDir;
  if (!baseDir) baseDir = findParentDir.sync(process.cwd(), ".subproject.json");
  if (!baseDir) throw new Error("You need to run this command from within a subproject");
  return baseDir;
}
const subprojectDir = findSubprojectDir();

export { SUBPROJECT_BASE_PATH, subprojectDir };
