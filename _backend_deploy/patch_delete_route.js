var fs = require('fs');
var path = '/srv/www/htdocs/swiftapp/server/index.js';
var content = fs.readFileSync(path, 'utf8');
var orig = content;

// Replace the require
content = content.replace(
  "const { deleteJobByIdEndpoint } = require('./endPoints/v1/deleteJobById');",
  "const { archiveJobByIdEndpoint } = require('./endPoints/v1/archiveJobById');"
);

// Replace the call
content = content.replace(
  '  deleteJobByIdEndpoint(req, res);',
  '  archiveJobByIdEndpoint(req, res);'
);

if (content !== orig) {
  fs.writeFileSync(path, content);
  console.log('PATCHED OK');
} else {
  console.log('PATTERN NOT FOUND - checking manually...');
  var idx = content.indexOf('deleteJobByIdEndpoint');
  console.log('First occurrence at index:', idx);
  if (idx > -1) console.log('Context:', JSON.stringify(content.slice(idx - 20, idx + 60)));
}
