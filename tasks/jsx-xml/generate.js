/* eslint-disable no-await-in-loop */
import { resolve } from "path";
import { writeFile, readFile } from "fs/promises";
import fse from "fs-extra";
import babel from "@babel/core";
import { fileURLToPath } from "url";

import { printHeader, successMessage, infoMessage } from "../../lib/util/index.js";
import { JSX_BUILT_INS, BABEL_OPTIONS } from "../../lib/jsx-xml/index.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export async function run() {
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
}
