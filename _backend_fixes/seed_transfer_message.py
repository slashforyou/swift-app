"""Add a message to transfer 1 for test visibility"""
import subprocess

DB_ARGS = ['-hlocalhost', '-uswiftapp_user', '-pU%Xgxvc54EKUD39PcwNAYvuS', 'swiftapp']

def sql(query):
    p = subprocess.Popen(['mysql'] + DB_ARGS, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    out, err = p.communicate(query.encode())
    return out.decode(), err.decode()

out, err = sql("""
UPDATE job_transfers
SET message = 'Besoin d un chauffeur avec CACES. Acces difficile, prevenir avant.'
WHERE id = 1;
""")
print("Update:", err.strip() if err.strip() else "OK")

out2, _ = sql("SELECT id, requested_drivers, requested_offsiders, pricing_amount, message FROM job_transfers WHERE id = 1;")
print("Final:", out2)
