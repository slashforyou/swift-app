#!/usr/bin/env python3
"""
Patch assignCrewToJobById.js to send push notifications when crew is assigned.
"""

FILE_PATH = '/srv/www/htdocs/swiftapp/server/endPoints/v1/assignCrewToJobById.js'

# Read the file
with open(FILE_PATH, 'r') as f:
    content = f.read()

# Check if already patched
if 'sendPushNotificationToUser' in content:
    print("✅ Already patched - sendPushNotificationToUser already present")
    exit(0)

# Find insertion point: after connection.release() and logger.db.disconnect()
# We insert before the performance/success logging block before res.json()
ANCHOR = "    await connection.release();\n    logger.db.disconnect();"

PUSH_BLOCK = """    await connection.release();
    logger.db.disconnect();

    // 🔔 Envoyer notifications push aux membres assignés
    try {
      const { sendPushNotificationToUser } = require('./pushNotifications');
      const pushPromises = assignedMembers.map(member =>
        sendPushNotificationToUser(parseInt(member.user_id), {
          title: '📋 Nouveau job assigné',
          body: `Vous avez été ajouté au job ${job.code}`,
          data: {
            type: 'job_assigned',
            job_id: job.id,
            job_code: job.code
          }
        })
      );
      const pushResults = await Promise.all(pushPromises);
      logger.success('PUSH', 'Push notifications sent for crew assignment', {
        jobId,
        jobCode: job.code,
        sent: pushResults.filter(r => r.success).length,
        failed: pushResults.filter(r => !r.success).length
      });
    } catch (pushError) {
      logger.error('PUSH', 'Failed to send push notifications (non-blocking)', pushError);
    }"""

if ANCHOR not in content:
    print("❌ Anchor not found in file - check manually")
    exit(1)

# Replace the anchor with push block
patched = content.replace(ANCHOR, PUSH_BLOCK, 1)

with open(FILE_PATH, 'w') as f:
    f.write(patched)

print("✅ Patch applied - push notification wired in assignCrewToJobById.js")
print("   Restart PM2 to apply: pm2 restart swiftapp")
