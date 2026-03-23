path = "/srv/www/htdocs/swiftapp/server/endPoints/v1/createJob.js"
with open(path, "r") as f:
    content = f.read()

original = content

content = content.replace(
    "SELECT id FROM job_users WHERE job_id = ? AND user_id = ? LIMIT 1",
    "SELECT 1 FROM job_users WHERE job_id = ? AND user_id = ? LIMIT 1"
)

content = content.replace(
    "[jobId, user.id, 'crew', 0]",
    "[jobId, user.id, 'manager', 0]"
)

if content == original:
    print("WARNING: No changes made - strings not found")
else:
    with open(path, "w") as f:
        f.write(content)
    print("OK: createJob.js patched")

lines = content.split("\n")
for i, line in enumerate(lines, 1):
    if 332 <= i <= 358:
        print(str(i) + ": " + line.rstrip())
