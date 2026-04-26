#!/usr/bin/env python3
"""
Inject quest hooks into gamificationEngine.js using sed on the server.
Line numbers from current backup - fresh file without any quest hooks.

Line numbers (0-indexed in sed = 1-indexed):
- require at line 27 (const { connect } = require('../swiftDb');)
- processJobCompleted log at line 331
- processPhotoAdded closing  });  at line 426
- processSignatureCollected closing  });  at line 457
- processNoteAdded closing  });  at line 495
- processReviewSubmitted console.log at line 696
"""
import subprocess

SERVER = 'sushinari'
ENGINE = '/srv/www/htdocs/swiftapp/server/utils/gamificationEngine.js'

# Confirm we're on the right file
result = subprocess.run(['ssh', SERVER, f'wc -l {ENGINE}'], capture_output=True)
print("Lines:", result.stdout.decode().strip())

# Verify the key line numbers
checks = [27, 331, 423, 452, 494, 696]
for line in checks:
    result = subprocess.run(['ssh', SERVER, f'sed -n {line}p {ENGINE}'], capture_output=True)
    print(f"L{line}: {result.stdout.decode(errors='replace').strip()}")

print("\n--- Starting injection ---\n")

# Build a big sed script
# We'll use sed with addresses and a lines to insert (i command)
# Note: on Linux sed, the i command inserts BEFORE the addressed line
# Syntax: sed -i 'Ni\<text>' file  BUT multiline needs multiple commands
# Easier: use python to write a temp sed script file

SED_SCRIPT = r"""
# Add require after line 27 (const { connect } = require...)
27 a\const questEngine = require('./questEngine');

# processJobCompleted: insert quest hook before line 331 (console.log)
330 a\    // Quest engine\
    try {\
      await questEngine.processQuestEvent('user', userId, 'job_completed', conn);\
      if (companyId) await questEngine.processQuestEvent('company', companyId, 'job_completed', conn);\
    } catch (qe) { console.error('[gamificationEngine] quest job_completed:', qe.message); }

# processPhotoAdded: insert before closing });  at line 426
# After "    }" at line 425 and before "  });" at line 426
# We insert after line 425
425 a\    // Quest engine\
    try {\
      await questEngine.processQuestEvent('user', userId, 'photo_added', conn);\
    } catch (qe) { console.error('[gamificationEngine] quest photo_added:', qe.message); }

# processSignatureCollected: insert before closing });  at line 457
456 a\    // Quest engine\
    try {\
      await questEngine.processQuestEvent('user', userId, 'signature_collected', conn);\
    } catch (qe) { console.error('[gamificationEngine] quest signature_collected:', qe.message); }

# processNoteAdded: insert before closing });  after if (inserted)... now at 494
# Since we added lines, line 494 shifts. But sed processes sequentially and line addresses shift for -i
# We'll just use the content as anchor instead... Actually let's just run sed with a separate command
"""

# Actually sed line numbers shift after each insertion. Let's do inserts from BOTTOM to TOP
# so line numbers don't change before we get to them.
# Order: 696, 495, 457, 426, 331, 27 (reverse)

# The sed 'a' command appends AFTER the line
# So to insert a block BEFORE line N, we append AFTER line N-1

# Build commands in reverse order to avoid line number shifting
insertions = [
    # (line_AFTER_which_to_insert, text_to_insert)
    # process insertions from bottom to top
    (695,  # before review console.log (line 696)
     "    // Quest engine review\n    for (const { user_id } of crewRows) {\n      try {\n        await questEngine.processQuestEvent('user', user_id, 'review_submitted', conn);\n      } catch (qe) { console.error('[gamificationEngine] quest review_submitted:', qe.message); }\n    }"),
    (493,  # before note closing (line 494 is if inserted..., 495 is  });)
     "    // Quest engine\n    try {\n      await questEngine.processQuestEvent('user', userId, 'note_added', conn);\n    } catch (qe) { console.error('[gamificationEngine] quest note_added:', qe.message); }"),
    (455,  # before sig closing  });  at 456? Let's verify
     "    // Quest engine\n    try {\n      await questEngine.processQuestEvent('user', userId, 'signature_collected', conn);\n    } catch (qe) { console.error('[gamificationEngine] quest signature_collected:', qe.message); }"),
    (424,  # before photo closing (  });  at 426, but after the    } at 425)
     "    // Quest engine\n    try {\n      await questEngine.processQuestEvent('user', userId, 'photo_added', conn);\n    } catch (qe) { console.error('[gamificationEngine] quest photo_added:', qe.message); }"),
    (330,  # before job console.log at 331
     "    // Quest engine\n    try {\n      await questEngine.processQuestEvent('user', userId, 'job_completed', conn);\n      if (companyId) await questEngine.processQuestEvent('company', companyId, 'job_completed', conn);\n    } catch (qe) { console.error('[gamificationEngine] quest job_completed:', qe.message); }"),
    (27,   # after require line 27
     "const questEngine = require('./questEngine');"),
]

# Apply each insertion via Python: read file, insert, write to temp, SCP
# Read current file
result = subprocess.run(['ssh', SERVER, f'cat {ENGINE}'], capture_output=True)
content_bytes = result.stdout
if not content_bytes:
    print("ERROR: empty file read from server")
    exit(1)

lines = content_bytes.decode('utf-8', errors='replace').split('\n')
original_count = len(lines)
print(f"Read {original_count} lines from server")

# Apply all insertions from top to bottom (since we're working with the list)
# BUT we need to do them top to bottom to maintain correct indices
# After each insertion, adjust subsequent indices
offset = 0
# Sort by line number ascending
insertions_sorted = sorted(insertions, key=lambda x: x[0])

for (line_after, text) in insertions_sorted:
    adjusted_idx = line_after + offset  # 0-based index = line_after - 1 + offset, but since we insert AFTER, idx = line_after
    insert_lines = text.split('\n')
    lines[adjusted_idx:adjusted_idx] = [''] * 0  # no-op
    # Insert AFTER line_after (1-based), so after index line_after-1+offset
    insert_pos = line_after + offset  # insert_pos is the 0-based position AFTER which we insert
    for i, new_line in enumerate(insert_lines):
        lines.insert(insert_pos + i, new_line)
    offset += len(insert_lines)
    print(f"Inserted {len(insert_lines)} lines after original line {line_after} (now at {insert_pos})")

new_content = '\n'.join(lines)

# Write to local temp file
with open('gamificationEngine_final.js', 'w', encoding='utf-8') as f:
    f.write(new_content)

print(f"Written to gamificationEngine_final.js ({len(lines)} lines)")

# Verify questEngine refs
quest_count = new_content.count('questEngine')
print(f"questEngine occurrences: {quest_count}")

# Backup
result = subprocess.run(
    ['ssh', SERVER, f'cp {ENGINE} {ENGINE}.bak_before_quest_final'],
    capture_output=True
)
print("Backup:", result.returncode)

# SCP
result = subprocess.run(
    ['scp', 'gamificationEngine_final.js', f'{SERVER}:{ENGINE}'],
    capture_output=True
)
print("SCP:", result.returncode)

# Validate syntax
result = subprocess.run(
    ['ssh', SERVER, f'node -c {ENGINE} && echo SYNTAX_OK'],
    capture_output=True
)
print("Syntax:", result.stdout.decode().strip(), result.stderr.decode()[:200])

# Verify quest hook count
result = subprocess.run(
    ['ssh', SERVER, f'grep -c "questEngine" {ENGINE}'],
    capture_output=True
)
print("questEngine refs on server:", result.stdout.decode().strip())
