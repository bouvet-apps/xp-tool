import { RESOURCE_DIR, lookupDependency, getConfig } from "../util/index.js";

const generateBabelOptions = () => ({
  presets: [
    [
      lookupDependency("@babel/preset-env"),
      {
        targets: {
          node: "16"
        }
      }
    ]
  ],
  plugins: [
    [
      lookupDependency("@babel/plugin-transform-react-jsx"),
      {
        runtime: "classic",
        pragma: "JSXXML"
      }
    ]
  ]
});

const FILE_EXTENSION_DEFAULT = ".xml.jsx";
const FILE_EXTENSION_ALTERNATIVE = ".jsxxml";
const FILE_EXTENSION_SHORT = ".jsx";

const getFileExtension = () => {
  const ext = getConfig().jsxXml.extension;
  if (ext === "alternative") return FILE_EXTENSION_ALTERNATIVE;
  if (ext === "short") return FILE_EXTENSION_SHORT;
  return FILE_EXTENSION_DEFAULT;
};

const BABEL_OPTIONS = generateBabelOptions();
const FILE_EXTENSION = getFileExtension();
const XML_RENDER_OPTIONS = { prettyPrint: true, headless: true };
const JSX_GLOB_PATH = `${RESOURCE_DIR}/**/*${FILE_EXTENSION}`;

const JSX_BUILT_INS = {
  Summary: `summary${FILE_EXTENSION_DEFAULT}`,
  Description: `description${FILE_EXTENSION_DEFAULT}`,
  Image: `image${FILE_EXTENSION_DEFAULT}`
};

export {
  BABEL_OPTIONS,
  FILE_EXTENSION,
  XML_RENDER_OPTIONS,
  JSX_GLOB_PATH,
  JSX_BUILT_INS
};
