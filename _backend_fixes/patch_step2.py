#!/usr/bin/env python3
path = "/srv/www/htdocs/swiftapp/server/endPoints/v1/assignments.js"
with open(path, "r") as f:
    lines = f.readlines()

# Trouver la ligne contenant "respond_assignment" (fermeture du sendPushToUser au POST)
target = -1
for i, line in enumerate(lines):
    if "respond_assignment" in line and "assignmentId: result.insertId" in line:
        target = i
        break

if target == -1:
    print("FAIL - respond_assignment line not found")
    exit(1)

# La ligne "    }" qui ferme le if (!isVehicle) est quelques lignes après
close_brace = -1
for i in range(target, target + 10):
    if lines[i].strip() == "}" and lines[i].startswith("    }"):
        close_brace = i
        break

if close_brace == -1:
    print("FAIL - closing brace not found")
    for i in range(target, min(target+10, len(lines))):
        print(f"  {target+i}: {repr(lines[i])}")
    exit(1)

# Vérifier que ce n'est pas déjà patché
already = any("Sollicitation" in lines[j] for j in range(target, close_brace+5))
if already:
    print("SKIP - already patched")
    exit(0)

INJECT = [
    "\n",
    "      // Inserer notification en base pour la sollicitation\n",
    "      await insertNotification(\n",
    "        connection,\n",
    "        resource_id,\n",
    '        "job_update",\n',
    "        `\U0001f69b Sollicitation \u2014 ${roleLabel}`,\n",
    "        `Vous avez \u00e9t\u00e9 demand\u00e9(e) comme ${roleLabel} sur le job ${jobCode}. Confirmez ou d\u00e9clinez dans l'app.`,\n",
    "        jobId,\n",
    '        "high"\n',
    "      );\n",
]

# Insérer AVANT "    }" (close_brace)
for idx, injected_line in enumerate(INJECT):
    lines.insert(close_brace + idx, injected_line)

print(f"[2] OK - insertNotification injected at line {close_brace} (after respond_assignment at {target})")

with open(path, "w") as f:
    f.writelines(lines)

print("done")
