"""Fix storage routes in index.js: correct auth middleware name and placement."""
import sys

INDEX_PATH = "/srv/www/htdocs/swiftapp/server/index.js"

with open(INDEX_PATH, "r") as f:
    content = f.read()

# 1) Remove the old bad injection block
start_marker = "// ── Storage routes ──"
if start_marker in content:
    start_idx = content.find(start_marker)
    # Find the end: it's the line before app.listen
    end_marker = "app.listen(port"
    end_idx = content.find(end_marker, start_idx)
    if end_idx > start_idx:
        content = content[:start_idx] + content[end_idx:]
        print("Removed old storage routes block")
    else:
        print("WARNING: Could not find end marker for old block")

# 2) Build the correct routes block
storage_block = """// ── Storage routes ──
const storage = require("./endPoints/v1/storage");
app.get("/swift-app/v1/storage/units", authenticateToken, storage.listUnits);
app.post("/swift-app/v1/storage/units", authenticateToken, storage.createUnit);
app.patch("/swift-app/v1/storage/units/:id", authenticateToken, storage.updateUnit);
app.delete("/swift-app/v1/storage/units/:id", authenticateToken, storage.deleteUnit);
app.get("/swift-app/v1/storage/lots", authenticateToken, storage.listLots);
app.get("/swift-app/v1/storage/lots/:id", authenticateToken, storage.getLot);
app.post("/swift-app/v1/storage/lots", authenticateToken, storage.createLot);
app.patch("/swift-app/v1/storage/lots/:id", authenticateToken, storage.updateLot);
app.delete("/swift-app/v1/storage/lots/:id", authenticateToken, storage.deleteLot);
app.post("/swift-app/v1/storage/lots/:id/units", authenticateToken, storage.assignUnit);
app.delete("/swift-app/v1/storage/lots/:lotId/units/:unitId", authenticateToken, storage.removeUnitFromLot);
app.patch("/swift-app/v1/storage/lots/:id/units/reorder", authenticateToken, storage.reorderUnits);
app.post("/swift-app/v1/storage/lots/:id/items", authenticateToken, storage.addItem);
app.patch("/swift-app/v1/storage/items/:id", authenticateToken, storage.updateItem);
app.delete("/swift-app/v1/storage/items/:id", authenticateToken, storage.deleteItem);
app.post("/swift-app/v1/storage/items/:id/checkout", authenticateToken, storage.checkoutItem);
app.get("/swift-app/v1/storage/lots/:id/photos", authenticateToken, storage.listPhotos);
app.post("/swift-app/v1/storage/lots/:id/photos", authenticateToken, storage.upload.single("image"), storage.uploadPhoto);
app.delete("/swift-app/v1/storage/photos/:id", authenticateToken, storage.deletePhoto);
app.get("/swift-app/v1/storage/lots/:id/billing", authenticateToken, storage.getBillingHistory);
app.post("/swift-app/v1/storage/lots/:id/billing", authenticateToken, storage.recordPayment);
app.get("/swift-app/v1/storage/billing/summary", authenticateToken, storage.getBillingSummary);
app.get("/swift-app/v1/storage/stats", authenticateToken, storage.getStorageStats);

"""

# 3) Insert before the 404 handler
marker_404 = "app.use((req, res) => {\n  res.status(404).json({ error: 'Not Found' });\n});"
if marker_404 in content:
    content = content.replace(marker_404, storage_block + marker_404)
    print("Inserted storage routes before 404 handler")
else:
    print("ERROR: Could not find 404 handler marker")
    sys.exit(1)

with open(INDEX_PATH, "w") as f:
    f.write(content)

print("✅ Storage routes fixed in index.js")
