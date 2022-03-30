const propertiesReader = require("properties-reader");
const path = require("path");
const Table = require("cli-table");
const util = require("../../lib/util");

exports.run = () => {
  const services = util.getServices();

  util.printHeader(`Services (${services.length})`);

  const table = new Table({
    head: ["Service", "URL"],
    colWidths: [40, 60]
  });

  services.forEach((service) => {
    const url = generateServiceUrl(service);
    table.push([service.name, url]);
  });
  console.log(table.toString());
};

function generateServiceUrl(service) {
  const properties = propertiesReader(path.join(util.CODE_DIR, "gradle.properties"));
  const appId = properties.get("appName");

  const url = `_/service/${appId}/${service.name}`;
  return url;
}
