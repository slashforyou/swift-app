/**
 * Upload Company Logo Endpoint
 * Route: POST /swift-app/v1/company/:companyId/logo
 *
 * Uploads a logo image to GCS and stores the URL in companies.logo_url
 */

const { bucket } = require("../../utils/gcsClient");
const gcsConfig = require("../../config/gcs");
const { connect, close } = require("../../swiftDb");

const uploadCompanyLogoEndpoint = async (req, res) => {
  console.log("[ Upload Company Logo ]", {
    companyId: req.params.companyId,
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
    const { companyId } = req.params;
    const userId = req.user?.id;
    // company_id UNIQUEMENT depuis le JWT — le param URL ne peut pas être approuvé seul
    const jwtCompanyId = req.user?.company_id;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, error: "Authentication required" });
    }

    // Vérifier que l'utilisateur appartient bien à cette company (anti-IDOR)
    if (!jwtCompanyId || parseInt(companyId) !== parseInt(jwtCompanyId)) {
      return res
        .status(403)
        .json({ success: false, error: "Access denied: company mismatch" });
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

    // Vérifier que la company existe (l'appartenance a déjà été vérifiée via JWT ci-dessus)
    const [companyCheck] = await connection.execute(
      "SELECT id FROM companies WHERE id = ?",
      [jwtCompanyId],
    );
    if (companyCheck.length === 0) {
      return res
        .status(404)
        .json({ success: false, error: "Company not found" });
    }

    // Upload to GCS
    const timestamp = Date.now();
    const ext = originalname.split(".").pop() || "jpg";
    const gcsPath = `logos/${jwtCompanyId}/${timestamp}_logo.${ext}`;
    const file = bucket.file(gcsPath);

    await file.save(buffer, {
      contentType: mimetype,
      resumable: false,
      metadata: {
        cacheControl: "public, max-age=31536000",
      },
    });

    // Get signed URL
    const [signedUrl] = await file.getSignedUrl({
      action: "read",
      expires: Date.now() + (gcsConfig.signedUrlExpires || 3600) * 1000,
    });

    // Update company record
    await connection.execute("UPDATE companies SET logo_url = ? WHERE id = ?", [
      gcsPath,
      jwtCompanyId,
    ]);

    console.log(
      `✅ Company logo uploaded for company ${jwtCompanyId}: ${gcsPath}`,
    );

    res.json({
      success: true,
      message: "Logo uploaded successfully",
      logo_url: signedUrl,
    });
  } catch (error) {
    console.error("❌ Upload company logo error:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  } finally {
    if (connection) await close(connection);
  }
};

module.exports = { uploadCompanyLogoEndpoint };
