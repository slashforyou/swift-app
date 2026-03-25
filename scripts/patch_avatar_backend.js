// Script to patch updateUserProfile.js and getUserProfile.js on the server
// Run on the server: node /tmp/patch_avatar_backend.js
const fs = require("fs");

// =============================================
// 1. PATCH updateUserProfile.js
// =============================================
const updateFile =
  "/srv/www/htdocs/swiftapp/server/endPoints/v1/updateUserProfile.js";
let updateContent = fs.readFileSync(updateFile, "utf8");

// Add avatarId to fieldMapping
updateContent = updateContent.replace(
  "'email': 'email'",
  "'email': 'email',\n            'avatarId': 'avatar_url'",
);

// Add avatarId validation before email validation
updateContent = updateContent.replace(
  "if (frontendField === 'email') {",
  "if (frontendField === 'avatarId') {\n                    const avatarVal = profileData[frontendField];\n                    if (typeof avatarVal !== 'string' || !/^\\d{1,2}$/.test(avatarVal)) {\n                        return { status: 400, json: { message: 'Invalid avatar ID' } };\n                    }\n                }\n                if (frontendField === 'email') {",
);

// Add avatar_url to SELECT after update
updateContent = updateContent.replace(
  "SELECT id, first_name, last_name, email, role, updated_at",
  "SELECT id, first_name, last_name, email, role, avatar_url, updated_at",
);

// Add avatarId to response
updateContent = updateContent.replace(
  "role: updatedUser[0].role,",
  "role: updatedUser[0].role,\n                avatarId: updatedUser[0].avatar_url || null,",
);

fs.writeFileSync(updateFile, updateContent);
console.log("✅ updateUserProfile.js patched");

// =============================================
// 2. PATCH getUserProfile.js - add avatar_url to SELECT and response
// =============================================
const getFile =
  "/srv/www/htdocs/swiftapp/server/endPoints/v1/getUserProfile.js";
let getContent = fs.readFileSync(getFile, "utf8");

// Add avatar_url to the user SELECT query
getContent = getContent.replace(
  "u.title, u.streak, u.last_activity, u.last_level_up",
  "u.title, u.streak, u.last_activity, u.last_level_up, u.avatar_url",
);

// Add avatarId to the profile response - in the user object
getContent = getContent.replace(
  "currentDevice: user.device,",
  "currentDevice: user.device,\n                avatarId: userData.avatar_url || null,",
);

fs.writeFileSync(getFile, getContent);
console.log("✅ getUserProfile.js patched");

console.log("DONE - Both files patched successfully");
