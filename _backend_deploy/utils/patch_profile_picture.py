"""Patch getUserProfile.js to include profile_picture in SQL + response"""
import shutil, datetime

path = '/srv/www/htdocs/swiftapp/server/endPoints/v1/getUserProfile.js'
backup = path + '.bak_' + datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
shutil.copy2(path, backup)
print(f'Backup: {backup}')

with open(path, 'r') as f:
    content = f.read()

# 1. Add profile_picture to the SQL query
old_sql = 'u.avatar_url, u.avatar_url'
new_sql = 'u.avatar_url, u.avatar_url, u.profile_picture'
if 'u.profile_picture' not in content:
    content = content.replace(old_sql, new_sql, 1)
    print('Added profile_picture to SQL query')
else:
    print('profile_picture already in SQL')

# 2. Add profilePicture to the response (after the second avatarId line)
if 'profilePicture' not in content:
    old_line = "avatarId: userData.avatar_url || null,"
    # Find the second occurrence
    first_idx = content.find(old_line)
    if first_idx >= 0:
        second_idx = content.find(old_line, first_idx + len(old_line))
        if second_idx >= 0:
            insert_point = second_idx + len(old_line)
            content = content[:insert_point] + "\n                profilePicture: userData.profile_picture || null," + content[insert_point:]
            print('Added profilePicture to response')
        else:
            # Only one occurrence, add after it
            insert_point = first_idx + len(old_line)
            content = content[:insert_point] + "\n                profilePicture: userData.profile_picture || null," + content[insert_point:]
            print('Added profilePicture to response (after first avatarId)')
else:
    print('profilePicture already in response')

with open(path, 'w') as f:
    f.write(content)

print('Done!')
