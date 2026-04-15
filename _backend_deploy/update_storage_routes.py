"""Update storage routes in index.js: add billing PATCH, billing generate, and client search."""
import sys

INDEX_PATH = "/srv/www/htdocs/swiftapp/server/index.js"

with open(INDEX_PATH, "r") as f:
    content = f.read()

# 1) Remove the old storage routes block
start_marker = "// ── Storage routes ──"
if start_marker in content:
    start_idx = content.find(start_marker)
    # Find the end of the block: next route group or 404 handler
    # Look for the next blank line followed by app.use or app.listen
    end_search = content[start_idx:]
    # Find last storage route line
    lines = end_search.split("\n")
    block_end = 0
    for i, line in enumerate(lines):
        stripped = line.strip()
        if stripped.startswith("app.") and "storage" in stripped:
            block_end = i
        elif stripped == "" and block_end > 0:
            block_end = i
            break
    # Remove old block
    old_block_end = start_idx + sum(len(lines[j]) + 1 for j in range(block_end + 1))
    content = content[:start_idx] + content[old_block_end:]
    print("Removed old storage routes block")

# 2) Build the complete routes block
storage_block = """// ── Storage routes ──
const storage = require("./endPoints/v1/storage");
app.get("/swift-app/v1/storage/units", authenticateToken, storage.listUnits);
app.post("/swift-app/v1/storage/units", authenticateToken, storage.createUnit);
app.patch("/swift-app/v1/storage/units/:id", authenticateToken, storage.updateUnit);
app.delete("/swift-app/v1/storage/units/:id", authenticateToken, storage.deleteUnit);
app.get("/swift-app/v1/storage/clients/search", authenticateToken, storage.searchClients);
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
app.patch("/swift-app/v1/storage/billing/:id", authenticateToken, storage.updateBillingRecord);
app.post("/swift-app/v1/storage/billing/generate", authenticateToken, storage.generateBilling);
app.get("/swift-app/v1/storage/billing/summary", authenticateToken, storage.getBillingSummary);
app.get("/swift-app/v1/storage/stats", authenticateToken, storage.getStorageStats);

"""

# 3) Insert before the 404 handler
marker_404 = 'app.use((req, res) => {\n  res.status(404).json({ error: \'Not Found\' });\n});'
if marker_404 in content:
    content = content.replace(marker_404, storage_block + marker_404)
    print("Inserted updated storage routes before 404 handler")
else:
    # Try alternate 404 patterns
    alt_marker = "app.use((req, res) =>"
    idx = content.find(alt_marker)
    if idx > 0:
        content = content[:idx] + storage_block + content[idx:]
        print("Inserted updated storage routes before 404 handler (alt)")
    else:
        print("ERROR: Could not find 404 handler marker")
        sys.exit(1)

with open(INDEX_PATH, "w") as f:
    f.write(content)

print("✅ Storage routes updated in index.js")
