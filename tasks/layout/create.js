const fse = require("fs-extra");
const path = require("path");
const util = require("../../lib/util");

const { SITE_DIR } = util;

const type = "layout";
const gridSize = 12;

exports.getConfig = () => [
  {
    argument: "name",
    type: "string",
    message: "Enter name (no spaces)",
    validate: util.VALIDATORS.nospace
  }, {
    argument: "displayName",
    type: "phrase",
    message: "Enter displayName"
  }, {
    argument: "columns",
    type: "number",
    message: `Enter number of columns (1-${gridSize})`,
    validate: v => v >= 1 && v <= gridSize
  }
];

exports.run = (config) => {
  const name = config.name;
  const displayName = config.displayName;

  const targetDirectory = path.resolve(SITE_DIR, `layouts/${name}`);

  util.executeIfPathAvailable(targetDirectory, () => {
    util.printHeader(`Creating ${type} '${name}' in ${targetDirectory}`);

    fse.ensureDirSync(targetDirectory);

    const regionNames = {
      1: [{ name: "main" }],
      2: [{ name: "left" }, { name: "right" }],
      3: [{ name: "left" }, { name: "center" }, { name: "right" }],
      4: [
        { name: "columnOne" },
        { name: "columnTwo" },
        { name: "columnThree" },
        { name: "columnFour" },
        { name: "columnFive" },
        { name: "columnSix" },
        { name: "columnSeven" },
        { name: "columnEight" },
        { name: "columnNine" },
        { name: "columnTen" },
        { name: "columnEleven" },
        { name: "columnTwelve" }
      ]
    };

    let regions;
    if (config.columns < 4) regions = regionNames[config.columns];
    else {
      regions = regionNames[4];
      regions.splice(config.columns, gridSize - config.columns);
    }
    regions = applyGrid(regions);

    // Create model for template
    const model = {
      name: name,
      displayName: displayName && displayName.en ? displayName.en : name,
      displayName_i18n: `${name}.displayName`,
      regions: regions
    };

    // Render templates
    util.renderTemplate(type, "xml", model, `${targetDirectory}/${name}.xml`);
    util.renderTemplate(type, "es6", model, `${targetDirectory}/${name}.es6`);
    util.renderTemplate(type, "ftl", model, `${targetDirectory}/${name}.ftl`);

    util.addPhrase(model.displayName_i18n, displayName);
  });
};

function applyGrid(regions) {
  const _regions = regions;
  const baseWidth = Math.floor(gridSize / _regions.length);
  let extra = gridSize - _regions.length * baseWidth;
  const center = Math.ceil(_regions.length / 2);
  const spread = Math.floor(extra / 2);

  return _regions.map((region, index) => {
    const r = { name: region.name };
    const i = index + 1;

    r.width = baseWidth;

    if (extra > 0) {
      if (i === center || (i >= center - spread && i <= center + spread)) {
        r.width = baseWidth + 1;
        extra--;
      }
    }

    return r;
  });
}
