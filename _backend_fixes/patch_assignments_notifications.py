#!/usr/bin/env python3
"""
Patch assignments.js to write notifications in the DB table
when a staff member is solicited for a job.
"""

path = "/srv/www/htdocs/swiftapp/server/endPoints/v1/assignments.js"

with open(path, "r") as f:
    content = f.read()

# ──────────────────────────────────────────────
# 1. Ajouter le helper insertNotification
# ──────────────────────────────────────────────
HELPER = """
/** Insère une notification en base pour un user (best-effort, non bloquant) */
async function insertNotification(connection, userId, type, title, notifContent, jobId = null, priority = "normal") {
  try {
    await connection.execute(
      `INSERT INTO notifications (type, title, content, status, priority, user_id, job_id)
       VALUES (?, ?, ?, 'unread', ?, ?, ?)`,
      [type, title, notifContent, priority, userId, jobId || null]
    );
  } catch (e) {
    console.warn("[assignments] insertNotification failed:", e.message);
  }
}

"""

ANCHOR_HELPER = "/** Enrichit une liste d'assignments avec les infos de la ressource */"
if "insertNotification" not in content:
    content = content.replace(ANCHOR_HELPER, HELPER + ANCHOR_HELPER)
    print("[1] ✅ insertNotification helper added")
else:
    print("[1] ⏭  helper already present")

# ──────────────────────────────────────────────
# 2. POST createAssignment → notifier le staff
# ──────────────────────────────────────────────
OLD_POST = """      // Le staff resource_id = user_id dans notre système
      await connection.execute(
        "UPDATE job_assignments SET notified_at = NOW() WHERE id = ?",
        [result.insertId],
      );

      const [jobInfo] = await connection.execute(
        "SELECT code FROM jobs WHERE id = ?",
        [jobId],
      );
      const jobCode = jobInfo[0]?.code ?? String(jobId);
      const roleLabel =
        role === "driver"
          ? "Chauffeur"
          : role === "offsider"
            ? "Offsider"
            : "Superviseur";

      // Le staff resource_id = user_id dans notre système
      await sendPushToUser(
        connection,
        resource_id,
        `🚛 Nouvelle affectation — ${roleLabel}`,
        `Vous avez été demandé(e) comme ${roleLabel} sur le job ${jobCode}`,
        { action: "respond_assignment", assignmentId: result.insertId, jobId },
      );"""

NEW_POST = """      // Le staff resource_id = user_id dans notre système
      await connection.execute(
        "UPDATE job_assignments SET notified_at = NOW() WHERE id = ?",
        [result.insertId],
      );

      const [jobInfo] = await connection.execute(
        "SELECT code FROM jobs WHERE id = ?",
        [jobId],
      );
      const jobCode = jobInfo[0]?.code ?? String(jobId);
      const roleLabel =
        role === "driver"
          ? "Chauffeur"
          : role === "offsider"
            ? "Offsider"
            : "Superviseur";

      // Le staff resource_id = user_id dans notre système
      await sendPushToUser(
        connection,
        resource_id,
        `🚛 Nouvelle affectation — ${roleLabel}`,
        `Vous avez été demandé(e) comme ${roleLabel} sur le job ${jobCode}`,
        { action: "respond_assignment", assignmentId: result.insertId, jobId },
      );

      // Écrire en base notifications pour que l'app voie la sollicitation
      await insertNotification(
        connection,
        resource_id,
        "job_update",
        `🚛 Sollicitation — ${roleLabel}`,
        `Vous avez été demandé(e) comme ${roleLabel} sur le job ${jobCode}. Confirmez ou déclinez.`,
        jobId,
        "high"
      );"""

if "Sollicitation" not in content:
    if OLD_POST in content:
        content = content.replace(OLD_POST, NEW_POST)
        print("[2] ✅ insertNotification call added in POST (staff solicitation)")
    else:
        print("[2] ❌ POST anchor not found — check manually")
else:
    print("[2] ⏭  POST patch already present")

# ──────────────────────────────────────────────
# 3. PATCH respond → notifier les admins (confirm)
# ──────────────────────────────────────────────
OLD_CONFIRM = """      if (action === "confirm") {
        await sendPushToUser(
          connection,
          admin.id,
          `✅ ${staffName} a confirmé`,
          `${roleLabel} confirmé(e) pour le job ${jobCode}`,
          { jobId, jobCode },
        );
      } else {
        await sendPushToUser(
          connection,
          admin.id,
          `❌ ${staffName} a décliné`,
          `Cherchez un(e) ${roleLabel} de remplacement pour le job ${jobCode}`,
          { jobId, jobCode, action: "reassign" },
        );
      }"""

NEW_CONFIRM = """      if (action === "confirm") {
        await sendPushToUser(
          connection,
          admin.id,
          `✅ ${staffName} a confirmé`,
          `${roleLabel} confirmé(e) pour le job ${jobCode}`,
          { jobId, jobCode },
        );
        await insertNotification(
          connection,
          admin.id,
          "job_update",
          `✅ ${staffName} a confirmé`,
          `${staffName} a accepté le rôle ${roleLabel} sur le job ${jobCode}.`,
          jobId,
          "normal"
        );
      } else {
        await sendPushToUser(
          connection,
          admin.id,
          `❌ ${staffName} a décliné`,
          `Cherchez un(e) ${roleLabel} de remplacement pour le job ${jobCode}`,
          { jobId, jobCode, action: "reassign" },
        );
        await insertNotification(
          connection,
          admin.id,
          "job_update",
          `❌ ${staffName} a décliné`,
          `${staffName} a refusé le rôle ${roleLabel} sur le job ${jobCode}. Réassignez un remplaçant.`,
          jobId,
          "high"
        );
      }"""

if 'await insertNotification(\n          connection,\n          admin.id,\n          "job_update",\n          `✅' not in content:
    if OLD_CONFIRM in content:
        content = content.replace(OLD_CONFIRM, NEW_CONFIRM)
        print("[3] ✅ insertNotification calls added in PATCH respond (confirm/decline)")
    else:
        print("[3] ❌ PATCH confirm/decline anchor not found — check manually")
else:
    print("[3] ⏭  PATCH patch already present")

with open(path, "w") as f:
    f.write(content)

print("\n✅ Patch complete — restart pm2 to apply.")
