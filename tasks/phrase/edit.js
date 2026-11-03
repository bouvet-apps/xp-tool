import enquirer from "enquirer";
import path from "path";
import propertiesReader from "properties-reader";
import * as util from "../../lib/util/index.js";

export async function run() {
  util.printHeader("Edit phrase");

  const languages = util.getLanguages();
  if (languages.length === 0) {
    util.warningMessage("No phrase files found in the project.");
    return;
  }

  const phraseFiles = languages.map((language) => {
    const filename = path.join(language.path, language.filename);
    return {
      language,
      filename,
      properties: propertiesReader({ sourceFile: filename })
    };
  });
  const keys = [...new Set(phraseFiles.flatMap(({ properties }) => [...properties.entries()].map(([key]) => key)))].sort();

  if (keys.length === 0) {
    util.warningMessage("No phrases found in the project.");
    return;
  }

  const { key } = await enquirer.prompt({
    type: "select",
    name: "key",
    message: "Choose phrase to edit",
    choices: keys
  });
  const questions = phraseFiles.map(({ language, properties }) => ({
    type: "input",
    name: language.code,
    message: `${language.name || language.code} (${language.code})`,
    initial: properties.getRaw(key) ?? ""
  }));
  const values = await enquirer.prompt(questions);

  await Promise.all(phraseFiles.map(async ({ language, filename, properties }) => {
    properties.set(key, values[language.code] ?? "");
    await properties.save(filename);
  }));

  util.successMessage(`Updated phrase '${key}' in ${languages.length} language files.`);
}
