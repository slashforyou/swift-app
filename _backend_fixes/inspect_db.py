import subprocess

def q(s):
    r = subprocess.run(['mysql','-u','swiftapp_user','-pU%Xgxvc54EKUD39PcwNAYvuS','swiftapp','-e',s],
                       stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    out = r.stdout.decode().strip()
    err = r.stderr.decode().strip()
    if err and 'Warning' not in err:
        print('ERR:', err[:200])
    return out

print('=== TRUCKS SCHEMA ===')
print(q('DESCRIBE trucks;'))

print('\n=== TRUCKS DATA ===')
print(q('SELECT * FROM trucks LIMIT 5;'))

print('\n=== JOBS WITH CONTRACTOR ===')
print(q('SELECT id,code,status,contractor_company_id FROM jobs WHERE contractor_company_id IS NOT NULL LIMIT 15;'))

print('\n=== ALL TRANSFERS ===')
print(q('SELECT id,job_id,status,sender_company_id,recipient_company_id,requested_drivers,requested_offsiders FROM job_transfers;'))
