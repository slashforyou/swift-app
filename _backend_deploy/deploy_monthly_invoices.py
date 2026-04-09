"""
Deploy monthly invoices feature
1. Run migration 028 (monthly_invoices + monthly_invoice_items tables)
2. Deploy endpoint file
3. Deploy cron file
4. Inject routes into index.js
5. Install node-cron if needed
6. Restart PM2
"""

import paramiko, os

SERVER = "82.165.49.120"
USER = "root"
SERVER_DIR = "/srv/www/htdocs/swiftapp/server"
LOCAL_DIR = os.path.dirname(os.path.abspath(__file__))


def get_ssh():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(SERVER, username=USER)
    return ssh


def run(ssh, cmd, label=""):
    if label:
        print(f"\n🔧 {label}")
    print(f"  $ {cmd}")
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    if out:
        print(f"  ✅ {out[:500]}")
    if err and "warning" not in err.lower():
        print(f"  ⚠️  {err[:500]}")
    return out


def upload(ssh, local_path, remote_path):
    sftp = ssh.open_sftp()
    print(f"  📤 {os.path.basename(local_path)} → {remote_path}")
    sftp.put(local_path, remote_path)
    sftp.close()


def main():
    ssh = get_ssh()

    # 1. Run migration
    print("\n" + "=" * 60)
    print("STEP 1: Run migration 028")
    print("=" * 60)

    migration_sql = os.path.join(LOCAL_DIR, "migrations", "028_create_monthly_invoices.sql")
    upload(ssh, migration_sql, "/tmp/028_create_monthly_invoices.sql")
    run(
        ssh,
        f'cd {SERVER_DIR} && mysql -u"$DB_USER" -p"$DB_PASS" "$DB_DATABASE" < /tmp/028_create_monthly_invoices.sql',
        "Running migration 028",
    )

    # 2. Deploy endpoint file
    print("\n" + "=" * 60)
    print("STEP 2: Deploy monthlyInvoices.js endpoint")
    print("=" * 60)

    endpoint_file = os.path.join(LOCAL_DIR, "endPoints", "v1", "billing", "monthlyInvoices.js")
    remote_billing_dir = f"{SERVER_DIR}/endPoints/v1/billing"
    run(ssh, f"mkdir -p {remote_billing_dir}", "Ensuring billing directory exists")
    upload(ssh, endpoint_file, f"{remote_billing_dir}/monthlyInvoices.js")

    # 3. Deploy cron file
    print("\n" + "=" * 60)
    print("STEP 3: Deploy monthlyInvoiceCron.js")
    print("=" * 60)

    cron_file = os.path.join(LOCAL_DIR, "cron", "monthlyInvoiceCron.js")
    remote_cron_dir = f"{SERVER_DIR}/cron"
    run(ssh, f"mkdir -p {remote_cron_dir}", "Ensuring cron directory exists")
    upload(ssh, cron_file, f"{remote_cron_dir}/monthlyInvoiceCron.js")

    # 4. Install node-cron
    print("\n" + "=" * 60)
    print("STEP 4: Install node-cron")
    print("=" * 60)

    run(ssh, f"cd {SERVER_DIR} && npm list node-cron 2>/dev/null || npm install node-cron", "Install node-cron if needed")

    # 5. Inject routes into index.js
    print("\n" + "=" * 60)
    print("STEP 5: Inject routes into index.js")
    print("=" * 60)

    INDEX_FILE = f"{SERVER_DIR}/index.js"

    # Check if already injected
    out = run(ssh, f'grep -c "monthlyInvoices" {INDEX_FILE} || echo "0"', "Checking existing routes")

    if out.strip() != "0":
        print("  ⏭️  Monthly invoice routes already injected")
    else:
        # Find the 404 handler or the last route block and inject before it
        ROUTES_CODE = r"""

// === Monthly Invoice Routes ===
const { generateMonthlyInvoice, listMonthlyInvoices, getMonthlyInvoice, updateMonthlyInvoice, sendMonthlyInvoice } = require('./endPoints/v1/billing/monthlyInvoices');
app.post('/v1/billing/monthly-invoices/generate', authenticateToken, async (req, res) => generateMonthlyInvoice(req, res));
app.get('/v1/billing/monthly-invoices', authenticateToken, async (req, res) => listMonthlyInvoices(req, res));
app.get('/v1/billing/monthly-invoices/:id', authenticateToken, async (req, res) => getMonthlyInvoice(req, res));
app.patch('/v1/billing/monthly-invoices/:id', authenticateToken, async (req, res) => updateMonthlyInvoice(req, res));
app.post('/v1/billing/monthly-invoices/:id/send', authenticateToken, async (req, res) => sendMonthlyInvoice(req, res));
logger.info('BILLING', 'Routes Monthly Invoices activées');

// === Cron Jobs ===
require('./cron/monthlyInvoiceCron');
"""
        # Escape for sed
        escaped = ROUTES_CODE.replace("'", "'\\''").replace("\n", "\\n")

        # Find the inter-contractor billing marker or 404 handler
        marker_check = run(ssh, f'grep -n "inter-contractor" {INDEX_FILE} | tail -1', "Finding injection point")

        if marker_check:
            line_num = marker_check.split(":")[0]
            # Use python to inject after the last inter-contractor line + 2
            inject_line = int(line_num) + 2
            print(f"  📍 Injecting after line {inject_line}")
        else:
            # Fallback: find 404 handler
            marker_check2 = run(ssh, f'grep -n "404" {INDEX_FILE} | head -1', "Finding 404 handler")
            if marker_check2:
                inject_line = int(marker_check2.split(":")[0]) - 1
            else:
                inject_line = None

        if inject_line:
            # Use a heredoc approach for clean injection
            run(
                ssh,
                f"""cd {SERVER_DIR} && python3 -c "
lines = open('index.js','r').read().split('\\n')
inject = '''
# === Monthly Invoice Routes ===
const {{ generateMonthlyInvoice, listMonthlyInvoices, getMonthlyInvoice, updateMonthlyInvoice, sendMonthlyInvoice }} = require('./endPoints/v1/billing/monthlyInvoices');
app.post('/v1/billing/monthly-invoices/generate', authenticateToken, async (req, res) => generateMonthlyInvoice(req, res));
app.get('/v1/billing/monthly-invoices', authenticateToken, async (req, res) => listMonthlyInvoices(req, res));
app.get('/v1/billing/monthly-invoices/:id', authenticateToken, async (req, res) => getMonthlyInvoice(req, res));
app.patch('/v1/billing/monthly-invoices/:id', authenticateToken, async (req, res) => updateMonthlyInvoice(req, res));
app.post('/v1/billing/monthly-invoices/:id/send', authenticateToken, async (req, res) => sendMonthlyInvoice(req, res));
logger.info('BILLING', 'Routes Monthly Invoices activées');

# === Cron Jobs ===
require('./cron/monthlyInvoiceCron');
'''.replace('#','//').split('\\n')
lines = lines[:{inject_line}] + inject + lines[{inject_line}:]
open('index.js','w').write('\\n'.join(lines))
print('Routes injected at line {inject_line}')
" """,
                "Injecting routes",
            )
        else:
            print("  ❌ Could not find injection point. Manual injection needed.")

    # 6. Restart PM2
    print("\n" + "=" * 60)
    print("STEP 6: Restart PM2")
    print("=" * 60)
    run(ssh, f"cd {SERVER_DIR} && pm2 restart swift-app --update-env", "Restarting PM2")
    run(ssh, f"sleep 2 && pm2 logs swift-app --lines 5 --nostream", "Verifying startup")

    ssh.close()
    print("\n✅ Monthly invoices deployment complete!")


if __name__ == "__main__":
    main()
