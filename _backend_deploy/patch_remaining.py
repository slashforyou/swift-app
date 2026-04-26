#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Patch les 3 endpoints restants: uploadSignatureToJob, createNote, review.js"""
import subprocess, tempfile, os

SERVER = "sushinari"
BASE   = "/srv/www/htdocs/swiftapp/server"

def ssh(cmd):
    r = subprocess.run(["ssh", SERVER, cmd], capture_output=True)
    stdout = r.stdout.decode('utf-8', errors='replace')
    return stdout, r.returncode

def read_remote(path):
    r = subprocess.run(["ssh", SERVER, f"cat {path}"], capture_output=True)
    return r.stdout.decode('utf-8')

def write_remote(path, content):
    with tempfile.NamedTemporaryFile(mode='w', encoding='utf-8', suffix='.tmp', delete=False) as f:
        f.write(content)
        tmp = f.name
    r = subprocess.run(["scp", tmp, f"{SERVER}:{path}"], capture_output=True)
    os.unlink(tmp)
    ssh(f"node -c {path} 2>&1")  # syntax check
    return r.returncode == 0


# ─── 1. uploadSignatureToJob.js ───────────────────────────────────────────────
path = f"{BASE}/endPoints/v1/uploadSignatureToJob.js"
content = read_remote(path)

if "gamificationEngine" not in content:
    # Add require after existing require lines
    from_str = "const { connect } = require('../../swiftDb');"
    to_str   = ("const { connect } = require('../../swiftDb');\n"
                "const { processSignatureCollected } = require('../../utils/gamificationEngine');")
    content = content.replace(from_str, to_str, 1)

    # Inject before the success return
    old = ("    return res.status(201).json({\n"
           "      success: true,\n"
           "      message: 'Signature ajoutée avec succès',")
    new = ("    // [GAMIF V2]\n"
           "    processSignatureCollected(parseInt(jobId), user.id, user.company_id || null, insertResult.insertId);\n"
           "\n"
           "    return res.status(201).json({\n"
           "      success: true,\n"
           "      message: 'Signature ajoutée avec succès',")
    if old in content:
        content = content.replace(old, new, 1)
        ok = write_remote(path, content)
        print(f"[{'OK' if ok else 'ERR'}] uploadSignatureToJob.js patched")
    else:
        print("[WARN] uploadSignatureToJob: pattern not found")
        print(repr(content[content.find("return res.status(201)"):content.find("return res.status(201)")+200]))
else:
    print("[SKIP] uploadSignatureToJob.js already patched")


# ─── 2. createNote.js ────────────────────────────────────────────────────────
path = f"{BASE}/endPoints/v1/createNote.js"
content = read_remote(path)

if "gamificationEngine" not in content:
    from_str = "const { connect } = require('../../swiftDb');"
    to_str   = ("const { connect } = require('../../swiftDb');\n"
                "const { processNoteAdded } = require('../../utils/gamificationEngine');")
    content = content.replace(from_str, to_str, 1)

    old = ("    return res.status(201).json({\n"
           "      success: true,\n"
           "      message: 'Note créée avec succès',")
    new = ("    // [GAMIF V2]\n"
           "    const _nJobId  = parseInt(job_id || req.params?.jobId);\n"
           "    const _nUserId = parseInt(created_by || 0);\n"
           "    if (_nJobId && _nUserId) processNoteAdded(_nJobId, _nUserId, null, result.insertId);\n"
           "\n"
           "    return res.status(201).json({\n"
           "      success: true,\n"
           "      message: 'Note créée avec succès',")
    if old in content:
        content = content.replace(old, new, 1)
        ok = write_remote(path, content)
        print(f"[{'OK' if ok else 'ERR'}] createNote.js patched")
    else:
        print("[WARN] createNote: pattern not found")
        idx = content.find("return res.status(201)")
        print(repr(content[max(0,idx-50):idx+200]))
else:
    print("[SKIP] createNote.js already patched")


# ─── 3. review.js ─────────────────────────────────────────────────────────────
path = f"{BASE}/endPoints/review.js"
content = read_remote(path)

if "gamificationEngine" not in content:
    # Add require
    lines = content.split('\n')
    last_req = 0
    for i, l in enumerate(lines):
        if l.strip().startswith('const ') and 'require' in l:
            last_req = i
    lines.insert(last_req + 1,
        "const { processReviewSubmitted } = require('../utils/gamificationEngine');")
    content = '\n'.join(lines)

    # Extend SELECT to include job_id
    content = content.replace(
        "'SELECT id, submitted_at, expires_at FROM job_review_tokens WHERE token = ?'",
        "'SELECT id, job_id, submitted_at, expires_at FROM job_review_tokens WHERE token = ?'",
        1
    )

    # Inject gamification hook before res.json({ ok: true })
    old = ("    vals.push(token);\n"
           "    await conn.query(`UPDATE job_review_tokens SET ${sets.join(', ')} WHERE token = ?`, vals);\n"
           "    res.json({ ok: true });\n"
           "  } finally {")
    new = ("    vals.push(token);\n"
           "    await conn.query(`UPDATE job_review_tokens SET ${sets.join(', ')} WHERE token = ?`, vals);\n"
           "    // [GAMIF V2] Fire-and-forget si review complète\n"
           "    if (s === 5) {\n"
           "      try { processReviewSubmitted(row.id, row.job_id); } catch (_) {}\n"
           "    }\n"
           "    res.json({ ok: true });\n"
           "  } finally {")
    if old in content:
        content = content.replace(old, new, 1)
        ok = write_remote(path, content)
        print(f"[{'OK' if ok else 'ERR'}] review.js patched")
    else:
        print("[WARN] review.js: pattern not found")
        idx = content.find("vals.push(token)")
        print(repr(content[idx:idx+250]))
else:
    print("[SKIP] review.js already patched")

print("\nDone.")
