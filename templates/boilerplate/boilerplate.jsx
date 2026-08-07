/** @jsx JSXYAML */
const runtime = require("{{{runtimePath}}}");

const {
  Fragment, JSXYAML, Summary, Description, Image{{#unless isComponent}}, render{{/unless}}
} = runtime;

function requireUncached(module) {
  delete require.cache[require.resolve(module)];
  return require(module);
}
{{#each imports}}
  {{{this}}}
{{/each}}
const {{name}} = {{#if isComponent}}({{#if props}}{ {{{props}}} }{{/if}}) => {{else}}render{{/if}}(
  <Fragment>
  {{{content}}}
  </Fragment>
);
module.exports = {{name}}
