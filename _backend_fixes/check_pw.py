f = open('/srv/www/htdocs/swiftapp/server/.env')
for line in f:
    if 'DB_PASS' in line:
        print('RAW:', repr(line))
        parts = line.strip().split('=', 1)
        pw = parts[1] if len(parts) > 1 else '?'
        print('PASSWORD:', repr(pw))
        print('LEN:', len(pw))
f.close()
