const { RESOURCE_DIR, lookupDependency, getConfig } = require("../util");

const generateBabelOptions = () => ({
  plugins: [
    lookupDependency("@babel/plugin-proposal-nullish-coalescing-operator"),
    lookupDependency("@babel/plugin-proposal-optional-chaining"),
    [
      lookupDependency("@babel/plugin-transform-react-jsx"),
      {
        pragma: "JSXXML"
      }
    ]
  ]
});

const FILE_EXTENSION_DEFAULT = ".xml.jsx";
const FILE_EXTENSION_ALTERNATIVE = ".jsxxml";

const getFileExtension = () => (getConfig().jsxXml.extension === "alternative" ? FILE_EXTENSION_DEFAULT : FILE_EXTENSION_ALTERNATIVE);

const BABEL_OPTIONS = generateBabelOptions();
const FILE_EXTENSION = getFileExtension();
const XML_RENDER_OPTIONS = { endOptions: { pretty: true } };
const JSX_GLOB_PATH = `${RESOURCE_DIR}/**/*${FILE_EXTENSION}`;

const JSX_BUILT_INS = {
  Summary: `summary${FILE_EXTENSION_DEFAULT}`,
  Description: `description${FILE_EXTENSION_DEFAULT}`,
  Image: `image${FILE_EXTENSION_DEFAULT}`
};

module.exports = {
  BABEL_OPTIONS,
  FILE_EXTENSION,
  XML_RENDER_OPTIONS,
  JSX_GLOB_PATH,
  JSX_BUILT_INS
};
