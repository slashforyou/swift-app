"""
fix_company_plan_route_order.py
Déplace GET /company/plan AVANT GET /company/:id pour corriger le shadowing Express.
"""

FILEPATH = "/srv/www/htdocs/swiftapp/server/index.js"

with open(FILEPATH, "r") as f:
    content = f.read()

# ── Marqueurs ──────────────────────────────────────────────────────────────────
PLAN_BLOCK_START = "app.get('/swift-app/v1/company/plan',"
ANCHOR = "// 🔍 [GET] Get Company by ID"

# ── Vérifications préalables ──────────────────────────────────────────────────
plan_pos    = content.find(PLAN_BLOCK_START)
anchor_pos  = content.find(ANCHOR)

if plan_pos == -1:
    print("ERROR: GET /company/plan route not found")
    exit(1)
if anchor_pos == -1:
    print("ERROR: anchor '// 🔍 [GET] Get Company by ID' not found")
    exit(1)
if plan_pos < anchor_pos:
    print("OK: GET /company/plan is already before GET /company/:id — nothing to do")
    exit(0)

# ── Extraire le bloc complet (de app.get(... jusqu'au });) ────────────────────
# Cherche le });  qui clôt le handler à partir de plan_pos
close_seq = "});"
close_pos = content.find(close_seq, plan_pos)
if close_pos == -1:
    print("ERROR: Could not find closing }); for GET /company/plan")
    exit(1)
close_pos += len(close_seq)

# Inclure les lignes vides avant et après pour une extraction propre
# Recule sur les \n précédant plan_pos
start = plan_pos
while start > 0 and content[start - 1] == "\n":
    start -= 1
start += 1  # garder au moins un \n avant

block = content[start:close_pos]

print(f"Block extracted ({len(block)} chars):")
print(block[:200], "...")

# ── Supprimer le bloc de sa position actuelle ─────────────────────────────────
# On supprime le bloc + les lignes vides qui le suivent
end_after = close_pos
while end_after < len(content) and content[end_after] == "\n":
    end_after += 1

content_without = content[:start] + content[end_after:]

# ── Insérer avant l'ancre ─────────────────────────────────────────────────────
anchor_pos2 = content_without.find(ANCHOR)
if anchor_pos2 == -1:
    print("ERROR: Anchor disappeared after removal")
    exit(1)

insertion = block + "\n\n\n"
content_fixed = content_without[:anchor_pos2] + insertion + content_without[anchor_pos2:]

# ── Sanity checks ─────────────────────────────────────────────────────────────
new_plan_pos   = content_fixed.find(PLAN_BLOCK_START)
new_anchor_pos = content_fixed.find(ANCHOR)

if new_plan_pos == -1:
    print("ERROR: plan route lost after fix")
    exit(1)
if new_plan_pos > new_anchor_pos:
    print("ERROR: plan route still after anchor — fix failed")
    exit(1)
if content_fixed.count(PLAN_BLOCK_START) != 1:
    print(f"ERROR: plan route appears {content_fixed.count(PLAN_BLOCK_START)} times")
    exit(1)

# ── Écriture ──────────────────────────────────────────────────────────────────
with open(FILEPATH, "w") as f:
    f.write(content_fixed)

print(f"SUCCESS: GET /company/plan moved before GET /company/:id")
print(f"  plan_pos before fix : {plan_pos}")
print(f"  anchor_pos before fix: {anchor_pos}")
print(f"  plan_pos after fix  : {new_plan_pos}")
print(f"  anchor_pos after fix: {new_anchor_pos}")
