#!/usr/bin/env python3
"""Remove duplicate sync block by finding and removing the second occurrence"""
import re

f = '/srv/www/htdocs/swiftapp/server/endPoints/v1/stripe/onboarding.js'
with open(f, 'r') as fh:
    content = fh.read()

# Count occurrences of "if (url) syncFields.website = url"
pattern = "if (url) syncFields.website = url"
count = content.count(pattern)
print(f"Found {count} occurrences of website sync pattern")

if count > 1:
    # Find the second occurrence and remove the entire block around it
    first_pos = content.find(pattern)
    second_pos = content.find(pattern, first_pos + 1)
    
    # Find the start of the second sync block (go back to find "// Sync Stripe")
    block_start = content.rfind("// Sync Stripe data to companies table", 0, second_pos)
    # Find the end of the second sync block (find the closing "}")  
    # The block ends with "    }\n\n" after the catch
    
    # From block_start, find the end pattern
    block_text_from = content[block_start:]
    # Find the 2nd closing brace of catch block
    end_marker = "console.warn('[Stripe->Company] Sync failed (non-critical):', syncErr.message);\n    }\n"
    end_pos_in_block = block_text_from.find(end_marker)
    if end_pos_in_block >= 0:
        block_end = block_start + end_pos_in_block + len(end_marker)
        # Remove the duplicate block (including leading newlines)
        # Also eat any trailing blank line
        while block_end < len(content) and content[block_end] == '\n':
            block_end += 1
        removed = content[block_start:block_end]
        content = content[:block_start] + content[block_end:]
        print(f"Removed duplicate block ({len(removed)} chars)")
        
        with open(f, 'w') as fh:
            fh.write(content)
        print("DEDUP_DONE")
    else:
        print("Could not find end of duplicate block")
elif count == 1:
    print("Only 1 occurrence, no duplicates to remove")
else:
    print("Pattern not found at all")
