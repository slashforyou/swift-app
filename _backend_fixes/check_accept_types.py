#!/usr/bin/env python3
"""Check types returned by the /full endpoint for accept/decline permissions."""
import json, subprocess, sys

TOKEN = "ea4c3634303782a9ffe3f19cbba336897e562707b49d6c497364d7e14dba24e90563ffda60ef0063d874b3aa737540575c98cdfb1b558a065c30cc96fd47c014"
URL = "http://localhost:3021/swift-app/v1/job/TST-MAR-019/full"

result = subprocess.run(
    ["curl", "-s", URL, "-H", f"Authorization: Bearer {TOKEN}"],
    capture_output=True, text=True
)
d = json.loads(result.stdout)
data = d["data"]
job = data["job"]

print(f"viewer_company_id: {data['viewer_company_id']} (type: {type(data['viewer_company_id']).__name__})")
print(f"contractor_company_id: {job['contractor_company_id']} (type: {type(job['contractor_company_id']).__name__})")
print(f"contractee_company_id: {job['contractee_company_id']} (type: {type(job['contractee_company_id']).__name__})")
print(f"assignment_status: {job['assignment_status']}")
print(f"status: {job['status']}")

# Simulate frontend logic
viewer = data['viewer_company_id']
contractor = job['contractor_company_id']
contractee = job['contractee_company_id']
assignment = job['assignment_status']

isSameCompany = contractee == contractor
isContractee = (not viewer) or (viewer == contractee)
isContractor = (not isContractee) and (viewer == contractor)

print(f"\n--- Frontend permission simulation ---")
print(f"isSameCompany: {isSameCompany}")
print(f"isContractee: {isContractee}")
print(f"isContractor: {isContractor}")
print(f"can_accept: {assignment == 'pending' and (isContractor or isSameCompany)}")
print(f"can_decline: {assignment == 'pending' and (isContractor or isSameCompany)}")
