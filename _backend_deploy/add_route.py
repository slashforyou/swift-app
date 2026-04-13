import sys

with open('/srv/www/htdocs/swiftapp/server/index.js', 'r') as f:
    content = f.read()

marker = "stripeOnboarding.submitDocument);"
idx = content.find(marker)
if idx == -1:
    print("ERROR: marker not found")
    sys.exit(1)

insert_pos = idx + len(marker)
new_route = "\n  app.post('/swift-app/v1/stripe/onboarding/document-attach', authenticateToken, resolveStripeMode, stripeOnboarding.submitDocumentAttach);"

content = content[:insert_pos] + new_route + content[insert_pos:]

with open('/srv/www/htdocs/swiftapp/server/index.js', 'w') as f:
    f.write(content)

print("Route added successfully")
