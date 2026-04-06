// ./endPoints/auth/resetPassword.js
const { connect } = require("../../swiftDb");
const PasswordSecurity = require("../../security/PasswordSecurity");

const resetPasswordEndpoint = async (req) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return {
        status: 400,
        json: { message: "Email, code, and new password are required" },
      };
    }

    if (newPassword.length < 8) {
      return {
        status: 400,
        json: { message: "Password must be at least 8 characters" },
      };
    }

    if (!/[A-Z]/.test(newPassword)) {
      return {
        status: 400,
        json: { message: "Password must contain at least one uppercase letter" },
      };
    }

    if (!/[a-z]/.test(newPassword)) {
      return {
        status: 400,
        json: { message: "Password must contain at least one lowercase letter" },
      };
    }

    if (!/[0-9]/.test(newPassword)) {
      return {
        status: 400,
        json: { message: "Password must contain at least one number" },
      };
    }

    if (!/[^A-Za-z0-9]/.test(newPassword)) {
      return {
        status: 400,
        json: { message: "Password must contain at least one special character" },
      };
    }

    const connection = await connect();

    // Verify code
    const [users] = await connection.execute(
      `SELECT id, email, verification_code, updated_at 
       FROM users WHERE email = ?`,
      [email.trim().toLowerCase()],
    );

    if (!Array.isArray(users) || users.length === 0) {
      return { status: 400, json: { message: "Invalid email or code" } };
    }

    const user = users[0];

    // Check code matches
    if (user.verification_code !== parseInt(code, 10)) {
      console.log(
        `🔑 [RESET PASSWORD] Invalid code for ${email}: got ${code}, expected ${user.verification_code}`,
      );
      return { status: 400, json: { message: "Invalid or expired code" } };
    }

    // Check expiry (15 minutes from updated_at)
    const codeAge = Date.now() - new Date(user.updated_at).getTime();
    if (codeAge > 15 * 60 * 1000) {
      console.log(
        `🔑 [RESET PASSWORD] Expired code for ${email}: ${Math.round(codeAge / 60000)} min old`,
      );
      return { status: 400, json: { message: "Invalid or expired code" } };
    }

    // Hash new password
    const passwordSecurity = new PasswordSecurity();
    const newHash = await passwordSecurity.hashPassword(newPassword);

    // Update password and clear code
    await connection.execute(
      `UPDATE users 
       SET password_hash = ?, verification_code = 0, updated_at = NOW() 
       WHERE id = ?`,
      [newHash, user.id],
    );

    console.log(`🔑 [RESET PASSWORD] Password reset successful for ${email}`);

    return {
      status: 200,
      json: { success: true, message: "Password updated successfully" },
    };
  } catch (error) {
    console.error("❌ [RESET PASSWORD] Error:", error);
    return { status: 500, json: { message: "Internal server error" } };
  }
};

module.exports = { resetPasswordEndpoint };
