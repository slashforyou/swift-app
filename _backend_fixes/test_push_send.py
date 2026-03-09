#!/usr/bin/env python3
"""Test push notification send."""
import subprocess
import json

BASE_URL = "http://localhost:3021/swift-app/v1/notifications/push/send"

# Test 1: node-fetch
print("=== Test 1: node-fetch module ===")
result = subprocess.run(
    ['node', '-e', "try { require('node-fetch'); console.log('OK node-fetch available'); } catch(e) { console.error('MISSING node-fetch:', e.message); }"],
    stdout=subprocess.PIPE, stderr=subprocess.PIPE
)
print(result.stdout.decode().strip())
if result.stderr: print("STDERR:", result.stderr.decode().strip())

# Test 2: send push via backend
print("\n=== Test 2: POST /notifications/push/send ===")
payload = json.dumps({"user_id": 24, "title": "Test push", "body": "Push backend OK!", "data": {"type": "test"}})
result = subprocess.run(
    ['curl', '-s', '-X', 'POST', BASE_URL,
     '-H', 'Content-Type: application/json',
     '--data-raw', payload],
    stdout=subprocess.PIPE, stderr=subprocess.PIPE
)
print("Response:", result.stdout.decode())
if result.returncode != 0:
    print("CURL error:", result.stderr.decode())

# Test 3: Direct Expo Push API
print("\n=== Test 3: Direct Expo Push API (fake token to check reachability) ===")
expo_payload = json.dumps([{
    "to": "ExponentPushToken[FAKE-TOKEN]",
    "title": "Test", "body": "Test", "data": {}
}])
result = subprocess.run(
    ['curl', '-s', '-X', 'POST', 'https://exp.host/--/api/v2/push/send',
     '-H', 'Accept: application/json',
     '-H', 'Content-Type: application/json',
     '--data-raw', expo_payload],
    stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=15
)
print("Expo API response:", result.stdout.decode()[:500])
