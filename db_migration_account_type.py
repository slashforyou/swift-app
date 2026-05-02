import subprocess

sql = """
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_type ENUM('business_owner','abn_contractor','employee') DEFAULT 'business_owner';
UPDATE users SET account_type = 'employee' WHERE company_role = 'employee' AND account_type = 'business_owner';
"""

import subprocess, sys
result = subprocess.run(
    ["mysql", "-u", "swiftapp_user", "-pU%Xgxvc54EKUD39PcwNAYvuS", "swiftapp", "-e", sql],
    stdout=subprocess.PIPE, stderr=subprocess.PIPE
)
print("stdout:", result.stdout.decode())
print("stderr:", result.stderr.decode())
print("rc:", result.returncode)
