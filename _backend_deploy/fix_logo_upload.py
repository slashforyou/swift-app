"""
Fix logo upload endpoint to use local storage instead of GCS.
The GCS service account key is missing, so we store logos locally
and serve them via express.static.
"""
import shutil, datetime

# 1. Rewrite the uploadCompanyLogo endpoint to use local fs
endpoint_path = '/srv/www/htdocs/swiftapp/server/endPoints/v1/uploadCompanyLogo.js'
backup = endpoint_path + '.bak_' + datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
shutil.copy2(endpoint_path, backup)
print(f'Backup: {backup}')

new_endpoint = r'''/**
 * Upload Company Logo Endpoint (Local Storage)
 * Route: POST /swift-app/v1/company/:companyId/logo
 *
 * Saves logo to /uploads/logos/ and stores the relative URL in companies.logo_url
 */

const fs = require('fs');
const path = require('path');
const { connect, close } = require('../../swiftDb');

const uploadCompanyLogoEndpoint = async (req, res) => {
  console.log('[ Upload Company Logo ]', {
    companyId: req.params.companyId,
    hasFile: !!req.file,
  });

  let connection;

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided',
      });
    }

    const { originalname, buffer, mimetype, size } = req.file;
    const { companyId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, error: 'Authentication required' });
    }

    // Validate mime type
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(mimetype)) {
      return res.status(400).json({
        success: false,
        error: 'Unsupported file type. Allowed: jpeg, png, webp',
      });
    }

    // Max 5MB
    if (size > 5 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        error: 'File too large. Max size: 5MB',
      });
    }

    connection = await connect();

    // Verify company exists
    const [companyCheck] = await connection.execute(
      'SELECT id FROM companies WHERE id = ?',
      [companyId],
    );
    if (companyCheck.length === 0) {
      return res
        .status(404)
        .json({ success: false, error: 'Company not found' });
    }

    // Ensure logo_url column exists
    try {
      await connection.execute(
        'ALTER TABLE companies ADD COLUMN logo_url VARCHAR(500) NULL AFTER company_code',
      );
      console.log('Added logo_url column to companies');
    } catch (_e) {
      // Column already exists - ignore
    }

    // Save to local filesystem
    const uploadsDir = path.join(__dirname, '../../uploads/logos', String(companyId));
    fs.mkdirSync(uploadsDir, { recursive: true });

    const timestamp = Date.now();
    const ext = path.extname(originalname) || '.jpg';
    const filename = `${timestamp}_logo${ext}`;
    const filePath = path.join(uploadsDir, filename);

    fs.writeFileSync(filePath, buffer);

    // Relative URL that will be served by express.static
    const relativeUrl = `/swift-app/uploads/logos/${companyId}/${filename}`;

    // Update company record
    await connection.execute('UPDATE companies SET logo_url = ? WHERE id = ?', [
      relativeUrl,
      companyId,
    ]);

    console.log(`Company logo uploaded for company ${companyId}: ${relativeUrl}`);

    res.json({
      success: true,
      message: 'Logo uploaded successfully',
      logo_url: relativeUrl,
    });
  } catch (error) {
    console.error('Upload company logo error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  } finally {
    if (connection) await close(connection);
  }
};

module.exports = { uploadCompanyLogoEndpoint };
'''

with open(endpoint_path, 'w') as f:
    f.write(new_endpoint)
print('Endpoint rewritten to use local storage')

# 2. Add express.static for uploads in index.js
index_path = '/srv/www/htdocs/swiftapp/server/index.js'
backup2 = index_path + '.bak_logo_' + datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
shutil.copy2(index_path, backup2)
print(f'Index backup: {backup2}')

with open(index_path, 'r') as f:
    content = f.read()

# Check if already added
if '/swift-app/uploads' not in content:
    # Add after existing express.static('public')
    anchor = "app.use(express.static('public'));"
    static_route = anchor + "\napp.use('/swift-app/uploads', express.static('uploads'));"
    content = content.replace(anchor, static_route, 1)
    with open(index_path, 'w') as f:
        f.write(content)
    print('Added express.static for /swift-app/uploads')
else:
    print('Static route for uploads already exists')

# 3. Create uploads/logos directory
import os
logos_dir = '/srv/www/htdocs/swiftapp/server/uploads/logos'
os.makedirs(logos_dir, exist_ok=True)
print(f'Created {logos_dir}')

print('\nDone! Restart PM2 to apply changes.')
