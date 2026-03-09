"""
Patch transfers.js pour envoyer une push notification expo
quand un job est assigné à un prestataire (POST /jobs/:id/transfers).

Aftercreation of a transfer, the sender_company_id already has the job.
We need to notify the admins of recipient_company_id.

Le backend doit avoir un helper sendPushToCompany(companyId, title, body, data)
ou utiliser Expo push API directement.
"""

import os
import re
import shutil
from datetime import datetime

TRANSFERS_PATH = '/srv/www/htdocs/swiftapp/server/endPoints/v1/jobs/transfers.js'

if not os.path.exists(TRANSFERS_PATH):
    print(f'❌ Fichier non trouvé : {TRANSFERS_PATH}')
    exit(1)

backup = TRANSFERS_PATH + f'.bak_{datetime.now().strftime("%Y%m%d_%H%M%S")}'
shutil.copy2(TRANSFERS_PATH, backup)
print(f'📦 Backup : {backup}')

with open(TRANSFERS_PATH, 'r') as f:
    content = f.read()

# ── Vérifier si déjà patché ─────────────────────────────────────────────────
if 'sendPushToCompany' in content or 'job_assigned_contractor' in content:
    print('✅ Déjà patché — aucun changement.')
    exit(0)

# Chercher le helper d'envoi push (adapt selon le projet)
PUSH_HELPER_CANDIDATES = [
    "/srv/www/htdocs/swiftapp/server/helpers/push.js",
    "/srv/www/htdocs/swiftapp/server/utils/push.js",
    "/srv/www/htdocs/swiftapp/server/services/pushNotifications.js",
]
push_helper_path = None
for p in PUSH_HELPER_CANDIDATES:
    if os.path.exists(p):
        push_helper_path = p
        break

push_require = ''
if push_helper_path:
    push_require = f"const {{ sendPushToCompany }} = require('{push_helper_path}');\n"
    print(f'✅ Push helper trouvé : {push_helper_path}')
else:
    # Créer une fonction inline basée sur Expo push API
    push_require = """
// Inline push notification helper
async function sendPushToCompany(connection, companyId, title, body, data = {}) {
  try {
    const [tokenRows] = await connection.execute(
      `SELECT ut.push_token
       FROM user_push_tokens ut
       JOIN users u ON u.id = ut.user_id
       WHERE u.company_id = ? AND ut.push_token IS NOT NULL AND ut.is_active = 1`,
      [companyId]
    );
    if (!tokenRows.length) return;

    const messages = tokenRows.map(r => ({
      to: r.push_token,
      title,
      body,
      data: { ...data, screen: 'Calendar' },
      sound: 'default',
    }));

    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messages),
    });
  } catch (err) {
    console.error('[sendPushToCompany] Error:', err.message);
  }
}

"""
    print('⚠️  Aucun push helper existant — fonction inline ajoutée.')

# ── Injecter le helper en haut du fichier ───────────────────────────────────
first_const = content.find('\nconst ')
if first_const > -1:
    content = content[:first_const] + '\n' + push_require + content[first_const:]
else:
    content = push_require + content

# ── Patcher la création du transfer (POST) : notify recipient ───────────────
# Chercher le return res.json({ success: true ... }) dans createTransferEndpoint
# et injecter l'appel push avant

OLD_CREATE_RETURN = r'(return res\.json\(\{\s*success:\s*true.*?transfer_id.*?\}\s*\))'
NEW_CREATE_RETURN = r"""// Notifier les admins du prestataire
    try {
      // Récupérer infos du job + sender
      const [jobInfoRows] = await connection.execute(
        `SELECT j.code, sc.name AS sender_name
         FROM jobs j
         LEFT JOIN companies sc ON sc.id = j.contractee_company_id
         WHERE j.id = ?`,
        [jobId]
      );
      const jobInfo = jobInfoRows[0] || {};
      const jobCode = jobInfo.code || jobId;
      const senderName = jobInfo.sender_name || 'Une entreprise';
      const recipientId = req.body.recipient_company_id;
      const jobDate = body?.start_window_start;

      if (recipientId) {
        await sendPushToCompany(
          connection,
          recipientId,
          '📦 Nouveau job à accepter',
          `${senderName} vous assigne le job #${jobCode}`,
          { screen: 'Calendar', date: jobDate, job_id: jobId, type: 'job_assigned_contractor' }
        );
      }
    } catch (_pushErr) {
      console.warn('[createTransfer] Push notification failed (non-blocking):', _pushErr?.message);
    }

    \1"""

match = re.search(OLD_CREATE_RETURN, content, re.DOTALL)
if match:
    content = re.sub(OLD_CREATE_RETURN, NEW_CREATE_RETURN, content, count=1, flags=re.DOTALL)
    print('✅ Push notification injectée dans createTransferEndpoint')
else:
    print('⚠️  Pattern de return non trouvé dans createTransferEndpoint — patch manuel nécessaire')

# ── Écrire le fichier ────────────────────────────────────────────────────────
with open(TRANSFERS_PATH, 'w') as f:
    f.write(content)

print('\n✅ Patch appliqué. Redémarre le serveur Node.js.')
print('   pm2 restart all')
