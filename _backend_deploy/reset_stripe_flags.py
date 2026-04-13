import subprocess
subprocess.run(['mysql', '-u', 'swiftapp_user', '-pU%Xgxvc54EKUD39PcwNAYvuS', 'swiftapp', '-Bse',
    'UPDATE companies SET stripe_onboarding_completed = 0, stripe_terms_accepted = 0 WHERE id = 12; SELECT id, name, stripe_onboarding_completed, stripe_terms_accepted FROM companies WHERE id = 12'])
