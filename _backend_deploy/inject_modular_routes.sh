#!/bin/bash
FILE=/srv/www/htdocs/swiftapp/server/index.js
LINE=$(grep -n '// 404 HANDLER' "$FILE" | head -1 | cut -d: -f1)

if [ -z "$LINE" ]; then
  echo "ERROR: Could not find 404 HANDLER marker"
  exit 1
fi

echo "Found 404 HANDLER at line $LINE, injecting routes before it..."

# Create a temp file with the routes to inject
cat > /tmp/modular_routes_block.txt << 'EOF'

// === Modular Job Templates Routes ===
const { listModularTemplates, createModularTemplate, getModularTemplate, updateModularTemplate, deleteModularTemplate } = require('./endPoints/v1/modularTemplates');
const { initJobSegments, getJobSegments, startSegment, completeSegment, assignEmployeesToSegment, updateReturnTrip, getFlatRateOptions, updateFlatRateOptions } = require('./endPoints/v1/jobSegments');
const { getJobTimeBreakdown } = require('./endPoints/v1/jobTimeBreakdown');

// Templates CRUD
app.get('/swift-app/v1/templates/modular', authenticateToken, listModularTemplates);
app.post('/swift-app/v1/templates/modular', authenticateToken, createModularTemplate);
app.get('/swift-app/v1/templates/modular/:id', authenticateToken, getModularTemplate);
app.put('/swift-app/v1/templates/modular/:id', authenticateToken, updateModularTemplate);
app.delete('/swift-app/v1/templates/modular/:id', authenticateToken, deleteModularTemplate);

// Job Segments
app.post('/swift-app/v1/jobs/:id/segments', authenticateToken, initJobSegments);
app.get('/swift-app/v1/jobs/:id/segments', authenticateToken, getJobSegments);
app.post('/swift-app/v1/jobs/:id/segments/:segId/start', authenticateToken, startSegment);
app.post('/swift-app/v1/jobs/:id/segments/:segId/complete', authenticateToken, completeSegment);
app.post('/swift-app/v1/jobs/:id/segments/:segId/employees', authenticateToken, assignEmployeesToSegment);
app.put('/swift-app/v1/jobs/:id/segments/:segId/employees', authenticateToken, assignEmployeesToSegment);
app.patch('/swift-app/v1/jobs/:id/return-trip', authenticateToken, updateReturnTrip);

// Flat Rate Options
app.get('/swift-app/v1/jobs/:id/flat-rate-options', authenticateToken, getFlatRateOptions);
app.put('/swift-app/v1/jobs/:id/flat-rate-options', authenticateToken, updateFlatRateOptions);

// Time Breakdown
app.get('/swift-app/v1/jobs/:id/time-breakdown', authenticateToken, getJobTimeBreakdown);

EOF

# Use sed to read the file and insert
BEFORE=$((LINE - 1))
head -n "$BEFORE" "$FILE" > /tmp/index_new.js
cat /tmp/modular_routes_block.txt >> /tmp/index_new.js
tail -n +"$LINE" "$FILE" >> /tmp/index_new.js
cp /tmp/index_new.js "$FILE"

echo "Done! Routes injected. New file has $(wc -l < "$FILE") lines."
