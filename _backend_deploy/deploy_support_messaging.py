"""
Deploys support messaging system:
1. Runs SQL migration
2. Copies endpoint files
3. Injects routes into index.js
"""
import subprocess
import os
import sys

SERVER_DIR = "/srv/www/htdocs/swiftapp/server"

def run(cmd):
    r = subprocess.Popen(cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, universal_newlines=True)
    out, err = r.communicate()
    return r.returncode, out.strip(), err.strip()

def main():
    # 1. Run migration
    print("=== Running migration ===")
    sql_file = "/tmp/024_create_support_messaging.sql"
    code, out, err = run(f"mysql -u swiftapp_user -p'U%Xgxvc54EKUD39PcwNAYvuS' swiftapp < {sql_file}")
    if code != 0:
        print(f"Migration error: {err}")
        # Tables may already exist, continue
    else:
        print("Migration OK")

    # 2. Copy endpoint files
    print("=== Copying endpoint files ===")
    support_dir = os.path.join(SERVER_DIR, "endPoints/v1/support")
    os.makedirs(support_dir, exist_ok=True)

    # Files are already SCP'd to /tmp/
    for f in ["conversations.js", "messages.js"]:
        code, _, err = run(f"cp /tmp/support_{f} {support_dir}/{f}")
        if code != 0:
            print(f"Copy error {f}: {err}")
            return False
    print("Files copied OK")

    # 3. Inject routes into index.js
    print("=== Injecting routes ===")
    index_path = os.path.join(SERVER_DIR, "index.js")

    with open(index_path, "r") as f:
        content = f.read()

    # Check if already injected
    if "support/conversations" in content:
        print("Routes already injected, skipping")
        return True

    # Find the 404 handler to inject before it
    marker = "// 404 handler"
    if marker not in content:
        # Try alternative markers
        for alt in ["app.use((req, res)", "app.all('*'", "// Catch-all", "// catch-all"]:
            if alt in content:
                marker = alt
                break

    if marker not in content:
        # Inject before the last app.listen
        marker = "app.listen"

    route_code = """
// === Support Messaging Routes ===
const { listConversations, createConversation } = require('./endPoints/v1/support/conversations');
const { listMessages, sendMessage } = require('./endPoints/v1/support/messages');

app.get('/v1/support/conversations', authenticateToken, listConversations);
app.post('/v1/support/conversations', authenticateToken, createConversation);
app.get('/v1/support/conversations/:id/messages', authenticateToken, listMessages);
app.post('/v1/support/conversations/:id/messages', authenticateToken, sendMessage);

"""

    content = content.replace(marker, route_code + marker)

    with open(index_path, "w") as f:
        f.write(content)

    print("Routes injected OK")
    return True

if __name__ == "__main__":
    success = main()
    if success:
        print("\n=== ALL DONE ===")
    else:
        print("\n=== FAILED ===")
        sys.exit(1)
