import enquirer from "enquirer";
import { readFile, writeFile } from "fs/promises";
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
    const value = values[language.code] ?? "";
    if (properties.getRaw(key) === value) return;

    const content = await readFile(filename, "utf8");
    const updatedContent = updatePhraseContents(content, key, value);
    if (updatedContent !== content) await writeFile(filename, updatedContent, "utf8");
  }));

  util.successMessage(`Updated phrase '${key}' in ${languages.length} language files.`);
}

export function updatePhraseContents(content, key, value) {
  const lines = splitLines(content);
  let section = "";
  let target;
  let firstSectionOffset = null;

  for (const line of lines) {
    const trimmed = line.text.trim();
    const sectionMatch = /^\[([^=]+)]$/.exec(trimmed);

    if (sectionMatch) {
      section = sectionMatch[1];
      if (firstSectionOffset === null) firstSectionOffset = line.offset;
      continue;
    }

    if (!trimmed || trimmed.startsWith("#")) continue;

    const propertyMatch = /^([^#=]+)(={0,1})(.*)$/.exec(trimmed);
    if (!propertyMatch) continue;

    const propertyKey = propertyMatch[1].trim();
    const fullKey = section ? `${section}.${propertyKey}` : propertyKey;
    if (fullKey === key) target = { line, propertyMatch };
  }

  if (target) {
    const { line, propertyMatch } = target;
    const leadingWhitespace = line.text.length - line.text.trimStart().length;
    const prefixLength = leadingWhitespace + propertyMatch[1].length + propertyMatch[2].length;
    const prefix = line.text.slice(0, prefixLength);
    const trailingWhitespace = line.text.slice(line.text.trimEnd().length);
    const separator = propertyMatch[2] ? " " : " = ";

    line.text = `${prefix}${separator}${value}${trailingWhitespace}`;
    return lines.map(({ text, ending }) => `${text}${ending}`).join("");
  }

  const newProperty = `${key} = ${value}`;
  const lineEnding = lines.find(({ ending }) => ending)?.ending ?? "\n";

  if (firstSectionOffset !== null) {
    const insertionOffset = firstSectionOffset === 0 && content.startsWith("\uFEFF") ? 1 : firstSectionOffset;
    return `${content.slice(0, insertionOffset)}${newProperty}${lineEnding}${content.slice(insertionOffset)}`;
  }

  if (content.length === 0) return newProperty;

  const hasFinalNewline = /(?:\r\n|\n|\r)$/.test(content);
  return `${content}${hasFinalNewline ? "" : lineEnding}${newProperty}${hasFinalNewline ? lineEnding : ""}`;
}

function splitLines(content) {
  const parts = content.split(/(\r\n|\n|\r)/);
  const lines = [];
  let offset = 0;

  for (let i = 0; i < parts.length; i += 2) {
    const text = parts[i];
    const ending = parts[i + 1] ?? "";
    lines.push({ text, ending, offset });
    offset += text.length + ending.length;
  }

  return lines;
}
