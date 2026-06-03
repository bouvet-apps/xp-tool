"use strict";

/** @jsx JSXXML */
const jsxxml = require("jsx-xml");
const {
  Comment,
  JSXXML
} = jsxxml;
const Image = ({
  src
}) => {
  const text = `@image: ${src}`;
  return JSXXML(Comment, null, text);
};
module.exports = Image;