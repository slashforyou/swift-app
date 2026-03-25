#!/usr/bin/env python3
"""Test the feedback endpoint."""
import json
import subprocess

TOKEN = "ea4c3634303782a9ffe3f19cbba336897e562707b49d6c497364d7e14dba24e90563ffda60ef0063d874b3aa737540575c98cdfb1b558a065c30cc96fd47c014"

body = json.dumps({"type": "help", "message": "Test feedback from script"})

result = subprocess.Popen(
    ["curl", "-s", "-X", "POST",
     "http://localhost:3021/swift-app/v1/feedback",
     "-H", f"Authorization: Bearer {TOKEN}",
     "-H", "Content-Type: application/json",
     "-d", body],
    stdout=subprocess.PIPE, stderr=subprocess.PIPE
)
stdout, stderr = result.communicate()
print("Response:", stdout.decode())
if stderr:
    print("Error:", stderr.decode())
