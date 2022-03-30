/** @jsx JSXXML */
const jsxxml = require("jsx-xml");

const {
  Comment, JSXXML
} = jsxxml;

const Summary = ({ lang, children = [], text = false }) => {
  const content = `@summary[${lang}]: ${text || children.join("")}`;
  return (
    <Comment>
      {content}
    </Comment>
  );
};

module.exports = Summary;
