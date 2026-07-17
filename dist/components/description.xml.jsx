/** @jsx JSXXML */
const jsxxml = require("jsx-xml");
const {
  Comment,
  JSXXML
} = jsxxml;
const Description = ({
  lang,
  children = [],
  text = false
}) => {
  const content = `@description[${lang}]: ${text || children.join("")}`;
  return JSXXML(Comment, null, content);
};
module.exports = Description;