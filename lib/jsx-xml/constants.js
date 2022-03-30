const { RESOURCE_DIR, lookupDependency } = require("../util");

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
const BABEL_OPTIONS = generateBabelOptions();
const FILE_EXTENSION = ".xml.jsx";
const XML_RENDER_OPTIONS = { endOptions: { pretty: true } };
const JSX_GLOB_PATH = `${RESOURCE_DIR}/**/*${FILE_EXTENSION}`;

const JSX_BUILT_INS = {
  Summary: `summary${FILE_EXTENSION}`,
  Description: `description${FILE_EXTENSION}`,
  Image: `image${FILE_EXTENSION}`
};

module.exports = {
  BABEL_OPTIONS,
  FILE_EXTENSION,
  XML_RENDER_OPTIONS,
  JSX_GLOB_PATH,
  JSX_BUILT_INS
};
