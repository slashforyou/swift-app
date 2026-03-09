#!/usr/bin/env python3
"""Patch index.js to add authenticateToken middleware to /v1/staff GET route"""

import re

path = '/srv/www/htdocs/swiftapp/server/index.js'
with open(path, 'r') as f:
    content = f.read()

# Find the staff GET route without auth middleware and add it
old_staff_route = """app.get('/swift-app/v1/staff', (req, res) => {
  console.log('[ List Staff endpoint called ]');
  const { listStaffEndpoint } = require('./endPoints/v1/staff');
  listStaffEndpoint(req, res);
});"""

new_staff_route = """app.get('/swift-app/v1/staff', (req, res, next) => {
  const { authenticateToken } = require('./middleware/authenticateToken');
  authenticateToken(req, res, next);
}, (req, res) => {
  console.log('[ List Staff endpoint called ]');
  const { listStaffEndpoint } = require('./endPoints/v1/staff');
  listStaffEndpoint(req, res);
});"""

if old_staff_route in content:
    content = content.replace(old_staff_route, new_staff_route)
    print("✅ Patched /v1/staff GET route with authenticateToken")
else:
    print("⚠️  Staff GET route not found as expected. Checking...")
    if "listStaffEndpoint" in content:
        print("   listStaffEndpoint found in file - may already be patched")
    else:
        print("   listStaffEndpoint not found at all!")

with open(path, 'w') as f:
    f.write(content)

print("Done writing index.js")
