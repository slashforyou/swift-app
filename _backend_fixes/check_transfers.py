import subprocess
sql = "SELECT jt.id, jt.requested_drivers, jt.requested_offsiders, jt.pricing_amount, jt.pricing_type, jt.preferred_truck_id, jt.assignment_status, j.code FROM job_transfers jt JOIN jobs j ON j.id=jt.job_id LIMIT 5;"
r = subprocess.run(["mysql","-u","swiftapp_user","-pU%Xgxvc54EKUD39PcwNAYvuS","swiftapp","-e", sql], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
print(r.stdout.decode())
print("STDERR:", r.stderr.decode()[:300])
