const libs = {
  portal: require("/lib/xp/portal"),
  freemarker: require("/lib/tineikt/freemarker"),
  content: require("/lib/xp/content"),
  i18n: require("/lib/xp/i18n"),
  image: require("/lib/image"),
  util: require("/lib/util")
};

exports.get = () => {
  const config = libs.portal.getComponent().config;
  const content = libs.portal.getContent();

  const model = content;
  model.locale = libs.util.getLanguage();

  const view = resolve("{{name}}.ftl");
  const body = libs.freemarker.render(view, model);

  return {
    body: body
  };
};
