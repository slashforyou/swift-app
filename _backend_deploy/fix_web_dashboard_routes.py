#!/usr/bin/env python3
"""
Fix 3 backend routes that the web dashboard (cobbr-app.com) relies on:

1. /swift-app/v1/users/me → 404 (route missing - add alias to auth/me + user/profile)
2. /swift-app/v1/gamification → 404 (route missing - add alias to user/gamification)
3. /swift-app/v1/vehicles → 400 (missing authenticateToken middleware)

Run: python3 fix_web_dashboard_routes.py
"""

import re
import sys

INDEX_JS = "/srv/www/htdocs/swiftapp/server/index.js"

def read_file(path):
    with open(path, "r", encoding="utf-8") as f:
        return f.read()

def write_file(path, content):
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

def fix_vehicles_auth(content):
    """Add authenticateToken middleware to all /vehicles routes."""

    # Pattern: app.get('/swift-app/v1/vehicles', (req, res) => {
    # Replace with inline auth middleware like staff routes do
    old = """app.get('/swift-app/v1/vehicles', (req, res) => {
  console.log('[ List Vehicles endpoint called ]');
  const { listVehiclesEndpoint } = require('./endPoints/v1/vehicles');
  listVehiclesEndpoint(req, res);
});"""

    new = """app.get('/swift-app/v1/vehicles', (req, res, next) => {
  const { authenticateToken: authVehicles } = require('./middleware/authenticateToken');
  authVehicles(req, res, next);
}, (req, res) => {
  console.log('[ List Vehicles endpoint called ]');
  const { listVehiclesEndpoint } = require('./endPoints/v1/vehicles');
  listVehiclesEndpoint(req, res);
});"""

    if old not in content:
        print("⚠️  Could not find vehicles GET route - may already be patched")
        return content

    content = content.replace(old, new)
    print("✅ Fixed /vehicles GET - added authenticateToken")

    # Fix POST
    old_post = """app.post('/swift-app/v1/vehicles', (req, res) => {
  console.log('[ Create Vehicle endpoint called ]');
  const { createVehicleEndpoint } = require('./endPoints/v1/vehicles');
  createVehicleEndpoint(req, res);
});"""
    new_post = """app.post('/swift-app/v1/vehicles', (req, res, next) => {
  const { authenticateToken: authVehicles } = require('./middleware/authenticateToken');
  authVehicles(req, res, next);
}, (req, res) => {
  console.log('[ Create Vehicle endpoint called ]');
  const { createVehicleEndpoint } = require('./endPoints/v1/vehicles');
  createVehicleEndpoint(req, res);
});"""
    if old_post in content:
        content = content.replace(old_post, new_post)
        print("✅ Fixed /vehicles POST - added authenticateToken")

    # Fix GET by ID
    old_getid = """app.get('/swift-app/v1/vehicles/:id', (req, res) => {
  console.log('[ Get Vehicle by ID endpoint called ]');
  const { getVehicleByIdEndpoint } = require('./endPoints/v1/vehicles');
  getVehicleByIdEndpoint(req, res);
});"""
    new_getid = """app.get('/swift-app/v1/vehicles/:id', (req, res, next) => {
  const { authenticateToken: authVehicles } = require('./middleware/authenticateToken');
  authVehicles(req, res, next);
}, (req, res) => {
  console.log('[ Get Vehicle by ID endpoint called ]');
  const { getVehicleByIdEndpoint } = require('./endPoints/v1/vehicles');
  getVehicleByIdEndpoint(req, res);
});"""
    if old_getid in content:
        content = content.replace(old_getid, new_getid)
        print("✅ Fixed /vehicles/:id GET - added authenticateToken")

    # Fix PUT
    old_put = """app.put('/swift-app/v1/vehicles/:id', (req, res) => {
  console.log('[ Update Vehicle endpoint called ]');
  const { updateVehicleEndpoint } = require('./endPoints/v1/vehicles');
  updateVehicleEndpoint(req, res);
});"""
    new_put = """app.put('/swift-app/v1/vehicles/:id', (req, res, next) => {
  const { authenticateToken: authVehicles } = require('./middleware/authenticateToken');
  authVehicles(req, res, next);
}, (req, res) => {
  console.log('[ Update Vehicle endpoint called ]');
  const { updateVehicleEndpoint } = require('./endPoints/v1/vehicles');
  updateVehicleEndpoint(req, res);
});"""
    if old_put in content:
        content = content.replace(old_put, new_put)
        print("✅ Fixed /vehicles/:id PUT - added authenticateToken")

    # Fix DELETE
    old_del = """app.delete('/swift-app/v1/vehicles/:id', (req, res) => {
  console.log('[ Delete Vehicle endpoint called ]');
  const { deleteVehicleEndpoint } = require('./endPoints/v1/vehicles');
  deleteVehicleEndpoint(req, res);
});"""
    new_del = """app.delete('/swift-app/v1/vehicles/:id', (req, res, next) => {
  const { authenticateToken: authVehicles } = require('./middleware/authenticateToken');
  authVehicles(req, res, next);
}, (req, res) => {
  console.log('[ Delete Vehicle endpoint called ]');
  const { deleteVehicleEndpoint } = require('./endPoints/v1/vehicles');
  deleteVehicleEndpoint(req, res);
});"""
    if old_del in content:
        content = content.replace(old_del, new_del)
        print("✅ Fixed /vehicles/:id DELETE - added authenticateToken")

    return content


def add_users_me_route(content):
    """Add /swift-app/v1/users/me alias that combines auth/me + user/profile."""

    if "'/swift-app/v1/users/me'" in content and "'/swift-app/v1/users/me/'" not in content.split("'/swift-app/v1/users/me'")[0][-5:]:
        # Check it's not just /users/me/permissions or /users/me/assignments
        lines = content.split('\n')
        for line in lines:
            if "'/swift-app/v1/users/me'" in line and '/permissions' not in line and '/assignments' not in line:
                print("⚠️  /users/me route may already exist")
                return content

    # Insert before the 404 catch-all at the end, or before the gamification routes
    # Find a good insertion point - after user/profile routes
    marker = "// 👤 [GET] Get User Stats"
    if marker not in content:
        marker = "app.get('/swift-app/v1/user/stats'"
    if marker not in content:
        # Fallback: insert before gamification
        marker = "// 🎮 [GET] Get User Gamification Data"

    if marker not in content:
        print("❌ Could not find insertion point for /users/me route")
        return content

    users_me_route = """
// 👤 [GET] /swift-app/v1/users/me — Alias for web dashboard
// Returns combined user info (profile + meta)
app.get('/swift-app/v1/users/me', async (req, res) => {
  console.log('[ Get Users/Me endpoint called (web dashboard alias) ]');
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ success: false, error: 'Authorization required' });
  }

  try {
    // Reuse the existing getUserProfile endpoint
    const { getUserProfileEndpoint } = require('./endPoints/v1/getUserProfile');
    const result = await getUserProfileEndpoint(token);
    return res.status(result.status).json(result.json);
  } catch (error) {
    console.error('Error in /users/me:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

"""

    content = content.replace(marker, users_me_route + marker)
    print("✅ Added /swift-app/v1/users/me route (alias for user/profile)")
    return content


def add_gamification_alias(content):
    """Add /swift-app/v1/gamification alias for /swift-app/v1/user/gamification."""

    # Check if already exists
    if "'/swift-app/v1/gamification'" in content:
        # Make sure it's the exact route, not /user/gamification
        lines = content.split('\n')
        for line in lines:
            if "'/swift-app/v1/gamification'" in line and '/user/gamification' not in line:
                print("⚠️  /gamification alias may already exist")
                return content

    marker = "// 🎮 [GET] Get User Gamification Data"
    if marker not in content:
        marker = "app.get('/swift-app/v1/user/gamification'"

    if marker not in content:
        print("❌ Could not find gamification insertion point")
        return content

    gamification_alias = """// 🎮 [GET] /swift-app/v1/gamification — Alias for web dashboard
app.get('/swift-app/v1/gamification', (req, res) => {
  console.log('[ Get Gamification endpoint called (web dashboard alias) ]');
  const { getGamificationEndpoint } = require('./endPoints/v1/gamification');
  getGamificationEndpoint(req, res);
});

"""

    content = content.replace(marker, gamification_alias + marker)
    print("✅ Added /swift-app/v1/gamification alias route")
    return content


def main():
    print("🔧 Fixing web dashboard API routes...")
    print(f"📄 Reading {INDEX_JS}")

    content = read_file(INDEX_JS)
    original = content

    # Fix 1: Add auth to vehicles
    content = fix_vehicles_auth(content)

    # Fix 2: Add /users/me
    content = add_users_me_route(content)

    # Fix 3: Add /gamification alias
    content = add_gamification_alias(content)

    if content == original:
        print("\n⚠️  No changes were made")
        return

    # Backup
    import shutil
    backup = INDEX_JS + ".bak"
    shutil.copy2(INDEX_JS, backup)
    print(f"\n📦 Backup saved to {backup}")

    write_file(INDEX_JS, content)
    print(f"✅ Written updated {INDEX_JS}")
    print("\n🔄 Restart with: pm2 restart swiftapp")


if __name__ == "__main__":
    main()
