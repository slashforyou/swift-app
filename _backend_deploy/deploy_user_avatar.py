"""
Deploy user avatar upload endpoint to server.
Copies the endpoint file and injects routes into index.js.
"""
import shutil, datetime

SERVER = '/srv/www/htdocs/swiftapp/server'

# 1. Copy the endpoint file
endpoint_src = '/tmp/uploadUserAvatar.js'
endpoint_dst = f'{SERVER}/endPoints/v1/uploadUserAvatar.js'
shutil.copy2(endpoint_src, endpoint_dst)
print(f'✅ Copied endpoint to {endpoint_dst}')

# 2. Inject routes into index.js
index_path = f'{SERVER}/index.js'
backup = index_path + '.bak_avatar_' + datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
shutil.copy2(index_path, backup)
print(f'📦 Backup: {backup}')

with open(index_path, 'r') as f:
    content = f.read()

# Check if already added
if 'uploadUserAvatar' in content:
    print('⚠️ Avatar routes already exist in index.js — skipping')
else:
    # Find the uploadCompanyLogo require and route lines
    # Add avatar routes right after them
    inject_require = '''const { uploadUserAvatarEndpoint, deleteUserAvatarEndpoint } = require('./endPoints/v1/uploadUserAvatar');'''

    inject_routes = '''
// User avatar upload
app.post('/swift-app/v1/user/avatar', authenticateToken, upload.single('avatar'), uploadUserAvatarEndpoint);
app.delete('/swift-app/v1/user/avatar', authenticateToken, deleteUserAvatarEndpoint);'''

    # Strategy: inject require after the uploadCompanyLogo require
    if 'uploadCompanyLogoEndpoint' in content:
        anchor_require = "require('./endPoints/v1/uploadCompanyLogo');"
        content = content.replace(
            anchor_require,
            anchor_require + '\n' + inject_require,
            1
        )
    else:
        # Fallback: add require near top
        anchor_require = "const express = require('express');"
        content = content.replace(
            anchor_require,
            anchor_require + '\n' + inject_require,
            1
        )

    # Strategy: inject routes after the company logo route
    if "company/:companyId/logo" in content:
        # Find the logo route line and add after it
        lines = content.split('\n')
        new_lines = []
        for line in lines:
            new_lines.append(line)
            if 'company/:companyId/logo' in line and 'uploadCompanyLogoEndpoint' in line:
                new_lines.append(inject_routes)
        content = '\n'.join(new_lines)
    else:
        # Fallback: add before the 404 handler
        if "404" in content:
            content = content.replace(
                "// 404 handler",
                inject_routes + "\n\n// 404 handler",
                1
            )

    with open(index_path, 'w') as f:
        f.write(content)
    print('✅ Routes injected into index.js')

# 3. Create uploads/avatars directory
import os
avatars_dir = f'{SERVER}/uploads/avatars'
os.makedirs(avatars_dir, exist_ok=True)
print(f'✅ Created {avatars_dir}')

# 4. Ensure profile_picture column in users table (will be done by endpoint too)
print('\n✅ Done! Restart PM2 to apply changes.')
