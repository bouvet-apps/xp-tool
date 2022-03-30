const libs = {
  portal: require("/lib/xp/portal"),
  freemarker: require("/lib/tineikt/freemarker")
};

exports.get = () => {
  // Create our data model
  const model = {};

  // Get the content that is using the page
  const content = libs.portal.getContent();
  model.locale = libs.util.getLanguage();

  model.isFragment = content.type === "portal:fragment";
  model.config = libs.portal.getSiteConfig();

  model.siteRoot = libs.portal.pageUrl({ path: libs.portal.getSite()._path, type: "absolute" });

  model.menuItems = libs.menu.getMenuTree(2);
  const view = resolve("{{name}}.ftl");
  const body = libs.freemarker.render(view, model);

  return {
    body: body
  };
};
