import subprocess, sys

DB_ARGS = ['-hlocalhost', '-uswiftapp_user', '-pU%Xgxvc54EKUD39PcwNAYvuS', 'swiftapp']
NEW_PASSWORD = 'NerdTest2026!'

def query(sql):
    p = subprocess.Popen(['mysql'] + DB_ARGS, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    out, err = p.communicate(input=sql.encode('utf-8'))
    return (out or b'').decode('utf-8', errors='replace'), err.decode('utf-8', errors='replace')

# Generate bcrypt hash via node
r = subprocess.run(
    ['node', '-e',
     "const b=require('/srv/www/htdocs/swiftapp/server/node_modules/bcrypt');"
     "b.hash('" + NEW_PASSWORD + "',10).then(h=>{process.stdout.write(h)})"],
    stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=15
)
if r.returncode != 0 or not r.stdout.decode().startswith('$2'):
    print("bcrypt error:", r.stderr.decode()[:200])
    sys.exit(1)

hashed = r.stdout.decode().strip()
print(f"New hash: {hashed[:20]}...")

out, err = query(f"UPDATE users SET password_hash = '{hashed}' WHERE email = 'admin.test@nerd-test.com';")
if 'ERROR' in err.upper():
    print("DB error:", err)
    sys.exit(1)

print(f"Password reset to: {NEW_PASSWORD}")
out, _ = query("SELECT id, email FROM users WHERE email = 'admin.test@nerd-test.com';")
print(out)
