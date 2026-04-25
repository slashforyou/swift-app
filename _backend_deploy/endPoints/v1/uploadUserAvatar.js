/**
 * Upload User Avatar Endpoint (Local Storage)
 * Route: POST /swift-app/v1/user/avatar
 *
 * Saves profile picture to /uploads/avatars/ and stores the relative URL in users.profile_picture
 */

const fs = require("fs");
const path = require("path");
const { connect, close } = require("../../swiftDb");

const uploadUserAvatarEndpoint = async (req, res) => {
  console.log("[ Upload User Avatar ]", {
    userId: req.user?.id,
    hasFile: !!req.file,
  });

  let connection;

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No image file provided",
      });
    }

    const { originalname, buffer, mimetype, size } = req.file;
    const userId = req.user?.id;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, error: "Authentication required" });
    }

    // Validate mime type
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedMimeTypes.includes(mimetype)) {
      return res.status(400).json({
        success: false,
        error: "Unsupported file type. Allowed: jpeg, png, webp",
      });
    }

    // Max 5MB
    if (size > 5 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        error: "File too large. Max size: 5MB",
      });
    }

    connection = await connect();

    // Ensure profile_picture column exists
    try {
      await connection.execute(
        "ALTER TABLE users ADD COLUMN profile_picture VARCHAR(500) NULL",
      );
      console.log("✅ Added profile_picture column to users");
    } catch (_e) {
      // Column already exists - ignore
    }

    // Delete old avatar file if exists
    const [currentUser] = await connection.execute(
      "SELECT profile_picture FROM users WHERE id = ?",
      [userId],
    );
    if (currentUser.length > 0 && currentUser[0].profile_picture) {
      try {
        const oldPath = path.join(
          __dirname,
          "../..",
          currentUser[0].profile_picture.replace("/swift-app/", ""),
        );
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
          console.log(`🗑️ Deleted old avatar: ${oldPath}`);
        }
      } catch (_e) {
        // Old file may not exist - ignore
      }
    }

    // Save to local filesystem
    const uploadsDir = path.join(
      __dirname,
      "../../uploads/avatars",
      String(userId),
    );
    fs.mkdirSync(uploadsDir, { recursive: true });

    const timestamp = Date.now();
    const ext = path.extname(originalname) || ".jpg";
    const filename = `${timestamp}_avatar${ext}`;
    const filePath = path.join(uploadsDir, filename);

    fs.writeFileSync(filePath, buffer);

    // Relative URL served by express.static
    const relativeUrl = `/swift-app/uploads/avatars/${userId}/${filename}`;

    // Update user record
    await connection.execute(
      "UPDATE users SET profile_picture = ? WHERE id = ?",
      [relativeUrl, userId],
    );

    console.log(`✅ User avatar uploaded for user ${userId}: ${relativeUrl}`);

    res.json({
      success: true,
      message: "Avatar uploaded successfully",
      profile_picture: relativeUrl,
    });
  } catch (error) {
    console.error("❌ Upload user avatar error:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  } finally {
    if (connection) await close(connection);
  }
};

/**
 * Delete User Avatar Endpoint
 * Route: DELETE /swift-app/v1/user/avatar
 */
const deleteUserAvatarEndpoint = async (req, res) => {
  let connection;

  try {
    const userId = req.user?.id;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, error: "Authentication required" });
    }

    connection = await connect();

    const [currentUser] = await connection.execute(
      "SELECT profile_picture FROM users WHERE id = ?",
      [userId],
    );

    if (currentUser.length > 0 && currentUser[0].profile_picture) {
      // Delete local file
      try {
        const oldPath = path.join(
          __dirname,
          "../..",
          currentUser[0].profile_picture.replace("/swift-app/", ""),
        );
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      } catch (_e) {
        // File may not exist
      }

      // Clear DB field
      await connection.execute(
        "UPDATE users SET profile_picture = NULL WHERE id = ?",
        [userId],
      );
    }

    res.json({ success: true, message: "Avatar removed" });
  } catch (error) {
    console.error("❌ Delete user avatar error:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  } finally {
    if (connection) await close(connection);
  }
};

module.exports = { uploadUserAvatarEndpoint, deleteUserAvatarEndpoint };
