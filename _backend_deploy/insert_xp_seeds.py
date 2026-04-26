#!/usr/bin/env python3
import subprocess, sys, tempfile, os

SERVER = "sushinari"
DB_USER = "swiftapp_user"
DB_PASS = "U%Xgxvc54EKUD39PcwNAYvuS"
DB_NAME = "swiftapp"

sql = """INSERT IGNORE INTO gamification_xp_rewards (action_code, action_name, xp_amount, is_active) VALUES
  ('review_submitted',         'Review client soumise',          20,  1),
  ('review_4star_overall',     'Note globale 4 etoiles',         20,  1),
  ('review_5star_overall',     'Note globale 5 etoiles',         40,  1),
  ('review_5star_service',     'Service note 5 etoiles',         15,  1),
  ('review_5star_team',        'Equipe notee 5 etoiles',         15,  1),
  ('staff_5star_rating',       'Staff note 5 etoiles individuel',25,  1),
  ('staff_positive_adjectives','Adjectifs positifs recus',       10,  1),
  ('photo_milestone_5',        '5 photos sur un job',            10,  1),
  ('photo_milestone_10',       '10 photos sur un job',           20,  1),
  ('photo_milestone_20',       '20 photos sur un job',           40,  1),
  ('photo_total_50',           '50 photos cumulees',            100,  1),
  ('photo_total_100',          '100 photos cumulees',           200,  1),
  ('photo_total_500',          '500 photos cumulees',           500,  1);
"""

with tempfile.NamedTemporaryFile("w", suffix=".sql", delete=False, encoding="utf-8") as f:
    f.write(sql)
    tmp = f.name

# Upload
r = subprocess.run(["scp", tmp, f"{SERVER}:/tmp/gamif_seeds2.sql"], capture_output=True)
os.unlink(tmp)
if r.returncode != 0:
    print("SCP failed:", r.stderr.decode())
    sys.exit(1)

# Execute
r2 = subprocess.run(["ssh", SERVER,
    f"mysql -u{DB_USER} '-p{DB_PASS}' {DB_NAME} 2>&1 < /tmp/gamif_seeds2.sql"],
    capture_output=True)
print(r2.stdout.decode())
print(r2.stderr.decode())
if r2.returncode != 0:
    sys.exit(1)

# Verify
r3 = subprocess.run(["ssh", SERVER,
    f"mysql -u{DB_USER} '-p{DB_PASS}' {DB_NAME} 2>/dev/null -e 'SELECT action_code, xp_amount FROM gamification_xp_rewards ORDER BY id'"],
    capture_output=True)
print(r3.stdout.decode())
print("DONE")
