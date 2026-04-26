#!/usr/bin/env python3
"""
Patch gamificationEngine.js to call questEngine.processQuestEvent after each action.
Uses sed/awk on the server to inject the require and calls.
"""
import subprocess

SERVER = 'sushinari'
ENGINE_PATH = '/srv/www/htdocs/swiftapp/server/utils/gamificationEngine.js'
QUEST_ENGINE_PATH = '/srv/www/htdocs/swiftapp/server/utils/questEngine.js'

# Check if already patched
result = subprocess.run(
    ['ssh', SERVER, f"grep -n 'questEngine' {ENGINE_PATH} | head -5"],
    capture_output=True
)
stdout = result.stdout.decode('utf-8', errors='replace')
print("Already patched?", stdout.strip())

if 'questEngine' in stdout:
    print("Already patched, skipping.")
else:
    # Patch approach: upload modified version
    # First, read current file
    result = subprocess.run(
        ['ssh', SERVER, f'cat {ENGINE_PATH}'],
        capture_output=True
    )
    content = result.stdout.decode('utf-8', errors='replace')

    # 1. Add require after the existing const { connect } = require line
    old_require = "const { connect } = require('../swiftDb');"
    new_require = """const { connect } = require('../swiftDb');
const questEngine = require('./questEngine');"""
    
    if old_require in content:
        content = content.replace(old_require, new_require, 1)
        print("Injected questEngine require")
    else:
        print("ERROR: could not find require line")
        print("First 50 chars:", repr(content[:200]))
        exit(1)

    # 2. After processJobCompleted awards XP to user, call quest engine
    # Find the console.log at end of processJobCompleted and inject before it
    old_log_job = "    console.log(`[gamificationEngine] processJobCompleted job=${jobId} user=${userId} comp=${companyId}`);"
    new_log_job = """    // Quest engine — job_completed
    try {
      await questEngine.processQuestEvent('user', userId, 'job_completed', conn);
      if (companyId) await questEngine.processQuestEvent('company', companyId, 'job_completed', conn);
    } catch (qe) { console.error('[gamificationEngine] quest job_completed:', qe.message); }

    console.log(`[gamificationEngine] processJobCompleted job=${jobId} user=${userId} comp=${companyId}`);"""
    
    if old_log_job in content:
        content = content.replace(old_log_job, new_log_job, 1)
        print("Injected job_completed quest hook")
    else:
        print("WARNING: could not find job_completed log line, searching...")
        # Try to find similar
        for line in content.splitlines():
            if 'processJobCompleted' in line and 'console.log' in line:
                print("Found:", repr(line))
        print("Continuing without job_completed quest hook patch")

    # 3. After processPhotoAdded - find the console.log
    old_log_photo = "    console.log(`[gamificationEngine] processPhotoAdded job=${jobId} user=${userId} img=${imageId}`);"
    new_log_photo = """    // Quest engine — photo_added
    try {
      await questEngine.processQuestEvent('user', userId, 'photo_added', conn);
    } catch (qe) { console.error('[gamificationEngine] quest photo_added:', qe.message); }

    console.log(`[gamificationEngine] processPhotoAdded job=${jobId} user=${userId} img=${imageId}`);"""
    
    if old_log_photo in content:
        content = content.replace(old_log_photo, new_log_photo, 1)
        print("Injected photo_added quest hook")
    else:
        print("WARNING: could not find photo_added console.log. Searching...")
        for line in content.splitlines():
            if 'processPhotoAdded' in line and 'console.log' in line:
                print("Found:", repr(line))

    # 4. processNoteAdded
    old_log_note = "    console.log(`[gamificationEngine] processNoteAdded job=${jobId} user=${userId} note=${noteId}`);"
    new_log_note = """    // Quest engine — note_added
    try {
      await questEngine.processQuestEvent('user', userId, 'note_added', conn);
    } catch (qe) { console.error('[gamificationEngine] quest note_added:', qe.message); }

    console.log(`[gamificationEngine] processNoteAdded job=${jobId} user=${userId} note=${noteId}`);"""
    
    if old_log_note in content:
        content = content.replace(old_log_note, new_log_note, 1)
        print("Injected note_added quest hook")
    else:
        print("WARNING: note_added log line not found")
        for line in content.splitlines():
            if 'processNoteAdded' in line and 'console.log' in line:
                print("Found:", repr(line))

    # 5. processSignatureCollected
    old_log_sig = "    console.log(`[gamificationEngine] processSignatureCollected job=${jobId} user=${userId} sig=${signatureId}`);"
    new_log_sig = """    // Quest engine — signature_collected
    try {
      await questEngine.processQuestEvent('user', userId, 'signature_collected', conn);
    } catch (qe) { console.error('[gamificationEngine] quest signature_collected:', qe.message); }

    console.log(`[gamificationEngine] processSignatureCollected job=${jobId} user=${userId} sig=${signatureId}`);"""
    
    if old_log_sig in content:
        content = content.replace(old_log_sig, new_log_sig, 1)
        print("Injected signature_collected quest hook")
    else:
        print("WARNING: signature_collected log line not found")
        for line in content.splitlines():
            if 'processSignatureCollected' in line and 'console.log' in line:
                print("Found:", repr(line))

    # 6. processReviewSubmitted
    old_log_rev = "    console.log(`[gamificationEngine] processReviewSubmitted review=${reviewTokenId} job=${jobId}`);"
    new_log_rev = """    // Quest engine — review_submitted
    for (const { user_id } of crewRows) {
      try {
        await questEngine.processQuestEvent('user', user_id, 'review_submitted', conn);
      } catch (qe) { console.error('[gamificationEngine] quest review_submitted:', qe.message); }
    }

    console.log(`[gamificationEngine] processReviewSubmitted review=${reviewTokenId} job=${jobId}`);"""
    
    if old_log_rev in content:
        content = content.replace(old_log_rev, new_log_rev, 1)
        print("Injected review_submitted quest hook")
    else:
        print("WARNING: review_submitted log line not found")
        for line in content.splitlines():
            if 'processReviewSubmitted' in line and 'console.log' in line:
                print("Found:", repr(line))

    # Write patched file
    with open('gamificationEngine_patched.js', 'w', encoding='utf-8') as f:
        f.write(content)

    # Backup original on server
    result = subprocess.run(
        ['ssh', SERVER, f'cp {ENGINE_PATH} {ENGINE_PATH}.bak_quest_{__import__("datetime").datetime.now().strftime("%Y%m%d_%H%M%S")}'],
        capture_output=True
    )
    print("Backup:", result.returncode)

    # SCP patched file
    result = subprocess.run(
        ['scp', 'gamificationEngine_patched.js', f'{SERVER}:{ENGINE_PATH}'],
        capture_output=True
    )
    print("SCP:", result.returncode, result.stderr.decode()[:100] if result.stderr else 'ok')

    # Validate syntax
    result = subprocess.run(
        ['ssh', SERVER, f'node -c {ENGINE_PATH} && echo SYNTAX_OK'],
        capture_output=True
    )
    print("Syntax:", result.stdout.decode().strip(), result.stderr.decode()[:100])
