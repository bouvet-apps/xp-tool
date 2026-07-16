"use strict";

/** @jsx JSXXML */
const jsxxml = require("jsx-xml");
const {
  Comment,
  JSXXML
} = jsxxml;
const Summary = ({
  lang,
  children = [],
  text = false
}) => {
  const content = `@summary[${lang}]: ${text || children.join("")}`;
  return JSXXML(Comment, null, content);
};
module.exports = Summary;