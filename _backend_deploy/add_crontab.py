import subprocess
SERVER = 'sushinari'
APP_DIR = '/srv/www/htdocs/swiftapp/server'
cron_line = f'0 0 * * * /usr/bin/node {APP_DIR}/cron/gamificationStreakCron.js >> /var/log/gamif_streak.log 2>&1'
r = subprocess.run(
    ['ssh', SERVER, f'(crontab -l 2>/dev/null; echo "{cron_line}") | crontab - ; crontab -l'],
    capture_output=True
)
print(r.stdout.decode())
print(r.stderr.decode())
