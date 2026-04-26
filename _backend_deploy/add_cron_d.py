import subprocess

SERVER = 'sushinari'
APP_DIR = '/srv/www/htdocs/swiftapp/server'
NODE_BIN = '/root/.nvm/versions/node/v16.17.0/bin/node'

cron_content = f"""SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin
0 0 * * * root {NODE_BIN} {APP_DIR}/cron/gamificationStreakCron.js >> /var/log/gamif_streak.log 2>&1
"""

import tempfile, os
with tempfile.NamedTemporaryFile("w", suffix=".cron", delete=False, encoding="utf-8") as f:
    f.write(cron_content)
    tmp = f.name

r = subprocess.run(["scp", tmp, f"{SERVER}:/etc/cron.d/swiftapp-gamification"], capture_output=True)
os.unlink(tmp)
print("SCP:", r.returncode, r.stderr.decode())

r2 = subprocess.run(["ssh", SERVER, "chmod 644 /etc/cron.d/swiftapp-gamification && cat /etc/cron.d/swiftapp-gamification"], capture_output=True)
print(r2.stdout.decode())
print(r2.stderr.decode())
