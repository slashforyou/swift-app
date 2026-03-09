const fs = require("fs");
const c = fs.readFileSync(
  "/srv/www/htdocs/swiftapp/server/endPoints/v1/startJobById.js",
  "utf8",
);
const i = c.indexOf("Job started successfully");
console.log(JSON.stringify(c.substring(i - 60, i + 60)));
