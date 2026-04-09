// ./endPoints/auth/forgotPassword.js
const { connect } = require("../../swiftDb");
const crypto = require("crypto");
const mailSender = require("../functions/mailSender")();

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

    // Send email via centralized mailSender
    await mailSender.passwordResetMail(user.email, resetCode, user.first_name);

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
