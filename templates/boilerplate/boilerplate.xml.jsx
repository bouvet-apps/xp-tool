/** @jsx JSXXML */
const jsxxml = require("jsx-xml");

const {
  Fragment, JSXXML{{#unless isComponent}}, render{{/unless}}
} = jsxxml;
{{#each imports}}
  {{{this}}}
{{/each}}
const {{name}} = {{#if isComponent}}({{#if props}}{ {{{props}}} }{{/if}}) => {{else}}render{{/if}}(
  <Fragment>
  {{{content}}}
  </Fragment>
{{#unless isComponent}}, {{{renderOptions}}}{{/unless}});
module.exports = {{name}}
