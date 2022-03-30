const fs = require("fs");
const path = require("path");
const xmlconvert = require("xml-js");
const glob = require("glob");
const util = require("../../lib/util");
const { updateGradleProperties: updateXpVersion } = require("./set-xpversion");

const XML_FILE_ENCODING = "utf8";


exports.run = () => {
  updateToForm();
  filterToProcessor();
  addXdataSite();
  updateXpVersion("7.2.0");
  updateGradleVersion();
  updateBuildGradle();
  updateLibPaths();
  updateDockerfile();
  updateVhost();

  util.printHeader("Almost there!");
  console.log("There may still be manual work and changes needed to be done. Make sure to check these things:");

  util.printBullet("If you have a util.js/es6 in your lib folder, rename it. It now collides with Enonic's own util lib");
  util.printBullet("Do not use createdTime, modifiedTime and other datetimes directly in 'new Date(..)'. XP7 saves datetime with 6 millisecond precision. Anything more that 3 will make it return invalid date");
  util.printBullet("External libs may need updated paths, /lib/ -> /site/lib/");
  util.printBullet("Replace 'userStore' with 'idProvider' when using lib-auth, lib-context or lib-portal");
  util.printBullet("Split your PWA logic from main.js to '/src/main/resources/webapp/webapp.js'");
  util.printBullet("Widgets must be manually updated");
};


function updateToForm() {
  const topToBeReplacedWithFormRegex = /<(site|layout|page|part|task|mixin|x-data) *.*>( |\n)*(<(display-name|super-type|is-abstract|is-final|allow-child-content|regions|allowContentType|mappings) *.*>(.|\n)*<\/(display-name|super-type|is-abstract|is-final|allow-child-content|regions|allowContentType|mappings)>)*( |\n)*(<(config|items)>)/gmi;
  const bottomToBeReplacedWithFormRegex = /<\/(config|items)>( |\n)*(<(display-name|super-type|is-abstract|is-final|allow-child-content|regions|allowContentType|mappings) *.*>(.|\n)*<\/(display-name|super-type|is-abstract|is-final|allow-child-content|regions|allowContentType|mappings)>(.|\n)*)*<\/(site|layout|page|part|task|mixin|x-data)>/gmi;

  const opts = { build: false };

  // Load mixins
  const mixinsXml = util.getMixins(opts).map((m) => {
    const mixin = {
      ...m,
      xml: fs.readFileSync(path.resolve(m.path, m.filename), XML_FILE_ENCODING)
    };
    return mixin;
  });

  // Load xdata
  const xdataXml = util.getXData(opts).map((x) => {
    const xd = {
      ...x,
      xml: fs.readFileSync(path.resolve(x.path, x.filename), XML_FILE_ENCODING)
    };
    return xd;
  });

  const contentTypeXml = util.getContentTypes(opts).map(ct => ({
    ...ct,
    xml: fs.readFileSync(`${ct.path}/${ct.filename}`, XML_FILE_ENCODING)
  }));
  const partXml = util.getParts(opts).map(part => ({
    ...part,
    xml: fs.readFileSync(`${part.path}/${part.filename}`, XML_FILE_ENCODING)
  }));
  const layoutXml = util.getLayouts(opts).map(layout => ({
    ...layout,
    xml: fs.readFileSync(`${layout.path}/${layout.filename}`, XML_FILE_ENCODING)
  }));

  const pageXml = util.getPages(opts).map(page => ({
    ...page,
    xml: fs.readFileSync(`${page.path}/${page.filename}`, XML_FILE_ENCODING)
  }));

  const siteXml = {
    name: "site",
    path: util.SITE_DIR,
    filename: "site.xml",
    xml: fs.readFileSync(path.resolve(util.SITE_DIR, "site.xml"), XML_FILE_ENCODING)
  };

  const xmlFiles = [
    ...mixinsXml,
    ...xdataXml,
    ...contentTypeXml,
    ...partXml,
    ...layoutXml,
    ...pageXml,
    siteXml
  ];

  const replaceTopWithForm = (...args) => {
    const match = args[0];
    const replaced = match.replace(/<(config|items)>/gmi, "<form>");
    return replaced;
  };

  const replaceBottomWithForm = (...args) => {
    const match = args[0];
    const replaced = match.replace(/<\/(config|items)>/gmi, "</form>");
    return replaced;
  };

  xmlFiles.forEach((file) => {
    const {
      name, path: filedir, filename, xml
    } = file;

    if (!name) {
      util.warningMessage("Missing name when parsing xml file:");
      console.log(file);
    }
    if (!filedir) {
      util.errorMessage(`Missing file directory when parsing ${name}`);
      return;
    }
    if (!filename) {
      util.errorMessage(`Missing filename when parsing ${name}`);
      return;
    }
    if (!xml) {
      util.errorMessage(`Missing xml when parsing ${name}`);
      return;
    }

    const filePath = path.resolve(filedir, filename);
    const newXml = xml.replace(topToBeReplacedWithFormRegex, replaceTopWithForm)
      .replace(bottomToBeReplacedWithFormRegex, replaceBottomWithForm);

    fs.writeFileSync(filePath, newXml);

    if (newXml !== xml) {
      util.successMessage(`Updated XML with name '${name}' from config to form`);
    } else {
      util.successMessage(`XML with name '${name}' had no need of changes`);
    }
  });
}

function filterToProcessor() {
  const siteXmlPath = path.resolve(util.SITE_DIR, "site.xml");

  if (fs.existsSync(siteXmlPath)) {
    const xml = fs.readFileSync(siteXmlPath, XML_FILE_ENCODING);
    const newXml = xml.replace(/<(\/)?filters>/gmi, "<$1processors>")
      .replace(/<response-filter/gmi, "<response-processor");

    fs.writeFileSync(siteXmlPath, newXml);
    util.successMessage("Updatet filters in site.xml");
  } else {
    util.warningMessage("Did not find site.xml");
  }

  const filters = util.getFilters().map(filter => ({
    ...filter,
    js: fs.readFileSync(`${filter.path}/${filter.filename}`, "utf8")
  }));

  filters.forEach((file) => {
    const {
      name, path: filedir, filename, js
    } = file;

    if (!name) {
      util.warningMessage("Missing name when parsing filter JS file:");
      console.log(file);
    }
    if (!filedir) {
      util.errorMessage(`Missing file directory when parsing ${name}`);
      return;
    }
    if (!filename) {
      util.errorMessage(`Missing filename when parsing ${name}`);
      return;
    }
    if (!js) {
      util.errorMessage(`Missing js when parsing ${name}`);
      return;
    }

    const filePath = path.resolve(filedir, filename);
    const newJs = js.replace("exports.responseFilter", "exports.responseProcessor");
    fs.writeFileSync(filePath, newJs);

    if (newJs !== js) {
      util.successMessage(`Updated filter '${name}' JS from filter to processor`);
    } else {
      util.successMessage(`Filter '${name}' JS had no need of changes`);
    }
  });


  const dirPath = path.resolve(util.SITE_DIR, "filters");
  if (fs.existsSync(dirPath)) {
    // Todo: Check if new dir already exists, if so, move js over
    fs.renameSync(dirPath, path.resolve(util.SITE_DIR, "processors"));
    util.successMessage("Renamed filters folder");
  } else {
    util.successMessage("No filters folder to rename");
  }
}

function addXdataSite() {
  const siteXml = {
    name: "site",
    path: util.SITE_DIR,
    filename: "site.xml",
    xml: fs.readFileSync(path.resolve(util.SITE_DIR, "site.xml"), "utf8")
  };
  const xmlOptions = { compact: false, spaces: 4 };

  const siteObj = xmlconvert.xml2js(siteXml.xml, xmlOptions);

  util.getXData({ build: false }).map((x) => {
    const xd = {
      ...x,
      xml: fs.readFileSync(path.resolve(x.path, x.filename), "utf8")
    };
    return xd;
  }).forEach((xd) => {
    const xdObj = xmlconvert.xml2js(xd.xml, xmlOptions);

    const rootIndex = xdObj.elements.findIndex(({ name }) => name === "x-data");
    const allowContentTypes = xdObj.elements[rootIndex].elements.filter(({ name }) => name === "allowContentType")
      .map(el => el.elements[0].text);

    const xData = {
      type: "element",
      name: "x-data",
      attributes: {
        name: xd.name,
        allowContentTypes: allowContentTypes.join("|")
      }
    };
    siteObj.elements[0].elements.push(xData);

    xdObj.elements[rootIndex].elements = xdObj.elements[rootIndex].elements.filter(({ name }) => name !== "allowContentType");
    const updatedXmlString = xmlconvert.json2xml(xdObj, xmlOptions);
    fs.writeFileSync(path.resolve(xd.path, xd.filename), updatedXmlString);
  });
  const xmlString = xmlconvert.json2xml(siteObj, xmlOptions);
  fs.writeFileSync(path.resolve(util.SITE_DIR, "site.xml"), xmlString);
}

function updateGradleVersion() {
  const gradleDir = path.resolve(util.BASE_DIR, "code/gradle");
  if (fs.existsSync(gradleDir)) {
    const gradleWrapperDir = path.resolve(util.BASE_DIR, "code/gradle/wrapper");
    if (fs.existsSync(gradleWrapperDir)) {
      const filename = path.resolve(gradleWrapperDir, "gradle-wrapper.properties");
      let content = fs.readFileSync(filename, "utf8");
      const regex = /^(distributionUrl ?=) ?.*/gmi;
      const newUrl = "https://services.gradle.org/distributions/gradle-5.6.4-bin.zip";
      content = content.replace(regex, `$1${newUrl}`);
      fs.writeFileSync(filename, content, "utf8");

      util.successMessage("Updated gradle version to 5.6.4");
    }
  }
}

function updateBuildGradle() {
  const buildFile = path.resolve(util.CODE_DIR, "build.gradle");
  if (fs.existsSync(buildFile)) {
    let content = fs.readFileSync(buildFile, "utf8");
    const toUpdate = [
      {
        regex: /id ('|")com\.enonic\.xp\.app('|") version ('|")1\.\d\.0('|")/gmi,
        replace: "id 'com.enonic.xp.app' version '2.0.0'"
      },
      {
        regex: /include ('|")com\.enonic\.lib:lib-http-client:\d\.\d\.\d('|")/gmi,
        replace: "include 'com.enonic.lib:lib-http-client:2.1.0'"
      },
      {
        regex: /include ('|")com\.enonic\.lib:menu:\d\.\d\.\d('|")/gmi,
        replace: "include 'com.enonic.lib:lib-menu:3.0.0'"
      },
      {
        regex: /include ('|")com\.enonic\.lib:lib-thymeleaf:\d\.\d\.\d('|")/gmi,
        replace: "include 'com.enonic.lib:lib-thymeleaf:2.0.0'"
      },
      {
        regex: /include ('|")com\.enonic\.lib:lib-cache:1\.\d\.\d('|")/gmi,
        replace: "include 'com.enonic.lib:lib-cache:2.1.0'"
      },
      {
        regex: /include ('|")com\.enonic\.lib:lib-admin-ui:1\.\d\.\d('|")/gmi,
        replace: "include 'com.enonic.lib:lib-admin-ui:2.2.2'"
      },
      {
        regex: /gradleVersion = ('|")\d\.\d\.\d('|")/gmi,
        replace: "gradleVersion = '5.6.4'"
      }
    ];
    toUpdate.forEach(({ regex, replace }) => { content = content.replace(regex, replace); });
    fs.writeFileSync(buildFile, content, "utf8");
    util.successMessage("Updated build.gradle to XP7 version of some dependencies");
  }
}

function updateLibPaths() {
  const toUpdate = [
    {
      regex: /lib\/xp\/http-client/gmi,
      replace: "lib/http-client"
    },
    {
      regex: /lib\/enonic\/menu/gmi,
      replace: "lib/menu"
    },
    {
      regex: /lib\/xp\/cache/gmi,
      replace: "lib/cache"
    },
    {
      regex: /lib\/tineikt\/freemarker/gmi,
      replace: "site/lib/tineikt/freemarker"
    }
  ];

  const globPath = `${util.RESOURCE_DIR}/**/*.+(es6|js)`;
  const jsFiles = glob.sync(globPath);

  jsFiles.forEach((js) => {
    let jsFile = fs.readFileSync(js, "utf8");
    toUpdate.forEach(({ regex, replace }) => { jsFile = jsFile.replace(regex, replace); });
    fs.writeFileSync(js, jsFile, "utf8");
  });
  util.successMessage("Updated most lib paths in all JS files");
}

function updateDockerfile() {
  const toUpdate = [
    {
      regex: /FROM enonic\/xp-app:6\.\d{1,2}\.\d/gmi,
      replace: "FROM enonic/xp:7.2.0-ubuntu"
    },
    {
      regex: /ENV SNAPSHOTTER_VERSION 1\.\d{1,2}\.\d/gmi,
      replace: "ENV SNAPSHOTTER_VERSION 2.1.1"
    }
  ];

  const serverDir = path.resolve(util.BASE_DIR, "enonic-server/");
  if (fs.existsSync(serverDir)) {
    const expDir = path.resolve(serverDir, "exp/");
    if (fs.existsSync(expDir)) {
      const dockerfile = path.resolve(expDir, "Dockerfile");
      if (fs.existsSync(dockerfile)) {
        let content = fs.readFileSync(dockerfile, "utf8");
        toUpdate.forEach(({ regex, replace }) => { content = content.replace(regex, replace); });
        fs.writeFileSync(dockerfile, content, "utf8");
        util.successMessage("Updated Dockerfile file");
      }
    }
  }
}

function updateVhost() {
  const toUpdate = [
    {
      regex: /\.userStore = system/gmi,
      replace: ".idProvider.system = default"
    },
    {
      regex: /mapping\.admin\./gmi,
      replace: "mapping.adm."
    },
    {
      regex: /mapping\.site\.target = \/portal\/master\//gmi,
      replace: "mapping.site.target = /site/default/master/"
    }
  ];

  const serverDir = path.resolve(util.BASE_DIR, "enonic-server/");
  if (fs.existsSync(serverDir)) {
    const expDir = path.resolve(serverDir, "exp/");
    if (fs.existsSync(expDir)) {
      const configDir = path.resolve(expDir, "config/");
      if (fs.existsSync(configDir)) {
        const vhost = path.resolve(configDir, "com.enonic.xp.web.vhost.cfg");
        if (fs.existsSync(vhost)) {
          let content = fs.readFileSync(vhost, "utf8");
          toUpdate.forEach(({ regex, replace }) => { content = content.replace(regex, replace); });
          fs.writeFileSync(vhost, content, "utf8");
          util.successMessage("Updated vhost file");
        }
      }
    }
  }
}
