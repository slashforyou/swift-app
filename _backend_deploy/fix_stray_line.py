with open('/srv/www/htdocs/swiftapp/server/index.js', 'r') as f:
    content = f.read()

# Remove the stray "  app.post(\n" line that's between document-attach and persons routes
old = "stripeOnboarding.submitDocumentAttach);\n  app.post(\n  \n  // "
new = "stripeOnboarding.submitDocumentAttach);\n\n  // "

if old in content:
    content = content.replace(old, new, 1)
    with open('/srv/www/htdocs/swiftapp/server/index.js', 'w') as f:
        f.write(content)
    print("Fixed: removed stray app.post( line")
else:
    print("Pattern not found, trying alternate...")
    # Try with Étape
    old2 = "submitDocumentAttach);\n  app.post(\n"
    if old2 in content:
        content = content.replace(old2, "submitDocumentAttach);\n", 1)
        with open('/srv/www/htdocs/swiftapp/server/index.js', 'w') as f:
            f.write(content)
        print("Fixed with alternate pattern")
    else:
        print("ERROR: could not find pattern to fix")
