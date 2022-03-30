const libs = {
  portal: require("/lib/xp/portal"),
  freemarker: require("/lib/tineikt/freemarker")
};

const view = resolve("{{name}}.ftl");

exports.get = () => {
  const component = libs.portal.getComponent();
  const config = component.config;
  {{#regions}}
  const {{name}} = "col-md-{{width}}";
  {{/regions}}

  const model = {
    {{#regions}}
    {{name}}Region: component.regions.{{name}},
    {{/regions}}
    columns: {
      {{#regions}}
      {{name}}: {{name}}{{#unless @last}},{{/unless}}
      {{/regions}}
    }
  };

  return {
    body: libs.freemarker.render(view, model)
  };
};
