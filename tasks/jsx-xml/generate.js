/* eslint-disable no-await-in-loop */
const { resolve } = require("path");
const { writeFile, readFile } = require("fs").promises;
const fse = require("fs-extra");
const babel = require("@babel/core");

const { printHeader, successMessage, infoMessage } = require("../../lib/util");
const { JSX_BUILT_INS, BABEL_OPTIONS } = require("../../lib/jsx-xml");

exports.run = async () => {
  const dirPath = resolve(__dirname, "../../dist/components");
  fse.ensureDirSync(dirPath);

  printHeader("Transpiling built in components");
  const componentFilenames = Object.values(JSX_BUILT_INS);

  for (const fileName of componentFilenames) {
    const filePath = resolve(__dirname, "../../templates/jsx", fileName);
    const fileContent = await readFile(filePath, "utf8");

    const transpiled = babel.transformSync(fileContent, BABEL_OPTIONS).code;
    const targetPath = resolve(dirPath, fileName);

    await writeFile(targetPath, transpiled);
    successMessage(`Transpiled:  ${targetPath}`);
  }
  infoMessage("Finished transpiling to dist");
};
