#!/usr/bin/env python3
"""
Fix pushNotifications.js to use existing DB column names.

Existing notification_preferences columns:
  push_notifications (not push_enabled)
  email_notifications (not email_enabled)
  sms_notifications (not sms_enabled)
  job_updates, truck_assignments, payment_alerts, system_alerts
  quiet_hours_start, quiet_hours_end, timezone
"""

FILE_PATH = '/srv/www/htdocs/swiftapp/server/endPoints/v1/pushNotifications.js'

with open(FILE_PATH, 'r') as f:
    content = f.read()

original = content

# Fix 1: sendPushNotificationToUser - query uses wrong column name
content = content.replace(
    "SELECT push_enabled FROM notification_preferences WHERE user_id = ?",
    "SELECT push_notifications AS push_enabled FROM notification_preferences WHERE user_id = ?"
)

# Fix 2: ensureNotificationPreferencesExists - if table already exists with old schema,
# the IF NOT EXISTS won't recreate it. We need to ensure the column exists.
# Replace the check query to be a safe ALTER TABLE IF needed.
# Insert a column-check migration after the IF NOT EXISTS create block.
ALTER_PATCH = """
  // Ensure push_enabled column is mapped (existing tables may use push_notifications)
  try {
    await connection.execute(`
      ALTER TABLE notification_preferences
      ADD COLUMN IF NOT EXISTS push_enabled BOOLEAN DEFAULT TRUE
    `);
  } catch(e) {
    // Column may already exist or not supported - ignore
  }
"""
# Find location after the CREATE TABLE block ends in ensureNotificationPreferencesExists
# The function ends with closing bracket after the CREATE TABLE statement
ANCHOR_CREATE = "    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci\n  `);"

if ANCHOR_CREATE in content:
    content = content.replace(ANCHOR_CREATE, ANCHOR_CREATE + ALTER_PATCH, 1)
    print("✅ Fix 2 applied: ALTER TABLE patch for push_enabled column")
else:
    print("⚠️ Fix 2 anchor not found - skipping")

# Fix 3: getNotificationPreferencesEndpoint - map column names in response
# push_notifications -> push_enabled, email_notifications -> email_enabled, etc.
OLD_PREFS_RESPONSE = """    res.json({
      success: true,
      data: {
        push_enabled: !!preferences.push_enabled,
        email_enabled: !!preferences.email_enabled,
        sms_enabled: !!preferences.sms_enabled,
        job_reminders: !!preferences.job_reminders,
        job_updates: !!preferences.job_updates,
        payment_alerts: !!preferences.payment_alerts,
        marketing: !!preferences.marketing,
        quiet_hours_enabled: !!preferences.quiet_hours_enabled,
        quiet_hours_start: preferences.quiet_hours_start,
        quiet_hours_end: preferences.quiet_hours_end,
        timezone: preferences.timezone
      }
    });"""

NEW_PREFS_RESPONSE = """    res.json({
      success: true,
      data: {
        push_enabled: !!(preferences.push_enabled !== undefined ? preferences.push_enabled : preferences.push_notifications),
        email_enabled: !!(preferences.email_enabled !== undefined ? preferences.email_enabled : preferences.email_notifications),
        sms_enabled: !!(preferences.sms_enabled !== undefined ? preferences.sms_enabled : preferences.sms_notifications),
        job_reminders: !!(preferences.job_reminders !== undefined ? preferences.job_reminders : preferences.job_updates),
        job_updates: !!preferences.job_updates,
        payment_alerts: !!preferences.payment_alerts,
        marketing: !!preferences.marketing,
        quiet_hours_enabled: !!preferences.quiet_hours_enabled,
        quiet_hours_start: preferences.quiet_hours_start,
        quiet_hours_end: preferences.quiet_hours_end,
        timezone: preferences.timezone
      }
    });"""

if OLD_PREFS_RESPONSE in content:
    content = content.replace(OLD_PREFS_RESPONSE, NEW_PREFS_RESPONSE)
    print("✅ Fix 3 applied: getNotificationPreferences column mapping")
else:
    print("⚠️ Fix 3 anchor not found - skipping")

if content != original:
    with open(FILE_PATH, 'w') as f:
        f.write(content)
    print("\n✅ pushNotifications.js patched - restart PM2 to apply")
else:
    print("\n⚠️ No changes made - check anchors manually")
