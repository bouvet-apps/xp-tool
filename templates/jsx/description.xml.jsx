/** @jsx JSXXML */
const jsxxml = require("jsx-xml");

const {
  Comment, JSXXML
} = jsxxml;

const Description = ({ lang, children = [], text = false }) => {
  const content = `@description[${lang}]: ${text || children.join("")}`;
  return (
    <Comment>
      {content}
    </Comment>
  );
};

module.exports = Description;
