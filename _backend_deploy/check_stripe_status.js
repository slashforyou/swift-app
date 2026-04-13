require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const mysql = require('mysql2/promise');

(async () => {
  try {
    const c = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_DATABASE,
      socketPath: process.env.DB_SOCKET
    });

    // 1. Show all tables
    const [tables] = await c.query('SHOW TABLES');
    console.log('=== ALL TABLES ===');
    tables.forEach(t => console.log(Object.values(t)[0]));

    // 2. Find stripe-related columns across all tables
    console.log('\n=== SEARCHING FOR STRIPE COLUMNS ===');
    for (const t of tables) {
      const tableName = Object.values(t)[0];
      const [cols] = await c.query('DESCRIBE ' + tableName);
      const stripeCols = cols.filter(r => 
        r.Field.toLowerCase().includes('stripe') || 
        r.Field.toLowerCase().includes('onboard') ||
        r.Field.toLowerCase().includes('acct_') ||
        r.Field.toLowerCase().includes('account')
      );
      if (stripeCols.length) {
        console.log(tableName + ':', stripeCols.map(r => r.Field).join(', '));
      }
    }

    // 3. Find user
    const [users] = await c.query('SELECT * FROM users WHERE email = ?', ['contact@cobbr-app.com']);
    if (users.length) {
      const userId = users[0].id;
      console.log('\n=== USER id=' + userId + ' ===');
      
      // Check companies
      try {
        const [companyCols] = await c.query('DESCRIBE companies');
        console.log('\ncompanies columns:', companyCols.map(r => r.Field).join(', '));
        const ownerCol = companyCols.find(r => r.Field === 'owner_id' || r.Field === 'user_id' || r.Field === 'created_by');
        if (ownerCol) {
          const [comps] = await c.query('SELECT * FROM companies WHERE ' + ownerCol.Field + ' = ?', [userId]);
          if (comps.length) {
            console.log('\nCompany data:');
            for (const [k, v] of Object.entries(comps[0])) {
              if (v !== null && v !== '') console.log('  ' + k + ':', v);
            }
          }
        } else {
          const [comps] = await c.query('SELECT * FROM companies LIMIT 5');
          console.log('\nAll companies (first 5):');
          comps.forEach(comp => {
            console.log(JSON.stringify(comp));
          });
        }
      } catch(e) { console.log('No companies table:', e.message); }
    }

    await c.end();
  } catch(e) { console.error('ERROR:', e.message); }
})();
