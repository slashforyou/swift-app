import shutil, datetime

path = '/etc/nginx/vhosts.d/cobbr-app.com.conf'
backup = path + '.bak_' + datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
shutil.copy2(path, backup)

with open(path, 'r') as f:
    content = f.read()

if '/swift-app' in content:
    print('Already present, skipping')
    exit(0)

anchor = '    location / {'
new_block = """    # Swift App API proxy
    location /swift-app {
        proxy_pass http://localhost:3021;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $host;
        proxy_set_header X-NginX-Proxy true;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
    }

"""

content = content.replace(anchor, new_block + anchor, 1)

with open(path, 'w') as f:
    f.write(content)

print('Injected - backup: ' + backup)
