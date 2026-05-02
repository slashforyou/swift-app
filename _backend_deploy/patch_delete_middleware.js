var fs = require('fs');
var path = '/srv/www/htdocs/swiftapp/server/index.js';
var content = fs.readFileSync(path, 'utf8');
var orig = content;

// Add authenticateToken middleware to DELETE /swift-app/v1/job/:id route
var oldRoute = "app.delete('/swift-app/v1/job/:id', (req, res) => {";
var newRoute = "app.delete('/swift-app/v1/job/:id', require('./middleware/authenticateToken').authenticateToken, (req, res) => {";

content = content.replace(oldRoute, newRoute);

if (content !== orig) {
  fs.writeFileSync(path, content);
  console.log('PATCHED OK - authenticateToken added to DELETE route');
} else {
  console.log('PATTERN NOT FOUND');
}
