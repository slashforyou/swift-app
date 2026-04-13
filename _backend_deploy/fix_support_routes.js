/**
 * Fix support routes - add /swift-app prefix
 * The routes were registered as /v1/support/... but need /swift-app/v1/support/...
 */
const fs = require('fs');
const path = '/srv/www/htdocs/swiftapp/server/index.js';

let content = fs.readFileSync(path, 'utf8');

// Fix the routes - replace /v1/support with /swift-app/v1/support
const replacements = [
  ["app.get('/v1/support/conversations'", "app.get('/swift-app/v1/support/conversations'"],
  ["app.post('/v1/support/conversations'", "app.post('/swift-app/v1/support/conversations'"],
  ["app.get('/v1/support/conversations/:id/messages'", "app.get('/swift-app/v1/support/conversations/:id/messages'"],
  ["app.post('/v1/support/conversations/:id/messages'", "app.post('/swift-app/v1/support/conversations/:id/messages'"],
];

let count = 0;
for (const [old, newStr] of replacements) {
  if (content.includes(old)) {
    content = content.replace(old, newStr);
    count++;
    console.log(`✅ Fixed: ${old} -> ${newStr}`);
  } else if (content.includes(newStr)) {
    console.log(`⏭️ Already fixed: ${newStr}`);
  } else {
    console.log(`⚠️ Not found: ${old}`);
  }
}

if (count > 0) {
  fs.writeFileSync(path, content, 'utf8');
  console.log(`\n✅ Fixed ${count} routes. Restart PM2 to apply.`);
} else {
  console.log("\nNo changes needed.");
}
