#!/usr/bin/env python3
"""
Inject quest engine calls into the remaining 4 functions of gamificationEngine.js.
Uses exact string matching for clean injection.
"""
import subprocess

SERVER = 'sushinari'
ENGINE_PATH = '/srv/www/htdocs/swiftapp/server/utils/gamificationEngine.js'

# Read current file
result = subprocess.run(['ssh', SERVER, f'cat {ENGINE_PATH}'], capture_output=True)
content = result.stdout.decode('utf-8', errors='replace')

print(f"File length: {len(content)} chars")

replacements = [
    # --- processPhotoAdded: inject before closing });  ---
    (
        "        if (mIns) await syncProfileXP('user', userId, xpM, conn);\n      }\n    }\n  });\n}",
        "        if (mIns) await syncProfileXP('user', userId, xpM, conn);\n      }\n    }\n    // Quest engine — photo_added\n    try {\n      await questEngine.processQuestEvent('user', userId, 'photo_added', conn);\n    } catch (qe) { console.error('[gamificationEngine] quest photo_added:', qe.message); }\n  });\n}",
        "Photo quest hook"
    ),
    # --- processSignatureCollected ---
    (
        "    if (inserted) {\n      await syncProfileXP('user', userId, xp, conn);\n      await incrementProfileStat('user', userId, 'total_signatures', 1, conn);\n    }\n  });\n}",
        "    if (inserted) {\n      await syncProfileXP('user', userId, xp, conn);\n      await incrementProfileStat('user', userId, 'total_signatures', 1, conn);\n    }\n    // Quest engine — signature_collected\n    try {\n      await questEngine.processQuestEvent('user', userId, 'signature_collected', conn);\n    } catch (qe) { console.error('[gamificationEngine] quest signature_collected:', qe.message); }\n  });\n}",
        "Signature quest hook"
    ),
    # --- processNoteAdded ---
    (
        "    if (inserted) await syncProfileXP('user', userId, xp, conn);\n  });\n}\n\n// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500// POINT D\u2019ENTR\u00c9E 5 \u2014 REVIEW SUBMITTED",
        "    if (inserted) await syncProfileXP('user', userId, xp, conn);\n    // Quest engine — note_added\n    try {\n      await questEngine.processQuestEvent('user', userId, 'note_added', conn);\n    } catch (qe) { console.error('[gamificationEngine] quest note_added:', qe.message); }\n  });\n}\n\n// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500// POINT D\u2019ENTR\u00c9E 5 \u2014 REVIEW SUBMITTED",
        "Note quest hook"
    ),
]

for old, new, label in replacements:
    if old in content:
        content = content.replace(old, new, 1)
        print(f"[OK] {label}")
    else:
        print(f"[WARN] {label} — pattern not found, trying line-by-line")
        # Try to debug: find what's actually there
        if 'total_signatures' in content and label == 'Signature quest hook':
            idx = content.index('total_signatures')
            print("  Context around total_signatures:", repr(content[idx-20:idx+120]))

# For processReviewSubmitted - inject before the console.log multiline
old_rev = "    console.log(\n      `[gamificationEngine] processReviewSubmitted reviewToken=${reviewTokenId} job=${jobId}`"
new_rev = """    // Quest engine — review_submitted (for each crew member)
    for (const { user_id } of crewRows) {
      try {
        await questEngine.processQuestEvent('user', user_id, 'review_submitted', conn);
      } catch (qe) { console.error('[gamificationEngine] quest review_submitted:', qe.message); }
    }

    console.log(
      `[gamificationEngine] processReviewSubmitted reviewToken=${reviewTokenId} job=${jobId}`"""

if old_rev in content:
    content = content.replace(old_rev, new_rev, 1)
    print("[OK] Review quest hook")
else:
    print("[WARN] Review quest hook — pattern not found")
    # Debug
    if 'processReviewSubmitted reviewToken' in content:
        idx = content.index('processReviewSubmitted reviewToken')
        print("Context:", repr(content[idx-60:idx+100]))

# Write and deploy
with open('gamificationEngine_patched2.js', 'w', encoding='utf-8') as f:
    f.write(content)

result = subprocess.run(
    ['scp', 'gamificationEngine_patched2.js', f'{SERVER}:{ENGINE_PATH}'],
    capture_output=True
)
print("SCP:", result.returncode, result.stderr.decode()[:100] if result.stderr else 'ok')

result = subprocess.run(
    ['ssh', SERVER, f'node -c {ENGINE_PATH} && echo SYNTAX_OK'],
    capture_output=True
)
print("Syntax:", result.stdout.decode().strip(), result.stderr.decode()[:200])
