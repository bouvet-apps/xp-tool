/** @jsx JSXXML */
const jsxxml = require("jsx-xml");

const {
  Comment, JSXXML
} = jsxxml;

const Image = ({ src }) => {
  const text = `@image: ${src}`;
  return (
    <Comment>
      {text}
    </Comment>
  );
};

module.exports = Image;
