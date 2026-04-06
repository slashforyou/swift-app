// ./endPoints/auth/forgotPassword.js
const { connect } = require("../../swiftDb");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const forgotPasswordEndpoint = async (req) => {
  try {
    const { email } = req.body;

    if (!email) {
      return { status: 400, json: { message: "Email is required" } };
    }

    const connection = await connect();

    // Check if user exists
    const [users] = await connection.execute(
      "SELECT id, first_name, email FROM users WHERE email = ?",
      [email.trim().toLowerCase()],
    );

    // Always return success (don't reveal if email exists)
    if (!Array.isArray(users) || users.length === 0) {
      console.log(`🔑 [FORGOT PASSWORD] Email not found: ${email}`);
      return {
        status: 200,
        json: {
          success: true,
          message: "If this email exists, a reset code has been sent.",
        },
      };
    }

    const user = users[0];

    // Generate 6-digit code
    const resetCode = crypto.randomInt(100000, 999999);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Store reset code in DB
    await connection.execute(
      `UPDATE users 
       SET verification_code = ?, updated_at = NOW() 
       WHERE id = ?`,
      [resetCode, user.id],
    );

    // Send email
    const transporter = nodemailer.createTransport({
      host: "smtp.ionos.fr",
      port: 465,
      secure: true,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"></head>
      <body style="margin:0;padding:0;background:#f8f9fa;font-family:Arial,sans-serif;">
        <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
          <div style="background:white;border-radius:16px;padding:40px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
            <div style="font-size:3rem;margin-bottom:16px;">🔑</div>
            <h1 style="color:#1a1a2e;font-size:1.5rem;margin:0 0 8px;">Réinitialisation du mot de passe</h1>
            <p style="color:#6c757d;font-size:1rem;margin:0 0 24px;">
              Bonjour <strong>${user.first_name}</strong>,
            </p>
            <p style="color:#495057;font-size:1rem;margin:0 0 24px;">
              Voici votre code de réinitialisation :
            </p>
            <div style="background:#f0f4ff;border:2px dashed #4361ee;border-radius:12px;padding:20px;margin:0 0 24px;">
              <span style="font-size:2.5rem;font-weight:bold;letter-spacing:8px;color:#4361ee;">${resetCode}</span>
            </div>
            <p style="color:#6c757d;font-size:0.875rem;margin:0 0 8px;">
              Ce code expire dans <strong>15 minutes</strong>.
            </p>
            <p style="color:#adb5bd;font-size:0.8rem;margin:24px 0 0;">
              Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
            </p>
          </div>
          <p style="text-align:center;color:#adb5bd;font-size:0.75rem;margin:16px 0 0;">
            Cobbr &mdash; Moving Made Simple
          </p>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: '"Cobbr" <contact@cobbr-app.com>',
      to: user.email,
      subject: "🔑 Code de réinitialisation — Cobbr",
      html: html,
    });

    console.log(`🔑 [FORGOT PASSWORD] Reset code sent to ${user.email}`);

    return {
      status: 200,
      json: {
        success: true,
        message: "If this email exists, a reset code has been sent.",
      },
    };
  } catch (error) {
    console.error("❌ [FORGOT PASSWORD] Error:", error);
    return { status: 500, json: { message: "Internal server error" } };
  }
};

module.exports = { forgotPasswordEndpoint };
