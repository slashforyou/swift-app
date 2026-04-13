import sys

path = '/srv/www/htdocs/swiftapp/server/endPoints/v1/stripe/connect.js'
with open(path, 'r') as f:
    lines = f.readlines()

# Find the block we need to fix (around line 449-462)
# Show context first
print("Current status block:")
for i in range(447, min(466, len(lines))):
    print(f"  {i+1}: {lines[i].rstrip()}")

# Build the fixed block - find start (if (!account.details_submitted)) and end (res.json)
start_idx = None
end_idx = None
for i in range(440, min(470, len(lines))):
    line = lines[i].strip()
    if 'if (!account.details_submitted)' in line:
        start_idx = i
    if start_idx and line == '}' and i > start_idx + 3:
        # Check if next non-empty line is res.json or blank
        next_real = i + 1
        while next_real < len(lines) and lines[next_real].strip() == '':
            next_real += 1
        if next_real < len(lines) and 'res.json' in lines[next_real]:
            end_idx = i
            break

if start_idx is None:
    print("ERROR: Could not find start of status block")
    sys.exit(1)

print(f"\nFound block at lines {start_idx+1} to {end_idx+1}")

# Replace the block
new_block = [
    '    if (!account.details_submitted) {\n',
    '      accountStatus = "incomplete";\n',
    '    } else if (disabledReason && (currentlyDue.length > 0 || pastDue.length > 0)) {\n',
    '      accountStatus = "restricted";\n',
    '    } else if (disabledReason) {\n',
    '      accountStatus = "pending_verification";\n',
    '    } else if (account.charges_enabled && account.payouts_enabled) {\n',
    '      accountStatus = "active";\n',
    '    } else {\n',
    '      accountStatus = "pending_verification";\n',
    '    }\n',
]

lines[start_idx:end_idx+1] = new_block

with open(path, 'w') as f:
    f.writelines(lines)

print("\nFixed! New block:")
for i, line in enumerate(new_block):
    print(f"  {start_idx+i+1}: {line.rstrip()}")
