// Swift App server (no proxy version)


require('dotenv').config();


const express = require('express');


const bodyParser = require('body-parser');


const { access } = require('fs');


const logger = require('./utils/consoleStyle');





// 🛡️ Security Systems


const IntrusionDetectionSystem = require('./security/IntrusionDetectionSystem');


const AdvancedEncryption = require('./security/AdvancedEncryption');


const securityHeaders = require('./middleware/securityHeaders');


const { presets: rateLimitPresets, createLimiter } = require('./middleware/rateLimiter');


const { auditLogger } = require('./middleware/auditLogger');





// Swagger et Monitoring


const { swaggerUi, specs } = require('./swagger-config');


const { healthEndpoint, healthSimpleEndpoint, metricsEndpoint } = require('./endPoints/monitoring');





const app = express();


const port = 3021;





const version = '1.0.0';





// 🔐 Initialize Security Systems


const ids = new IntrusionDetectionSystem();


const encryption = new AdvancedEncryption();





// Configure IDS alerts


ids.addAlertHandler((alert) => {


  console.log(`🚨 SECURITY ALERT: ${alert.type}`, alert.data);


  // Ici on pourrait envoyer des emails, webhooks, etc.


});





// 🛡️ Security Headers (Phase 3)


app.use(securityHeaders());





// 📝 Audit Logger (Phase 3)


app.use(auditLogger.middleware({


  excludePaths: ['/api/health', '/api/metrics', '/api-docs'],


  logBody: true


}));





// 🛡️ Security Middleware (TEMPORAIREMENT DÉSACTIVÉ POUR DÉVELOPPEMENT)


app.use((req, res, next) => {


  // DÉVELOPPEMENT SEULEMENT - IDS désactivé


  const clientIP = req.ip || req.connection?.remoteAddress || '127.0.0.1';


  console.log(`🔓 DEV MODE - Request from IP: ${clientIP} to ${req.path}`);


  next();


  


  // TODO: Réactiver en production avec configuration moins stricte


  /*


  // Exclure les endpoints d'authentification et calendar de l'IDS aggressive


  if (req.path.includes('/swift-app/auth/') || req.path.includes('/swift-app/login') || req.path.includes('/swift-app/calendar-days') || req.path.includes('/swift-app/v1/calendar') || req.path.includes('/swift-app/v1/jobs')) {


    // Appliquer une version allégée de l'IDS pour l'auth et calendar


    const clientIP = req.ip || req.connection?.remoteAddress || '127.0.0.1';


    console.log(`🔐 Exempted request from IP: ${clientIP} to ${req.path}`);


    next();


  } else {


    // Appliquer l'IDS complet pour les autres endpoints


    ids.middleware()(req, res, next);


  }


  */


});





// Middleware pour compter les requêtes (pour métriques)


app.use((req, res, next) => {


  app.locals.requestCount = (app.locals.requestCount || 0) + 1;


  next();


});





// Middleware to parse JSON bodies (skip for Stripe webhooks - needs raw body)


app.use((req, res, next) => {


  if (req.path === '/swift-app/v1/stripe/webhooks') {


    // Skip JSON parsing for Stripe webhooks - they need raw body for signature verification


    return next();


  }


  bodyParser.json()(req, res, next);


});





// Raw body parser specifically for Stripe webhooks (must be before routes)


app.use('/swift-app/v1/stripe/webhooks', express.raw({ type: 'application/json' }));





// Middleware to handle CORS


app.use((req, res, next) => {


  res.header('Access-Control-Allow-Origin', '*');


  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');


  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');


  if (req.method === 'OPTIONS') return res.sendStatus(204);


  next();


});





// 📊 MONITORING & DOCUMENTATION


// Swagger Documentation UI


app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {


  customCss: '.swagger-ui .topbar { display: none }',


  customSiteTitle: 'SwiftApp API Documentation'


}));





// Health Check Endpoints


app.get('/api/health', healthEndpoint);


app.get('/api/health/simple', healthSimpleEndpoint);


app.get('/api/metrics', metricsEndpoint);





// � API Discovery Endpoints


const { discoverRoutes, discoverSummary, discoverByCategory } = require('./endPoints/v1/api/discover');


app.get('/swift-app/v1/api/discover', discoverRoutes);


app.get('/swift-app/v1/api/discover/summary', discoverSummary);


app.get('/swift-app/v1/api/discover/category/:category', discoverByCategory);





// 🛡️ Security Monitoring Endpoints


app.get('/api/security/stats', (req, res) => {


  // Require admin access for security stats


  const auth = req.headers.authorization;


  if (!auth || !auth.includes('admin-token')) {


    return res.status(403).json({ error: 'Admin access required' });


  }


  


  res.json({


    ids: ids.getStats(),


    encryption: encryption.getStats(),


    timestamp: new Date().toISOString()


  });


});





app.post('/api/security/rotate-keys', async (req, res) => {


  // Require admin access for key rotation


  const auth = req.headers.authorization;


  if (!auth || !auth.includes('admin-token')) {


    return res.status(403).json({ error: 'Admin access required' });


  }


  


  try {


    const result = await encryption.rotateKeys();


    res.json(result);


  } catch (error) {


    res.status(500).json({ error: 'Key rotation failed', details: error.message });


  }


});





// 📊 Audit Logs Endpoints (Phase 3)


app.get('/swift-app/v1/audit/logs', (req, res) => {


  console.log('[ Get Audit Logs endpoint called ]');


  const { getAuditLogsEndpoint } = require('./endPoints/v1/auditLogs');


  getAuditLogsEndpoint(req, res);


});





app.get('/swift-app/v1/audit/stats', (req, res) => {


  console.log('[ Get Audit Stats endpoint called ]');


  const { getAuditStatsEndpoint } = require('./endPoints/v1/auditLogs');


  getAuditStatsEndpoint(req, res);


});





app.delete('/swift-app/v1/audit/purge', (req, res) => {


  console.log('[ Purge Audit Logs endpoint called ]');


  const { purgeAuditLogsEndpoint } = require('./endPoints/v1/auditLogs');


  purgeAuditLogsEndpoint(req, res);


});





// 🧪 Test endpoints


app.get('/swift-app/get-test', (req, res) => {


  console.log('[ Get Test endpoint called ]');


  res.json({ message: 'GET request to /swift-app/get-test successful' });


});


app.post('/swift-app/post-test', (req, res) => {


  console.log('[ Post Test endpoint called ]');


  res.json({ message: 'POST request to /swift-app/post-test successful', data: req.body });


});


app.put('/swift-app/put-test', (req, res) => {


  console.log('[ Put Test endpoint called ]');


  res.json({ message: 'PUT request to /swift-app/put-test successful', data: req.body });


});


app.delete('/swift-app/delete-test', (req, res) => {


  console.log('[ Delete Test endpoint called ]');


  res.json({ message: 'DELETE request to /swift-app/delete-test successful' });


});


app.patch('/swift-app/patch-test', (req, res) => {


  console.log('[ Patch Test endpoint called ]');


  res.json({ message: 'PATCH request to /swift-app/patch-test successful', data: req.body });


});





// 🧪 Test endpoints V1





app.get('/swift-app/v1/tests', (req, res) => {


  console.log('[ V1 Get Tests endpoint called ]');


  res.json({ message: 'GET request to /swift-app/v1/tests successful' });


});


app.post('/swift-app/v1/tests', (req, res) => {


  console.log('[ V1 Post Tests endpoint called ]');


  res.json({ message: 'POST request to /swift-app/v1/tests successful', data: req.body });


});


app.put('/swift-app/v1/tests', (req, res) => {


  console.log('[ V1 Put Tests endpoint called ]');


  res.json({ message: 'PUT request to /swift-app/v1/tests successful', data: req.body });


});


app.delete('/swift-app/v1/tests', (req, res) => {


  console.log('[ V1 Delete Tests endpoint called ]');


  res.json({ message: 'DELETE request to /swift-app/v1/tests successful' });


});


app.patch('/swift-app/v1/tests', (req, res) => {


  console.log('[ V1 Patch Tests endpoint called ]');


  res.json({ message: 'PATCH request to /swift-app/v1/tests successful', data: req.body });


});





//------------------------------------------------------------------------------------


// API Endpoints


//------------------------------------------------------------------------------------





// 🔐 [POST] /swift-app/subscribe


app.post('/swift-app/subscribe', async (req, res) => {


  console.log('[ Subscribe endpoint called ]');


  console.log('Request body:', req.body);





  const { mail, firstName, lastName, password, companyName, accountType } = req.body;


  const isBusinessOwner = accountType !== 'employee';


  if (!mail || !firstName || !lastName || !password || (isBusinessOwner && !companyName))


    return res.status(400).json({ error: 'Required fields missing' });


  if (!mail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/))


    return res.status(400).json({ error: 'Invalid mail address' });


  if (!password.match(/^[a-zA-Z0-9À-ÿéèêëôùûüçàâäæœ\-_\.!@#$%^&*()+=\[\]{}<>?~]{8,}$/))


    return res.status(400).json({ error: 'Password must be at least 8 characters long and valid' });


  if (mail.includes("'") || firstName.includes("'") || lastName.includes("'") || password.includes("'") || (companyName && companyName.includes("'")))


    return res.status(400).json({ error: 'Invalid characters in inputs' });





  const { subscribeEndpoint } = require('./endPoints/subscribe');


  try {


  const response = await subscribeEndpoint(req);





  // Return response as-is (subscribeEndpoint handles all error cases)


  return res.json(response);





} catch (err) {


  if (res.headersSent) return;


  console.error('[Subscribe error]', err);


  return res.status(500).json({ error: 'Internal Server Error', details: err.message });


}


});





// 🔐 [POST] /swift-app/verifyMail


app.post('/swift-app/verifyMail', async (req, res) => {


  console.log('[ Verify Mail endpoint called ]', req.body);


  const { mail, code } = req.body;


  if (!mail || !code){


    console.log('[ Verify Mail endpoint failed validation - missing mail or code ]');


    return res.status(400).json({ error: 'Mail and code are required' });


  }


  if (!mail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)){


    console.log('[ Verify Mail endpoint failed validation - invalid mail format ]');


    return res.status(400).json({ error: 'Invalid mail address' });


  }


  if (!code.match(/^[0-9]{6}$/)){


    console.log('[ Verify Mail endpoint failed validation - invalid code format ]');


    return res.status(400).json({ error: 'Code must be a 6-digit number' });


  }


  if (mail.includes("'") || code.includes("'")){


    console.log('[ Verify Mail endpoint failed validation - invalid characters ]');


    return res.status(400).json({ error: 'Invalid characters in mail or code' });


  }


  const { verifyMailEndpoint } = require('./endPoints/verifyMail');


  try {


    const response = await verifyMailEndpoint(mail, code, req.body.device);


    if (!response || typeof response !== 'object' || !response.success)


      return res.status(400).json({ error: 'Verification failed', details: response });


    


    // Return auto-login data if available


    const result = {


      message: 'Email verified successfully',


      success: true


    };


    if (response.autoLogin) {


      result.autoLogin = true;


      result.deviceId = response.deviceId;


      result.sessionToken = response.sessionToken;


      result.sessionExpiry = response.sessionExpiry;


      result.refreshToken = response.refreshToken;


      result.refreshExpiry = response.refreshExpiry;


      result.user = response.user;


    }


    return res.json(result);


  } catch (err) {


    if (res.headersSent) return;


    console.error('[Verify Mail error]', err);


    return res.status(500).json({ error: 'Internal Server Error', details: err.message });


  }


});





// 🔐 [POST] /swift-app/auth/login (Rate Limited - 5 attempts/15min)


app.post('/swift-app/auth/login', rateLimitPresets.auth, (req, res) => {


  console.log('🚀 [STEP 1] Login endpoint called');


  console.log('🚀 [STEP 1] Raw request body:', JSON.stringify(req.body, null, 2));


  const { mail, password, device } = req.body;


  console.log('🚀 [STEP 1] Extracted data:', { 


    mail: mail || 'MISSING', 


    password: password ? `[${password.length} chars]` : 'MISSING', 


    device: device || 'MISSING' 


  });


  if (!mail || !password || !device) {


    console.log('❌ [STEP 2] VALIDATION FAILED - missing fields:', { mail: !!mail, password: !!password, device: !!device });


    return res.status(400).json({ error: 'Mail, password, and device are required' });


  } 


  console.log('✅ [STEP 2] Required fields present');


  


  if (!mail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {


    console.log('❌ [STEP 2] VALIDATION FAILED - invalid mail format:', mail);


    return res.status(400).json({ error: 'Invalid mail address' });


  }


  console.log('✅ [STEP 2] Mail format valid');


  


  if (!password.match(/^[a-zA-Z0-9À-ÿéèêëôùûüçàâäæœ\-_\.!@#$%^&*()+=\[\]{}<>?~]{8,}$/)) {


    console.log('❌ [STEP 2] VALIDATION FAILED - invalid password format. Password chars:', password.split('').map(c => `${c}(${c.charCodeAt(0)})`).join(', '));


    return res.status(400).json({ error: 'Password must be at least 8 characters long and valid' });


  }


  console.log('✅ [STEP 2] Password format valid');


  


  if (typeof device !== 'object' || device === null || Array.isArray(device) || JSON.stringify(device).includes("'")) {


    console.log('❌ [STEP 2] VALIDATION FAILED - invalid device format:', device);


    return res.status(400).json({ error: 'Invalid device format' });


  }


  console.log('✅ [STEP 2] Device format valid');


  


  if (mail.includes("'") || password.includes("'")) {


    console.log('❌ [STEP 2] VALIDATION FAILED - invalid characters in credentials');


    return res.status(400).json({ error: 'Invalid characters in mail or password' });


  }


  console.log('✅ [STEP 2] All validations passed, calling loginEndpoint');


  


  // STEP 3: Call the login endpoint


  console.log('🚀 [STEP 3] Loading login endpoint module...');


  const { loginEndpoint } = require('./endPoints/auth/login');


  console.log('🚀 [STEP 3] Calling loginEndpoint with request...');


  


  loginEndpoint(req)


    .then(response => {


      console.log('🚀 [STEP 4] LoginEndpoint response received:', JSON.stringify(response, null, 2));


      


      if (!response || typeof response !== 'object' || !response.success) {


        console.log('❌ [STEP 4] FAILED - invalid response structure');


        return res.status(400).json({ error: 'Login failed', details: response });


      }





      console.log('✅ [STEP 4] Login successful, sending response to client');


      return res.json({


        message: 'Login successful',


        success: true,


        deviceId: response.deviceId,


        sessionToken: response.sessionToken,


        sessionExpiry: response.sessionExpiry,


        refreshToken: response.refreshToken,


        refreshExpiry: response.refreshExpiry,


        user: response.user,


      });


    })


    .catch(err => {


      if (res.headersSent) return;


      console.error('❌ [STEP 4] LOGIN ERROR CAUGHT:', err);


      return res.status(500).json({ error: 'Internal Server Error', details: err.message });


    });


});





// 🔐 [POST] /swift-app/auth/forgot-password (Rate Limited)


app.post('/swift-app/auth/forgot-password', rateLimitPresets.auth, async (req, res) => {


  try {


    const { forgotPasswordEndpoint } = require('./endPoints/auth/forgotPassword');


    const result = await forgotPasswordEndpoint(req);


    return res.status(result.status).json(result.json);


  } catch (error) {


    console.error('❌ [FORGOT PASSWORD] Route error:', error);


    return res.status(500).json({ message: 'Internal server error' });


  }


});





// 🔐 [POST] /swift-app/auth/reset-password (Rate Limited)


app.post('/swift-app/auth/reset-password', rateLimitPresets.auth, async (req, res) => {


  try {


    const { resetPasswordEndpoint } = require('./endPoints/auth/resetPassword');


    const result = await resetPasswordEndpoint(req);


    return res.status(result.status).json(result.json);


  } catch (error) {


    console.error('❌ [RESET PASSWORD] Route error:', error);


    return res.status(500).json({ message: 'Internal server error' });


  }


});





// 🔐 [GET] /swift-app/auth/me


app.get('/swift-app/auth/me', async (req, res) => {


  console.log('[ Get Me endpoint called ]');


  const { headers } = req;





  console.log('Request headers:', headers);





  if (!headers) {


    console.log('[ Get Me endpoint failed - user not found ]');


    return res.status(404).json({ error: 'User not found' });


  } else if (!headers.authorization || !headers.authorization.startsWith('Bearer ')) {


    console.log('[ Get Me endpoint failed - invalid authorization header ]');


    return res.status(400).json({ error: 'Invalid authorization header' });


  }





  const token = headers.authorization.split(' ')[1];





  console.log('Token:', token);





  if (!token || typeof token !== 'string' || token.length === 0 || !token.match(/^[a-zA-Z0-9\-_]+$/)) {


    console.log('[ Get Me endpoint failed - invalid token format ]');


    return res.status(400).json({ error: 'Invalid token format' });


  } else if (token.includes("'")) {


    console.log('[ Get Me endpoint failed - invalid characters in token ]');


    return res.status(400).json({ error: 'Invalid characters in token' });


  }





  const { getMeEndpoint } = require('./endPoints/auth/me');


  const response = await getMeEndpoint(token);





  return res.json({


    message: 'User retrieved successfully',


    success: true,


    user: response.user


  });


});





// 🔐 [POST] /swift-app/auth/refresh


app.post('/swift-app/auth/refresh', (req, res) => {


  console.log('[ Token Refresh endpoint called ]');


  const { refresh_token, device } = req.body;


  if (!refresh_token || !device) {


    console.log('ERROR - Token Refresh endpoint failed validation - missing fields');


    return res.status(400).json({ error: 'Refresh token and device are required' });


  } else if (typeof refresh_token !== 'string' || refresh_token.length === 0 || !refresh_token.match(/^[a-zA-Z0-9\-_]+$/)) {


    console.log('ERROR - Token Refresh endpoint failed validation - invalid token format');


    return res.status(400).json({ error: 'Invalid refresh token format' });


  } else if (typeof device !== 'object' || device === null || Array.isArray(device) || JSON.stringify(device).includes("'")) {


    console.log('ERROR - Token Refresh endpoint failed validation - invalid device format');


    return res.status(400).json({ error: 'Invalid device format' });


  } else if (refresh_token.includes("'")) {


    console.log('ERROR - Token Refresh endpoint failed validation - invalid characters');


    return res.status(400).json({ error: 'Invalid characters in refresh token' });


  } else {


    const { refreshEndpoint } = require('./endPoints/auth/refresh');


    refreshEndpoint(refresh_token, device)


      .then(response => {


        if (!response || typeof response !== 'object' || !response.success || typeof response.user !== 'object' || !response.token) {


          return res.status(400).json({ error: 'Token refresh failed', details: response });


        }


        if (!response.user.id || !response.user.mail || !response.user.firstName || !response.user.lastName) {


          return res.status(400).json({ error: 'Invalid user data returned', details: response.user });


        }


        return res.json({


          message: 'Token refreshed successfully',


          success: true,


          user: response.user,


          refresh_token: response.token,
          sessionToken: response.sessionToken


        });


      })


      .catch(err => {


        if (res.headersSent) return;


        console.error('[Token Refresh error]', err);


        return res.status(500).json({ error: 'Internal Server Error', details: err.message });


      });


  }


});





// ==============================================


// 🏢 BUSINESS OWNER ENDPOINTS


// ==============================================


const { authenticateToken: businessOwnerAuth } = require('./middleware/authenticateToken');


const businessOwnerEndpoints = require('./endPoints/businessOwner');





// 🏢 [POST] /swift-app/business-owner/complete-profile


// Complète le profil d'un Business Owner après l'inscription (Steps 2-7)


app.post('/swift-app/business-owner/complete-profile', businessOwnerAuth, businessOwnerEndpoints.completeProfile);





// 🏢 [GET] /swift-app/business-owner/profile  


// Récupère le profil complet du Business Owner


app.get('/swift-app/business-owner/profile', businessOwnerAuth, businessOwnerEndpoints.getProfile);





// 🏢 [PATCH] /swift-app/business-owner/profile


// Met à jour partiellement le profil Business Owner


app.patch('/swift-app/business-owner/profile', businessOwnerAuth, businessOwnerEndpoints.updateProfile);





// ==============================================


// END BUSINESS OWNER ENDPOINTS


// ==============================================





// ==============================================


// 📋 ONBOARDING ENDPOINTS


// ==============================================


const { getOnboardingChecklist } = require('./endPoints/v1/onboardingChecklist');





// 📋 [GET] /swift-app/v1/onboarding/checklist


app.get('/swift-app/v1/onboarding/checklist', businessOwnerAuth, getOnboardingChecklist);





// ==============================================


// END ONBOARDING ENDPOINTS


// ==============================================





// ==============================================


// 📝 CONTRACT ENDPOINTS


// ==============================================


const { getClauses, createClause, updateClause, deleteClause, reorderClauses } = require('./endPoints/v1/contractClauses');


const { generateContract, getJobContract, signContract } = require('./endPoints/v1/jobContracts');





// Clause CRUD


app.get('/swift-app/v1/contracts/clauses', businessOwnerAuth, getClauses);


app.post('/swift-app/v1/contracts/clauses', businessOwnerAuth, createClause);


app.patch('/swift-app/v1/contracts/clauses/:id', businessOwnerAuth, updateClause);


app.delete('/swift-app/v1/contracts/clauses/:id', businessOwnerAuth, deleteClause);


app.post('/swift-app/v1/contracts/reorder', businessOwnerAuth, reorderClauses);





// Job contracts


app.post('/swift-app/v1/contracts/generate/:jobId', businessOwnerAuth, generateContract);


app.get('/swift-app/v1/contracts/job/:jobId', businessOwnerAuth, getJobContract);


app.post('/swift-app/v1/contracts/sign/:contractId', businessOwnerAuth, signContract);





// ==============================================


// END CONTRACT ENDPOINTS


// ==============================================





// 🔐 [GET] /swift-app/token


app.get('/swift-app/token', (req, res) => {


  console.log('[ Token endpoint called ]');


  const { mail, password } = req.query;





  if (!mail || !password)


    return res.status(400).json({ error: 'Mail and password are required' });





  if (!mail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/))


    return res.status(400).json({ error: 'Invalid mail address' });





  if (!password.match(/^[a-zA-Z0-9]{8,}$/))


    return res.status(400).json({ error: 'Password must be at least 8 characters long and contain only alphanumeric characters' });





  if (mail.includes("'") || password.includes("'"))


    return res.status(400).json({ error: 'Invalid characters in mail or password' });





  const { tokenEndpoint } = require('./endPoints/token');





  tokenEndpoint(mail, password)


    .then(token => {


      if (!token || typeof token !== 'string' || token.length === 0 || !token.match(/^[a-zA-Z0-9\-_]+$/))


        return res.status(400).json({ error: 'Invalid token generated' });





      res.json({ message: 'Token generated successfully', succeed: true, token });


    })


    .catch(err => {


      res.status(500).json({ error: 'Internal Server Error', details: err.message });


    });


});





// 👤 [GET] /swift-app/user


app.get('/swift-app/user', (req, res) => {


  console.log('[ User info endpoint called ]');


  const { token, user_id } = req.query;





  if (!token || !user_id)


    return res.status(400).json({ error: 'Token and user_id are required' });





  if (token.includes("'") || user_id.includes("'"))


    return res.status(400).json({ error: 'Invalid characters in user_id or token' });





  const { userInfoEndpoint } = require('./endPoints/userInfo');





  userInfoEndpoint(token, user_id)


    .then(userInfo => {


      if (!userInfo || typeof userInfo !== 'object' || !userInfo.id || !userInfo.firstName || !userInfo.lastName || !userInfo.email)


        return res.status(400).json({ error: 'Invalid user information retrieved' });





      res.json({ message: 'User information retrieved successfully', succeed: true, userInfo });


    })


    .catch(err => {


      res.status(500).json({ error: 'Internal Server Error', details: err.message });


    });


});





// 📅 [POST] /swift-app/calendar-days


app.post('/swift-app/calendar-days', async (req, res) => {


  logger.endpoint.start('POST /swift-app/calendar-days');


  


  // We verify the headers


  const { headers, body } = req;





  if (!headers) {


    logger.endpoint.validation('POST /swift-app/calendar-days', 'Missing headers');


    return res.status(400).json({ error: 'Missing headers' });


  } else if (!headers.authorization || !headers.authorization.startsWith('Bearer ')) {


    logger.endpoint.validation('POST /swift-app/calendar-days', 'Invalid authorization header');


    return res.status(400).json({ error: 'Invalid authorization header' });


  } else if (!body || typeof body !== 'object') {


    logger.endpoint.validation('POST /swift-app/calendar-days', 'Invalid body');


    return res.status(400).json({ error: 'Invalid body' });


  }





  logger.debug('REQUEST', 'Headers received', { authorization: headers.authorization ? 'Bearer ***' : 'Missing' });





  const token = headers.authorization.split(' ')[1];


  const { startDate, endDate } = body;





  if (!token || typeof token !== 'string' || token.length === 0 || !token.match(/^[a-zA-Z0-9\-_]+$/)) {


    logger.endpoint.validation('POST /swift-app/calendar-days', 'Invalid token format');


    return res.status(400).json({ error: 'Invalid token format' });


  } else if (token.includes("'")) {


    logger.endpoint.validation('POST /swift-app/calendar-days', 'Invalid characters in token');


    return res.status(400).json({ error: 'Invalid characters in token' });


  } else if (!startDate || !endDate) {


    logger.endpoint.validation('POST /swift-app/calendar-days', 'Missing startDate or endDate');


    return res.status(400).json({ error: 'startDate and endDate are required' });


  } else if (!startDate.match(/^[0-9]{2}-[0-9]{2}-[0-9]{4}$/) || !endDate.match(/^[0-9]{2}-[0-9]{2}-[0-9]{4}$/)) {


    logger.endpoint.validation('POST /swift-app/calendar-days', 'Invalid date format');


    return res.status(400).json({ error: 'startDate and endDate must be in DD-MM-YYYY format' });


  } else if (startDate.includes("'") || endDate.includes("'")) {


    logger.endpoint.validation('POST /swift-app/calendar-days', 'Invalid characters in dates');


    return res.status(400).json({ error: 'Invalid characters in dates' });


  }





  const { calendarDaysEndpoint } = require('./endPoints/calendarDays');


  const calendarResponse = await calendarDaysEndpoint(token, startDate, endDate);





  logger.debug('RESPONSE', 'Calendar Days response', { status: calendarResponse.status, jobsCount: calendarResponse.json.jobs?.length || 0 });





  // Return the response to the client


  return res.status(calendarResponse.status).json(calendarResponse.json);


});





// 👤 Users Management





// 👤 [GET] Get User Profile


app.get('/swift-app/v1/user/profile', (req, res) => {


  console.log('[ Get User Profile endpoint called ]');





  const { getUserProfileEndpoint } = require('./endPoints/v1/getUserProfile');


  const token = req.headers.authorization?.replace('Bearer ', '');





  getUserProfileEndpoint(token)


    .then(result => {


      res.status(result.status).json(result.json);


    })


    .catch(error => {


      console.error('Error in getUserProfile:', error);


      res.status(500).json({ message: 'Internal server error' });


    });


});





// 👤 [PUT] Update User Profile


app.put('/swift-app/v1/user/profile', (req, res) => {


  console.log('[ Update User Profile endpoint called ]');





  const { updateUserProfileEndpoint } = require('./endPoints/v1/updateUserProfile');


  const token = req.headers.authorization?.replace('Bearer ', '');


  const profileData = req.body;





  updateUserProfileEndpoint(token, profileData)


    .then(result => {


      res.status(result.status).json(result.json);


    })


    .catch(error => {


      console.error('Error in updateUserProfile:', error);


      res.status(500).json({ message: 'Internal server error' });


    });


});








// 👤 [GET] /swift-app/v1/users/me — Alias for web dashboard


// Returns combined user info (profile + meta)


app.get('/swift-app/v1/users/me', async (req, res) => {


  console.log('[ Get Users/Me endpoint called (web dashboard alias) ]');


  const token = req.headers.authorization?.replace('Bearer ', '');





  if (!token) {


    return res.status(401).json({ success: false, error: 'Authorization required' });


  }





  try {


    // Reuse the existing getUserProfile endpoint


    const { getUserProfileEndpoint } = require('./endPoints/v1/getUserProfile');


    const result = await getUserProfileEndpoint(token);


    return res.status(result.status).json(result.json);


  } catch (error) {


    console.error('Error in /users/me:', error);


    return res.status(500).json({ success: false, error: 'Internal server error' });


  }


});





// 👤 [GET] Get User Stats


app.get('/swift-app/v1/user/stats', (req, res) => {


  console.log('[ Get User Stats endpoint called ]');





  const { getUserStatsEndpoint } = require('./endPoints/v1/getUserStats');


  const token = req.headers.authorization?.replace('Bearer ', '');





  getUserStatsEndpoint(token)


    .then(result => {


      res.status(result.status).json(result.json);


    })


    .catch(error => {


      console.error('Error in getUserStats:', error);


      res.status(500).json({ message: 'Internal server error' });


    });


});





// � [GET] Get User Sessions


app.get('/swift-app/v1/user/sessions', (req, res) => {


  console.log('[ Get User Sessions endpoint called ]');





  const { getUserSessionsEndpoint } = require('./endPoints/v1/getUserSessions');


  const token = req.headers.authorization?.replace('Bearer ', '');





  getUserSessionsEndpoint(token)


    .then(result => {


      res.status(result.status).json(result.json);


    })


    .catch(error => {


      console.error('Error in getUserSessions:', error);


      res.status(500).json({ message: 'Internal server error' });


    });


});





// 🎮 [GET] /swift-app/v1/gamification — Alias for web dashboard


app.get('/swift-app/v1/gamification', (req, res) => {


  console.log('[ Get Gamification endpoint called (web dashboard alias) ]');


  const { getGamificationEndpoint } = require('./endPoints/v1/gamification');


  getGamificationEndpoint(req, res);


});





// 🎮 [GET] Get User Gamification Data


app.get('/swift-app/v1/user/gamification', (req, res) => {


  console.log('[ Get User Gamification endpoint called ]');


  const { getGamificationEndpoint } = require('./endPoints/v1/gamification');


  getGamificationEndpoint(req, res);


});





// 🎮 [GET] Get Leaderboard


app.get('/swift-app/v1/user/gamification/leaderboard', (req, res) => {


  console.log('[ Get Leaderboard endpoint called ]');


  const { getLeaderboardEndpoint } = require('./endPoints/v1/gamification');


  getLeaderboardEndpoint(req, res);


});





// 🎮 [GET] Get XP History


app.get('/swift-app/v1/user/gamification/history', (req, res) => {


  console.log('[ Get XP History endpoint called ]');


  const { getXpHistoryEndpoint } = require('./endPoints/v1/gamification');


  getXpHistoryEndpoint(req, res);


});



// 🎮 Gamification V2

app.get('/swift-app/v1/user/gamification/v2/profile', (req, res) => {

  const { getV2ProfileEndpoint } = require('./endPoints/v1/gamificationV2');

  getV2ProfileEndpoint(req, res);

});

app.get('/swift-app/v1/user/gamification/v2/leaderboard', (req, res) => {

  const { getV2LeaderboardEndpoint } = require('./endPoints/v1/gamificationV2');

  getV2LeaderboardEndpoint(req, res);

});

app.get('/swift-app/v1/user/gamification/v2/history', (req, res) => {

  const { getV2HistoryEndpoint } = require('./endPoints/v1/gamificationV2');

  getV2HistoryEndpoint(req, res);

});
app.get('/swift-app/v1/user/gamification/v2/quests', (req, res) => {
  const { getV2QuestsEndpoint } = require('./endPoints/v1/gamificationV2');
  getV2QuestsEndpoint(req, res);
});

app.post('/swift-app/v1/user/gamification/v2/quests/:questCode/claim', (req, res) => {
  const { claimV2QuestEndpoint } = require('./endPoints/v1/gamificationV2');
  claimV2QuestEndpoint(req, res);
});

app.get('/swift-app/v1/user/gamification/v2/trophies', (req, res) => {
  const { getV2TrophiesEndpoint } = require('./endPoints/v1/gamificationV2');
  getV2TrophiesEndpoint(req, res);
});

app.get('/swift-app/v1/user/gamification/v2/daily-recap', (req, res) => {
  const { getV2DailyRecapEndpoint } = require('./endPoints/v1/gamificationV2');
  getV2DailyRecapEndpoint(req, res);
});

// 🎮 Gamification V2 Foundation — Phase 1 (nouveaux endpoints)
const {
  getProfile: getGamV2FProfile,
  getXpHistory: getGamV2FXpHistory,
  getBadges: getGamV2FBadges,
  getLeaderboard: getGamV2FLeaderboard,
  getJobScorecard: getGamV2FScorecard,
  getClientReviewForm,
  submitClientReview,
  createClientReviewLink,
} = require('./endPoints/v1/gamificationV2Foundation');

app.get('/swift-app/v1/gamification/profile', ...getGamV2FProfile);
app.get('/swift-app/v1/gamification/xp/history', ...getGamV2FXpHistory);
app.get('/swift-app/v1/gamification/badges', ...getGamV2FBadges);
app.get('/swift-app/v1/gamification/leaderboard', ...getGamV2FLeaderboard);
app.get('/swift-app/v1/gamification/scorecard/:jobId', ...getGamV2FScorecard);
app.get('/swift-app/v1/gamification/client-review/:token', getClientReviewForm);
app.post('/swift-app/v1/gamification/client-review', submitClientReview);
app.post('/swift-app/v1/gamification/client-review/create', ...createClientReviewLink);









// � [ADMIN] Gamification Admin Endpoints


app.get('/swift-app/v1/admin/gamification/config', (req, res) => {


  console.log('[ Admin Get Gamification Config endpoint called ]');


  const { getGamificationConfigEndpoint } = require('./endPoints/v1/gamificationAdmin');


  getGamificationConfigEndpoint(req, res);


});





app.put('/swift-app/v1/admin/gamification/levels/:level', (req, res) => {


  console.log('[ Admin Update Level endpoint called ]');


  const { updateLevelEndpoint } = require('./endPoints/v1/gamificationAdmin');


  updateLevelEndpoint(req, res);


});





app.put('/swift-app/v1/admin/gamification/ranks/:id', (req, res) => {


  console.log('[ Admin Update Rank endpoint called ]');


  const { updateRankEndpoint } = require('./endPoints/v1/gamificationAdmin');


  updateRankEndpoint(req, res);


});





app.put('/swift-app/v1/admin/gamification/badges/:id', (req, res) => {


  console.log('[ Admin Update Badge endpoint called ]');


  const { updateBadgeEndpoint } = require('./endPoints/v1/gamificationAdmin');


  updateBadgeEndpoint(req, res);


});





app.put('/swift-app/v1/admin/gamification/rewards/:id', (req, res) => {


  console.log('[ Admin Update XP Reward endpoint called ]');


  const { updateRewardEndpoint } = require('./endPoints/v1/gamificationAdmin');


  updateRewardEndpoint(req, res);


});





app.post('/swift-app/v1/admin/gamification/refresh-cache', (req, res) => {


  console.log('[ Admin Refresh Gamification Cache endpoint called ]');


  const { refreshCacheEndpoint } = require('./endPoints/v1/gamificationAdmin');


  refreshCacheEndpoint(req, res);


});





app.post('/swift-app/v1/admin/gamification/levels', (req, res) => {


  console.log('[ Admin Create Level endpoint called ]');


  const { createLevelEndpoint } = require('./endPoints/v1/gamificationAdmin');


  createLevelEndpoint(req, res);


});





app.post('/swift-app/v1/admin/gamification/ranks', (req, res) => {


  console.log('[ Admin Create Rank endpoint called ]');


  const { createRankEndpoint } = require('./endPoints/v1/gamificationAdmin');


  createRankEndpoint(req, res);


});





app.post('/swift-app/v1/admin/gamification/badges', (req, res) => {


  console.log('[ Admin Create Badge endpoint called ]');


  const { createBadgeEndpoint } = require('./endPoints/v1/gamificationAdmin');


  createBadgeEndpoint(req, res);


});





app.post('/swift-app/v1/admin/gamification/rewards', (req, res) => {


  console.log('[ Admin Create XP Reward endpoint called ]');


  const { createRewardEndpoint } = require('./endPoints/v1/gamificationAdmin');


  createRewardEndpoint(req, res);


});





// �👤 [POST] Change Password


app.post('/swift-app/v1/user/change-password', (req, res) => {


  console.log('[ Change Password endpoint called ]');





  const { changePasswordEndpoint } = require('./endPoints/v1/changePassword');


  const token = req.headers.authorization?.replace('Bearer ', '');


  const { currentPassword, newPassword } = req.body;





  changePasswordEndpoint(token, currentPassword, newPassword)


    .then(result => {


      res.status(result.status).json(result.json);


    })


    .catch(error => {


      console.error('Error in changePassword:', error);


      res.status(500).json({ message: 'Internal server error' });


    });


});





// 👤 [DELETE] Revoke Session


app.delete('/swift-app/v1/user/session/:deviceId', (req, res) => {


  console.log('[ Revoke Session endpoint called ]');





  const { revokeSessionEndpoint } = require('./endPoints/v1/revokeSession');


  const token = req.headers.authorization?.replace('Bearer ', '');


  const { deviceId } = req.params;





  revokeSessionEndpoint(token, deviceId)


    .then(result => {


      res.status(result.status).json(result.json);


    })


    .catch(error => {


      console.error('Error in revokeSession:', error);


      res.status(500).json({ message: 'Internal server error' });


    });


});





// 👤 [DELETE] Delete Account


app.delete('/swift-app/v1/user/account', (req, res) => {


  console.log('[ Delete Account endpoint called ]');





  const { deleteAccountEndpoint } = require('./endPoints/v1/deleteAccount');


  const token = req.headers.authorization?.replace('Bearer ', '');





  deleteAccountEndpoint(token)


    .then(result => {


      res.status(result.status).json(result.json);


    })


    .catch(error => {


      console.error('Error in deleteAccount:', error);


      res.status(500).json({ message: 'Internal server error' });


    });


});





// 🔔 PUSH NOTIFICATIONS





// 🔔 [POST] Register Push Token


app.post('/swift-app/v1/users/push-token', businessOwnerAuth, (req, res) => {


  console.log('[ Register Push Token endpoint called ]');


  const { registerPushTokenEndpoint } = require('./endPoints/v1/pushNotifications');


  registerPushTokenEndpoint(req, res);


});





// 🔔 [DELETE] Remove Push Token


app.delete('/swift-app/v1/users/push-token', businessOwnerAuth, (req, res) => {


  console.log('[ Remove Push Token endpoint called ]');


  const { removePushTokenEndpoint } = require('./endPoints/v1/pushNotifications');


  removePushTokenEndpoint(req, res);


});





// 🔔 [GET] Get Notification Preferences


app.get('/swift-app/v1/users/notification-preferences', businessOwnerAuth, (req, res) => {


  console.log('[ Get Notification Preferences endpoint called ]');


  const { getNotificationPreferencesEndpoint } = require('./endPoints/v1/pushNotifications');


  getNotificationPreferencesEndpoint(req, res);


});





// 🔔 [PATCH] Update Notification Preferences


app.patch('/swift-app/v1/users/notification-preferences', businessOwnerAuth, (req, res) => {


  console.log('[ Update Notification Preferences endpoint called ]');


  const { updateNotificationPreferencesEndpoint } = require('./endPoints/v1/pushNotifications');


  updateNotificationPreferencesEndpoint(req, res);


});





// 🔔 [POST] Send Push Notification (Admin)


app.post('/swift-app/v1/notifications/push/send', (req, res) => {


  console.log('[ Send Push Notification endpoint called ]');


  const { sendPushNotificationEndpoint } = require('./endPoints/v1/pushNotifications');


  sendPushNotificationEndpoint(req, res);


});





// �👥 Clients





// 👤 [POST] Create Client


app.post('/swift-app/v1/client', (req, res) => {


  console.log('[ Create Client endpoint called ]');





  const { createClientEndpoint } = require('./endPoints/v1/createClient');


  createClientEndpoint(req, res);


});





// [POST] Lookup Cobbr users by phone numbers (contacts import)


app.post('/swift-app/v1/users/lookup-by-phones', require('./middleware/authenticateToken').authenticateToken, (req, res) => {


  const { lookupUsersByPhones } = require('./endPoints/v1/usersLookup');


  lookupUsersByPhones(req, res);


});





// 📋 [GET] List Clients


app.get('/swift-app/v1/clients', (req, res) => {


  console.log('[ List Clients endpoint called ]');





  const { listClientsEndpoint } = require('./endPoints/v1/listClients');


  listClientsEndpoint(req, res);


});





// 🔍 [GET] Get Client by ID


app.get('/swift-app/v1/client/:id', (req, res) => {


  console.log('[ Get Client by ID endpoint called ]');


  const { getClientByIdEndpoint } = require('./endPoints/v1/getClientById');


  getClientByIdEndpoint(req, res);


});





// ✏️ [PATCH] Update Client by ID


app.patch('/swift-app/v1/client/:id', (req, res) => {


  console.log('[ Update Client by ID endpoint called ]');





  const { updateClientByIdEndpoint } = require('./endPoints/v1/updateClientById');


  updateClientByIdEndpoint(req, res);


});





// 🗑️ [DELETE] Delete Client by ID


app.delete('/swift-app/v1/client/:id', (req, res) => {


  console.log('[ Delete Client by ID endpoint called ]');





  const { deleteClientByIdEndpoint } = require('./endPoints/v1/deleteClientById');


  deleteClientByIdEndpoint(req, res);


});





// 📦 [POST] Archive Client by ID


app.post('/swift-app/v1/client/:id/archive', (req, res) => {


  console.log('[ Archive Client by ID endpoint called ]');





  const { archiveClientByIdEndpoint } = require('./endPoints/v1/archiveClientById');


  archiveClientByIdEndpoint(req, res);


});





// 📤 [POST] Unarchive Client by ID


app.post('/swift-app/v1/client/:id/unarchive', (req, res) => {


  console.log('[ Unarchive Client by ID endpoint called ]');





  const { unarchiveClientByIdEndpoint } = require('./endPoints/v1/unarchiveClientById');


  unarchiveClientByIdEndpoint(req, res);


});





// 📄 Devis/Quote





// 📝 [POST} Create Quote


app.post('/swift-app/v1/quote', (req, res) => {


  console.log('[ Create Quote endpoint called ]');





  const { createQuoteEndpoint } = require('./endPoints/v1/createQuote');


  createQuoteEndpoint(req, res);


});





// 📋 [GET] List Quotes


app.get('/swift-app/v1/quotes', (req, res) => {


  console.log('[ List Quotes endpoint called ]');





  const { listQuotesEndpoint } = require('./endPoints/v1/listQuotes');


  listQuotesEndpoint(req, res);


});





// 🔍 [GET] Get Quote by ID


app.get('/swift-app/v1/quote/:id', (req, res) => {


  console.log('[ Get Quote by ID endpoint called ]');





  const { getQuoteByIdEndpoint } = require('./endPoints/v1/getQuoteById');


  getQuoteByIdEndpoint(req, res);


});





// ✏️ [PUT] Update Quote by ID


app.put('/swift-app/v1/quote/:id', (req, res) => {


  console.log('[ Update Quote by ID endpoint called ]');





  const { updateQuoteByIdEndpoint } = require('./endPoints/v1/updateQuoteById');


  updateQuoteByIdEndpoint(req, res);


});





// 🗑️ [DELETE] Delete Quote by ID


app.delete('/swift-app/v1/quote/:id', (req, res) => {


  console.log('[ Delete Quote by ID endpoint called ]');





  const { deleteQuoteByIdEndpoint } = require('./endPoints/v1/deleteQuoteById');


  deleteQuoteByIdEndpoint(req, res);


});





// 📧 [POST] Send by email Quote by ID


app.post('/swift-app/v1/quote/:id/send', (req, res) => {


  console.log('[ Send Quote by ID endpoint called ]');


  const { sendQuoteByIdEndpoint } = require('./endPoints/v1/sendQuoteById');


  sendQuoteByIdEndpoint(req, res);


});





// ✅ [POST] Accept / Reject Quote by ID


app.post('/swift-app/v1/quote/:id/decision', (req, res) => {


  console.log('[ Accept/Reject Quote by ID endpoint called ]');


  const { decisionQuoteByIdEndpoint } = require('./endPoints/v1/decisionQuoteById');


  decisionQuoteByIdEndpoint(req, res);


});





// 🏗️ Jobs





// 🆕 [POST] Create Job


app.post('/swift-app/v1/job', (req, res) => {


  console.log('[ Create Job endpoint called ]');


  try {


    const { createJobEndpoint } = require('./endPoints/v1/createJob');


    createJobEndpoint(req, res);


  } catch (error) {


    console.error('Error loading createJob endpoint:', error);


    res.status(500).json({ success: false, error: 'Failed to load endpoint', details: error.message });


  }


});





// 📋 [GET] List Jobs


app.get('/swift-app/v1/jobs', (req, res) => {


  console.log('[ List Jobs endpoint called ]');


  const { listJobsEndpoint } = require('./endPoints/v1/listJobs');


  listJobsEndpoint(req, res);


});





// 🔍 [GET] Get Job by ID


app.get('/swift-app/v1/job/:id', (req, res) => {


  console.log('[ Get Job by ID endpoint called ]');


  const { getJobByIdEndpoint } = require('./endPoints/v1/getJobById');


  getJobByIdEndpoint(req, res);


});





// 🔍 [GET] Get Full Job by ID (all details)


app.get('/swift-app/v1/job/:id/full', (req, res) => {


  console.log('[ Get Full Job by ID endpoint called ]');


  const { getFullJobByIdEndpoint } = require('./endPoints/v1/getFullJobById');


  getFullJobByIdEndpoint(req, res);


});





// 🌍 [GET] Get Job Timezone and local dates


app.get('/swift-app/v1/job/:id/timezone', (req, res) => {


  console.log('[ Get Job Timezone endpoint called ]');


  const { getJobTimezoneEndpoint } = require('./endPoints/v1/getJobTimezone');


  getJobTimezoneEndpoint(req, res);


});





// 🔄 [POST] Advance Job Step


app.post('/swift-app/v1/job/:id/advance-step', (req, res) => {


  console.log('[ Advance Job Step endpoint called ]');


  const { advanceJobStepEndpoint } = require('./endPoints/v1/advanceJobStep');


  advanceJobStepEndpoint(req, res);


});





// 🔧 [POST] Fix Job Inconsistencies


app.post('/swift-app/v1/job/:id/fix-inconsistencies', (req, res) => {


  console.log('[ Fix Job Inconsistencies endpoint called ]');


  const { fixJobInconsistenciesEndpoint } = require('./endPoints/v1/fixJobInconsistencies');


  fixJobInconsistenciesEndpoint(req, res);


});





// ✏️ [PATCH] Update Job by ID


app.patch('/swift-app/v1/job/:id', (req, res) => {


  console.log('[ Update Job by ID endpoint called ]');


  const { updateJobByIdEndpoint } = require('./endPoints/v1/updateJobById');


  updateJobByIdEndpoint(req, res);


});





// ✏️ [PATCH] Update Job by ID (alias /jobs)


app.patch('/swift-app/v1/jobs/:id', (req, res) => {


  console.log('[ Update Job by ID endpoint called - alias /jobs ]');


  const { updateJobByIdEndpoint } = require('./endPoints/v1/updateJobById');


  updateJobByIdEndpoint(req, res);


});





// 🗑️ [DELETE] Delete Job by ID


app.delete('/swift-app/v1/job/:id', require('./middleware/authenticateToken').authenticateToken, (req, res) => {


  console.log('[ Delete Job by ID endpoint called ]');


  const { archiveJobByIdEndpoint } = require('./endPoints/v1/archiveJobById');


  archiveJobByIdEndpoint(req, res);


});





// �📦 [POST] Archive Job by ID


app.post('/swift-app/v1/job/:id/archive', (req, res) => {


  console.log('[ Archive Job by ID endpoint called ]');


  const { archiveJobByIdEndpoint } = require('./endPoints/v1/archiveJobById');


  archiveJobByIdEndpoint(req, res);


});





// 📤 [POST] Unarchive Job by ID


app.post('/swift-app/v1/job/:id/unarchive', (req, res) => {


  console.log('[ Unarchive Job by ID endpoint called ]');


  const { unarchiveJobByIdEndpoint } = require('./endPoints/v1/unarchiveJobById');


  unarchiveJobByIdEndpoint(req, res);


});





// ▶️ [POST] Start Job by ID


app.post('/swift-app/v1/job/:id/start', (req, res) => {


  console.log('[ Start Job by ID endpoint called ]');


  const { startJobByIdEndpoint } = require('./endPoints/v1/startJobById');


  startJobByIdEndpoint(req, res);


});





// ✅ [POST] Accept Job by ID (contractor accepte le job)


app.post('/swift-app/v1/job/:id/accept', require('./middleware/authenticateToken').authenticateToken, (req, res) => {


  console.log('[ Accept Job by ID endpoint called ]');


  const { acceptJobEndpoint } = require('./endPoints/v1/acceptJob');


  acceptJobEndpoint(req, res);


});


// ✅ [POST] Accept/Decline Job — plural URL alias (frontend uses /v1/jobs/:id/accept)


app.post('/swift-app/v1/jobs/:id/accept', require('./middleware/authenticateToken').authenticateToken, (req, res) => {


  console.log('[ Accept Job (plural URL) ]');


  const { acceptJobEndpoint } = require('./endPoints/v1/acceptJob');


  acceptJobEndpoint(req, res);


});





app.post('/swift-app/v1/jobs/:id/decline', require('./middleware/authenticateToken').authenticateToken, (req, res) => {


  console.log('[ Decline Job (plural URL) ]');


  const { declineJobEndpoint } = require('./endPoints/v1/declineJob');


  declineJobEndpoint(req, res);


});





// ❌ [POST] Decline Job by ID (contractor refuse le job)


app.post('/swift-app/v1/job/:id/decline', require('./middleware/authenticateToken').authenticateToken, (req, res) => {


  console.log('[ Decline Job by ID endpoint called ]');


  const { declineJobEndpoint } = require('./endPoints/v1/declineJob');


  declineJobEndpoint(req, res);


});





// ⏸️ [POST] Pause Job by ID


app.post('/swift-app/v1/job/:id/pause', (req, res) => {


  console.log('[ Pause Job by ID endpoint called ]');


  const { pauseJobByIdEndpoint } = require('./endPoints/v1/pauseJobById');


  pauseJobByIdEndpoint(req, res);


});





// ▶️ [POST] Resume Job by ID


app.post('/swift-app/v1/job/:id/resume', (req, res) => {


  console.log('[ Resume Job by ID endpoint called ]');


  const { resumeJobByIdEndpoint } = require('./endPoints/v1/resumeJobById');


  resumeJobByIdEndpoint(req, res);


});





// ✅ [POST] Complete Job by ID


app.post('/swift-app/v1/job/:id/complete', (req, res) => {


  console.log('[ Complete Job by ID endpoint called ]');


  const { completeJobByIdEndpoint } = require('./endPoints/v1/completeJobById');


  completeJobByIdEndpoint(req, res);


});

// ── Phase 4 : Scorecard & Reviews ──────────────────────────────────
app.get('/swift-app/v1/jobs/:id/scorecard', (req, res) => {
  const { getJobScorecardEndpoint } = require('./endPoints/v1/jobScorecard');
  getJobScorecardEndpoint(req, res);
});

app.post('/swift-app/v1/jobs/:id/review-request', (req, res) => {
  const { sendReviewRequestEndpoint } = require('./endPoints/v1/clientReview');
  sendReviewRequestEndpoint(req, res);
});

app.get('/swift-app/v1/review/:token', (req, res) => {
  const { getReviewPageEndpoint } = require('./endPoints/v1/clientReview');
  getReviewPageEndpoint(req, res);
});

app.post('/swift-app/v1/review/:token', (req, res) => {
  const { submitReviewEndpoint } = require('./endPoints/v1/clientReview');
  submitReviewEndpoint(req, res);
});
// ── /Phase 4 ────────────────────────────────────────────────────────

// ── Phase 5 : V2 Badges ─────────────────────────────────────────────
app.get('/swift-app/v1/user/gamification/v2/badges', (req, res) => {
  const { getV2BadgesEndpoint } = require('./endPoints/v1/gamificationV2');
  getV2BadgesEndpoint(req, res);
});
// ── /Phase 5 ────────────────────────────────────────────────────────







// 👷 Crew Members





// 👥 [POST] assign crew members to the Job by ID


app.post('/swift-app/v1/job/:id/crew', (req, res) => {


  console.log('[ Assign Crew to Job by ID endpoint called ]');


  const { assignCrewToJobByIdEndpoint } = require('./endPoints/v1/assignCrewToJobById');


  assignCrewToJobByIdEndpoint(req, res);


});





// 👀 [GET] Get Job's crew members by Job ID


app.get('/swift-app/v1/job/:id/crew', (req, res) => {


  console.log('[ Get Job Crew by Job ID endpoint called ]');


  const { getJobCrewByIdEndpoint } = require('./endPoints/v1/getJobCrewById');


  getJobCrewByIdEndpoint(req, res);


});





// ➖ [DELETE] Remove crew member from the Job by ID


app.delete('/swift-app/v1/job/:id/crew/:crewId', (req, res) => {


  console.log('[ Remove Crew from Job by ID endpoint called ]');


  const { removeCrewFromJobByIdEndpoint } = require('./endPoints/v1/removeCrewFromJobById');


  removeCrewFromJobByIdEndpoint(req, res);


});





// ✏️ [PATCH] Update Job's crew member by ID


app.patch('/swift-app/v1/job/:id/crew/:crewId', (req, res) => {


  console.log('[ Update Job Crew by ID endpoint called ]');


  const { updateJobCrewByIdEndpoint } = require('./endPoints/v1/updateJobCrewById');


  updateJobCrewByIdEndpoint(req, res);


});





// 🚛 TRUCKS





// 🚚 [POST] Assign trucks to the Job by ID


app.post('/swift-app/v1/job/:id/trucks', (req, res) => {


  console.log('[ Assign Trucks to Job by ID endpoint called ]');


  const { assignTrucksToJobByIdEndpoint } = require('./endPoints/v1/assignTrucksToJobById');


  assignTrucksToJobByIdEndpoint(req, res);


});





// 👀 [GET] Get Job's trucks by Job ID


app.get('/swift-app/v1/job/:id/trucks', (req, res) => {


  console.log('[ Get Job Trucks by Job ID endpoint called ]');


  const { getJobTrucksByIdEndpoint } = require('./endPoints/v1/getJobTrucksById');


  getJobTrucksByIdEndpoint(req, res);


});





// ➖ [DELETE] Remove truck from the Job by ID


app.delete('/swift-app/v1/job/:id/trucks/:truckId', (req, res) => {


  console.log('[ Remove Truck from Job by ID endpoint called ]');


  const { removeTruckFromJobByIdEndpoint } = require('./endPoints/v1/removeTruckFromJobById');


  removeTruckFromJobByIdEndpoint(req, res);


});





// ✏️ [PATCH] Update Job's truck by ID


app.patch('/swift-app/v1/job/:id/trucks/:truckId', (req, res) => {


  console.log('[ Update Job Truck by ID endpoint called ]');


  const { updateJobTruckByIdEndpoint } = require('./endPoints/v1/updateJobTruckById');


  updateJobTruckByIdEndpoint(req, res);


});





// ⏱️ TIMELINE





// 📋 [GET] Get full action history for a job


app.get('/swift-app/v1/jobs/:id/actions', require('./middleware/authenticateToken').authenticateToken, (req, res) => {


  const { getJobActionsEndpoint } = require('./endPoints/v1/getJobActionsById');


  getJobActionsEndpoint(req, res);


});





// 📅 [GET] Get all the event on the job timeline


app.get('/swift-app/v1/job/:id/timeline', (req, res) => {


  console.log('[ Get Job Timeline by Job ID endpoint called ]');


  const { getJobTimelineByIdEndpoint } = require('./endPoints/v1/getJobTimelineById');


  getJobTimelineByIdEndpoint(req, res);


});





// 📦 Items (Fourniture, boxes, etc.)





// 🆕 [POST] Create Item


app.post('/swift-app/v1/job/:jobId/item', (req, res) => {


  console.log('[ Create Item endpoint called ]');


  const { createItemEndpoint } = require('./endPoints/v1/createItem');


  createItemEndpoint(req, res);


});





// 📋 [GET] List Items for a Job


app.get('/swift-app/v1/job/:jobId/items', (req, res) => {


  console.log('[ List Items endpoint called ]');


  const { listItemsEndpoint } = require('./endPoints/v1/listItems');


  listItemsEndpoint(req, res);


});





// 🔍 [GET] Get Item by ID


app.get('/swift-app/v1/job/:jobId/item/:itemId', (req, res) => {


  console.log('[ Get Item by ID endpoint called ]');


  const { getItemByIdEndpoint } = require('./endPoints/v1/getItemById');


  getItemByIdEndpoint(req, res);


});





// ✏️ [PATCH] Update Item by ID


app.patch('/swift-app/v1/job/:jobId/item/:itemId', (req, res) => {


  console.log('[ Update Item by ID endpoint called ]');


  const { updateItemByIdEndpoint } = require('./endPoints/v1/updateItemById');





  updateItemByIdEndpoint(req, res);


});





// 🗑️ [DELETE] Delete Item by ID


app.delete('/swift-app/v1/job/:jobId/item/:itemId', (req, res) => {


  console.log('[ Delete Item by ID endpoint called ]');


  const { deleteItemByIdEndpoint } = require('./endPoints/v1/deleteItemById');


  deleteItemByIdEndpoint(req, res);


});





// 📤 [POST] import CSV items to a Job


app.post('/swift-app/v1/job/:jobId/items/import', (req, res) => {


  console.log('[ Import Items to Job endpoint called ]');





  const { importItemsToJobEndpoint } = require('./endPoints/v1/importItemsToJob');


  importItemsToJobEndpoint(req, res);


});





// ===============================


// � JOB IMAGES ROUTES


// ===============================





// 📋 [GET] List images for a job


app.get('/swift-app/v1/job/:jobId/images', (req, res) => {


  console.log('[ List Job Images endpoint called ]');


  const { listJobImagesEndpoint } = require('./endPoints/v1/listJobImages');


  listJobImagesEndpoint(req, res);


});





// ===============================


// �🔔 NOTIFICATIONS ROUTES


// ===============================





// 📋 [GET] List notifications for user


app.get('/swift-app/v1/notifications', (req, res) => {


  console.log('[ List Notifications endpoint called ]');


  const { listNotificationsEndpoint } = require('./endPoints/v1/listNotifications');


  listNotificationsEndpoint(req, res);


});





// 📝 [POST] Create new notification


app.post('/swift-app/v1/notifications', (req, res) => {


  console.log('[ Create Notification endpoint called ]');


  const { createNotificationEndpoint } = require('./endPoints/v1/createNotification');


  createNotificationEndpoint(req, res);


});





// ✅ [PATCH] Mark all notifications as read (DOIT ÊTRE AVANT /:notificationId)


app.patch('/swift-app/v1/notifications/mark-all-read', (req, res) => {


  console.log('[ Mark All Notifications Read endpoint called ]');


  const { markAllNotificationsReadEndpoint } = require('./endPoints/v1/markAllNotificationsRead');


  markAllNotificationsReadEndpoint(req, res);


});





// ✏️ [PATCH] Update notification status


app.patch('/swift-app/v1/notifications/:notificationId', (req, res) => {


  console.log('[ Update Notification endpoint called ]');


  const { updateNotificationEndpoint } = require('./endPoints/v1/updateNotification');


  updateNotificationEndpoint(req, res);


});





// 🗑️ [DELETE] Delete notification


app.delete('/swift-app/v1/notifications/:notificationId', (req, res) => {


  console.log('[ Delete Notification endpoint called ]');


  const { deleteNotificationEndpoint } = require('./endPoints/v1/deleteNotification');


  deleteNotificationEndpoint(req, res);


});





// ===============================


// 📊 JOB VOLUME ESTIMATION


// ===============================





// 📏 [POST] estimate volume of items for a Job


app.post('/swift-app/v1/job/:jobId/items/estimate-volume', (req, res) => {


  console.log('[ Estimate Volume of Items for Job endpoint called ]');


  const { estimateVolumeForJobEndpoint } = require('./endPoints/v1/estimateVolumeForJob');





  estimateVolumeForJobEndpoint(req, res);


});





// 📝 NOTES


const { authenticateToken: notesAuthToken } = require('./middleware/authenticateToken');





// 🆕 [POST] Create Note


app.post('/swift-app/v1/job/:jobId/notes', (req, res) => {


  console.log('[ Create Note endpoint called ]');


  const { createNoteEndpoint } = require('./endPoints/v1/createNote');


  createNoteEndpoint(req, res);


});





// ✅ [POST] Mark ALL Notes as Read (MUST be before :noteId routes!)


app.post('/swift-app/v1/job/:jobId/notes/read-all', notesAuthToken, (req, res) => {


  console.log('[ Mark All Notes as Read endpoint called ]');


  const { markAllNotesAsReadEndpoint } = require('./endPoints/v1/markAllNotesAsRead');


  markAllNotesAsReadEndpoint(req, res);


});





// ✅ [POST] Mark single Note as Read


app.post('/swift-app/v1/job/:jobId/notes/:noteId/read', notesAuthToken, (req, res) => {


  console.log('[ Mark Note as Read endpoint called ]');


  const { markNoteAsReadEndpoint } = require('./endPoints/v1/markNoteAsRead');


  markNoteAsReadEndpoint(req, res);


});





// 📋 [GET] List Notes for a Job (with read status)


app.get('/swift-app/v1/job/:jobId/notes', notesAuthToken, (req, res) => {


  console.log('[ List Notes endpoint called ]');


  const { listNotesEndpoint } = require('./endPoints/v1/listNotes');


  listNotesEndpoint(req, res);


});





// 🔍 [GET] Get Note by ID


app.get('/swift-app/v1/job/:jobId/notes/:noteId', (req, res) => {


  console.log('[ Get Note by ID endpoint called ]');


  const { getNoteByIdEndpoint } = require('./endPoints/v1/getNoteById');


  getNoteByIdEndpoint(req, res);


});





// ✏️ [PATCH] Update Note by ID


app.patch('/swift-app/v1/job/:jobId/notes/:noteId', (req, res) => {


  console.log('[ Update Note by ID endpoint called ]');


  const { updateNoteByIdEndpoint } = require('./endPoints/v1/updateNoteById');


  updateNoteByIdEndpoint(req, res);


});





// 🗑️ [DELETE] Delete Note by ID


app.delete('/swift-app/v1/job/:jobId/notes/:noteId', (req, res) => {


  console.log('[ Delete Note by ID endpoint called ]');


  const { deleteNoteByIdEndpoint } = require('./endPoints/v1/deleteNoteById');


  deleteNoteByIdEndpoint(req, res);


});





// 🆕 [POST] Create Note (direct route)


app.post('/swift-app/v1/note', (req, res) => {


  console.log('[ Create Note endpoint called (direct) ]');


  const { createNoteEndpoint } = require('./endPoints/v1/createNote');


  createNoteEndpoint(req, res);


});





// 📷 PHOTOS





// 📸 [POST] Upload Photo to a Job


app.post('/swift-app/v1/job/:jobId/photos', (req, res) => {


  console.log('[ Upload Photo to Job endpoint called ]');


  const { uploadPhotoToJobEndpoint } = require('./endPoints/v1/uploadPhotoToJob');


  uploadPhotoToJobEndpoint(req, res);


});





// 🖼️ [GET] List Photos for a Job


app.get('/swift-app/v1/job/:jobId/photos', (req, res) => {


  console.log('[ List Photos for Job endpoint called ]');


  const { listPhotosForJobEndpoint } = require('./endPoints/v1/listPhotosForJob');


  listPhotosForJobEndpoint(req, res);


});





// 🗑️ [DELETE] Delete Photo by ID from a Job


app.delete('/swift-app/v1/job/:jobId/photos/:photoId', (req, res) => {


  console.log('[ Delete Photo by ID from Job endpoint called ]');





  const { deletePhotoByIdFromJobEndpoint } = require('./endPoints/v1/deletePhotoByIdFromJob');


  deletePhotoByIdFromJobEndpoint(req, res);


});





// ✍️ SIGNATURE





// 📝 [POST] Upload Signature to a Job


app.post('/swift-app/v1/job/:jobId/signature', (req, res) => {


  console.log('[ Upload Signature to Job endpoint called ]');





  const { uploadSignatureToJobEndpoint } = require('./endPoints/v1/uploadSignatureToJob');


  uploadSignatureToJobEndpoint(req, res);


});





// 👀 [GET] Get Signature for a Job


app.get('/swift-app/v1/job/:jobId/signatures', (req, res) => {


  console.log('[ Get Signature for Job endpoint called ]');





  const { getSignatureForJobEndpoint } = require('./endPoints/v1/getSignatureForJob');


  getSignatureForJobEndpoint(req, res);


});





// 🗑️ [DELETE] Delete Signature from a Job [if needed - Admin only]


app.delete('/swift-app/v1/job/:jobId/signature/:signatureId', (req, res) => {


  console.log('[ Delete Signature from Job endpoint called ]');





  const { deleteSignatureFromJobEndpoint } = require('./endPoints/v1/deleteSignatureFromJob');


  deleteSignatureFromJobEndpoint(req, res);


});





// 📅 CALENDAR





// 🗓️ [GET] Get Calendar Overview for a given period


app.get('/swift-app/v1/calendar', (req, res) => {


  console.log('[ Get Calendar Overview endpoint called ]');


  const { getCalendarOverviewEndpoint } = require('./endPoints/v1/getCalendarOverview');


  getCalendarOverviewEndpoint(req, res);


});





// 📦 JOB ITEMS (Items liés aux déménagements)





// 🆕 [POST] Create Job Item (avec jobId dans l'URL)


app.post('/swift-app/v1/job/:jobId/items', (req, res) => {


  console.log('[ Create Job Item endpoint called ]', { jobId: req.params.jobId });


  const { createItemEndpoint } = require('./endPoints/v1/createItem');


  createItemEndpoint(req, res);


});





// 🆕 [POST] Create Job Item (avec job_id dans le body - compatibilité)


app.post('/swift-app/v1/item', (req, res) => {


  console.log('[ Create Job Item endpoint called (legacy) ]', { job_id: req.body.job_id });


  const { createItemEndpoint } = require('./endPoints/v1/createItem');


  createItemEndpoint(req, res);


});





// 🏢 COMPANIES





// 🆕 [POST] Create Company


app.post('/swift-app/v1/company', (req, res) => {


  console.log('[ Create Company endpoint called ]');





  const { createCompanyEndpoint } = require('./endPoints/v1/createCompany');


  createCompanyEndpoint(req, res);


});





// 📋 [GET] List Companies


app.get('/swift-app/v1/companies', (req, res) => {


  console.log('[ List Companies endpoint called ]');


  const { listCompaniesEndpoint } = require('./endPoints/v1/listCompanies');


  listCompaniesEndpoint(req, res);


});










app.get('/swift-app/v1/company/plan', require('./middleware/authenticateToken').authenticateToken, (req, res) => {


  const { getCompanyPlanEndpoint } = require('./endPoints/v1/companies/plan');


  getCompanyPlanEndpoint(req, res);


});


// 🔍 [GET] Get Company by ID


app.get('/swift-app/v1/company/:id', (req, res) => {


  console.log('[ Get Company by ID endpoint called ]');


  const { getCompanyByIdEndpoint } = require('./endPoints/v1/getCompanyById');


  getCompanyByIdEndpoint(req, res);


});





// ✏️ [PATCH] Update Company by ID


app.patch('/swift-app/v1/company/:id', (req, res) => {


  console.log('[ Update Company by ID endpoint called ]');


  const { updateCompanyByIdEndpoint } = require('./endPoints/v1/updateCompanyById');





  updateCompanyByIdEndpoint(req, res);


});





// 🗑️ [DELETE] Delete Company by ID


app.delete('/swift-app/v1/company/:id', (req, res) => {


  console.log('[ Delete Company by ID endpoint called ]');


  const { deleteCompanyByIdEndpoint } = require('./endPoints/v1/deleteCompanyById');


  deleteCompanyByIdEndpoint(req, res);


});





// � TEAMS MANAGEMENT





// 📋 [GET] List Teams - New route without companyId


app.get('/swift-app/v1/teams', require('./middleware/authenticateToken').authenticateToken, (req, res) => {


  console.log('[ List Teams (v1/teams) endpoint called ]');


  const { listTeamsEndpoint } = require('./endPoints/v1/teams');


  listTeamsEndpoint(req, res);


});





// 🆕 [POST] Create Team - New route without companyId


app.post('/swift-app/v1/teams', (req, res) => {


  console.log('[ Create Team (v1/teams) endpoint called ]');


  const { createTeamEndpoint } = require('./endPoints/v1/teams');


  createTeamEndpoint(req, res);


});





// 🔍 [GET] Get Team by ID - New route


app.get('/swift-app/v1/teams', require('./middleware/authenticateToken').authenticateToken, (req, res) => {


  console.log('[ Get Team by ID (v1/teams) endpoint called ]');


  const { getTeamEndpoint } = require('./endPoints/v1/teams');


  getTeamEndpoint(req, res);


});





// ✏️ [PUT] Update Team by ID - New route


app.put('/swift-app/v1/teams/:teamId', (req, res) => {


  console.log('[ Update Team (v1/teams) endpoint called ]');


  const { updateTeamEndpoint } = require('./endPoints/v1/teams');


  updateTeamEndpoint(req, res);


});





// 🗑️ [DELETE] Delete Team by ID - New route


app.delete('/swift-app/v1/teams/:teamId', (req, res) => {


  console.log('[ Delete Team (v1/teams) endpoint called ]');


  const { deleteTeamEndpoint } = require('./endPoints/v1/teams');


  deleteTeamEndpoint(req, res);


});





// 👤 [POST] Add member to team


app.post('/swift-app/v1/teams/:teamId/members', (req, res) => {


  console.log('[ Add Team Member endpoint called ]');


  const { addTeamMemberEndpoint } = require('./endPoints/v1/teams');


  addTeamMemberEndpoint(req, res);


});





// 👤 [DELETE] Remove member from team


app.delete('/swift-app/v1/teams/:teamId/members/:staffId', (req, res) => {


  console.log('[ Remove Team Member endpoint called ]');


  const { removeTeamMemberEndpoint } = require('./endPoints/v1/teams');


  removeTeamMemberEndpoint(req, res);


});





// 📋 [POST] Assign team to job


app.post('/swift-app/v1/jobs/:jobId/team', (req, res) => {


  console.log('[ Assign Team to Job endpoint called ]');


  const { assignTeamToJobEndpoint } = require('./endPoints/v1/teams');


  assignTeamToJobEndpoint(req, res);


});





// ============================================


// LEGACY ROUTES (avec companyId) - Compatibilité


// ============================================





// 📋 [GET] List Teams for a company (legacy)


app.get('/swift-app/v1/company/:companyId/teams', (req, res) => {


  console.log('[ List Teams endpoint called ]');


  const { listTeamsEndpoint } = require('./endPoints/v1/teams');


  listTeamsEndpoint(req, res);


});





// 🆕 [POST] Create Team for a company (legacy)


app.post('/swift-app/v1/company/:companyId/teams', (req, res) => {


  console.log('[ Create Team endpoint called ]');


  const { createTeamEndpoint } = require('./endPoints/v1/teams');


  createTeamEndpoint(req, res);


});





// 🔍 [GET] Get Team by ID (legacy)


app.get('/swift-app/v1/company/:companyId/teams/:teamId', (req, res) => {


  console.log('[ Get Team by ID endpoint called ]');


  const { getTeamEndpoint } = require('./endPoints/v1/teams');


  getTeamEndpoint(req, res);


});





// ✏️ [PUT] Update Team by ID (legacy)


app.put('/swift-app/v1/company/:companyId/teams/:teamId', (req, res) => {


  console.log('[ Update Team endpoint called ]');


  const { updateTeamEndpoint } = require('./endPoints/v1/teams');


  updateTeamEndpoint(req, res);


});





// 🗑️ [DELETE] Delete Team by ID (legacy)


app.delete('/swift-app/v1/company/:companyId/teams/:teamId', (req, res) => {


  console.log('[ Delete Team endpoint called ]');


  const { deleteTeamEndpoint } = require('./endPoints/v1/teams');


  deleteTeamEndpoint(req, res);


});





// ============================================================================


// 🔐 ROLES & PERMISSIONS (RBAC) - Phase 2


// ============================================================================





// 🔐 [GET] List all available roles (new frontend format)


app.get('/swift-app/v1/roles', (req, res) => {


  console.log('[ List All Roles endpoint called ]');


  const { listAllRolesEndpoint } = require('./endPoints/v1/roles');


  listAllRolesEndpoint(req, res);


});





// 🔐 [GET] Get user permissions


app.get('/swift-app/v1/users/:userId/permissions', (req, res) => {


  console.log('[ Get User Permissions endpoint called ]');


  const { getUserPermissionsEndpoint } = require('./endPoints/v1/roles');


  getUserPermissionsEndpoint(req, res);


});





// 🔐 [PUT] Assign role to user (new format)


app.put('/swift-app/v1/users/:userId/role', (req, res) => {


  console.log('[ Assign Role to User endpoint called ]');


  const { assignRoleToUserEndpoint } = require('./endPoints/v1/roles');


  assignRoleToUserEndpoint(req, res);


});





// 🔐 [POST] Check permission (utility endpoint)


app.post('/swift-app/v1/permissions/check', (req, res) => {


  console.log('[ Check Permission endpoint called ]');


  const { checkPermissionEndpoint } = require('./endPoints/v1/roles');


  checkPermissionEndpoint(req, res);


});





// ============================================================================


// 🔐 ROLES & PERMISSIONS (RBAC) - Legacy routes


// ============================================================================





// 🔐 [GET] List roles for a company (legacy)


app.get('/swift-app/v1/company/:companyId/roles', (req, res) => {


  console.log('[ List Roles endpoint called ]');


  const { listRolesEndpoint } = require('./endPoints/v1/roles');


  listRolesEndpoint(req, res);


});





// 🔐 [POST] Create a custom role


app.post('/swift-app/v1/company/:companyId/roles', (req, res) => {


  console.log('[ Create Role endpoint called ]');


  const { createRoleEndpoint } = require('./endPoints/v1/roles');


  createRoleEndpoint(req, res);


});





// 🔐 [PUT] Update a role


app.put('/swift-app/v1/company/:companyId/roles/:roleId', (req, res) => {


  console.log('[ Update Role endpoint called ]');


  const { updateRoleEndpoint } = require('./endPoints/v1/roles');


  updateRoleEndpoint(req, res);


});





// 🔐 [DELETE] Delete a role


app.delete('/swift-app/v1/company/:companyId/roles/:roleId', (req, res) => {


  console.log('[ Delete Role endpoint called ]');


  const { deleteRoleEndpoint } = require('./endPoints/v1/roles');


  deleteRoleEndpoint(req, res);


});





// 🔐 [PATCH] Assign role to staff (legacy)


app.patch('/swift-app/v1/staff/:staffId/role', (req, res) => {


  console.log('[ Assign Role to Staff endpoint called ]');


  const { assignRoleToStaffEndpoint } = require('./endPoints/v1/roles');


  assignRoleToStaffEndpoint(req, res);


});





// 🔐 [GET] Get my permissions


app.get('/swift-app/v1/users/me/permissions', (req, res) => {


  console.log('[ Get My Permissions endpoint called ]');


  const { getMyPermissionsEndpoint } = require('./endPoints/v1/roles');


  getMyPermissionsEndpoint(req, res);


});





// ============================================================================


// 🌍 i18n & USER PREFERENCES (PHASE 3)


// ============================================================================





// 🌍 [GET] Get available languages


app.get('/swift-app/v1/i18n/languages', (req, res) => {


  console.log('[ Get Available Languages endpoint called ]');


  const { getAvailableLanguagesEndpoint } = require('./endPoints/v1/userPreferences');


  getAvailableLanguagesEndpoint(req, res);


});





// 🌍 [GET] Get translations for a language


app.get('/swift-app/v1/i18n/translations/:lang', (req, res) => {


  console.log('[ Get Translations endpoint called ]');


  const { getTranslationsEndpoint } = require('./endPoints/v1/userPreferences');


  getTranslationsEndpoint(req, res);


});





// 🌍 [POST] Translate a key


app.post('/swift-app/v1/i18n/translate', (req, res) => {


  console.log('[ Translate Text endpoint called ]');


  const { translateTextEndpoint } = require('./endPoints/v1/userPreferences');


  translateTextEndpoint(req, res);


});





// 🎨 [GET] Get available themes


app.get('/swift-app/v1/themes', (req, res) => {


  console.log('[ Get Available Themes endpoint called ]');


  const { getAvailableThemesEndpoint } = require('./endPoints/v1/userPreferences');


  getAvailableThemesEndpoint(req, res);


});





// ⚙️ [GET] Get user preferences


app.get('/swift-app/v1/users/preferences', (req, res) => {


  console.log('[ Get User Preferences endpoint called ]');


  const { getUserPreferencesEndpoint } = require('./endPoints/v1/userPreferences');


  getUserPreferencesEndpoint(req, res);


});





// ⚙️ [PATCH] Update user preferences


app.patch('/swift-app/v1/users/preferences', (req, res) => {


  console.log('[ Update User Preferences endpoint called ]');


  const { updateUserPreferencesEndpoint } = require('./endPoints/v1/userPreferences');


  updateUserPreferencesEndpoint(req, res);


});





// ============================================================================


// 🚚 TRUCKS


// ============================================================================





// 🚚 [POST] Create a truck for a company


app.post('/swift-app/v1/company/:companyId/trucks', (req, res) => {


  console.log('[ Create Truck for Company endpoint called ]');


  const { createTruckForCompanyEndpoint } = require('./endPoints/v1/createTruckForCompany');


  createTruckForCompanyEndpoint(req, res);


});





// 🚚 [POST] Create a truck for a company (singular route)


app.post('/swift-app/v1/company/:companyId/truck', (req, res) => {


  console.log('[ Create Truck for Company endpoint called (singular) ]');


  const { createTruckForCompanyEndpoint } = require('./endPoints/v1/createTruckForCompany');


  createTruckForCompanyEndpoint(req, res);


});





// 🚛 [GET] List trucks for a company


app.get('/swift-app/v1/company/:companyId/trucks', (req, res) => {


  console.log('[ List Trucks for Company endpoint called ]');


  const { listTrucksForCompanyEndpoint } = require('./endPoints/v1/listTrucksForCompany');


  listTrucksForCompanyEndpoint(req, res);


});





// 🔍 [GET] Get truck by ID for a company


app.get('/swift-app/v1/company/:companyId/trucks/:truckId', (req, res) => {


  console.log('[ Get Truck by ID for Company endpoint called ]');


  const { getTruckByIdForCompanyEndpoint } = require('./endPoints/v1/getTruckByIdForCompany');


  getTruckByIdForCompanyEndpoint(req, res);


});





// ✏️ [PATCH] Update truck by ID for a company


app.patch('/swift-app/v1/company/:companyId/trucks/:truckId', (req, res) => {


  console.log('[ Update Truck by ID for Company endpoint called ]');


  const { updateTruckByIdForCompanyEndpoint } = require('./endPoints/v1/updateTruckByIdForCompany');


  updateTruckByIdForCompanyEndpoint(req, res);


});





// 🗑️ [DELETE] Delete truck by ID for a company


app.delete('/swift-app/v1/company/:companyId/trucks/:truckId', (req, res) => {


  console.log('[ Delete Truck by ID for Company endpoint called ]');


  const { deleteTruckByIdForCompanyEndpoint } = require('./endPoints/v1/deleteTruckByIdForCompany');


  deleteTruckByIdForCompanyEndpoint(req, res);


});





// � TRUCK IMAGES





// 📸 [POST] Upload image for a truck


const uploadImageMiddleware = require('./middleware/uploadImage');


app.post('/swift-app/v1/company/:companyId/trucks/:truckId/image', uploadImageMiddleware.single('image'), (req, res) => {


  console.log('[ Upload Truck Image endpoint called ]');


  const { uploadTruckImageEndpoint } = require('./endPoints/v1/uploadTruckImage');


  uploadTruckImageEndpoint(req, res);


});





// 📋 [GET] List images for a truck


app.get('/swift-app/v1/company/:companyId/trucks/:truckId/images', (req, res) => {


  console.log('[ List Truck Images endpoint called ]');


  const { listTruckImagesEndpoint } = require('./endPoints/v1/uploadTruckImage');


  listTruckImagesEndpoint(req, res);


});





// 🗑️ [DELETE] Delete image for a truck


app.delete('/swift-app/v1/company/:companyId/trucks/:truckId/images/:imageId', (req, res) => {


  console.log('[ Delete Truck Image endpoint called ]');


  const { deleteTruckImageEndpoint } = require('./endPoints/v1/uploadTruckImage');


  deleteTruckImageEndpoint(req, res);


});





// �💬 COMMUNICATION





// 📨 [POST] Send a message (email/SMS) to a client


app.post('/swift-app/v1/job/:jobId/message', (req, res) => {


  console.log('[ Send Message to Client endpoint called ]');


  const { sendMessageToClientEndpoint } = require('./endPoints/v1/sendMessageToClient');


  sendMessageToClientEndpoint(req, res);


});





// 💬 [GET] List messages for a job


app.get('/swift-app/v1/job/:jobId/messages', (req, res) => {


  console.log('[ List Messages for Job endpoint called ]');


  const { listMessagesForJobEndpoint } = require('./endPoints/v1/listMessagesForJob');


  listMessagesForJobEndpoint(req, res);


});





// 🔍 [GET] Get message by ID for a job


app.get('/swift-app/v1/job/:jobId/message/:messageId', (req, res) => {


  console.log('[ Get Message by ID for Job endpoint called ]');


  const { getMessageByIdForJobEndpoint } = require('./endPoints/v1/getMessageByIdForJob');


  getMessageByIdForJobEndpoint(req, res);


});





// 🏥 SYSTEM HEALTH





// ❤️ [GET] Health Check


app.get('/swift-app/health', (req, res) => {


  console.log('[ Health Check endpoint called ]');


  const { healthCheckEndpoint } = require('./endPoints/health');


  healthCheckEndpoint(req, res);


});





// 🔍 [GET] Database Pool Status


app.get('/swift-app/health/db', (req, res) => {


  const { getPoolStats, healthCheck } = require('./swiftDb');


  const stats = getPoolStats();


  console.log('[ DB Health Check ]', stats);


  res.json({


    success: true,


    pool: stats,


    status: stats.active > 15 ? 'warning' : 'healthy',


    message: stats.active > 15 ? 'High connection count' : 'Pool healthy'


  });


});





// 🧹 [POST] Cleanup idle DB connections (admin only)


app.post('/swift-app/health/db/cleanup', async (req, res) => {


  const { cleanupIdleConnections, getPoolStats } = require('./swiftDb');


  console.log('[ DB Cleanup requested ]');


  const before = getPoolStats();


  const result = await cleanupIdleConnections();


  const after = getPoolStats();


  res.json({


    success: true,


    before,


    after,


    cleaned: result.cleaned,


    message: `Cleaned ${result.cleaned} idle connections`


  });


});





//----------------------------------------------------------------------------


// END OF API ENDPOINTS


//----------------------------------------------------------------------------





// Middleware to handle preflight requests


app.options('*', (req, res) => {


  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');


  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');


  res.sendStatus(204);


});





// === MOVED 404 handler AFTER all routes ===


// (was here but caught Stripe routes before they were registered)





// Error handler


app.use((err, req, res, next) => {


  console.error('[Uncaught Error]', err.stack);


  console.log('res.headersSent?', res.headersSent);


  if (res.headersSent) return;


  res.status(500).json({ error: 'Internal Server Error' });


});





// Static file support (optional)


app.use(express.static('public'));


app.use('/swift-app/uploads', express.static('uploads'));





// Start server





//------------------------------------------------------------------------------------


// Generated endpoints


//------------------------------------------------------------------------------------





// PUT /swift-app/v1/job/:id/pause


app.put('/swift-app/v1/job/:id/pause', (req, res) => {


  const { pauseJobByIdEndpoint } = require('./endPoints/v1/pauseJobById');


  pauseJobByIdEndpoint(req)


    .then(response => res.json(response))


    .catch(error => {


      console.error('Error in pauseJobById:', error);


      res.status(500).json({ success: false, message: 'Internal server error' });


    });


});





// PUT /swift-app/v1/job/:id/resume


app.put('/swift-app/v1/job/:id/resume', (req, res) => {


  const { resumeJobByIdEndpoint } = require('./endPoints/v1/resumeJobById');


  resumeJobByIdEndpoint(req)


    .then(response => res.json(response))


    .catch(error => {


      console.error('Error in resumeJobById:', error);


      res.status(500).json({ success: false, message: 'Internal server error' });


    });


});





// PUT /swift-app/v1/job/:id/start


app.put('/swift-app/v1/job/:id/start', (req, res) => {


  const { startJobByIdEndpoint } = require('./endPoints/v1/startJobById');


  startJobByIdEndpoint(req)


    .then(response => res.json(response))


    .catch(error => {


      console.error('Error in startJobById:', error);


      res.status(500).json({ success: false, message: 'Internal server error' });


    });


});





// GET /swift-app/v1/job/:id/crew


app.get('/swift-app/v1/job/:id/crew', (req, res) => {


  const { getJobCrewByIdEndpoint } = require('./endPoints/v1/getJobCrewById');


  getJobCrewByIdEndpoint(req)


    .then(response => res.json(response))


    .catch(error => {


      console.error('Error in getJobCrewById:', error);


      res.status(500).json({ success: false, message: 'Internal server error' });


    });


});





// GET /swift-app/v1/job/:id/trucks


app.get('/swift-app/v1/job/:id/trucks', (req, res) => {


  const { getJobTrucksByIdEndpoint } = require('./endPoints/v1/getJobTrucksById');


  getJobTrucksByIdEndpoint(req)


    .then(response => res.json(response))


    .catch(error => {


      console.error('Error in getJobTrucksById:', error);


      res.status(500).json({ success: false, message: 'Internal server error' });


    });


});





// GET /swift-app/v1/job/:id/timeline


app.get('/swift-app/v1/job/:id/timeline', (req, res) => {


  const { getJobTimelineByIdEndpoint } = require('./endPoints/v1/getJobTimelineById');


  getJobTimelineByIdEndpoint(req)


    .then(response => res.json(response))


    .catch(error => {


      console.error('Error in getJobTimelineById:', error);


      res.status(500).json({ success: false, message: 'Internal server error' });


    });


});





// PUT /swift-app/v1/job/:id/crew


app.put('/swift-app/v1/job/:id/crew', (req, res) => {


  const { updateJobCrewByIdEndpoint } = require('./endPoints/v1/updateJobCrewById');


  updateJobCrewByIdEndpoint(req)


    .then(response => res.json(response))


    .catch(error => {


      console.error('Error in updateJobCrewById:', error);


      res.status(500).json({ success: false, message: 'Internal server error' });


    });


});





// PUT /swift-app/v1/job/:id/truck/:truckId


app.put('/swift-app/v1/job/:id/truck/:truckId', (req, res) => {


  const { updateJobTruckByIdEndpoint } = require('./endPoints/v1/updateJobTruckById');


  updateJobTruckByIdEndpoint(req)


    .then(response => res.json(response))


    .catch(error => {


      console.error('Error in updateJobTruckById:', error);


      res.status(500).json({ success: false, message: 'Internal server error' });


    });


});





// DELETE /swift-app/v1/job/:id/truck/:truckId


app.delete('/swift-app/v1/job/:id/truck/:truckId', (req, res) => {


  const { removeTruckFromJobByIdEndpoint } = require('./endPoints/v1/removeTruckFromJobById');


  removeTruckFromJobByIdEndpoint(req)


    .then(response => res.json(response))


    .catch(error => {


      console.error('Error in removeTruckFromJobById:', error);


      res.status(500).json({ success: false, message: 'Internal server error' });


    });


});





// DELETE /swift-app/v1/job/:id/crew/:crewId


app.delete('/swift-app/v1/job/:id/crew/:crewId', (req, res) => {


  const { removeCrewFromJobByIdEndpoint } = require('./endPoints/v1/removeCrewFromJobById');


  removeCrewFromJobByIdEndpoint(req)


    .then(response => res.json(response))


    .catch(error => {


      console.error('Error in removeCrewFromJobById:', error);


      res.status(500).json({ success: false, message: 'Internal server error' });


    });


});





// GET /swift-app/v1/company/:id


app.get('/swift-app/v1/company/:id', (req, res) => {


  const { getCompanyByIdEndpoint } = require('./endPoints/v1/getCompanyById');


  getCompanyByIdEndpoint(req)


    .then(response => res.json(response))


    .catch(error => {


      console.error('Error in getCompanyById:', error);


      res.status(500).json({ success: false, message: 'Internal server error' });


    });


});





// PUT /swift-app/v1/company/:id


app.put('/swift-app/v1/company/:id', (req, res) => {


  const { updateCompanyByIdEndpoint } = require('./endPoints/v1/updateCompanyById');


  updateCompanyByIdEndpoint(req)


    .then(response => res.json(response))


    .catch(error => {


      console.error('Error in updateCompanyById:', error);


      res.status(500).json({ success: false, message: 'Internal server error' });


    });


});





// GET /swift-app/v1/companies


app.get('/swift-app/v1/companies', (req, res) => {


  const { listCompaniesEndpoint } = require('./endPoints/v1/listCompanies');


  listCompaniesEndpoint(req)


    .then(response => res.json(response))


    .catch(error => {


      console.error('Error in listCompanies:', error);


      res.status(500).json({ success: false, message: 'Internal server error' });


    });


});











// GET /swift-app/v1/company/:id/truck/:truckId


app.get('/swift-app/v1/company/:id/truck/:truckId', (req, res) => {


  const { getTruckByIdForCompanyEndpoint } = require('./endPoints/v1/getTruckByIdForCompany');


  getTruckByIdForCompanyEndpoint(req)


    .then(response => res.json(response))


    .catch(error => {


      console.error('Error in getTruckByIdForCompany:', error);


      res.status(500).json({ success: false, message: 'Internal server error' });


    });


});





// PUT /swift-app/v1/company/:id/truck/:truckId


app.put('/swift-app/v1/company/:id/truck/:truckId', (req, res) => {


  const { updateTruckByIdForCompanyEndpoint } = require('./endPoints/v1/updateTruckByIdForCompany');


  updateTruckByIdForCompanyEndpoint(req, res);


});





// DELETE /swift-app/v1/company/:id/truck/:truckId


app.delete('/swift-app/v1/company/:id/truck/:truckId', (req, res) => {


  const { deleteTruckByIdForCompanyEndpoint } = require('./endPoints/v1/deleteTruckByIdForCompany');


  deleteTruckByIdForCompanyEndpoint(req)


    .then(response => res.json(response))


    .catch(error => {


      console.error('Error in deleteTruckByIdForCompany:', error);


      res.status(500).json({ success: false, message: 'Internal server error' });


    });


});





// GET /swift-app/v1/item/:id


app.get('/swift-app/v1/item/:id', (req, res) => {


  const { getItemByIdEndpoint } = require('./endPoints/v1/getItemById');


  getItemByIdEndpoint(req)


    .then(response => res.json(response))


    .catch(error => {


      console.error('Error in getItemById:', error);


      res.status(500).json({ success: false, message: 'Internal server error' });


    });


});





// PUT /swift-app/v1/item/:id


app.put('/swift-app/v1/item/:id', (req, res) => {


  const { updateItemByIdEndpoint } = require('./endPoints/v1/updateItemById');


  updateItemByIdEndpoint(req)


    .then(response => res.json(response))


    .catch(error => {


      console.error('Error in updateItemById:', error);


      res.status(500).json({ success: false, message: 'Internal server error' });


    });


});





// POST /swift-app/v1/job/:id/items/import


app.post('/swift-app/v1/job/:id/items/import', (req, res) => {


  const { importItemsToJobEndpoint } = require('./endPoints/v1/importItemsToJob');


  importItemsToJobEndpoint(req)


    .then(response => res.json(response))


    .catch(error => {


      console.error('Error in importItemsToJob:', error);


      res.status(500).json({ success: false, message: 'Internal server error' });


    });


});





// GET /swift-app/v1/note/:id


app.get('/swift-app/v1/note/:id', (req, res) => {


  const { getNoteByIdEndpoint } = require('./endPoints/v1/getNoteById');


  getNoteByIdEndpoint(req)


    .then(response => res.json(response))


    .catch(error => {


      console.error('Error in getNoteById:', error);


      res.status(500).json({ success: false, message: 'Internal server error' });


    });


});





// PUT /swift-app/v1/note/:id


app.put('/swift-app/v1/note/:id', (req, res) => {


  const { updateNoteByIdEndpoint } = require('./endPoints/v1/updateNoteById');


  updateNoteByIdEndpoint(req)


    .then(response => res.json(response))


    .catch(error => {


      console.error('Error in updateNoteById:', error);


      res.status(500).json({ success: false, message: 'Internal server error' });


    });


});





// GET /swift-app/v1/notes


app.get('/swift-app/v1/notes', (req, res) => {


  const { listNotesEndpoint } = require('./endPoints/v1/listNotes');


  listNotesEndpoint(req)


    .then(response => res.json(response))


    .catch(error => {


      console.error('Error in listNotes:', error);


      res.status(500).json({ success: false, message: 'Internal server error' });


    });


});





// DELETE /swift-app/v1/note/:id


app.delete('/swift-app/v1/note/:id', (req, res) => {


  console.log('[ Delete Note by ID endpoint called ]');


  const { deleteNoteByIdEndpoint } = require('./endPoints/v1/deleteNoteById');


  deleteNoteByIdEndpoint(req, res);


});





// POST /swift-app/v1/job/:id/photo


app.post('/swift-app/v1/job/:id/photo', (req, res) => {


  const { uploadPhotoToJobEndpoint } = require('./endPoints/v1/uploadPhotoToJob');


  uploadPhotoToJobEndpoint(req)


    .then(response => res.json(response))


    .catch(error => {


      console.error('Error in uploadPhotoToJob:', error);


      res.status(500).json({ success: false, message: 'Internal server error' });


    });


});





// --- GESTION DES IMAGES (Google Cloud Storage) ---


const uploadImage = require('./middleware/uploadImage');





// Test route d'image


app.post('/swift-app/v1/job/:jobId/image/test', (req, res) => {


  console.log('Test route appelée:', req.params, req.body);


  res.json({ message: 'Test route image OK', params: req.params });


});





// Upload image to GCS and create DB entry


try {


  const { uploadImageEndpoint } = require('./endPoints/v1/uploadJobImage');


  app.post('/swift-app/v1/job/:jobId/image', uploadImage.single('image'), uploadImageEndpoint);


  console.log('✅ Route upload image configurée');


} catch (error) {


  console.error('❌ Erreur configuration route upload:', error.message);


}


// Get image by ID


app.get('/swift-app/v1/image/:id', require('./endPoints/v1/getJobImageById').getJobImageByIdEndpoint);


// Serve image with signed URL


app.get('/swift-app/v1/image/:id/serve', require('./endPoints/v1/serveJobImage').serveJobImageEndpoint);


// Update image (description)


app.patch('/swift-app/v1/image/:id', require('./endPoints/v1/updateJobImage').updateJobImageEndpoint);


// Soft delete image


app.delete('/swift-app/v1/image/:id', require('./endPoints/v1/deleteJobImage').deleteJobImageEndpoint);


// Restore deleted image


app.patch('/swift-app/v1/image/:id/restore', require('./endPoints/v1/restoreJobImage').restoreJobImageEndpoint);


// List images by user


app.get('/swift-app/v1/user/:userId/images', require('./endPoints/v1/listUserImages').listUserImagesEndpoint);





// GET /swift-app/v1/job/:id/photos


app.get('/swift-app/v1/job/:id/photos', (req, res) => {


  const { listPhotosForJobEndpoint } = require('./endPoints/v1/listPhotosForJob');


  listPhotosForJobEndpoint(req)


    .then(response => res.json(response))


    .catch(error => {


      console.error('Error in listPhotosForJob:', error);


      res.status(500).json({ success: false, message: 'Internal server error' });


    });


});





// DELETE /swift-app/v1/job/:id/photo/:photoId


app.delete('/swift-app/v1/job/:id/photo/:photoId', (req, res) => {


  const { deletePhotoByIdFromJobEndpoint } = require('./endPoints/v1/deletePhotoByIdFromJob');


  deletePhotoByIdFromJobEndpoint(req)


    .then(response => res.json(response))


    .catch(error => {


      console.error('Error in deletePhotoByIdFromJob:', error);


      res.status(500).json({ success: false, message: 'Internal server error' });


    });


});





// POST /swift-app/v1/job/:id/message


app.post('/swift-app/v1/job/:id/message', (req, res) => {


  const { sendMessageToClientEndpoint } = require('./endPoints/v1/sendMessageToClient');


  sendMessageToClientEndpoint(req)


    .then(response => res.json(response))


    .catch(error => {


      console.error('Error in sendMessageToClient:', error);


      res.status(500).json({ success: false, message: 'Internal server error' });


    });


});





// GET /swift-app/v1/job/:id/messages


app.get('/swift-app/v1/job/:id/messages', (req, res) => {


  const { listMessagesForJobEndpoint } = require('./endPoints/v1/listMessagesForJob');


  listMessagesForJobEndpoint(req)


    .then(response => res.json(response))


    .catch(error => {


      console.error('Error in listMessagesForJob:', error);


      res.status(500).json({ success: false, message: 'Internal server error' });


    });


});





// GET /swift-app/v1/job/:id/message/:messageId


app.get('/swift-app/v1/job/:id/message/:messageId', (req, res) => {


  const { getMessageByIdForJobEndpoint } = require('./endPoints/v1/getMessageByIdForJob');


  getMessageByIdForJobEndpoint(req)


    .then(response => res.json(response))


    .catch(error => {


      console.error('Error in getMessageByIdForJob:', error);


      res.status(500).json({ success: false, message: 'Internal server error' });


    });


});





// GET /swift-app/v1/calendar


app.get('/swift-app/v1/calendar', (req, res) => {


  const { getCalendarOverviewEndpoint } = require('./endPoints/v1/getCalendarOverview');


  getCalendarOverviewEndpoint(req)


    .then(response => res.json(response))


    .catch(error => {


      console.error('Error in getCalendarOverview:', error);


      res.status(500).json({ success: false, message: 'Internal server error' });


    });


});





// POST /swift-app/v1/job/:id/estimate


app.post('/swift-app/v1/job/:id/estimate', (req, res) => {


  console.log('[ Estimate Volume for Job endpoint called ]');


  


  const { estimateVolumeForJobEndpoint } = require('./endPoints/v1/estimateVolumeForJob');


  estimateVolumeForJobEndpoint(req, res);


});





// GET /swift-app/v1/items - List all items


app.get('/swift-app/v1/items', (req, res) => {


  console.log('[ List Items endpoint called ]');


  


  const { listItemsEndpoint } = require('./endPoints/v1/listItems');


  listItemsEndpoint(req, res);


});





// GET /swift-app/v1/item/:id - Get item by ID


app.get('/swift-app/v1/item/:id', (req, res) => {


  console.log('[ Get Item By ID endpoint called ]');


  


  const { getItemByIdEndpoint } = require('./endPoints/v1/getItemById');


  getItemByIdEndpoint(req, res);


});





// PATCH /swift-app/v1/item/:id - Update item


app.patch('/swift-app/v1/item/:id', (req, res) => {


  console.log('[ Update Item By ID endpoint called ]');


  


  const { updateItemByIdEndpoint } = require('./endPoints/v1/updateItemById');


  updateItemByIdEndpoint(req, res);


});





// DELETE /swift-app/v1/item/:id - Delete item


app.delete('/swift-app/v1/item/:id', (req, res) => {


  console.log('[ Delete Item By ID endpoint called ]');


  


  const { deleteItemByIdEndpoint } = require('./endPoints/v1/deleteItemById');


  deleteItemByIdEndpoint(req, res);


});





// ============================================


// 📝 LOGS FRONTEND


// ============================================





// 📝 [POST] Create frontend log


app.post('/swift-app/v1/logs', (req, res) => {


  console.log('[ Create Frontend Log endpoint called ]');


  const { createLogEndpoint } = require('./endPoints/v1/logs');


  createLogEndpoint(req, res);


});





// 📋 [GET] List frontend logs (admin)


app.get('/swift-app/v1/logs', (req, res) => {


  console.log('[ List Frontend Logs endpoint called ]');


  const { listLogsEndpoint } = require('./endPoints/v1/logs');


  listLogsEndpoint(req, res);


});





// ============================================


// 📊 ANALYTICS EVENTS


// ============================================





// 📊 [POST] Create analytics events (batch)


app.post('/swift-app/v1/analytics/events', (req, res) => {


  console.log('[ Create Analytics Events endpoint called ]');


  const { createAnalyticsEventsEndpoint } = require('./endPoints/v1/analytics');


  createAnalyticsEventsEndpoint(req, res);


});





// 📋 [GET] List analytics events


app.get('/swift-app/v1/analytics/events', (req, res) => {


  console.log('[ List Analytics Events endpoint called ]');


  const { listAnalyticsEventsEndpoint } = require('./endPoints/v1/analytics');


  listAnalyticsEventsEndpoint(req, res);


});





// 📈 [GET] Analytics summary (dashboard)


app.get('/swift-app/v1/analytics/summary', (req, res) => {


  console.log('[ Get Analytics Summary endpoint called ]');


  const { getAnalyticsSummaryEndpoint } = require('./endPoints/v1/analytics');


  getAnalyticsSummaryEndpoint(req, res);


});





// ============================================


// 📍 JOB STEPS


// ============================================





// 📍 [GET] Get current job step


app.get('/swift-app/v1/job/:id/step', (req, res) => {


  console.log('[ Get Job Step endpoint called ]');


  const { getJobStepEndpoint } = require('./endPoints/v1/jobSteps');


  getJobStepEndpoint(req, res);


});





// ✏️ [PUT] Update job step (sync from mobile app)


app.put('/swift-app/v1/job/:id/step', (req, res) => {


  console.log('[ Update Job Step endpoint called ]');


  const { updateJobStepEndpoint } = require('./endPoints/v1/updateJobStep');


  updateJobStepEndpoint(req, res);


});





// 📋 [GET] Get all job steps with history


app.get('/swift-app/v1/jobs/:id/steps', (req, res) => {


  console.log('[ Get Job Steps endpoint called ]');


  const { getJobStepsEndpoint } = require('./endPoints/v1/jobSteps');


  getJobStepsEndpoint(req, res);


});





// 📖 [GET] Get step definitions (static)


app.get('/swift-app/v1/job-steps/definitions', (req, res) => {


  console.log('[ Get Step Definitions endpoint called ]');


  const { getStepDefinitionsEndpoint } = require('./endPoints/v1/jobSteps');


  getStepDefinitionsEndpoint(req, res);


});





// ============================================


// ⏱️ JOB TIMER SYNC


// ============================================





// 🔄 [POST] Sync job timer from mobile app


app.post('/swift-app/v1/job/:id/sync-timer', (req, res) => {


  console.log('[ Sync Job Timer endpoint called ]');


  const syncJobTimer = require('./endPoints/v1/syncJobTimer');


  syncJobTimer(req, res);


});





// 📊 [GET] Get job timer data


app.get('/swift-app/v1/job/:id/timer', async (req, res) => {


  console.log('[ Get Job Timer endpoint called ]');


  const { connect, close } = require('./swiftDb');


  const jobIdOrCode = req.params.id;


  


  let connection;


  try {


    connection = await connect();


    let jobQuery, jobParams;


    if (/^\d+$/.test(jobIdOrCode)) {


      jobQuery = `SELECT id, code, timer_total_hours, timer_billable_hours, timer_break_hours,


                  timer_is_running, timer_started_at, timer_last_updated FROM jobs WHERE id = ?`;


      jobParams = [parseInt(jobIdOrCode)];


    } else {


      jobQuery = `SELECT id, code, timer_total_hours, timer_billable_hours, timer_break_hours,


                  timer_is_running, timer_started_at, timer_last_updated FROM jobs WHERE code = ?`;


      jobParams = [jobIdOrCode];


    }


    


    const [result] = await connection.execute(jobQuery, jobParams);


    if (result.length === 0) {


      return res.status(404).json({ success: false, error: 'Job not found' });


    }


    


    const job = result[0];


    return res.json({


      success: true,


      job_id: job.id,


      job_code: job.code,


      timer: {


        total_hours: parseFloat(job.timer_total_hours) || 0,


        billable_hours: parseFloat(job.timer_billable_hours) || 0,


        break_hours: parseFloat(job.timer_break_hours) || 0,


        is_running: job.timer_is_running === 1,


        started_at: job.timer_started_at,


        last_updated: job.timer_last_updated


      }


    });


  } catch (error) {


    console.error('[GET-TIMER] Error:', error);


    return res.status(500).json({ success: false, error: error.message });


  } finally {


    if (connection) close(connection);


  }


});





// ============================================


// 🚗 VEHICLES (Alias for Trucks)


// ============================================





// 📋 [GET] List vehicles


app.get('/swift-app/v1/vehicles', (req, res, next) => {


  const { authenticateToken: authVehicles } = require('./middleware/authenticateToken');


  authVehicles(req, res, next);


}, (req, res) => {


  console.log('[ List Vehicles endpoint called ]');


  const { listVehiclesEndpoint } = require('./endPoints/v1/vehicles');


  listVehiclesEndpoint(req, res);


});





// 🆕 [POST] Create vehicle


app.post('/swift-app/v1/vehicles', (req, res, next) => {


  const { authenticateToken: authVehicles } = require('./middleware/authenticateToken');


  authVehicles(req, res, next);


}, (req, res) => {


  console.log('[ Create Vehicle endpoint called ]');


  const { createVehicleEndpoint } = require('./endPoints/v1/vehicles');


  createVehicleEndpoint(req, res);


});





// 🔍 [GET] Get vehicle by ID


app.get('/swift-app/v1/vehicles/:id', (req, res, next) => {


  const { authenticateToken: authVehicles } = require('./middleware/authenticateToken');


  authVehicles(req, res, next);


}, (req, res) => {


  console.log('[ Get Vehicle by ID endpoint called ]');


  const { getVehicleByIdEndpoint } = require('./endPoints/v1/vehicles');


  getVehicleByIdEndpoint(req, res);


});





// ✏️ [PUT] Update vehicle


app.put('/swift-app/v1/vehicles/:id', (req, res, next) => {


  const { authenticateToken: authVehicles } = require('./middleware/authenticateToken');


  authVehicles(req, res, next);


}, (req, res) => {


  console.log('[ Update Vehicle endpoint called ]');


  const { updateVehicleEndpoint } = require('./endPoints/v1/vehicles');


  updateVehicleEndpoint(req, res);


});





// 🗑️ [DELETE] Delete vehicle


app.delete('/swift-app/v1/vehicles/:id', (req, res, next) => {


  const { authenticateToken: authVehicles } = require('./middleware/authenticateToken');


  authVehicles(req, res, next);


}, (req, res) => {


  console.log('[ Delete Vehicle endpoint called ]');


  const { deleteVehicleEndpoint } = require('./endPoints/v1/vehicles');


  deleteVehicleEndpoint(req, res);


});





// ============================================


// 👥 STAFF MANAGEMENT


// ============================================





// 📋 [GET] List staff members


app.get('/swift-app/v1/staff', (req, res, next) => {


  const { authenticateToken } = require('./middleware/authenticateToken');


  authenticateToken(req, res, next);


}, (req, res) => {


  console.log('[ List Staff endpoint called ]');


  const { listStaffEndpoint } = require('./endPoints/v1/staff');


  listStaffEndpoint(req, res);


});





// 🔍 [GET] Get staff member by ID


app.get('/swift-app/v1/staff/:id', (req, res) => {


  console.log('[ Get Staff Member endpoint called ]');


  const { getStaffMemberEndpoint } = require('./endPoints/v1/staff');


  getStaffMemberEndpoint(req, res);


});





// 📧 [POST] Invite staff member


app.post('/swift-app/v1/staff/invite', (req, res) => {


  console.log('[ Invite Staff endpoint called ]');


  const { inviteStaffEndpoint } = require('./endPoints/v1/staff');


  inviteStaffEndpoint(req, res);


});





// 🤝 [POST] Add contractor


app.post('/swift-app/v1/staff/contractors', (req, res) => {


  console.log('[ Add Contractor endpoint called ]');


  const { addContractorEndpoint } = require('./endPoints/v1/staff');


  addContractorEndpoint(req, res);


});





// 🗑️ [DELETE] Delete contractor


app.delete('/swift-app/v1/staff/contractors/:id', (req, res) => {


  console.log('[ Delete Contractor endpoint called ]');


  const { deleteContractorEndpoint } = require('./endPoints/v1/staff');


  deleteContractorEndpoint(req, res);


});





// ============================================


// STRIPE ENDPOINTS


// ============================================





// ============================================


// ROUTES POST URGENTES (HORS SECTION STRIPE)


// ============================================


// Test pour débugger le problème de routage POST





// Middleware pour vérifier que Stripe est configuré


const { resolveStripeMode } = require('./middleware/stripeMode');


const { authenticateToken } = require('./middleware/authenticateToken');





// Chargement conditionnel des modules Stripe


const stripeConfig = require('./config/stripe');





if (stripeConfig.isConfigured) {


  // --- STRIPE CONNECT (Onboarding & Gestion) ---


  const stripeConnect = require('./endPoints/v1/stripe/connect');





  app.post('/swift-app/v1/stripe/connect/create', authenticateToken, resolveStripeMode, stripeConnect.createConnectedAccount);


  app.get('/swift-app/v1/stripe/connect/status', authenticateToken, resolveStripeMode, stripeConnect.getConnectedAccountStatus);


  app.get('/swift-app/v1/stripe/connect/onboarding', authenticateToken, resolveStripeMode, stripeConnect.getOnboardingLink);


  app.post('/swift-app/v1/stripe/connect/refresh-onboarding', authenticateToken, resolveStripeMode, stripeConnect.refreshOnboardingLink);


  app.post('/swift-app/v1/stripe/connect/refresh-link', authenticateToken, resolveStripeMode, stripeConnect.getRefreshLink);  // ⭐ NEW: type 'account_update'


  app.post('/swift-app/v1/stripe/connect/dashboard-link', authenticateToken, resolveStripeMode, stripeConnect.createDashboardLink);


  app.delete('/swift-app/v1/stripe/connect/disconnect', authenticateToken, resolveStripeMode, stripeConnect.disconnectAccount);





  // --- STRIPE NATIVE ONBOARDING (5 étapes sans WebView) ---


  const stripeOnboarding = require('./endPoints/v1/stripe/onboarding');


  


  // Étape 0: Créer le compte Stripe silencieusement


  app.post('/swift-app/v1/stripe/onboarding/start', authenticateToken, resolveStripeMode, stripeOnboarding.startOnboarding);





  // Draft auto-save routes


  app.post('/swift-app/v1/stripe/onboarding/save-draft', authenticateToken, stripeOnboarding.saveDraft);


  app.get('/swift-app/v1/stripe/onboarding/get-draft', authenticateToken, stripeOnboarding.getDraft);


  


  // Étape 1: Informations personnelles


  app.post('/swift-app/v1/stripe/onboarding/personal-info', authenticateToken, resolveStripeMode, stripeOnboarding.submitPersonalInfo);





  // Étape 2: Business profile


  app.post('/swift-app/v1/stripe/onboarding/business-profile', authenticateToken, resolveStripeMode, stripeOnboarding.submitBusinessProfile);


  


  // Étape 3: Adresse


  app.post('/swift-app/v1/stripe/onboarding/address', authenticateToken, resolveStripeMode, stripeOnboarding.submitAddress);


  app.post('/swift-app/v1/stripe/onboarding/company-details', authenticateToken, resolveStripeMode, stripeOnboarding.submitCompanyDetails);


  


  // Étape 4: Compte bancaire


  app.post('/swift-app/v1/stripe/onboarding/bank-account', authenticateToken, resolveStripeMode, stripeOnboarding.submitBankAccount);


  


  // Étape 5: Upload document (pièce d'identité recto/verso)


  app.post('/swift-app/v1/stripe/onboarding/document', authenticateToken, resolveStripeMode, stripeOnboarding.upload.single('file'), stripeOnboarding.submitDocument);


  app.post('/swift-app/v1/stripe/onboarding/document-attach', authenticateToken, resolveStripeMode, stripeOnboarding.submitDocumentAttach);





  // Étape 6: Company Persons (owners/directors/executives/representative)


  app.post('/swift-app/v1/stripe/onboarding/persons', authenticateToken, resolveStripeMode, stripeOnboarding.submitPersons);


  


  // Étape 7: Verify (check requirements status - does NOT finalize)


  app.post('/swift-app/v1/stripe/onboarding/verify', authenticateToken, resolveStripeMode, stripeOnboarding.verifyOnboarding);


  


  // Étape 8: Finalisation


  app.post('/swift-app/v1/stripe/onboarding/complete', authenticateToken, resolveStripeMode, stripeOnboarding.completeOnboarding);


  


  // Statut de l'onboarding


  app.get('/swift-app/v1/stripe/onboarding/status', authenticateToken, resolveStripeMode, stripeOnboarding.getOnboardingStatus);


  


  // ⭐ DELETE: Supprimer le compte Stripe (pour réinitialiser l'onboarding)


  app.delete('/swift-app/v1/stripe/account', authenticateToken, resolveStripeMode, stripeOnboarding.deleteStripeAccount);





  // ⭐ GET: Vérifier les capabilities du compte (KYC in-app disponible?)


  app.get('/swift-app/v1/stripe/account/capabilities', authenticateToken, resolveStripeMode, stripeOnboarding.getAccountCapabilities);





  // 📋 [GET] Liste des comptes Stripe Connect liés aux companies


  app.get('/swift-app/v1/stripe/company-accounts', authenticateToken, resolveStripeMode, async (req, res) => {


    const { connect, close } = require('./swiftDb');


    let connection;


    


    try {


      connection = await connect();


      const userId = req.user?.id;


      const userRole = req.user?.role;


      const userCompanyId = req.user?.company_id;


      


      // Query de base


      let query = `


        SELECT 


          c.id as company_id,


          c.name as company_name,


          c.email as company_email,


          c.abn as company_abn,


          s.id as stripe_record_id,


          s.stripe_account_id,


          s.account_type,


          s.charges_enabled,


          s.payouts_enabled,


          s.details_submitted,


          s.country,


          s.currency,


          s.email as stripe_email,


          s.created_at as stripe_connected_at,


          s.disconnected_at,


          CASE 


            WHEN s.stripe_account_id IS NULL THEN 'not_connected'


            WHEN s.disconnected_at IS NOT NULL THEN 'disconnected'


            WHEN s.charges_enabled = 1 AND s.payouts_enabled = 1 THEN 'active'


            WHEN s.details_submitted = 1 THEN 'pending_verification'


            ELSE 'onboarding_incomplete'


          END as stripe_status


        FROM companies c


        LEFT JOIN stripe_connected_accounts s ON c.id = s.company_id AND s.disconnected_at IS NULL


      `;


      


      let params = [];


      


      // Si pas admin, filtrer sur la company de l'utilisateur


      if (userRole !== 'admin') {


        query += ' WHERE c.id = ?';


        params.push(userCompanyId);


      }


      


      query += ' ORDER BY c.id ASC';


      


      const [accounts] = await connection.query(query, params);


      


      // Résumé


      const summary = {


        total_companies: accounts.length,


        connected: accounts.filter(a => a.stripe_account_id && !a.disconnected_at).length,


        active: accounts.filter(a => a.stripe_status === 'active').length,


        pending: accounts.filter(a => a.stripe_status === 'pending_verification' || a.stripe_status === 'onboarding_incomplete').length,


        not_connected: accounts.filter(a => a.stripe_status === 'not_connected').length


      };


      


      res.json({


        success: true,


        summary,


        accounts: accounts.map(acc => ({


          company: {


            id: acc.company_id,


            name: acc.company_name,


            email: acc.company_email,


            abn: acc.company_abn


          },


          stripe: acc.stripe_account_id ? {


            account_id: acc.stripe_account_id,


            account_type: acc.account_type,


            status: acc.stripe_status,


            charges_enabled: !!acc.charges_enabled,


            payouts_enabled: !!acc.payouts_enabled,


            details_submitted: !!acc.details_submitted,


            country: acc.country,


            currency: acc.currency,


            email: acc.stripe_email,


            connected_at: acc.stripe_connected_at


          } : null


        }))


      });


      


    } catch (error) {


      console.error('❌ [Stripe] Error fetching company accounts:', error);


      res.status(500).json({ success: false, error: error.message });


    } finally {


      if (connection) close(connection);


    }


  });





  // 📋 [GET] Compte Stripe d'une company spécifique


  app.get('/swift-app/v1/stripe/company/:companyId/account', authenticateToken, resolveStripeMode, async (req, res) => {


    const { connect, close } = require('./swiftDb');


    let connection;


    


    try {


      connection = await connect();


      const { companyId } = req.params;


      const userId = req.user?.id;


      const userRole = req.user?.role;


      const userCompanyId = req.user?.company_id;


      


      // Vérifier accès (admin ou même company)


      if (userRole !== 'admin' && parseInt(companyId) !== userCompanyId) {


        return res.status(403).json({ success: false, error: 'Access denied' });


      }


      


      const [company] = await connection.query('SELECT id, name, email, abn FROM companies WHERE id = ?', [companyId]);


      


      if (company.length === 0) {


        return res.status(404).json({ success: false, error: 'Company not found' });


      }


      


      const [stripeAccount] = await connection.query(


        `SELECT * FROM stripe_connected_accounts WHERE company_id = ? AND disconnected_at IS NULL`,


        [companyId]


      );


      


      const hasStripe = stripeAccount.length > 0;


      


      // Si pas de compte Stripe actif, renvoyer 200 avec stripe: null (état normal pour nouveaux inscrits)


      if (!hasStripe) {


        return res.json({


          success: true,


          stripe: null,


          has_stripe_account: false,


          company: {


            id: company[0].id,


            name: company[0].name,


            email: company[0].email,


            abn: company[0].abn


          },


          message: 'No Stripe account yet. Complete onboarding to create one.'


        });


      }


      


      const acc = stripeAccount[0];


      


      let stripeStatus = 'not_connected';


      if (acc) {


        if (acc.charges_enabled && acc.payouts_enabled) stripeStatus = 'active';


        else if (acc.details_submitted) stripeStatus = 'pending_verification';


        else stripeStatus = 'onboarding_incomplete';


      }


      


      // Format snake_case pour compatibilité frontend


      let requirements = { currently_due: [], eventually_due: [], past_due: [], disabled_reason: null };


      let capabilities = { card_payments: 'inactive', transfers: 'inactive' };


      


      // Parser les requirements JSON si disponibles


      try {


        if (acc.requirements_currently_due) requirements.currently_due = JSON.parse(acc.requirements_currently_due);


        if (acc.requirements_eventually_due) requirements.eventually_due = JSON.parse(acc.requirements_eventually_due);


        if (acc.requirements_past_due) requirements.past_due = JSON.parse(acc.requirements_past_due);


        if (acc.capabilities) capabilities = JSON.parse(acc.capabilities);


      } catch (e) { /* ignore parse errors */ }


      


      // Déterminer disabled_reason


      if (!acc.charges_enabled || !acc.payouts_enabled) {


        if (requirements.currently_due.length > 0) requirements.disabled_reason = 'requirements.pending_verification';


        else if (requirements.past_due.length > 0) requirements.disabled_reason = 'requirements.past_due';


        else if (!acc.details_submitted) requirements.disabled_reason = 'pending_verification';


      }


      


      // Fetch live Stripe data for onboarding screens


      const { stripe } = require('./config/stripe');


      let liveAccount = null;


      try {


        liveAccount = await stripe.accounts.retrieve(acc.stripe_account_id);


      } catch (liveErr) {


        console.error('⚠️ [Stripe] Failed to fetch live account data:', liveErr.message);


      }





      res.json({


        success: true,


        stripe_account_id: acc.stripe_account_id,


        business_name: company[0].name,


        status: stripeStatus,


        charges_enabled: !!acc.charges_enabled,


        payouts_enabled: !!acc.payouts_enabled,


        country: acc.country,


        currency: (acc.currency || 'aud').toLowerCase(),


        onboarding_completed: acc.onboarding_completed_at !== null,


        details_submitted: !!acc.details_submitted,


        requirements,


        capabilities,


        // Backward compatibility - also include nested company/stripe objects


        company: {


          id: company[0].id,


          name: company[0].name,


          email: company[0].email,


          abn: company[0].abn


        },


        stripe: {


          account_id: acc.stripe_account_id,


          account_type: acc.account_type,


          status: stripeStatus,


          charges_enabled: !!acc.charges_enabled,


          payouts_enabled: !!acc.payouts_enabled,


          details_submitted: !!acc.details_submitted,


          country: acc.country,


          currency: acc.currency,


          email: acc.email,


          connected_at: acc.created_at,


          // Live Stripe data for onboarding pre-fill


          business_type: liveAccount ? liveAccount.business_type : null,


          company: liveAccount ? (liveAccount.company || null) : null,


          individual: liveAccount ? (liveAccount.individual || null) : null,


          business_profile: liveAccount ? (liveAccount.business_profile || null) : null,


          external_accounts: liveAccount ? (liveAccount.external_accounts || null) : null,


          requirements: liveAccount ? liveAccount.requirements : requirements,


        },


        can_receive_payments: acc.charges_enabled,


        can_receive_payouts: acc.payouts_enabled


      });


      


    } catch (error) {


      console.error('❌ [Stripe] Error fetching company account:', error);


      res.status(500).json({ success: false, error: error.message });


    } finally {


      if (connection) close(connection);


    }


  });





  // � NOUVEAU - Paiements d'une company (Fix #2 - endpoint manquant)


  app.get('/swift-app/v1/stripe/company/:companyId/payments', authenticateToken, resolveStripeMode, async (req, res) => {


    const { connect, close } = require('./swiftDb');


    let connection;


    


    try {


      connection = await connect();


      const { companyId } = req.params;


      const userId = req.user?.id;


      const userRole = req.user?.role;


      const userCompanyId = req.user?.company_id;


      


      // Vérifier accès (admin ou même company)


      if (userRole !== 'admin' && parseInt(companyId) !== userCompanyId) {


        return res.status(403).json({ success: false, error: 'Access denied' });


      }


      


      // Récupérer le compte Stripe de la company


      const [stripeAccount] = await connection.query(


        `SELECT stripe_account_id FROM stripe_connected_accounts WHERE company_id = ? AND disconnected_at IS NULL`,


        [companyId]


      );


      


      if (stripeAccount.length === 0) {


        return res.status(400).json({ 


          success: false, 


          error: 'No Stripe account found for this company',


          company_id: parseInt(companyId)


        });


      }


      


      const stripeAccountId = stripeAccount[0].stripe_account_id;


      const stripe = require('./config/stripe').stripe;


      


      // Paramètres de pagination


      const limit = Math.min(parseInt(req.query.limit) || 25, 100);


      const starting_after = req.query.starting_after;


      


      // Récupérer les paiements (PaymentIntents) de ce compte Stripe


      const listParams = { limit };


      if (starting_after) listParams.starting_after = starting_after;


      


      const paymentIntents = await stripe.paymentIntents.list(listParams, {


        stripeAccount: stripeAccountId


      });


      


      // Formater les données


      const payments = paymentIntents.data.map(pi => ({


        id: pi.id,


        amount: pi.amount,


        currency: pi.currency,


        status: pi.status,


        description: pi.description,


        customer: pi.customer,


        created: pi.created,


        metadata: pi.metadata,


        payment_method_types: pi.payment_method_types,


        receipt_email: pi.receipt_email


      }));


      


      res.json({


        success: true,


        company_id: parseInt(companyId),


        stripe_account_id: stripeAccountId,


        payments: payments,


        has_more: paymentIntents.has_more,


        count: payments.length


      });


      


    } catch (error) {


      console.error('❌ [Stripe] Error fetching company payments:', error);


      res.status(500).json({ success: false, error: error.message });


    } finally {


      if (connection) close(connection);


    }


  });





  // �🚀 SOLUTION FINALE - Route GET pour création compte (contourne bug POST)


  app.get('/swift-app/v1/stripe/connect/create-account', authenticateToken, resolveStripeMode, async (req, res) => {


    console.log('🚀 [SOLUTION FINALE] GET route for account creation');


    


    const connection = await require('./swiftDb').connect();


    const stripe = require('./config/stripe').stripe;


    


    try {


      // Récupérer company_id depuis query params (GET) ou body (POST fallback)


      const companyId = req.query.company_id || req.body.company_id;


      const userId = req.user?.id;


      


      if (!companyId) {


        return res.status(400).json({


          success: false,


          error: 'company_id is required (in query params for GET)'


        });


      }


      


      console.log(`🚀 [SOLUTION] User ${userId} creating account for company ${companyId}`);


      


      // Récupérer infos company


      const [company] = await connection.query(


        'SELECT id, name, email FROM companies WHERE id = ?',


        [companyId]


      );


      


      if (company.length === 0) {


        return res.status(404).json({


          success: false,


          error: 'Company not found'


        });


      }


      


      const companyData = company[0];


      


      // Vérifier si compte existe déjà


      const [existing] = await connection.query(


        'SELECT stripe_account_id FROM stripe_connected_accounts WHERE company_id = ? AND disconnected_at IS NULL',


        [companyId]


      );


      


      if (existing.length > 0) {


        return res.status(400).json({


          success: false,


          error: 'Stripe account already exists',


          data: { stripe_account_id: existing[0].stripe_account_id }


        });


      }


      


      console.log('🚀 [SOLUTION] Creating Stripe account...');


      


      // Créer compte Stripe


      const account = await stripe.accounts.create({


        type: 'standard',


        country: 'AU',





        capabilities: {


          card_payments: { requested: true },


          transfers: { requested: true }


        },


        business_type: 'company',


        metadata: {


          company_id: companyId.toString(),


          company_name: companyData.name,


          swiftapp_user_id: userId.toString()


        }


      });


      


      console.log(`✅ [SOLUTION] Account created: ${account.id}`);


      


      // Sauver en DB


      await connection.query(


        `INSERT INTO stripe_connected_accounts 


         (company_id, stripe_account_id, account_type, charges_enabled, 


          payouts_enabled, details_submitted, country, currency, email, created_at)


         VALUES (?, ?, 'standard', ?, ?, ?, 'AU', 'AUD', ?, NOW())`,


        [


          companyId,


          account.id,


          account.charges_enabled || false,


          account.payouts_enabled || false,


          account.details_submitted || false,


          companyData.email


        ]


      );


      


      // Créer lien onboarding


      const accountLink = await stripe.accountLinks.create({


        account: account.id,


        refresh_url: 'https://cobbr-app.com/settings/stripe/refresh',


        return_url: 'https://cobbr-app.com/settings/stripe/success',


        type: 'account_onboarding'


      });


      


      console.log(`🎉 [SOLUTION] SUCCESS! Ready for frontend`);


      


      res.status(201).json({


        success: true,


        message: 'Stripe Connected Account created successfully',


        data: {


          stripe_account_id: account.id,


          onboarding_url: accountLink.url,


          expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),


          charges_enabled: account.charges_enabled,


          payouts_enabled: account.payouts_enabled


        }


      });


      


    } catch (error) {


      console.error('❌ [SOLUTION] Error:', error);


      res.status(500).json({


        success: false,


        error: 'Failed to create account',


        message: error.message


      });


    } finally {


      await require('./swiftDb').close(connection);


    }


  });





  // --- STRIPE PAYMENT METHODS (Gestion Cartes) ---


  const stripePaymentMethods = require('./endPoints/v1/stripe/payment-methods');





  app.post('/swift-app/v1/payment-methods/attach', authenticateToken, resolveStripeMode, stripePaymentMethods.attachPaymentMethod);


  app.get('/swift-app/v1/payment-methods/list/:client_id', authenticateToken, resolveStripeMode, stripePaymentMethods.listPaymentMethods);


  app.post('/swift-app/v1/payment-methods/set-default', authenticateToken, resolveStripeMode, stripePaymentMethods.setDefaultPaymentMethod);


  app.delete('/swift-app/v1/payment-methods/:payment_method_id', authenticateToken, resolveStripeMode, stripePaymentMethods.detachPaymentMethod);





  // --- STRIPE PAYMENTS (Paiements & Remboursements) ---


  const stripePayments = require('./endPoints/v1/stripe/payments');





  app.post('/swift-app/v1/payments/create-payment-intent', authenticateToken, resolveStripeMode, stripePayments.createPaymentIntent);


  app.post('/swift-app/v1/payments/confirm', authenticateToken, resolveStripeMode, stripePayments.confirmPayment);


  app.get('/swift-app/v1/payments/history', authenticateToken, resolveStripeMode, stripePayments.getPaymentHistory);


  app.post('/swift-app/v1/payments/refund', authenticateToken, resolveStripeMode, stripePayments.createRefund);


  app.post('/swift-app/v1/payments/cash', authenticateToken, resolveStripeMode, stripePayments.recordCashPayment);


  // Note: getPaymentDetails n'est pas exporté, utiliser getPaymentHistory avec filtres





  // --- JOB PAYMENTS (Paiements Directs Jobs) ---


  const jobPayments = require('./endPoints/v1/jobs/payments');





  app.post('/swift-app/v1/jobs/:job_id/payment/create', authenticateToken, resolveStripeMode, jobPayments.createJobPaymentIntent);


  app.post('/swift-app/v1/jobs/:job_id/payment/confirm', authenticateToken, resolveStripeMode, jobPayments.confirmJobPayment);


  app.get('/swift-app/v1/jobs/:job_id/payments', authenticateToken, resolveStripeMode, jobPayments.getJobPayments);





  // --- STRIPE PAYMENT ALIASES (Compatibilité Frontend) ---


  // Routes courtes pour faciliter l'intégration frontend


  app.post('/swift-app/v1/payment/create-intent', authenticateToken, resolveStripeMode, stripePayments.createPaymentIntent);


  app.post('/swift-app/v1/payment/confirm', authenticateToken, resolveStripeMode, stripePayments.confirmPayment);


  app.post('/swift-app/v1/payment/refund', authenticateToken, resolveStripeMode, stripePayments.createRefund);


  app.post('/swift-app/v1/payment/cash', authenticateToken, resolveStripeMode, stripePayments.recordCashPayment);





  // --- STRIPE CLIENT CARD ALIASES (Compatibilité Frontend) ---


  // Routes simplifiées pour la gestion des cartes clients


  const stripePaymentAdapters = require('./endPoints/v1/stripe/payment-adapters');


  


  app.get('/swift-app/v1/client/:id/cards', authenticateToken, resolveStripeMode, stripePaymentAdapters.listClientCards);


  app.post('/swift-app/v1/client/:id/card', authenticateToken, resolveStripeMode, stripePaymentAdapters.attachClientCard);


  app.delete('/swift-app/v1/client/:id/card/:cardId', authenticateToken, resolveStripeMode, stripePaymentAdapters.deleteClientCard);


  app.patch('/swift-app/v1/client/:id/card/:cardId', authenticateToken, resolveStripeMode, stripePaymentAdapters.updateClientCard);





  // --- STRIPE PAYOUTS (Virements Bancaires) ---


  const stripePayouts = require('./endPoints/v1/stripe/payouts');





  app.get('/swift-app/v1/stripe/balance', authenticateToken, resolveStripeMode, stripePayouts.getBalance);


  app.get('/swift-app/v1/stripe/payouts', authenticateToken, resolveStripeMode, stripePayouts.listPayouts);


  app.get('/swift-app/v1/stripe/payouts/:payoutId', authenticateToken, resolveStripeMode, stripePayouts.getPayoutDetails);


  app.post('/swift-app/v1/stripe/payouts/create', authenticateToken, resolveStripeMode, stripePayouts.createInstantPayout);





  // --- STRIPE INVOICES (Factures) ---


  const stripeInvoices = require('./endPoints/v1/stripe/invoices');





  app.post('/swift-app/v1/invoices', resolveStripeMode, stripeInvoices.createInvoice);


  app.get('/swift-app/v1/invoices/:invoice_id', resolveStripeMode, stripeInvoices.getInvoiceById);


  app.get('/swift-app/v1/invoices/list', resolveStripeMode, stripeInvoices.listInvoices);


  app.post('/swift-app/v1/invoices/:invoice_id/finalize', resolveStripeMode, stripeInvoices.finalizeInvoice);


  app.post('/swift-app/v1/invoices/:invoice_id/send', resolveStripeMode, stripeInvoices.sendInvoice);


  app.post('/swift-app/v1/invoices/:invoice_id/pay', resolveStripeMode, stripeInvoices.recordManualPayment);


  app.post('/swift-app/v1/invoices/:invoice_id/void', resolveStripeMode, stripeInvoices.voidInvoice);


  app.get('/swift-app/v1/invoices/:invoice_id/pdf', resolveStripeMode, stripeInvoices.getInvoicePDF);





  // --- STRIPE QUOTES (Devis) ---


  const stripeQuotes = require('./endPoints/v1/stripe/quotes');





  app.post('/swift-app/v1/quotes', resolveStripeMode, stripeQuotes.createQuote);


  app.get('/swift-app/v1/quotes/:quote_id', resolveStripeMode, stripeQuotes.getQuoteById);


  app.get('/swift-app/v1/quotes/list', resolveStripeMode, stripeQuotes.listQuotes);


  app.post('/swift-app/v1/quotes/:quote_id/finalize', resolveStripeMode, stripeQuotes.finalizeQuote);


  app.post('/swift-app/v1/quotes/:quote_id/send', resolveStripeMode, stripeQuotes.sendQuote);


  // Note: acceptQuote n'existe pas, le client accepte via l'URL Stripe hébergée


  app.post('/swift-app/v1/quotes/:quote_id/cancel', resolveStripeMode, stripeQuotes.cancelQuote);


  app.get('/swift-app/v1/quotes/:quote_id/pdf', resolveStripeMode, stripeQuotes.getQuotePDF);





  // --- STRIPE WEBHOOKS (Événements) ---


  const stripeWebhooks = require('./endPoints/v1/stripe/webhooks');





  app.post('/swift-app/v1/stripe/webhooks', stripeWebhooks.handleStripeWebhook);





  // --- DISPUTES (Litiges) ---


  const disputes = require('./endPoints/disputes');





  app.use('/swift-app/disputes', disputes);





  // --- REPORTS (Rapports Financiers) ---


  const reports = require('./endPoints/reports');





  const { authenticateToken: authReports } = require('./middleware/authenticateToken'); app.use('/swift-app/reports', authReports, reports);





  // --- STRIPE PAYMENT LINKS (Liens de Paiement) ---


  const stripePaymentLinks = require('./endPoints/v1/stripe/payment-links');





  app.post('/swift-app/v1/stripe/payment-links/create', authenticateToken, resolveStripeMode, stripePaymentLinks.createPaymentLink);


  app.get('/swift-app/v1/stripe/payment-links/list', authenticateToken, resolveStripeMode, stripePaymentLinks.listPaymentLinks);


  app.get('/swift-app/v1/stripe/payment-links/:id', authenticateToken, resolveStripeMode, stripePaymentLinks.getPaymentLink);


  app.patch('/swift-app/v1/stripe/payment-links/:id', authenticateToken, resolveStripeMode, stripePaymentLinks.updatePaymentLink);


  app.post('/swift-app/v1/stripe/payment-links/:id/deactivate', authenticateToken, resolveStripeMode, stripePaymentLinks.deactivatePaymentLink);





  // --- STRIPE ACCOUNT SETTINGS (Paramètres Compte) ---


  const stripeAccountSettings = require('./endPoints/v1/stripe/account-settings');





  app.patch('/swift-app/v1/stripe/account/settings', authenticateToken, resolveStripeMode, stripeAccountSettings.updateAccountSettings);


  app.get('/swift-app/v1/stripe/account/settings', authenticateToken, resolveStripeMode, stripeAccountSettings.getAccountSettings);


  app.get('/swift-app/v1/stripe/account/settings/history', authenticateToken, resolveStripeMode, stripeAccountSettings.getSettingsHistory);


  


  logger.info('STRIPE', 'Routes Stripe activées');





  // ============================================


  // STRIPE SUBSCRIPTIONS (Billing)


  // ============================================


  const stripeSubscriptions = require('./endPoints/v1/stripe/subscriptions');


  app.post('/swift-app/v1/stripe/subscriptions/create', authenticateToken, resolveStripeMode, stripeSubscriptions.createSubscription);


  app.post('/swift-app/v1/stripe/subscriptions/cancel', authenticateToken, resolveStripeMode, stripeSubscriptions.cancelSubscription);


  app.post('/swift-app/v1/stripe/subscriptions/resume', authenticateToken, resolveStripeMode, stripeSubscriptions.resumeSubscription);


  app.get('/swift-app/v1/stripe/subscriptions/status', authenticateToken, resolveStripeMode, stripeSubscriptions.getSubscriptionStatus);


  app.post('/swift-app/v1/stripe/subscriptions/change-plan', authenticateToken, resolveStripeMode, stripeSubscriptions.changePlan);


  logger.info('STRIPE', 'Routes Stripe Subscriptions activées');








  // ============================================


  // ROUTES ALTERNATIVES STRIPE CONNECT (URGENCE)


  // ============================================


  // Routes de secours pour problème routage POST


  


  app.post('/swift-app/v1/stripe-alt/connect/create', authenticateToken, resolveStripeMode, stripeConnect.createConnectedAccount);


  app.get('/swift-app/v1/stripe-alt/connect/onboarding', authenticateToken, resolveStripeMode, stripeConnect.getOnboardingLink);


  app.get('/swift-app/v1/stripe-alt/connect/status', authenticateToken, resolveStripeMode, stripeConnect.getConnectedAccountStatus);


  


  // Route debug pour diagnostique


  app.get('/swift-app/v1/debug/routes', (req, res) => {


    const routes = [];


    app._router.stack.forEach((middleware) => {


      if (middleware.route) {


        routes.push({


          path: middleware.route.path,


          methods: Object.keys(middleware.route.methods)


        });


      }


    });


    res.json(routes.filter(r => r.path && r.path.includes('stripe')));


  });


  


  console.log('✅ Routes alternatives Stripe ajoutées : /stripe-alt/connect/*');


  


  // Route test POST pour diagnostic


  app.post('/swift-app/v1/test-post', (req, res) => {


    res.json({ success: true, message: 'POST route works!', body: req.body });


  });


  


  app.get('/swift-app/v1/test-get', (req, res) => {


    res.json({ success: true, message: 'GET route works!' });


  });


  


  // Route test POST AVEC middlewares pour diagnostic


  app.post('/swift-app/v1/test-post-auth', authenticateToken, resolveStripeMode, (req, res) => {


    res.json({ success: true, message: 'POST route with auth works!', user: req.user });


  });


  


  // Route test STRIPE HANDLER pour diagnostic précis


  app.post('/swift-app/v1/test-stripe-handler', authenticateToken, resolveStripeMode, async (req, res) => {


    try {


      console.log('🧪 [TEST] Calling stripeConnect.createConnectedAccount...');


      await stripeConnect.createConnectedAccount(req, res);


    } catch (error) {


      console.error('🚨 [TEST] Handler error:', error);


      res.status(500).json({ 


        success: false, 


        error: 'Handler failed', 


        details: error.message,


        stack: error.stack


      });


    }


  });


  


  // ============================================


  // SOLUTION IMMÉDIATE - ROUTES STRIPE SIMPLIFIÉES


  // ============================================


  // Contournement du bug handlers complexes


  


  const stripe = require('./config/stripe').stripe;


  const { connect, close } = require('./swiftDb');


  


  // POST /stripe/account/create-simple - Handler simplifié qui fonctionne


  app.post('/swift-app/v1/stripe/account/create-simple', authenticateToken, resolveStripeMode, async (req, res) => {


    const connection = await connect();


    


    try {


      console.log('🆕 [SIMPLE] Creating Stripe account - handler simplifié');


      const { company_id } = req.body;


      const userId = req.user?.id;


      


      if (!company_id) {


        return res.status(400).json({


          success: false,


          error: 'company_id is required in request body'


        });


      }


      


      console.log(`🆕 [SIMPLE] User ${userId} creating account for company ${company_id}`);


      


      // Récupérer infos compagnie


      const [company] = await connection.query(


        'SELECT id, name, email, phone FROM companies WHERE id = ?',


        [company_id]


      );


      


      if (company.length === 0) {


        return res.status(404).json({


          success: false,


          error: 'Company not found'


        });


      }


      


      const companyData = company[0];


      


      // Vérifier si compte existe déjà


      const [existing] = await connection.query(


        'SELECT id, stripe_account_id FROM stripe_connected_accounts WHERE company_id = ? AND disconnected_at IS NULL',


        [company_id]


      );


      


      if (existing.length > 0) {


        return res.status(400).json({


          success: false,


          error: 'Stripe account already exists for this company',


          data: {


            stripe_account_id: existing[0].stripe_account_id


          }


        });


      }


      


      console.log('🆕 [SIMPLE] Creating Stripe account...');


      


      // Créer compte Stripe


      const account = await stripe.accounts.create({


        type: 'standard',


        country: 'AU',





        capabilities: {


          card_payments: { requested: true },


          transfers: { requested: true }


        },


        business_type: 'company',


        metadata: {


          company_id: company_id.toString(),


          company_name: companyData.name,


          swiftapp_user_id: userId.toString()


        }


      });


      


      console.log(`✅ [SIMPLE] Stripe account created: ${account.id}`);


      


      // Sauvegarder en DB


      await connection.query(


        `INSERT INTO stripe_connected_accounts 


         (company_id, stripe_account_id, account_type, charges_enabled, 


          payouts_enabled, details_submitted, requirements_currently_due,


          requirements_eventually_due, requirements_past_due, capabilities,


          country, currency, email)


         VALUES (?, ?, 'standard', ?, ?, ?, ?, ?, ?, ?, 'AU', 'AUD', ?)`,


        [


          company_id,


          account.id,


          account.charges_enabled || false,


          account.payouts_enabled || false,


          account.details_submitted || false,


          JSON.stringify(account.requirements?.currently_due || []),


          JSON.stringify(account.requirements?.eventually_due || []),


          JSON.stringify(account.requirements?.past_due || []),


          JSON.stringify(account.capabilities || {}),


          companyData.email


        ]


      );


      


      // Créer lien onboarding


      const accountLink = await stripe.accountLinks.create({


        account: account.id,


        refresh_url: 'https://cobbr-app.com/settings/stripe/refresh',


        return_url: 'https://cobbr-app.com/settings/stripe/success',


        type: 'account_onboarding'


      });


      


      console.log(`✅ [SIMPLE] Success - returning data`);


      


      res.status(201).json({


        success: true,


        message: 'Stripe Connected Account created successfully',


        data: {


          stripe_account_id: account.id,


          onboarding_url: accountLink.url,


          expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),


          charges_enabled: account.charges_enabled,


          payouts_enabled: account.payouts_enabled,


          requirements: {


            currently_due: account.requirements?.currently_due || [],


            eventually_due: account.requirements?.eventually_due || [],


            past_due: account.requirements?.past_due || []


          }


        }


      });


      


    } catch (error) {


      console.error('❌ [SIMPLE] Error:', error);


      res.status(500).json({


        success: false,


        error: 'Failed to create Stripe account',


        details: error.message


      });


    } finally {


      await close(connection);


    }


  });


  


  // GET /stripe/account/onboarding-simple - Handler simplifié


  app.get('/swift-app/v1/stripe/account/onboarding-simple', authenticateToken, resolveStripeMode, async (req, res) => {


    const connection = await connect();


    


    try {


      console.log('🔗 [SIMPLE] Getting onboarding link - handler simplifié');


      const companyId = req.query?.company_id;


      


      if (!companyId) {


        return res.status(400).json({


          success: false,


          error: 'company_id is required in query'


        });


      }


      


      const [account] = await connection.query(


        'SELECT stripe_account_id FROM stripe_connected_accounts WHERE company_id = ? AND disconnected_at IS NULL',


        [companyId]


      );


      


      if (account.length === 0) {


        return res.status(404).json({


          success: false,


          error: 'No Stripe account found. Please create one first.',


          action_required: 'create_account'


        });


      }


      


      const accountLink = await stripe.accountLinks.create({


        account: account[0].stripe_account_id,


        refresh_url: 'https://cobbr-app.com/settings/stripe/refresh',


        return_url: 'https://cobbr-app.com/settings/stripe/success',


        type: 'account_onboarding'


      });


      


      res.json({


        success: true,


        data: {


          onboarding_url: accountLink.url,


          expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString()


        }


      });


      


    } catch (error) {


      console.error('❌ [SIMPLE] Error:', error);


      res.status(500).json({


        success: false,


        error: 'Failed to generate onboarding link',


        details: error.message


      });


    } finally {


      await close(connection);


    }


  });


  


  console.log('✅ Routes Stripe simplifiées ajoutées : /stripe/account/*-simple');


  


} else {


  logger.warning('STRIPE', 'Routes Stripe désactivées - configuration manquante');


}





// ============================================


// 💕 Valentine Special Endpoint


// ============================================


app.post("/swift-app/valentine-notification", async (req, res) => {


  try {


    const { noHoverCount, timestamp } = req.body;


    const nodemailer = require('nodemailer');


    


    const transporter = nodemailer.createTransport({


      host: 'smtp.ionos.fr',


      port: 465,


      secure: true,


      auth: {


        user: process.env.MAIL_USER,


        pass: process.env.MAIL_PASS


      }


    });


    


    const html = `


      <!DOCTYPE html>


      <html>


      <head><meta charset="UTF-8"></head>


      <body style="margin:0;padding:0;background:#ffeef8;font-family:Arial,sans-serif;">


        <div style="max-width:600px;margin:0 auto;padding:40px 20px;">


          <div style="background:linear-gradient(135deg,#ff9a9e 0%,#fecfef 100%);border-radius:20px;padding:40px;text-align:center;">


            <h1 style="color:#d63384;font-size:2.5rem;font-family:cursive;margin:0;">🎉 Elle a dit OUI ! 🎉</h1>


            <div style="font-size:3rem;margin:20px 0;">💕💖💕</div>


            <div style="background:white;padding:30px;border-radius:15px;margin:20px 0;">


              <p style="font-size:1.3rem;color:#495057;margin:0;">


                <strong>Alanna</strong> a cliqué sur <span style="color:#d63384;font-weight:bold;">"Yes"</span> !


              </p>


              <p style="font-size:1.1rem;color:#6c757d;margin:25px 0 0;">


                Nombre de survols sur "No" : <strong style="color:#d63384;font-size:2rem;">${noHoverCount || 0}</strong>


              </p>


              <p style="font-size:0.9rem;color:#adb5bd;margin:20px 0 0;">


                ${new Date(timestamp || Date.now()).toLocaleString("fr-FR", { timeZone: "Europe/Paris" })}


              </p>


            </div>


            <p style="font-size:1.5rem;margin:0;">Happy Valentine's Day! 🌹</p>


          </div>


        </div>


      </body>


      </html>


    `;


    


    await transporter.sendMail({


      from: '"💕 Valentine Bot" <contact@cobbr-app.com>',


      to: 'romaingiovanni@gmail.com',


      subject: '💕 Alanna a dit OUI ! 💕',


      html: html


    });


    


    console.log("💕 Valentine notification sent! Alanna said YES! (No hover count: " + noHoverCount + ")");


    res.json({ success: true });


  } catch (err) {


    console.error("Valentine notification error:", err);


    res.json({ success: true }); // Return success anyway so the page works


  }


});








// ============================================


// 🤝 [POST] Accept staff invitation (employee creates account via token)


app.post('/swift-app/v1/staff/accept-invitation', (req, res) => {


  console.log('[ Accept Staff Invitation endpoint called ]');


  const { acceptInvitationEndpoint } = require('./endPoints/v1/acceptInvitation');


  acceptInvitationEndpoint(req, res);


});





// ═══════════════════════════════════════════════════════════


// 🤝 ROUTES B2B JOB TRANSFER & COMPANY RELATIONS


// ═══════════════════════════════════════════════════════════


(function registerTransferRoutes() {


  const { authenticateToken } = require('./middleware/authenticateToken');


  const companyMe       = require('./endPoints/v1/companies/me');


  const companyLookup   = require('./endPoints/v1/companies/lookup');


  const companyRelations = require('./endPoints/v1/companies/relations');


  const jobTransfers    = require('./endPoints/v1/jobs/transfers');


  const counterProposal = require('./endPoints/v1/jobs/counterProposal')


  // [PATCH] staff_requests_route


  const { staffRequestsEndpoint } = require('./endPoints/v1/jobs/staffRequests');


  const acceptCounterProposal = require('./endPoints/v1/jobs/acceptCounterProposal');


  const rejectCounterProposal = require('./endPoints/v1/jobs/rejectCounterProposal');;


  const pendingAssignments = require('./endPoints/v1/jobs/pendingAssignments');


  const incomingTransfers = require('./endPoints/v1/transfers/incoming');


  const interContractorBilling = require('./endPoints/v1/billing/interContractor');


  const monthlyInvoices = require('./endPoints/v1/billing/monthlyInvoices');
  const pdfInvoice = require('./endPoints/v1/billing/pdfInvoice');





  // Profil de la company connectée (inclut company_code)


  app.get('/swift-app/v1/companies/me', authenticateToken, companyMe.getMyCompanyEndpoint);





  // Lookup par code public


  app.get('/swift-app/v1/companies/lookup', authenticateToken, companyLookup.lookupCompanyEndpoint);





  // Carnet de relations


  app.get('/swift-app/v1/companies/relations',     authenticateToken, companyRelations.listRelationsEndpoint);


  app.post('/swift-app/v1/companies/relations',    authenticateToken, companyRelations.saveRelationEndpoint);


  app.patch('/swift-app/v1/companies/relations/:id', authenticateToken, companyRelations.updateRelationEndpoint);


  app.delete('/swift-app/v1/companies/relations/:id', authenticateToken, companyRelations.deleteRelationEndpoint);





  const companyPublicTrucks = require('./endPoints/v1/companies/publicTrucks');


  app.get('/swift-app/v1/companies/:companyId/public-trucks', authenticateToken, companyPublicTrucks.getPublicTrucksEndpoint);

  // ── Referral / Parrainage ──────────────────────────────────────────────────
  app.get('/swift-app/v1/company/:companyId/referral-code', authenticateToken, (req, res) => {
    const { getReferralCodeEndpoint } = require('./endPoints/v1/referral');
    getReferralCodeEndpoint(req, res);
  });
  app.get('/swift-app/v1/company/:companyId/referrals', authenticateToken, (req, res) => {
    const { listReferralsEndpoint } = require('./endPoints/v1/referral');
    listReferralsEndpoint(req, res);
  });
  app.post('/swift-app/v1/referral/use', (req, res) => {
    // No auth required (called during onboarding before user has token)
    const { useReferralCodeEndpoint } = require('./endPoints/v1/referral');
    useReferralCodeEndpoint(req, res);
  });

  // ── Weekly hours quota ──────────────────────────────────────────────
  app.get('/swift-app/v1/company/:companyId/weekly-hours', authenticateToken, (req, res) => {
    const { getWeeklyHoursEndpoint } = require('./endPoints/v1/weeklyHours');
    getWeeklyHoursEndpoint(req, res);
  });






  const assignments = require('./endPoints/v1/assignments');


const gamificationV2 = require('./endPoints/v1/gamificationV2');


  app.get('/swift-app/v1/jobs/:jobId/assignments',                              authenticateToken, assignments.listAssignmentsEndpoint);


  app.post('/swift-app/v1/jobs/:jobId/assignments',                             authenticateToken, assignments.createAssignmentEndpoint);


  app.delete('/swift-app/v1/jobs/:jobId/assignments/:assignmentId',             authenticateToken, assignments.deleteAssignmentEndpoint);


  app.patch('/swift-app/v1/jobs/:jobId/assignments/:assignmentId/respond',      authenticateToken, assignments.respondToAssignmentEndpoint);


  app.get('/swift-app/v1/companies/:companyId/resources/availability',          authenticateToken, assignments.getResourceAvailabilityEndpoint);


  app.get('/swift-app/v1/users/me/assignments',                                 authenticateToken, assignments.getMyAssignmentsEndpoint);





  // Délégations de job


  app.post('/swift-app/v1/jobs/:jobId/transfers',                          authenticateToken, jobTransfers.createTransferEndpoint);


  app.get('/swift-app/v1/jobs/:jobId/transfers',                           authenticateToken, jobTransfers.listTransfersEndpoint);


  app.patch('/swift-app/v1/jobs/:jobId/transfers/:transferId/respond',     authenticateToken, jobTransfers.respondToTransferEndpoint);


  app.delete('/swift-app/v1/jobs/:jobId/transfers/:transferId',            authenticateToken, jobTransfers.cancelTransferEndpoint);





  // Délégations reçues (inbox)


  app.get('/swift-app/v1/transfers/incoming', authenticateToken, incomingTransfers.getIncomingTransfersEndpoint);





  // Inter-contractor billing


  app.get('/swift-app/v1/billing/inter-contractor/stats', authenticateToken, interContractorBilling.getBillingStats);


  app.get('/swift-app/v1/billing/inter-contractor', authenticateToken, interContractorBilling.listInterContractorBilling);


  app.patch('/swift-app/v1/billing/inter-contractor/:id', authenticateToken, interContractorBilling.updateBillingStatus);





  // Monthly Invoices


  app.post('/swift-app/v1/billing/monthly-invoices/generate', authenticateToken, monthlyInvoices.generateMonthlyInvoice);


  app.get('/swift-app/v1/billing/monthly-invoices/clients', authenticateToken, monthlyInvoices.listInvoiceClients);


  app.get('/swift-app/v1/billing/monthly-invoices', authenticateToken, monthlyInvoices.listMonthlyInvoices);


  app.get('/swift-app/v1/billing/monthly-invoices/:id', authenticateToken, monthlyInvoices.getMonthlyInvoice);
  app.get('/swift-app/v1/billing/monthly-invoices/:id/pdf', authenticateToken, pdfInvoice.downloadInvoicePdf);


  app.patch('/swift-app/v1/billing/monthly-invoices/:id', authenticateToken, monthlyInvoices.updateMonthlyInvoice);


  app.post('/swift-app/v1/billing/monthly-invoices/:id/send', authenticateToken, monthlyInvoices.sendMonthlyInvoice);








  // Contre-proposition contracteur


  app.post('/swift-app/v1/jobs/:jobId/counter_proposal', authenticateToken, counterProposal.counterProposalEndpoint);


  app.post('/swift-app/v1/jobs/:jobId/staff-requests', authenticateToken, staffRequestsEndpoint);


  app.post('/swift-app/v1/jobs/:jobId/accept_counter_proposal', authenticateToken, acceptCounterProposal.acceptCounterProposalEndpoint);


  app.post('/swift-app/v1/jobs/:jobId/reject_counter_proposal', authenticateToken, rejectCounterProposal.rejectCounterProposalEndpoint);


  app.get('/swift-app/v1/jobs/pending-assignments', authenticateToken, pendingAssignments.pendingAssignmentsEndpoint);





    console.log('✅ [Routes] B2B Transfer routes registered');





  // Cron Jobs


  require('./cron/monthlyInvoiceCron');


  require('./cron/trophySeasonCron');

  require('./cron/dailyRecapCron');
  require('./cron/overduePaymentsCron');


  require('./cron/storageBillingCron');

  // [Phase 3 JQS] Reputation score daily cron
  const { startReputationCron } = require('./utils/reputationCron');
  startReputationCron();


})();





// ✅ [POST] User Feedback


app.post('/swift-app/v1/feedback', require('./middleware/authenticateToken').authenticateToken, (req, res) => {


  console.log('[ Feedback endpoint called ]');


  const { feedbackEndpoint } = require('./endPoints/v1/feedback');


  feedbackEndpoint(req, res);


});





// 📸 [POST] Upload company logo


const uploadLogoMiddleware = require('./middleware/uploadImage');


app.post('/swift-app/v1/company/:companyId/logo', require('./middleware/authenticateToken').authenticateToken, uploadLogoMiddleware.single('logo'), (req, res) => {


  const { uploadCompanyLogoEndpoint } = require('./endPoints/v1/uploadCompanyLogo');


const { uploadUserAvatarEndpoint, deleteUserAvatarEndpoint } = require('./endPoints/v1/uploadUserAvatar');


  uploadCompanyLogoEndpoint(req, res);


});





// User avatar upload  


app.post('/swift-app/v1/user/avatar', require('./middleware/authenticateToken').authenticateToken, require('./middleware/uploadImage').single('avatar'), (req, res) => {


  const { uploadUserAvatarEndpoint } = require('./endPoints/v1/uploadUserAvatar');


  uploadUserAvatarEndpoint(req, res);


});


app.delete('/swift-app/v1/user/avatar', require('./middleware/authenticateToken').authenticateToken, (req, res) => {


  const { deleteUserAvatarEndpoint } = require('./endPoints/v1/uploadUserAvatar');


  deleteUserAvatarEndpoint(req, res);


});





// Plans endpoints


app.get('/swift-app/v1/plans', (req, res) => {


  const { getPlansEndpoint } = require('./endPoints/v1/plans');


  getPlansEndpoint(req, res);


});
app.post('/swift-app/v1/company/select-plan', require('./middleware/authenticateToken').authenticateToken, (req, res) => {


  const { selectPlanEndpoint } = require('./endPoints/v1/companies/selectPlan');


  selectPlanEndpoint(req, res);


});





app.post('/swift-app/v1/admin/company/plan', (req, res) => {


  const { setCompanyPlanEndpoint } = require('./endPoints/v1/adminSetPlan');


  setCompanyPlanEndpoint(req, res);


});

app.post('/swift-app/v1/admin/send-notification', require('./middleware/authenticateToken').authenticateToken, (req, res) => {
  const { adminSendNotificationEndpoint } = require('./endPoints/v1/adminSendNotification');
  adminSendNotificationEndpoint(req, res);
});










// === Modular Job Templates Routes ===


const { listModularTemplates, createModularTemplate, getModularTemplate, updateModularTemplate, deleteModularTemplate } = require('./endPoints/v1/modularTemplates');


const { initJobSegments, getJobSegments, startSegment, completeSegment, assignEmployeesToSegment, updateReturnTrip, getFlatRateOptions, updateFlatRateOptions, updateJobSegment, deleteJobSegment, addCustomSegment } = require('./endPoints/v1/jobSegments');


const { getJobTimeBreakdown } = require('./endPoints/v1/jobTimeBreakdown');





// Templates CRUD


app.get('/swift-app/v1/templates/modular', authenticateToken, listModularTemplates);


app.post('/swift-app/v1/templates/modular', authenticateToken, createModularTemplate);


app.get('/swift-app/v1/templates/modular/:id', authenticateToken, getModularTemplate);


app.put('/swift-app/v1/templates/modular/:id', authenticateToken, updateModularTemplate);


app.delete('/swift-app/v1/templates/modular/:id', authenticateToken, deleteModularTemplate);





// Job Segments


app.post('/swift-app/v1/jobs/:id/segments', authenticateToken, initJobSegments);


app.get('/swift-app/v1/jobs/:id/segments', authenticateToken, getJobSegments);


app.post('/swift-app/v1/jobs/:id/segments/:segId/start', authenticateToken, startSegment);


app.post('/swift-app/v1/jobs/:id/segments/:segId/complete', authenticateToken, completeSegment);


app.post('/swift-app/v1/jobs/:id/segments/:segId/employees', authenticateToken, assignEmployeesToSegment);


app.put('/swift-app/v1/jobs/:id/segments/:segId/employees', authenticateToken, assignEmployeesToSegment);


app.patch('/swift-app/v1/jobs/:id/segments/:segId', authenticateToken, updateJobSegment);


app.delete('/swift-app/v1/jobs/:id/segments/:segId', authenticateToken, deleteJobSegment);


app.post('/swift-app/v1/jobs/:id/segments/add', authenticateToken, addCustomSegment);


app.patch('/swift-app/v1/jobs/:id/return-trip', authenticateToken, updateReturnTrip);





// Flat Rate Options


app.get('/swift-app/v1/jobs/:id/flat-rate-options', authenticateToken, getFlatRateOptions);


app.put('/swift-app/v1/jobs/:id/flat-rate-options', authenticateToken, updateFlatRateOptions);








// Payment Issues


const { reportPaymentIssue, getPaymentIssues, resolvePaymentIssue } = require("./endPoints/v1/paymentIssues");


app.post("/swift-app/v1/jobs/:jobId/payment-issues", authenticateToken, reportPaymentIssue);


app.get("/swift-app/v1/jobs/:jobId/payment-issues", authenticateToken, getPaymentIssues);


app.patch("/swift-app/v1/payment-issues/:id/resolve", authenticateToken, resolvePaymentIssue);





// Time Breakdown


app.get('/swift-app/v1/jobs/:id/time-breakdown', authenticateToken, getJobTimeBreakdown);





// ABN Lookup endpoints (ABR API proxy)


app.get('/swift-app/v1/companies/abn-lookup', require('./middleware/authenticateToken').authenticateToken, (req, res) => {


  const { abnLookupEndpoint } = require('./endPoints/v1/companies/abnLookup');


  abnLookupEndpoint(req, res);


});





app.get('/swift-app/v1/companies/abn-search', require('./middleware/authenticateToken').authenticateToken, (req, res) => {


  const { abnSearchEndpoint } = require('./endPoints/v1/companies/abnLookup');


  abnSearchEndpoint(req, res);


});





// Postcode lookup endpoint (Australian suburbs)


app.get('/swift-app/v1/companies/postcode-lookup', require('./middleware/authenticateToken').authenticateToken, (req, res) => {


  const { postcodeLookupEndpoint } = require('./endPoints/v1/companies/abnLookup');


  postcodeLookupEndpoint(req, res);


});





// 🏆 Onboarding Milestones
const { getOnboardingMilestones, unlockOnboardingMilestone, markOnboardingMilestoneShown } = require('./endPoints/v1/users/milestones');

app.get('/swift-app/v1/users/me/onboarding-milestones', require('./middleware/authenticateToken').authenticateToken, getOnboardingMilestones);

app.post('/swift-app/v1/users/me/onboarding-milestones', require('./middleware/authenticateToken').authenticateToken, unlockOnboardingMilestone);

app.patch('/swift-app/v1/users/me/onboarding-milestones/:name/shown', require('./middleware/authenticateToken').authenticateToken, markOnboardingMilestoneShown);

// 404 HANDLER (doit être APRÈS toutes les routes)


// ============================================





// === Support Messaging Routes ===


const { listConversations, createConversation } = require('./endPoints/v1/support/conversations');


const { listMessages, sendMessage, replyToConversation } = require('./endPoints/v1/support/messages');





app.get('/swift-app/v1/support/conversations', authenticateToken, listConversations);


app.post('/swift-app/v1/support/conversations', authenticateToken, createConversation);


app.get('/swift-app/v1/support/conversations/:id/messages', authenticateToken, listMessages);


app.post('/swift-app/v1/support/conversations/:id/messages', authenticateToken, sendMessage);
app.post('/swift-app/v1/support/conversations/:id/reply', authenticateToken, replyToConversation);





// ── Storage routes ──


const storage = require("./endPoints/v1/storage");


app.get("/swift-app/v1/storage/units", authenticateToken, storage.listUnits);


app.post("/swift-app/v1/storage/units", authenticateToken, storage.createUnit);


app.patch("/swift-app/v1/storage/units/:id", authenticateToken, storage.updateUnit);


app.delete("/swift-app/v1/storage/units/:id", authenticateToken, storage.deleteUnit);


app.get("/swift-app/v1/storage/clients/search", authenticateToken, storage.searchClients);


app.get("/swift-app/v1/storage/lots", authenticateToken, storage.listLots);


app.get("/swift-app/v1/storage/lots/:id", authenticateToken, storage.getLot);


app.post("/swift-app/v1/storage/lots", authenticateToken, storage.createLot);


app.patch("/swift-app/v1/storage/lots/:id", authenticateToken, storage.updateLot);


app.delete("/swift-app/v1/storage/lots/:id", authenticateToken, storage.deleteLot);


app.post("/swift-app/v1/storage/lots/:id/units", authenticateToken, storage.assignUnit);


app.delete("/swift-app/v1/storage/lots/:lotId/units/:unitId", authenticateToken, storage.removeUnitFromLot);


app.patch("/swift-app/v1/storage/lots/:id/units/reorder", authenticateToken, storage.reorderUnits);


app.post("/swift-app/v1/storage/lots/:id/items", authenticateToken, storage.addItem);


app.patch("/swift-app/v1/storage/items/:id", authenticateToken, storage.updateItem);


app.delete("/swift-app/v1/storage/items/:id", authenticateToken, storage.deleteItem);


app.post("/swift-app/v1/storage/items/:id/checkout", authenticateToken, storage.checkoutItem);


app.get("/swift-app/v1/storage/lots/:id/photos", authenticateToken, storage.listPhotos);


app.post("/swift-app/v1/storage/lots/:id/photos", authenticateToken, storage.upload.single("image"), storage.uploadPhoto);


app.delete("/swift-app/v1/storage/photos/:id", authenticateToken, storage.deletePhoto);


app.get("/swift-app/v1/storage/lots/:id/billing", authenticateToken, storage.getBillingHistory);


app.post("/swift-app/v1/storage/lots/:id/billing", authenticateToken, storage.recordPayment);


app.patch("/swift-app/v1/storage/billing/:id", authenticateToken, storage.updateBillingRecord);


app.post("/swift-app/v1/storage/billing/generate", authenticateToken, storage.generateBilling);


app.get("/swift-app/v1/storage/billing/summary", authenticateToken, storage.getBillingSummary);


app.get("/swift-app/v1/storage/stats", authenticateToken, storage.getStorageStats);








// ============================================


// ⭐ JOB REVIEW — Public review pages


// ============================================


const review = require('./endPoints/review');


app.get('/review/:token', review.getReviewPage);


app.post('/review/:token/step', review.saveStep);


app.get('/swift-app/v1/job/:code/review', authenticateToken, review.getJobReview);






// ──────────────────────────────────────────────────────────────────────────────
// PHASE 1 — Multi-account : memberships, contractors, billing, events
// Deploye le : voir _backend_deploy/noah_deploy_phase1.ps1
// ──────────────────────────────────────────────────────────────────────────────
const { loadUserContext }    = require('./middleware/loadUserContext');
const { requirePermission }  = require('./middleware/requirePermission');

// ── Memberships (equipe interne) ──────────────────────────────────────────────
const {
  listMemberships,
  inviteMember,
  updatePermissions,
  suspendMember,
} = require('./endPoints/v1/memberships/index');

app.get('/swift-app/v1/memberships',
  authenticateToken, loadUserContext,
  (req, res) => listMemberships(req, res));
app.post('/swift-app/v1/memberships/invite',
  authenticateToken, loadUserContext,
  (req, res) => inviteMember(req, res));
app.patch('/swift-app/v1/memberships/:id/permissions',
  authenticateToken, loadUserContext,
  (req, res) => updatePermissions(req, res));
app.delete('/swift-app/v1/memberships/:id',
  authenticateToken, loadUserContext,
  (req, res) => suspendMember(req, res));

// ── Contractors reseau ABN ────────────────────────────────────────────────────
const {
  listContractors,
  inviteContractor,
  updateContractorStatus,
} = require('./endPoints/v1/contractors/index');

app.get('/swift-app/v1/contractors',
  authenticateToken, loadUserContext,
  (req, res) => listContractors(req, res));
app.post('/swift-app/v1/contractors/invite',
  authenticateToken, loadUserContext,
  (req, res) => inviteContractor(req, res));
app.patch('/swift-app/v1/contractors/:id/status',
  authenticateToken, loadUserContext,
  (req, res) => updateContractorStatus(req, res));

// ── Profil contractor (self) ──────────────────────────────────────────────────
const {
  getContractorProfile,
  upsertContractorProfile,
} = require('./endPoints/v1/contractorProfile/index');

app.get('/swift-app/v1/contractor-profile',
  authenticateToken,
  (req, res) => getContractorProfile(req, res));
app.put('/swift-app/v1/contractor-profile',
  authenticateToken,
  (req, res) => upsertContractorProfile(req, res));

// ── Assignations job <-> contractor ──────────────────────────────────────────
const {
  assignContractor,
  respondToAssignment,
  listJobContractors,
} = require('./endPoints/v1/jobContractors/index');

// IMPORTANT : la route /respond doit etre declaree AVANT /:assignmentId
app.post('/swift-app/v1/jobs/:jobId/contractors/:assignmentId/respond',
  authenticateToken,
  (req, res) => respondToAssignment(req, res));
app.post('/swift-app/v1/jobs/:jobId/contractors',
  authenticateToken, loadUserContext,
  (req, res) => assignContractor(req, res));
app.get('/swift-app/v1/jobs/:jobId/contractors',
  authenticateToken, loadUserContext,
  (req, res) => listJobContractors(req, res));

// ── Facturation client (flux entrant) ────────────────────────────────────────
const {
  listClientInvoices,
  getClientInvoice,
  createClientInvoice,
  updateClientInvoice,
} = require('./endPoints/v1/clientInvoices/index');

app.get('/swift-app/v1/client-invoices',
  authenticateToken, loadUserContext,
  requirePermission('can_view_financials'),
  (req, res) => listClientInvoices(req, res));
app.get('/swift-app/v1/client-invoices/:id',
  authenticateToken, loadUserContext,
  requirePermission('can_view_financials'),
  (req, res) => getClientInvoice(req, res));
app.post('/swift-app/v1/client-invoices',
  authenticateToken, loadUserContext,
  requirePermission('can_collect_payment'),
  (req, res) => createClientInvoice(req, res));
app.patch('/swift-app/v1/client-invoices/:id',
  authenticateToken, loadUserContext,
  requirePermission('can_collect_payment'),
  (req, res) => updateClientInvoice(req, res));

// ── Payables contractor (flux sortant) ───────────────────────────────────────
const {
  listContractorPayables,
  createContractorPayable,
  markContractorPaid,
} = require('./endPoints/v1/contractorPayables/index');

app.get('/swift-app/v1/contractor-payables',
  authenticateToken, loadUserContext,
  requirePermission('can_view_financials'),
  (req, res) => listContractorPayables(req, res));
app.post('/swift-app/v1/contractor-payables',
  authenticateToken, loadUserContext,
  requirePermission('can_manage_stripe'),
  (req, res) => createContractorPayable(req, res));
app.patch('/swift-app/v1/contractor-payables/:id/paid',
  authenticateToken, loadUserContext,
  requirePermission('can_manage_stripe'),
  (req, res) => markContractorPaid(req, res));
// ── FIN PHASE 1 ──────────────────────────────────────────────────────────────

app.use((req, res) => {


  res.status(404).json({ error: 'Not Found' });


});





// ============================================


// SERVER START


// ============================================





app.listen(port, () => {

  logger.success('SERVER', `Swift app server is running on http://localhost:${port}`);

  logger.info('SERVER', `Version: ${version}`);

  logger.info('SYSTEM', 'All systems ready and operational');

  // 🎮 Gamification V2 — Wiring event system
  try {
    const eventBus = require('./services/gamification/eventBus');
    const ruleEngine = require('./services/gamification/ruleEngine');
    eventBus.registerListeners(ruleEngine);
    logger.info('GAMIFICATION', 'Event bus wired to rule engine');
  } catch (e) {
    logger.warn('GAMIFICATION', 'Event bus wiring failed: ' + e.message);
  }


  


  // 🔍 DB Pool monitoring - toutes les 5 minutes


  const { healthCheck, cleanupIdleConnections } = require('./swiftDb');


  setInterval(async () => {


    try {


      const stats = await healthCheck();


      // Auto-cleanup si trop de connexions


      if (stats.total > 15) {


        console.log('🧹 [Auto] Too many connections, cleaning up...');


        await cleanupIdleConnections();


      }


    } catch (err) {


      console.error('❌ [DB Monitor] Error:', err.message);


    }


  }, 5 * 60 * 1000); // 5 minutes


  


  console.log('🔍 DB Pool monitoring started (every 5 min)');


});





module.exports = app;





