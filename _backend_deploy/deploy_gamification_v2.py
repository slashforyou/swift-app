#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
deploy_gamification_v2.py
═══════════════════════════════════════════════════════════════════════════════
Script de déploiement Gamification V2.

Actions:
  1. Copie gamificationEngine.js → server/utils/
  2. Copie migration SQL → server/migrations/
  3. Exécute la migration SQL
  4. Patch les endpoints: uploadJobImage, uploadSignatureToJob, createNote,
                          completeJobById, review.js
  5. Redémarre le serveur (pm2 restart)

Usage (depuis le projet):
  python _backend_deploy/deploy_gamification_v2.py

Requires: paramiko   (pip install paramiko)
"""

import subprocess
import sys
import os

SERVER_ALIAS = "sushinari"
SERVER_BASE  = "/srv/www/htdocs/swiftapp/server"
DB_USER      = "swiftapp_user"
DB_PASS      = "U%Xgxvc54EKUD39PcwNAYvuS"
DB_NAME      = "swiftapp"

LOCAL_BASE   = os.path.dirname(os.path.abspath(__file__))
PROJECT_BASE = os.path.dirname(LOCAL_BASE)

def run_ssh(cmd, capture=True):
    """Exécute une commande via SSH."""
    result = subprocess.run(
        ["ssh", SERVER_ALIAS, cmd],
        capture_output=capture, text=True
    )
    if result.returncode != 0 and capture:
        print(f"[WARN] SSH cmd failed: {cmd[:80]}")
        print(f"       stderr: {result.stderr[:200]}")
    return result

def scp_to(local_path, remote_path):
    """Copie un fichier local vers le serveur via scp."""
    result = subprocess.run(
        ["scp", local_path, f"{SERVER_ALIAS}:{remote_path}"],
        capture_output=True, text=True
    )
    if result.returncode != 0:
        print(f"[ERROR] SCP failed: {local_path} → {remote_path}")
        print(result.stderr)
        return False
    print(f"[SCP]  {os.path.basename(local_path)} → {remote_path}")
    return True


# ─────────────────────────────────────────────────────────────────────────────
# ÉTAPE 1: Copier gamificationEngine.js
# ─────────────────────────────────────────────────────────────────────────────
def step1_copy_engine():
    print("\n=== ÉTAPE 1: Déploiement gamificationEngine.js ===")
    local  = os.path.join(LOCAL_BASE, "gamificationEngine.js")
    remote = f"{SERVER_BASE}/utils/gamificationEngine.js"

    # Backup si existant
    run_ssh(f"[ -f {remote} ] && cp {remote} {remote}.bak || true")

    if scp_to(local, remote):
        out = run_ssh(f"node -c {remote}")
        if out.returncode == 0:
            print("[OK] gamificationEngine.js syntax OK")
        else:
            print(f"[WARN] Syntax check: {out.stderr}")


# ─────────────────────────────────────────────────────────────────────────────
# ÉTAPE 2: Copier et exécuter la migration SQL
# ─────────────────────────────────────────────────────────────────────────────
def step2_run_migration():
    print("\n=== ÉTAPE 2: Migration SQL 026_gamification_v2_core ===")
    local  = os.path.join(LOCAL_BASE, "migrations", "026_gamification_v2_core.sql")
    remote = f"{SERVER_BASE}/migrations/026_gamification_v2_core.sql"

    scp_to(local, remote)

    # Exécuter la migration
    cmd = (
        f"mysql -u {DB_USER} '-p{DB_PASS}' {DB_NAME} "
        f"< {SERVER_BASE}/migrations/026_gamification_v2_core.sql 2>&1"
    )
    result = run_ssh(cmd)
    if result.returncode == 0:
        print("[OK] Migration exécutée avec succès")
    else:
        print(f"[WARN] Migration output: {result.stdout[:500]}")

    # Vérifier les tables créées
    verify = run_ssh(
        f"mysql -u {DB_USER} '-p{DB_PASS}' {DB_NAME} "
        f"-e 'SHOW TABLES LIKE \"gamification_%\";' 2>/dev/null"
    )
    print(f"[INFO] Tables gamification:\n{verify.stdout}")


# ─────────────────────────────────────────────────────────────────────────────
# ÉTAPE 3: Patch uploadJobImage.js
# ─────────────────────────────────────────────────────────────────────────────
def step3_patch_upload_image():
    print("\n=== ÉTAPE 3: Patch uploadJobImage.js ===")
    remote = f"{SERVER_BASE}/endPoints/v1/uploadJobImage.js"

    # Lire le contenu actuel
    result = run_ssh(f"cat {remote}")
    content = result.stdout

    if "gamificationEngine" in content:
        print("[SKIP] uploadJobImage.js déjà patché")
        return

    # Patch: ajouter require en haut et hook après l'INSERT
    new_content = content

    # 1. Ajouter le require après la dernière ligne require existante
    require_block = "const { connect } = require('../../swiftDb');"
    require_replacement = (
        "const { connect } = require('../../swiftDb');\n"
        "const { processPhotoAdded } = require('../../utils/gamificationEngine');"
    )
    new_content = new_content.replace(require_block, require_replacement, 1)

    # 2. Injecter le hook après await connection.release() (avant res.json)
    old_block = "    await connection.release();\n    \n    res.json({"
    new_block = (
        "    await connection.release();\n"
        "\n"
        "    // [GAMIF V2] Fire-and-forget\n"
        "    processPhotoAdded(\n"
        "      parseInt(job_id), parseInt(user_id),\n"
        "      null, result.insertId\n"
        "    );\n"
        "\n"
        "    res.json({"
    )
    if old_block in new_content:
        new_content = new_content.replace(old_block, new_block, 1)
        write_remote_file(remote, new_content)
        print("[OK] uploadJobImage.js patché")
    else:
        print("[WARN] Pattern non trouvé dans uploadJobImage.js - patch manuel requis")


# ─────────────────────────────────────────────────────────────────────────────
# ÉTAPE 4: Patch uploadSignatureToJob.js
# ─────────────────────────────────────────────────────────────────────────────
def step4_patch_signature():
    print("\n=== ÉTAPE 4: Patch uploadSignatureToJob.js ===")
    remote = f"{SERVER_BASE}/endPoints/v1/uploadSignatureToJob.js"

    result = run_ssh(f"cat {remote}")
    content = result.stdout

    if "gamificationEngine" in content:
        print("[SKIP] uploadSignatureToJob.js déjà patché")
        return

    new_content = content

    # 1. Ajouter require
    old_req = "const { connect } = require('../../swiftDb');"
    new_req = (
        "const { connect } = require('../../swiftDb');\n"
        "const { processSignatureCollected } = require('../../utils/gamificationEngine');"
    )
    new_content = new_content.replace(old_req, new_req, 1)

    # 2. Injecter avant return res.status(201) (la réponse succès finale)
    old_return = "    return res.status(201).json({\n      success: true,\n      message: 'Signature ajoutée avec succès',"
    new_return = (
        "    // [GAMIF V2] Fire-and-forget\n"
        "    processSignatureCollected(\n"
        "      parseInt(jobId), user.id,\n"
        "      user.company_id || null, insertResult.insertId\n"
        "    );\n"
        "\n"
        "    return res.status(201).json({\n"
        "      success: true,\n"
        "      message: 'Signature ajoutée avec succès',"
    )
    if old_return in new_content:
        new_content = new_content.replace(old_return, new_return, 1)
        write_remote_file(remote, new_content)
        print("[OK] uploadSignatureToJob.js patché")
    else:
        print("[WARN] Pattern non trouvé dans uploadSignatureToJob.js - patch manuel requis")


# ─────────────────────────────────────────────────────────────────────────────
# ÉTAPE 5: Patch createNote.js
# ─────────────────────────────────────────────────────────────────────────────
def step5_patch_create_note():
    print("\n=== ÉTAPE 5: Patch createNote.js ===")
    remote = f"{SERVER_BASE}/endPoints/v1/createNote.js"

    result = run_ssh(f"cat {remote}")
    content = result.stdout

    if "gamificationEngine" in content:
        print("[SKIP] createNote.js déjà patché")
        return

    new_content = content

    # 1. Ajouter require
    old_req = "const { connect } = require('../../swiftDb');"
    new_req = (
        "const { connect } = require('../../swiftDb');\n"
        "const { processNoteAdded } = require('../../utils/gamificationEngine');"
    )
    new_content = new_content.replace(old_req, new_req, 1)

    # 2. Injecter avant return res.status(201)
    old_return = "    return res.status(201).json({\n      success: true,\n      message: 'Note créée avec succès',"
    new_return = (
        "    // [GAMIF V2] Fire-and-forget\n"
        "    const _noteJobId = job_id || req.params?.jobId;\n"
        "    const _noteUserId = created_by || req.user?.id || null;\n"
        "    if (_noteJobId && _noteUserId) {\n"
        "      processNoteAdded(\n"
        "        parseInt(_noteJobId), parseInt(_noteUserId),\n"
        "        null, result.insertId\n"
        "      );\n"
        "    }\n"
        "\n"
        "    return res.status(201).json({\n"
        "      success: true,\n"
        "      message: 'Note créée avec succès',"
    )
    if old_return in new_content:
        new_content = new_content.replace(old_return, new_return, 1)
        write_remote_file(remote, new_content)
        print("[OK] createNote.js patché")
    else:
        print("[WARN] Pattern non trouvé dans createNote.js - patch manuel requis")


# ─────────────────────────────────────────────────────────────────────────────
# ÉTAPE 6: Patch completeJobById.js
# ─────────────────────────────────────────────────────────────────────────────
def step6_patch_complete_job():
    print("\n=== ÉTAPE 6: Patch completeJobById.js ===")
    remote = f"{SERVER_BASE}/endPoints/v1/completeJobById.js"

    result = run_ssh(f"cat {remote}")
    content = result.stdout

    if "gamificationEngine" in content:
        print("[SKIP] completeJobById.js déjà patché")
        return

    new_content = content

    # 1. Ajouter require (après le require jobActionLogger existant)
    old_req = "const { logJobAction } = require('../../utils/jobActionLogger');"
    new_req = (
        "const { logJobAction } = require('../../utils/jobActionLogger');\n"
        "const { processJobCompleted } = require('../../utils/gamificationEngine');"
    )
    new_content = new_content.replace(old_req, new_req, 1)

    # 2. Injecter après le logJobAction call existant
    old_log = "    logJobAction({ jobId: numericJobId || job.id, actionType: 'job_completed',"
    # Trouver la ligne complète de logJobAction
    idx = new_content.find(old_log)
    if idx != -1:
        # Trouver la fin de cette ligne
        end_idx = new_content.find('\n', idx)
        log_line = new_content[idx:end_idx]
        new_content = new_content.replace(
            log_line,
            log_line + "\n    // [GAMIF V2] Fire-and-forget\n"
            "    processJobCompleted(\n"
            "      jobId, user.id,\n"
            "      user.company_id || job.contractor_company_id || null\n"
            "    );",
            1
        )
        write_remote_file(remote, new_content)
        print("[OK] completeJobById.js patché")
    else:
        print("[WARN] Pattern logJobAction non trouvé - patch manuel requis")


# ─────────────────────────────────────────────────────────────────────────────
# ÉTAPE 7: Patch review.js
# ─────────────────────────────────────────────────────────────────────────────
def step7_patch_review():
    print("\n=== ÉTAPE 7: Patch review.js ===")
    remote = f"{SERVER_BASE}/endPoints/review.js"

    result = run_ssh(f"cat {remote}")
    content = result.stdout

    if "gamificationEngine" in content:
        print("[SKIP] review.js déjà patché")
        return

    new_content = content

    # 1. Étendre le SELECT pour inclure job_id (nécessaire pour passer au moteur)
    old_select = "'SELECT id, submitted_at, expires_at FROM job_review_tokens WHERE token = ?'"
    new_select = "'SELECT id, job_id, submitted_at, expires_at FROM job_review_tokens WHERE token = ?'"
    if old_select in new_content:
        new_content = new_content.replace(old_select, new_select, 1)
        print("[OK] SELECT étendu avec job_id")
    else:
        print("[WARN] SELECT pattern non trouvé — job_id peut manquer")

    # 2. Ajouter le require après les derniers requires existants
    lines = new_content.split('\n')
    last_req_idx = 0
    for i, line in enumerate(lines):
        if line.strip().startswith('const ') and 'require' in line:
            last_req_idx = i

    gamif_require = "const { processReviewSubmitted } = require('../utils/gamificationEngine');"
    lines.insert(last_req_idx + 1, gamif_require)
    new_content = '\n'.join(lines)

    # 3. Injecter le hook: remplacer le bloc submit final
    # Pattern exact visible à sed -n '147,153p' review.js
    old_block = (
        "    vals.push(token);\n"
        "    await conn.query(`UPDATE job_review_tokens SET ${sets.join(', ')} WHERE token = ?`, vals);\n"
        "    res.json({ ok: true });\n"
        "  } finally {"
    )
    new_block = (
        "    vals.push(token);\n"
        "    await conn.query(`UPDATE job_review_tokens SET ${sets.join(', ')} WHERE token = ?`, vals);\n"
        "    // [GAMIF V2] Fire-and-forget sur step 5 (review complète)\n"
        "    if (s === 5) {\n"
        "      try { processReviewSubmitted(row.id, row.job_id); } catch (_) {}\n"
        "    }\n"
        "    res.json({ ok: true });\n"
        "  } finally {"
    )

    if old_block in new_content:
        new_content = new_content.replace(old_block, new_block, 1)
        write_remote_file(remote, new_content)
        print("[OK] review.js patché")
    else:
        print("[WARN] Pattern exact non trouvé dans review.js")
        idx = new_content.find("vals.push(token)")
        if idx != -1:
            print(f"      Context: {repr(new_content[idx:idx+250])}")


# ─────────────────────────────────────────────────────────────────────────────
# UTILITAIRE: Écrire un fichier sur le serveur via heredoc
# ─────────────────────────────────────────────────────────────────────────────
def write_remote_file(remote_path, content):
    """
    Écrit un fichier sur le serveur via SSH + Python (gestion UTF-8 propre).
    """
    # Créer un fichier temporaire local
    import tempfile
    with tempfile.NamedTemporaryFile(
        mode='w', encoding='utf-8', suffix='.js', delete=False
    ) as f:
        f.write(content)
        tmp_local = f.name

    # Backup remote
    run_ssh(f"cp {remote_path} {remote_path}.bak_gamif_$(date +%Y%m%d_%H%M%S) 2>/dev/null || true")

    # SCP
    result = subprocess.run(
        ["scp", tmp_local, f"{SERVER_ALIAS}:{remote_path}"],
        capture_output=True, text=True
    )
    os.unlink(tmp_local)

    if result.returncode != 0:
        print(f"[ERROR] Failed to write {remote_path}: {result.stderr}")
        return False
    return True


# ─────────────────────────────────────────────────────────────────────────────
# ÉTAPE 8: Redémarrer le serveur
# ─────────────────────────────────────────────────────────────────────────────
def step8_restart():
    print("\n=== ÉTAPE 8: Redémarrage PM2 ===")
    result = run_ssh("pm2 restart all 2>&1 | tail -5")
    print(result.stdout or "[INFO] PM2 restarted (no output)")


# ─────────────────────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────────────────────
if __name__ == '__main__':
    print("╔══════════════════════════════════════════════════╗")
    print("║     DÉPLOIEMENT GAMIFICATION V2 — BACKEND       ║")
    print("╚══════════════════════════════════════════════════╝")

    step1_copy_engine()
    step2_run_migration()
    step3_patch_upload_image()
    step4_patch_signature()
    step5_patch_create_note()
    step6_patch_complete_job()
    step7_patch_review()
    step8_restart()

    print("\n✅ Déploiement terminé !")
    print("   Vérifiez les logs: ssh sushinari 'pm2 logs --lines 20'")
