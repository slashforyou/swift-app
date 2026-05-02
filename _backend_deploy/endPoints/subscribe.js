const crypto = require('crypto');
const { connect } = require('../swiftDb');
const PasswordSecurity = require('../security/PasswordSecurity');

const subscribeEndpoint = async (req) => {
  const { mail, firstName, lastName, password, companyName, accountType } = req.body;
  console.log('[SUBSCRIBE] Endpoint called with:', { mail, firstName, lastName, companyName, accountType, password: '***' });

  const isBusinessOwner = accountType !== 'employee';

  if (!mail || !firstName || !lastName || !password)
    return { success: false, message: 'Mail, firstName, lastName, and password are required' };

  if (isBusinessOwner && (!companyName || companyName.trim().length < 2))
    return { success: false, message: 'Company name must be at least 2 characters long' };

  if (!mail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/))
    return { success: false, message: 'Invalid mail address' };

  if (password.length < 8)
    return { success: false, message: 'Password must be at least 8 characters long' };

  let connection;

  try {
    connection = await connect();

    const [existingUsers] = await connection.execute(
      'SELECT id FROM users WHERE email = ?',
      [mail]
    );

    if (existingUsers.length > 0)
      return { success: false, message: 'Email already in use' };

    console.log('[SUBSCRIBE] Hashing password...');
    const passwordSecurity = new PasswordSecurity();

    let password_hash;
    try {
      password_hash = await passwordSecurity.hashPassword(password);
      console.log('[SUBSCRIBE] Password hashed successfully');
    } catch (passwordError) {
      console.log('[SUBSCRIBE] Password validation failed:', passwordError.message);
      return { success: false, message: 'Password security requirements not met: ' + passwordError.message };
    }

    if (isBusinessOwner) {
      // Business owner: create company + user as patron
      const companyCode = crypto.randomBytes(4).toString('hex').toUpperCase();
      await connection.execute(
        'INSERT INTO companies (name, company_code) VALUES (?, ?)',
        [companyName.trim(), companyCode]
      );
      const companyId = (await connection.execute('SELECT LAST_INSERT_ID() AS id'))[0][0].id;
      console.log('[SUBSCRIBE] Company created:', { companyId, companyName, companyCode });

      await connection.execute(
        'INSERT INTO users (email, first_name, last_name, password_hash, company_id, company_role) VALUES (?, ?, ?, ?, ?, ?)',
        [mail, firstName, lastName, password_hash, companyId, 'patron']
      );

      const userId = (await connection.execute('SELECT LAST_INSERT_ID() AS id'))[0][0].id;
      if (!userId) return { success: false, message: 'User not found after insertion' };

      await connection.execute(
        'UPDATE companies SET owner_user_id = ? WHERE id = ?',
        [userId, companyId]
      );

      // Seed default contract clauses for the new company
      try {
        const { seedDefaultClausesForCompany } = require('./helpers/defaultClauses');
        await seedDefaultClausesForCompany(connection, companyId);
      } catch (seedError) {
        console.error('[SUBSCRIBE] Failed to seed default clauses (non-blocking):', seedError.message);
      }

      const verificationCode = crypto.randomInt(100_000, 999_999).toString();
      await connection.execute('UPDATE users SET verification_code = ? WHERE email = ?', [verificationCode, mail]);

      const { MailSender } = require('./functions/mailSender');
      const mailSender = MailSender();
      const mailResult = await mailSender.verificationMail(mail, verificationCode);
      if (!mailResult.success) return { success: false, message: 'Failed to send verification email' };

      return {
        success: true,
        user: { id: userId, mail, firstName, lastName, company_id: companyId, company_role: 'patron' }
      };
    } else {
      // Employee: create user without company (they join later via company code)
      await connection.execute(
        'INSERT INTO users (email, first_name, last_name, password_hash, company_role) VALUES (?, ?, ?, ?, ?)',
        [mail, firstName, lastName, password_hash, 'employee']
      );

      const userId = (await connection.execute('SELECT LAST_INSERT_ID() AS id'))[0][0].id;
      if (!userId) return { success: false, message: 'User not found after insertion' };

      const verificationCode = crypto.randomInt(100_000, 999_999).toString();
      await connection.execute('UPDATE users SET verification_code = ? WHERE email = ?', [verificationCode, mail]);

      const { MailSender } = require('./functions/mailSender');
      const mailSender = MailSender();
      const mailResult = await mailSender.verificationMail(mail, verificationCode);
      if (!mailResult.success) return { success: false, message: 'Failed to send verification email' };

      return {
        success: true,
        user: { id: userId, mail, firstName, lastName, company_id: null, company_role: 'employee' }
      };
    }

  } catch (error) {
    console.error('[Subscribe error]', error);
    return { success: false, message: 'Subscription failed' };
  } finally {
    if (connection) await connection.release();
  }
};

module.exports = { subscribeEndpoint };
