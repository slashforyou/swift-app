"""Fix PATCH 2: Add LEFT JOIN companies c_contractee using exact anchor"""
import shutil
from datetime import datetime

path = '/srv/www/htdocs/swiftapp/server/endPoints/calendarDays.js'
with open(path, 'r') as f:
    content = f.read()

if 'c_contractee ON c_contractee.id' in content:
    print('Already patched.')
    exit(0)

backup = path + f'.bak_join2_{datetime.now().strftime("%Y%m%d_%H%M%S")}'
shutil.copy2(path, backup)

# Exact anchor from the file (with trailing spaces seen in context)
old = 'LEFT JOIN trucks t ON jt.truck_id = t.id\n                   \n            LEFT JOIN job_transfers jtransfers'
new = ('LEFT JOIN trucks t ON jt.truck_id = t.id\n'
       '                    LEFT JOIN companies c_contractee ON c_contractee.id = j.contractee_company_id\n'
       '                   \n            LEFT JOIN job_transfers jtransfers')

if old in content:
    content = content.replace(old, new, 1)
    with open(path, 'w') as f:
        f.write(content)
    print('OK - companies JOIN added')
else:
    # Debug: find the trucks JOIN and print surrounding bytes
    idx = content.find('LEFT JOIN trucks t ON jt.truck_id = t.id')
    print(f'Trucks JOIN at {idx}')
    print(repr(content[idx:idx+120]))
