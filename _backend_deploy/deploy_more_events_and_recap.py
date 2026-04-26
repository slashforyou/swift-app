#!/usr/bin/env python3
"""
deploy_more_events_and_recap.py
Orchestrates the deployment of:
  1. More gamification events (startJob, stepCompleted, uploadPhoto x2)
  2. Daily end-of-day XP recap via cron + push notification
  3. getV2DailyRecapEndpoint in gamificationV2.js + index.js route

PRE-REQUISITE: run from workspace root.
Scripts srv_patch_gamif_events.py, srv_patch_index_recap.py, dailyRecapCron.js
must exist in the same _backend_deploy/ folder.
"""
import subprocess
import sys
import os

SSH_HOST = 'sushinari'
SERVER   = '/srv/www/htdocs/swiftapp/server'
DEPLOY   = os.path.dirname(os.path.abspath(__file__))


def run(cmd, check=True):
    print(f'\n$ {cmd}')
    result = subprocess.run(cmd, shell=True, text=True, capture_output=True)
    if result.stdout:
        print(result.stdout.rstrip())
    if result.stderr:
        print('[stderr]', result.stderr.rstrip())
    if check and result.returncode != 0:
        print(f'FAILED (exit {result.returncode})')
        sys.exit(1)
    return result


print('=' * 70)
print('STEP 1  --  Upload server-side scripts')
print('=' * 70)

run(f'scp "{DEPLOY}/srv_patch_gamif_events.py" {SSH_HOST}:/tmp/srv_patch_gamif_events.py')
run(f'scp "{DEPLOY}/srv_patch_index_recap.py"  {SSH_HOST}:/tmp/srv_patch_index_recap.py')
run(f'scp "{DEPLOY}/dailyRecapCron.js"         {SSH_HOST}:{SERVER}/utils/dailyRecapCron.js')
print('  Uploads OK')

print('\n' + '=' * 70)
print('STEP 2  --  Run gamificationEngine + endpoint patches')
print('=' * 70)

run(f'ssh {SSH_HOST} "python3 /tmp/srv_patch_gamif_events.py"')

print('\n' + '=' * 70)
print('STEP 3  --  Run index.js patch (route + require)')
print('=' * 70)

run(f'ssh {SSH_HOST} "python3 /tmp/srv_patch_index_recap.py"')

print('\n' + '=' * 70)
print('STEP 4  --  Register daily-recap cron')
print('=' * 70)

CRON_LINE = (
    '*/5 * * * * root '
    '/root/.nvm/versions/node/v16.17.0/bin/node '
    f'{SERVER}/utils/dailyRecapCron.js '
    '>> /var/log/swiftapp-recap.log 2>&1'
)
CRON_FILE = '/etc/cron.d/swiftapp-gamification'

r = run(f'ssh {SSH_HOST} "grep -q dailyRecapCron {CRON_FILE} && echo EXISTS || echo MISSING"', check=False)
if 'MISSING' in r.stdout:
    run(f"ssh {SSH_HOST} \"echo '{CRON_LINE}' >> {CRON_FILE}\"")
    run(f'ssh {SSH_HOST} "chmod 644 {CRON_FILE}"')
    print('  Cron registered')
else:
    print('  Cron already present')

print('\n' + '=' * 70)
print('STEP 5  --  Restart PM2')
print('=' * 70)

run(f'ssh {SSH_HOST} "pm2 restart all --update-env"')

print('\n' + '=' * 70)
print('STEP 6  --  Quick smoke test')
print('=' * 70)

run(f'ssh {SSH_HOST} "pm2 status"')

print('\n')
print('=' * 70)
print('DEPLOY COMPLETE')
print('  - processJobStarted       => startJobById.js')
print('  - processStepCompleted    => advanceJobStepWithTimer.js')
print('  - processPhotoAdded (x2)  => uploadPhotoToJob.js + uploadMultipleImages.js')
print('  - getV2DailyRecapEndpoint => gamificationV2.js + index.js route')
print('  - dailyRecapCron.js       => cron */5 min')
print('=' * 70)
