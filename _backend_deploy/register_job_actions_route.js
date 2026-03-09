/**
 * register_job_actions_route.js
 * Injects the new /jobs/:id/actions route into index.js
 * Run once: node register_job_actions_route.js
 */
const fs = require("fs");
const INDEX = "/srv/www/htdocs/swiftapp/server/index.js";

let content = fs.readFileSync(INDEX, "utf8");

if (content.includes("/jobs/:id/actions")) {
  console.log("ALREADY_REGISTERED: /jobs/:id/actions");
  process.exit(0);
}

// Backup
fs.writeFileSync(INDEX + ".bak", content);

const INSERTION_POINT = `// 📅 [GET] Get all the event on the job timeline
app.get('/swift-app/v1/job/:id/timeline', (req, res) => {`;

const NEW_ROUTE = `// 📋 [GET] Get full action history for a job
app.get('/swift-app/v1/jobs/:id/actions', require('./middleware/authenticateToken').authenticateToken, (req, res) => {
  const { getJobActionsEndpoint } = require('./endPoints/v1/getJobActionsById');
  getJobActionsEndpoint(req, res);
});

// 📅 [GET] Get all the event on the job timeline
app.get('/swift-app/v1/job/:id/timeline', (req, res) => {`;

if (!content.includes(INSERTION_POINT)) {
  console.error("INSERTION_POINT not found in index.js");
  process.exit(1);
}

content = content.replace(INSERTION_POINT, NEW_ROUTE);
fs.writeFileSync(INDEX, content);
console.log("REGISTERED: GET /swift-app/v1/jobs/:id/actions");
