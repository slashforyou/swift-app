import pymysql
conn = pymysql.connect(host="localhost", user="swiftapp_user", password="U%Xgxvc54EKUD39PcwNAYvuS", db="swiftapp")
cur = conn.cursor()
cur.execute("""
    SELECT j.id, j.code, j.status, j.assignment_status,
           j.contractee_company_id, j.contractor_company_id,
           j.required_offsider,
           COUNT(jt.id) AS truck_count,
           COUNT(ja.id) AS addr_count
    FROM jobs j
    LEFT JOIN job_trucks jt ON jt.job_id = j.id
    LEFT JOIN job_addresses ja ON ja.job_id = j.id
    WHERE j.id >= 34
    GROUP BY j.id
    ORDER BY j.id
""")
rows = cur.fetchall()
print(f"{'ID':<5} {'Code':<15} {'Status':<12} {'Assign':<11} {'Cee':<4} {'Ctor':<5} {'Offs':<5} {'Trucks':<7} Addrs")
print("-" * 80)
for r in rows:
    print(f"{r[0]:<5} {r[1]:<15} {r[2]:<12} {r[3]:<11} {str(r[4]):<4} {str(r[5]):<5} {r[6]:<5} {r[7]:<7} {r[8]}")
conn.close()
print(f"\n=> {len(rows)} jobs insérés au total")
