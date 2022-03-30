const constants = require("./constants");
const template = require("./template");
const dependency = require("./dependency");
const jsxXml = require("./jsx-xml");

module.exports = {
  ...constants,
  ...template,
  ...dependency,
  ...jsxXml
};
