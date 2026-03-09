import pymysql
conn = pymysql.connect(host="localhost", user="swiftapp_user", password="U%Xgxvc54EKUD39PcwNAYvuS", db="swiftapp")
cur = conn.cursor()

# status = pending pour tous
# assignment_status = pending si B2B (contractor_company_id != null), none si interne
n = cur.execute("""
    UPDATE jobs
    SET status = 'pending',
        assignment_status = CASE
            WHEN contractor_company_id IS NOT NULL THEN 'pending'
            ELSE 'none'
        END
    WHERE id BETWEEN 34 AND 55
""")
conn.commit()
print(f"{n} jobs remis en pending.")

# Vérification
cur.execute("""
    SELECT id, code, status, assignment_status, contractee_company_id, contractor_company_id
    FROM jobs WHERE id BETWEEN 34 AND 55 ORDER BY id
""")
print(f"\n{'ID':<5} {'Code':<15} {'Status':<10} {'Assignment':<11} {'Cee':<4} Ctor")
print("-" * 65)
for r in cur.fetchall():
    print(f"{r[0]:<5} {r[1]:<15} {r[2]:<10} {r[3]:<11} {str(r[4]):<4} {r[5]}")
conn.close()
