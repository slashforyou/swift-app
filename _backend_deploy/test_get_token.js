// Test script to generate a JWT token and test modular template endpoints
// Run from /srv/www/htdocs/swiftapp/server/
const jwt = require('./node_modules/jsonwebtoken');
const { connect } = require('./swiftDb');

async function main() {
  let connection;
  try {
    connection = await connect();
    
    // Find a user with company_id
    const [users] = await connection.execute(
      'SELECT id, email, company_id FROM users WHERE company_id IS NOT NULL LIMIT 1'
    );
    if (users.length === 0) {
      console.log('No user with company found');
      return;
    }
    const user = users[0];
    console.log('Test user:', user.id, user.email, 'company:', user.company_id);

    // Get JWT secret from config or env
    let secret;
    try {
      const config = require('./config');
      secret = config.JWT_SECRET || config.jwtSecret;
    } catch(e) {}
    if (!secret) secret = process.env.JWT_SECRET;
    if (!secret) {
      // Try reading from .env
      const fs = require('fs');
      const envFile = fs.readFileSync('.env', 'utf8');
      const match = envFile.match(/JWT_SECRET=(.*)/);
      if (match) secret = match[1].trim();
    }

    if (!secret) {
      console.log('Could not find JWT secret');
      return;
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, company_id: user.company_id },
      secret,
      { expiresIn: '1h' }
    );
    console.log('TOKEN:', token);

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    if (connection) connection.release();
    process.exit(0);
  }
}
main();
