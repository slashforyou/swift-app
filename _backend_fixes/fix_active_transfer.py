path = '/srv/www/htdocs/swiftapp/server/endPoints/v1/getJobById.js'
with open(path, 'r') as f:
    content = f.read()

old = ('fer: isOwner,\n'
       '      can_respond_transfer: !!userCompanyId && !isOwner\n'
       '    };\n'
       '    \n'
       '    return res.json({ \n')

new = ('fer: isOwner,\n'
       '      can_respond_transfer: !!userCompanyId && !isOwner\n'
       '    };\n'
       '\n'
       '    // Delegation active (pending transfer)\n'
       '    const [activeTransferRows] = await connection.execute(\n'
       '      `SELECT jt.*,\n'
       '              sc.name AS sender_company_name, sc.company_code AS sender_company_code,\n'
       '              rc.name AS recipient_company_name, rc.company_code AS recipient_company_code\n'
       '       FROM job_transfers jt\n'
       '       LEFT JOIN companies sc ON sc.id = jt.sender_company_id\n'
       '       LEFT JOIN companies rc ON rc.id = jt.recipient_company_id\n'
       '       WHERE jt.job_id = ? AND jt.status = \'pending\'\n'
       '       LIMIT 1`,\n'
       '      [job.id]\n'
       '    );\n'
       '    const activeTransfer = activeTransferRows[0] || null;\n\n'
       '    return res.json({ \n')

if old in content:
    content = content.replace(old, new, 1)
    with open(path, 'w') as f:
        f.write(content)
    print('OK activeTransfer SQL injected')
else:
    # Debug: show surrounding context
    idx = content.find('can_respond_transfer')
    print('PATTERN NOT FOUND. Context:')
    print(repr(content[max(0,idx-20):idx+200]))
