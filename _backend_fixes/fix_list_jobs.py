path = '/srv/www/htdocs/swiftapp/server/endPoints/v1/listJobs.js'
with open(path, 'r') as f:
    content = f.read()

# Remove the incorrect can_respond_transfer that uses job.recipient_company_id
# Pattern exact avec 10 espaces d'indentation (vu dans le debug)
old = ("','accepted','in-progress'].includes(job.status),\n"
       "          can_cancel_transfer: isOwner,\n"
       "          can_respond_transfer: !isOwner && !!userCompanyId && parseInt(job.recipient_company_id || 0) === parseInt(userCompanyId)")

new = ("','accepted','in-progress'].includes(job.status),\n"
       "          can_cancel_transfer: isOwner,\n"
       "          can_respond_transfer: false")

if old in content:
    content = content.replace(old, new, 1)
    with open(path, 'w') as f:
        f.write(content)
    print('OK can_respond_transfer fixed in listJobs')
else:
    idx = content.find('can_respond_transfer')
    print('PATTERN NOT FOUND. Context:')
    print(repr(content[max(0,idx-100):idx+200]))
