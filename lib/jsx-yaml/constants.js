import { resolve } from "path";
import { fileURLToPath } from "url";
import { RESOURCE_DIR, lookupDependency } from "../util/index.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

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
        pragma: "JSXYAML",
        pragmaFrag: "Fragment"
      }
    ]
  ]
});

const BABEL_OPTIONS = generateBabelOptions();
const FILE_EXTENSION = ".jsx";
const OUTPUT_EXTENSION = ".yaml";
const JSX_GLOB_PATH = `${RESOURCE_DIR}/**/*${FILE_EXTENSION}`;

// Absolute path to the CJS runtime the transpiled build files require at compile time.
const RUNTIME_PATH = resolve(__dirname, "runtime.cjs").replace(/\\/g, "/");

export {
  BABEL_OPTIONS,
  FILE_EXTENSION,
  OUTPUT_EXTENSION,
  JSX_GLOB_PATH,
  RUNTIME_PATH
};
