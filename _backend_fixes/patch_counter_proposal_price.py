"""Add proposed_price support to counterProposal.js"""
import shutil
from datetime import datetime

path = '/srv/www/htdocs/swiftapp/server/endPoints/v1/jobs/counterProposal.js'
with open(path, 'r') as f:
    content = f.read()

if 'proposed_price' in content:
    print('Already patched.')
    exit(0)

backup = path + f'.bak_{datetime.now().strftime("%Y%m%d_%H%M%S")}'
shutil.copy2(path, backup)
print(f'Backup: {backup}')

original = content

# PATCH 1: Extract proposed_price from body
old1 = "    const { proposed_start, proposed_end, note } = req.body;"
new1 = "    const { proposed_start, proposed_end, note, proposed_price } = req.body;"

# PATCH 2: INSERT into job_counter_proposals - add price column
old2 = (
    "      const [insertResult] = await connection.execute(\n"
    "        `INSERT INTO job_counter_proposals\n"
    "           (job_id, contractor_company_id, proposed_start, proposed_end, note, status, created_at)\n"
    "         VALUES (?, ?, ?, ?, ?, 'pending', NOW())`,\n"
    "        [jobId, companyId, proposed_start, proposed_end, note || null]\n"
    "      );"
)
new2 = (
    "      const [insertResult] = await connection.execute(\n"
    "        `INSERT INTO job_counter_proposals\n"
    "           (job_id, contractor_company_id, proposed_start, proposed_end, proposed_price, note, status, created_at)\n"
    "         VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW())`,\n"
    "        [jobId, companyId, proposed_start, proposed_end,\n"
    "          proposed_price != null ? parseFloat(proposed_price) : null,\n"
    "          note || null]\n"
    "      );"
)

# PATCH 3: UPDATE jobs - add counter_proposed_price
old3 = (
    "    await connection.execute(\n"
    "      `UPDATE jobs\n"
    "       SET assignment_status = 'negotiating',\n"
    "           counter_proposed_start = ?,\n"
    "           counter_proposed_end   = ?,\n"
    "           counter_proposal_note  = ?,\n"
    "           counter_proposed_at    = NOW(),\n"
    "           counter_proposed_by    = ?\n"
    "       WHERE id = ?`,\n"
    "      [proposed_start, proposed_end, note || null, userId, jobId]\n"
    "    );"
)
new3 = (
    "    const priceVal = proposed_price != null ? parseFloat(proposed_price) : null;\n"
    "    await connection.execute(\n"
    "      `UPDATE jobs\n"
    "       SET assignment_status = 'negotiating',\n"
    "           counter_proposed_start = ?,\n"
    "           counter_proposed_end   = ?,\n"
    "           counter_proposed_price = ?,\n"
    "           counter_proposal_note  = ?,\n"
    "           counter_proposed_at    = NOW(),\n"
    "           counter_proposed_by    = ?\n"
    "       WHERE id = ?`,\n"
    "      [proposed_start, proposed_end, priceVal, note || null, userId, jobId]\n"
    "    );"
)

patches = [
    ('Extract proposed_price from body', old1, new1),
    ('INSERT job_counter_proposals with price', old2, new2),
    ('UPDATE jobs with counter_proposed_price', old3, new3),
]

for label, old, new in patches:
    if old in content:
        content = content.replace(old, new, 1)
        print(f'  OK: {label}')
    else:
        print(f'  NOT FOUND: {label}')

if content != original:
    with open(path, 'w') as f:
        f.write(content)
    print('File written.')
else:
    print('No changes.')
