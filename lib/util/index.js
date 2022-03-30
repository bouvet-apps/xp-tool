const common = require("./common");
const config = require("./config");
const console = require("./console");
const constants = require("./constants");
const i18n = require("./i18n");
const paths = require("./paths");
const template = require("./template");
const xp = require("./xp");

module.exports = {
  ...common,
  ...config,
  ...console,
  ...constants,
  ...i18n,
  ...paths,
  ...template,
  ...xp
};
