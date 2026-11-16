import propertiesReader from "properties-reader";
import path from "path";
import Table from "cli-table";
import * as util from "../../lib/util/index.js";

export function run() {
  const apis = util.getApis();

  util.printHeader(`APIs (${apis.length})`);

  const table = new Table({
    head: ["API", "URL"],
    colWidths: [40, 60]
  });

  apis.forEach((api) => {
    const url = generateApiUrl(api);
    table.push([api.name, url]);
  });
  console.log(table.toString());
}

function generateApiUrl(api) {
  const properties = propertiesReader(path.join(util.CODE_DIR, "gradle.properties"));
  const appId = properties.get("appName");

  const url = `api/${appId}:${api.name}`;
  return url;
}
