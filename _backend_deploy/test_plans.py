#!/usr/bin/env python3
"""Test script for plan endpoints"""
import os
import urllib.request
import json

BASE = os.environ.get("TEST_API_BASE", "http://localhost:3021/swift-app")
SECRET = os.environ.get("ADMIN_SECRET", "")

if not SECRET:
    print("⚠️  ADMIN_SECRET env variable not set. Admin tests will fail.")
    print("   Usage: ADMIN_SECRET=your_secret python test_plans.py")

def test_get_plans():
    print("=== GET /v1/plans ===")
    req = urllib.request.Request(BASE + "/v1/plans")
    resp = urllib.request.urlopen(req)
    data = json.loads(resp.read().decode())
    print(json.dumps(data, indent=2))
    print()

def test_admin_set_unlimited():
    print("=== POST /v1/admin/company/plan (set unlimited) ===")
    body = json.dumps({"company_id": 1, "plan_id": "unlimited"}).encode()
    req = urllib.request.Request(BASE + "/v1/admin/company/plan", data=body, method="POST")
    req.add_header("Content-Type", "application/json")
    req.add_header("x-admin-secret", SECRET)
    resp = urllib.request.urlopen(req)
    print(json.loads(resp.read().decode()))
    print()

def test_admin_no_secret():
    print("=== POST /v1/admin/company/plan (no secret - should fail) ===")
    body = json.dumps({"company_id": 1, "plan_id": "unlimited"}).encode()
    req = urllib.request.Request(BASE + "/v1/admin/company/plan", data=body, method="POST")
    req.add_header("Content-Type", "application/json")
    try:
        resp = urllib.request.urlopen(req)
        print("UNEXPECTED SUCCESS:", resp.read().decode())
    except urllib.error.HTTPError as e:
        print("Correctly rejected:", e.code, json.loads(e.read().decode()))
    print()

def test_admin_revert_free():
    print("=== POST /v1/admin/company/plan (revert to free) ===")
    body = json.dumps({"company_id": 1, "plan_id": "free"}).encode()
    req = urllib.request.Request(BASE + "/v1/admin/company/plan", data=body, method="POST")
    req.add_header("Content-Type", "application/json")
    req.add_header("x-admin-secret", SECRET)
    resp = urllib.request.urlopen(req)
    print(json.loads(resp.read().decode()))
    print()

if __name__ == "__main__":
    test_get_plans()
    test_admin_set_unlimited()
    test_admin_no_secret()
    test_admin_revert_free()
