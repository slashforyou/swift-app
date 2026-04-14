"""
Injects storage routes into the SwiftApp backend (index.js).
Run on server: python3 /tmp/inject_storage_routes.py
"""
import re

INDEX_PATH = "/srv/www/htdocs/swiftapp/server/index.js"

# Routes to inject
ROUTE_BLOCK = '''
// ── Storage routes ──
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
'''

def inject():
    with open(INDEX_PATH, 'r') as f:
        content = f.read()

    if 'storage/units' in content:
        print("Storage routes already present in index.js")
        return

    # Find last app.get/app.post/app.patch/app.delete line and insert after
    # Look for the server listen or a good insertion point
    marker = "app.listen"
    idx = content.find(marker)
    if idx == -1:
        # fallback: append before module.exports or at end
        marker = "module.exports"
        idx = content.find(marker)
    
    if idx == -1:
        # Just append
        content += ROUTE_BLOCK
    else:
        # Insert before the marker
        content = content[:idx] + ROUTE_BLOCK + "\n" + content[idx:]

    with open(INDEX_PATH, 'w') as f:
        f.write(content)

    print("✅ Storage routes injected into index.js")

if __name__ == "__main__":
    inject()
