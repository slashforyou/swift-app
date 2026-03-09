import subprocess
DB = ['-hlocalhost', '-uswiftapp_user', '-pU%Xgxvc54EKUD39PcwNAYvuS', 'swiftapp']
p = subprocess.Popen(['mysql'] + DB, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
o, e = p.communicate(b"UPDATE job_transfers SET message='Furniture removal, 3-bedroom house. Must arrive by 8am. Narrow driveway - bring smaller truck if available.' WHERE id=1; SELECT message FROM job_transfers WHERE id=1;")
print(o.decode(), e.decode())
