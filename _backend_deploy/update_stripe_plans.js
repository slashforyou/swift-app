const dotenv = require('dotenv');
dotenv.config();
const mysql = require('mysql2/promise');

(async () => {
  const c = await mysql.createConnection({
    host: 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  await c.execute(
    'UPDATE plans SET stripe_price_id = ?, stripe_product_id = ? WHERE id = ?',
    ['price_1TJUJPInA65k4AVUGciDCtsJ', 'prod_UI4SGFACM9yXGZ', 'pro']
  );

  await c.execute(
    'UPDATE plans SET stripe_price_id = ?, stripe_product_id = ? WHERE id = ?',
    ['price_1TJUK1InA65k4AVUR81N58xo', 'prod_UI4SnR7hFS64CT', 'expert']
  );

  const [rows] = await c.query('SELECT id, name, stripe_price_id, stripe_product_id, price FROM plans');
  console.table(rows);
  await c.end();
})();
