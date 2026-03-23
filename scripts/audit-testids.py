#!/usr/bin/env python3
"""Audit testIDs: cross-check YAML flows against source code."""
import os, re, sys

src = os.path.join(os.path.dirname(__file__), '..', 'src')
e2e = os.path.join(os.path.dirname(__file__), '..', 'e2e', 'flows')

# Collect all testIDs from source code
found = set()
dyn_prefixes = set()  # for template literals like `address-${idx}-street`
pat_static = re.compile(r'testID="([^"]+)"')
pat_dyn = re.compile(r'testID=\{`([^`]+)`\}')

for root, dirs, files in os.walk(src):
    for f in files:
        if f.endswith('.tsx') or f.endswith('.ts'):
            try:
                content = open(os.path.join(root, f), encoding='utf-8').read()
                for m in pat_static.finditer(content):
                    found.add(m.group(1))
                for m in pat_dyn.finditer(content):
                    tpl = m.group(1)
                    # store prefix up to first $
                    prefix = tpl.split('$')[0]
                    dyn_prefixes.add(prefix)
            except:
                pass

def is_present(tid):
    if tid in found:
        return True
    # Check dynamic prefix match (e.g. "address-0-street" matches prefix "address-")
    for pfx in dyn_prefixes:
        if tid.startswith(pfx):
            return True
    return False

# Flow IDs to check
flows = {
    '010': [
        'connection-register-btn', 'register-type-screen', 'register-type-card-business',
        'business-registration-screen', 'register-firstname-input', 'register-lastname-input',
        'register-email-input', 'register-phone-input', 'register-password-input',
        'register-confirm-password-input', 'register-personal-info-next-btn',
        'register-company-name-input', 'register-business-details-next-btn',
        'register-address-next-btn', 'register-insurance-next-btn',
        'plan-card-starter', 'register-plan-next-btn',
        'register-banking-next-btn', 'register-terms-checkbox',
        'register-privacy-checkbox', 'register-stripe-checkbox', 'register-legal-finish-btn',
        'register-review-submit-btn', 'mail-verification-screen',
        'mail-verification-code-input', 'mail-verification-submit-btn',
        'login-screen', 'login-email-input', 'login-password-input', 'login-submit-btn', 'home-screen'
    ],
    '050': [
        'home-calendar-btn', 'calendar-month-screen', 'calendar-month-day-25',
        'calendar-day-screen', 'calendar-day-create-job-fab', 'create-job-modal',
        'create-job-client-search', 'create-job-client-item-30',
        'address-step-scroll', 'address-0-street', 'address-0-city', 'address-0-state-picker',
        'state-picker-title', 'state-option-NSW', 'address-0-zip',
        'address-1-street', 'address-1-city', 'address-1-state-picker',
        'state-option-VIC', 'address-1-zip',
        'create-job-address-next-btn', 'create-job-schedule-next-btn',
        'create-job-details-next-btn', 'create-job-pricing-next-btn', 'create-job-save-btn',
        'tab-job', 'job-details-screen', 'job-staffing-assign-btn',
        'job-timer-start-btn', 'job-timer-pause-btn', 'job-timer-play-btn',
        'tab-payment', 'job-payment-scroll'
    ],
    '060': [
        'tab-StaffCrew', 'add-staff-button', 'tab-Vehicles', 'tab-Schedule',
        'tab-Settings', 'tab-Clients', 'tab-Jobs', 'tab-Home'
    ],
    '080': [
        'tab-Settings', 'profile-edit-phone-input', 'profile-save-btn'
    ]
}

total_missing = 0
for flow_id, ids in sorted(flows.items()):
    missing = [tid for tid in ids if not is_present(tid)]
    ok_count = len(ids) - len(missing)
    print(f"\n=== Flow {flow_id} ({ok_count}/{len(ids)} OK) ===")
    for tid in ids:
        status = "OK  " if is_present(tid) else "MISS"
        if status == "MISS":
            print(f"  {status}: {tid}")
    if not missing:
        print("  All testIDs present!")
    total_missing += len(missing)

print(f"\n=== TOTAL MISSING: {total_missing} ===")

# Also print all dynamic prefixes found
print(f"\nDynamic template prefixes found: {sorted(dyn_prefixes)}")
