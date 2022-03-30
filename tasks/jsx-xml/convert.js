/* eslint-disable no-useless-escape */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
const { relative, basename } = require("path");
const {
  writeFile, readFile, unlink
} = require("fs").promises;
const glob = require("glob");
const util = require("../../lib/util");

const { FILE_EXTENSION, XML_RENDER_OPTIONS } = require("../../lib/jsx-xml");

const SITE_DIR = util.SITE_DIR;
const globPath = `${SITE_DIR}/**/*.xml`;

exports.getConfig = () => [
  {
    argument: "delete",
    type: "string",
    message: "Delete XML files after conversion? If so, answer 'DELETE' (without ticks)"
  }
];

// Deprecated, TODO make unpack command for compacts
// eslint-disable-next-line no-unused-vars
const createTemplate = (config) => {
  const {
    name, content, isComponent, mixins
  } = config;

  return util.renderTemplate("boilerplate", FILE_EXTENSION, {
    isComponent,
    imports: mixins,
    renderOptions: JSON.stringify(XML_RENDER_OPTIONS),
    name,
    content
  });
};

const createTemplateCompact = (config) => {
  const {
    name, content, isComponent, mixins
  } = config;

  return util.renderTemplate("compact", FILE_EXTENSION, {
    isComponent,
    imports: mixins,
    renderOptions: JSON.stringify(XML_RENDER_OPTIONS),
    name,
    content
  });
};

const capitalize = (s) => {
  if (typeof s !== "string") return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
};


// list-article -> ListArticle
const processFileName = s => s.split("-").map(word => capitalize(word)).join("");

const getAllFiles = () => glob.sync(globPath);

const getPathToSite = (filePath) => {
  const path = relative(filePath, SITE_DIR);

  if (path === ".." || path.length === 0) return ".";
  return path.split("/").slice(0, -1).join("/");
};

const doReplace = (fileContent, isMixin) => {
  const toReplace = [
    {
      // Remove XML tag at top. Will be readded later.
      match: /<\??xml version=".*" encoding=".*"\??>\n?/gmi,
      replace: ""
    },
    {
      // Go from 4 spaces to 2 to match JSX spacing
      match: / {4}/gm,
      replace: "  "
    },
    {
      // Remove last linebreak for prettier output
      match: /\n$/,
      replace: ""
    },
    {
      // Wrap regexp in string
      match: /(\${.*})/gmi,
      replace: "{\"$1\"}"
    },
    {
      // Replace mixing with component
      match: /<mixin *name="(.*)" *\/>/gmi,
      replace: (match, group1) => `<${processFileName(group1)} />`
    },
    // Next 3 are for xml comments used for generating documentation
    {
      match: /( *)<!-- @summary\[(\w*)\]: ?((.|\n)*?) ?-->/gmi,
      replace: (match, startIndet, lang, text) => `${startIndet}<Summary lang=\"${lang}\" text=${text.includes("\n") ? `{\`${text}\`}` : `"${text.replace(/[\""]/gmi, "&quot;")}"`} />`
    },
    {
      match: /( *)<!-- @description\[(\w*)\]: ?((.|\n)*?) ?-->/gmi,
      replace: (match, startIndet, lang, text) => `${startIndet}<Description lang=\"${lang}\" text=${text.includes("\n") ? `{\`${text}\`}` : `"${text.replace(/[\""]/gmi, "&quot;")}"`} />`
    },
    {
      match: /( *)<!-- @image: ?((.|\n)*?) ?-->/gmi,
      replace: "$1<Image src=\"$2\" />"
    }
  ];


  if (isMixin) {
    toReplace.push(
      {
        // Remove everything before the actual schema content
        match: /[\s\S]*<form>\n? {0,2}/gmi,
        replace: ""
      },
      {
        // Remove everything after the actual schema content
        match: /\n *<\/form>[\s\S]*/gmi,
        replace: ""
      },
      {
        match: /\n {2}/gmi,
        replace: "\n"
      },
    );
  } else {
    toReplace.push(
      {
        match: /\n/gmi,
        replace: "\n  "
      },
      {
        match: /(.)/,
        replace: "  $1"
      }
    );
  }
  const reduceFn = (content, { match, replace }) => content.replace(match, replace);
  const schema = toReplace.reduce(reduceFn, fileContent);
  return schema;
};

// Convert xml file to jsx file
const convertFile = async (filePath) => {
  const relativePath = relative(SITE_DIR, filePath);
  try {
    const fileContent = await readFile(filePath, "utf8");
    const fileName = basename(filePath, ".xml");
    const isComponent = !filePath.match(/main\/resources\/site\/(pages|layouts|content-types|parts|x-data|site\.xml)/gmi);
    const isMixin = filePath.match(/main\/resources\/site\/mixins/gmi);
    const hasSummary = !!fileContent.match(/<!-- @(summary)/gmi);
    const hasDescription = !!fileContent.match(/<!-- @(description)/gmi);
    const hasImage = !!fileContent.match(/<!-- @(image)/gmi);
    const pathToSite = getPathToSite(filePath);

    const schema = doReplace(fileContent, isMixin);

    let mixins = {};
    const mixinMatches = fileContent.matchAll(/<mixin *name="(.*)" *\/>/gmi);
    for (const match of mixinMatches) {
      const name = match[1];
      if (!mixins[name]) {
        mixins[name] = `<import component="${processFileName(name)}" path="${pathToSite}/mixins/${name}/${name}${FILE_EXTENSION}" />`;
      }
    }
    mixins = Object.keys(mixins).map(key => mixins[key]);

    const componentName = processFileName(fileName);
    const convertedFile = createTemplateCompact({
      name: componentName,
      content: schema,
      isComponent,
      hasSummary,
      hasDescription,
      hasImage,
      mixins
    });

    const newPath = filePath.replace(".xml", FILE_EXTENSION);
    await writeFile(newPath, convertedFile);
    console.log(`JSX converted file at ${relativePath}`);
    return true;
  } catch (err) {
    util.errorMessage(`Failed to convert file at ${relativePath}`);
    console.log(err);
  }
  return false;
};


const convertFiles = async () => {
  const files = getAllFiles();

  let succesCount = 0;
  let errorCount = 0;

  util.printHeader("Starting conversion");

  // Transpile all files first
  for (const filePath of files) {
    const result = await convertFile(filePath);
    if (result) succesCount++;
    else errorCount++;
  }

  if (succesCount) util.successMessage(`Successfully converted ${succesCount} files!`);
  if (errorCount) util.errorMessage(`Failed to convert ${errorCount} files!`);
};

const deleteFiles = async () => {
  const files = getAllFiles();
  for (const filePath of files) {
    try {
      await unlink(filePath);

      util.warningMessage(`Deleted file at ${filePath}`);
    } catch (err) {
      util.errorMessage(`Failed to delete file at ${filePath}`);
      console.log(err);
    }
  }
};

exports.run = async (config) => {
  const shouldDelete = (config.delete || "") === "DELETE";
  util.printHeader("Converting XML files to JSX");
  if (shouldDelete) {
    util.infoMessage("Deleting files after conversion!");
  }

  // async function to enable await, making sure initial transpile run is ran first
  await convertFiles();

  util.successMessage("Finished converting files!");

  if (shouldDelete) {
    await deleteFiles();
    util.warningMessage("Finished deleting files! Bye forever....");
  }

  util.infoMessage("Updating your babel, eslint etc. to work with/ignore the JSX files is up to you");
  util.printHeader("Xptool provides compiler and watcher for JSX files!");
  util.printBullet(`Running 'xptool jsx-xml build' will compile your *${FILE_EXTENSION} files in /site to XML in build folder`);
  util.printBullet(`Add 'xptool jsx-xml watch' to your npm scripts (or use xptool directly in terminal). This will watch all *${FILE_EXTENSION} files in /site and recompile when they or outbound dependencies are changed.`);
};
