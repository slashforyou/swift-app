#!/usr/bin/env python3
"""
Use sed on server to inject quest hooks at known line numbers.
More reliable than string matching with unicode.
"""
import subprocess

SERVER = 'sushinari'
ENGINE_PATH = '/srv/www/htdocs/swiftapp/server/utils/gamificationEngine.js'

# First, get current line count and find lines just before closing });  of each function
# We know:
# processPhotoAdded ends with:  });  (the one just before POINT D'ENTREE 3 comment)
# processSignatureCollected ends with:  });  (just before POINT D'ENTREE 4 comment)
# processNoteAdded ends with:  });  (just before POINT D'ENTREE 5... line)
# processReviewSubmitted ends with console.log then });  (around line 700-710)

# Check line numbers of key patterns
result = subprocess.run(
    ['ssh', SERVER, 
     f"grep -n 'POINT D.ENTR' {ENGINE_PATH}"],
    capture_output=True
)
print(result.stdout.decode('utf-8', errors='replace'))

result = subprocess.run(
    ['ssh', SERVER, 
     f"grep -n 'questEngine' {ENGINE_PATH}"],
    capture_output=True
)
print("questEngine refs:", result.stdout.decode('utf-8', errors='replace'))

# Find lines of the '  });' just before each section header
# Strategy: use awk to insert after specific patterns

# Photo: inject before the last '  });' of processPhotoAdded
# We know it ends just before the SIGNATURE COLLECTED section
# Let's use line numbers from the grep output

result = subprocess.run(
    ['ssh', SERVER,
     f"grep -n 'ENTREE 3\\|ENTREE 4\\|ENTREE 5\\|total_signatures\\|processNoteAdded\\|xp_distributed' {ENGINE_PATH} | head -20"],
    capture_output=True
)
print(result.stdout.decode('utf-8', errors='replace'))
