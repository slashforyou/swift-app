p = '/srv/www/htdocs/swiftapp/server/endPoints/v1/uploadCompanyLogo.js'
with open(p) as f:
    c = f.read()
c = c.replace('/swift-app/uploads/logos/', 'https://altivo.fr/swift-app/uploads/logos/')
with open(p, 'w') as f:
    f.write(c)
print('Done - URL updated to absolute')
