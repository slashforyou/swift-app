/**
 * Script de test du backend pour la signature
 * Teste les endpoints nécessaires au fonctionnement de la signature
 */

const https = require('https');
const http = require('http');

// Configuration
const BASE_URL = 'https://altivo.fr/swift-app'; // Sans /v1 - on l'ajoute dans les paths
const JOB_ID = 8; // Job de test

// Couleurs pour la console
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(method, path, data = null, token = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(BASE_URL + path);
        const isHttps = url.protocol === 'https:';
        const lib = isHttps ? https : http;
        
        const options = {
            hostname: url.hostname,
            port: url.port || (isHttps ? 443 : 80),
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            }
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        const req = lib.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const json = body ? JSON.parse(body) : null;
                    resolve({ status: res.statusCode, data: json, headers: res.headers });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body, headers: res.headers });
                }
            });
        });

        req.on('error', reject);

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

async function testHealthCheck() {
    log('\n=== TEST 1: Health Check ===', 'cyan');
    try {
        const result = await makeRequest('GET', '/v1/health');
        log(`Status: ${result.status}`, result.status === 200 ? 'green' : 'red');
        log(`Response: ${JSON.stringify(result.data, null, 2)}`, 'reset');
        return result.status === 200;
    } catch (error) {
        log(`Error: ${error.message}`, 'red');
        return false;
    }
}

async function testLogin() {
    log('\n=== TEST 2: Login (obtenir token) ===', 'cyan');
    
    // Credentials de test depuis la doc + device payload simulé
    const testCredentials = {
        mail: 'test@swift-app.com',
        password: 'password123',
        device: {
            name: 'Test Script Device',
            platform: 'android',
            osVersion: '14',
            appVersion: '1.0.0',
            deviceId: 'test-device-' + Date.now()
        },
        wantRefreshInBody: true
    };
    
    try {
        const result = await makeRequest('POST', '/auth/login', testCredentials);
        log(`Status: ${result.status}`, result.status === 200 ? 'green' : 'yellow');
        
        if (result.status === 200 && result.data?.sessionToken) {
            log(`Token obtenu: ${result.data.sessionToken.substring(0, 30)}...`, 'green');
            return result.data.sessionToken;
        } else {
            log(`Réponse: ${JSON.stringify(result.data, null, 2)}`, 'yellow');
            log('Note: Authentification nécessaire - utiliser un token existant', 'yellow');
            return null;
        }
    } catch (error) {
        log(`Error: ${error.message}`, 'red');
        return null;
    }
}

async function testGetJobDetails(token) {
    log(`\n=== TEST 3: GET /v1/job/${JOB_ID}/full ===`, 'cyan');
    try {
        const result = await makeRequest('GET', `/v1/job/${JOB_ID}/full`, null, token);
        log(`Status: ${result.status}`, result.status === 200 ? 'green' : 'red');
        
        if (result.status === 200 && result.data) {
            const data = result.data.data || result.data;
            const job = data.job || data;
            log('Job trouvé:', 'green');
            log(`  - ID: ${job.id}`, 'reset');
            log(`  - Code: ${job.code}`, 'reset');
            log(`  - Status: ${job.status}`, 'reset');
            log(`  - Step: ${job.step || job.current_step}`, 'reset');
            log(`  - signature_blob: ${job.signature_blob ? '✅ PRESENT (' + String(job.signature_blob).substring(0, 50) + '...)' : '❌ NULL/ABSENT'}`, job.signature_blob ? 'green' : 'red');
            log(`  - signature_date: ${job.signature_date || '❌ NULL'}`, job.signature_date ? 'green' : 'red');
            return { success: true, job, rawData: result.data };
        } else {
            log(`Réponse: ${JSON.stringify(result.data, null, 2)}`, 'red');
            return { success: false };
        }
    } catch (error) {
        log(`Error: ${error.message}`, 'red');
        return { success: false };
    }
}

async function testGetSignatures(token) {
    log(`\n=== TEST 4: GET /v1/job/${JOB_ID}/signatures ===`, 'cyan');
    try {
        const result = await makeRequest('GET', `/v1/job/${JOB_ID}/signatures`, null, token);
        log(`Status: ${result.status}`, result.status === 200 ? 'green' : 'yellow');
        
        if (result.status === 200) {
            log(`Signatures trouvées: ${JSON.stringify(result.data, null, 2)}`, 'green');
            return result.data;
        } else if (result.status === 404) {
            log('Endpoint /signatures non trouvé (peut-être pas implémenté)', 'yellow');
            return null;
        } else {
            log(`Réponse: ${JSON.stringify(result.data, null, 2)}`, 'yellow');
            return null;
        }
    } catch (error) {
        log(`Error: ${error.message}`, 'red');
        return null;
    }
}

async function testGetSignature(token) {
    log(`\n=== TEST 5: GET /v1/job/${JOB_ID}/signature ===`, 'cyan');
    try {
        const result = await makeRequest('GET', `/v1/job/${JOB_ID}/signature`, null, token);
        log(`Status: ${result.status}`, result.status === 200 ? 'green' : 'yellow');
        
        if (result.status === 200) {
            log(`Signature trouvée: ${JSON.stringify(result.data, null, 2)}`, 'green');
            return result.data;
        } else if (result.status === 404) {
            log('Pas de signature ou endpoint non trouvé', 'yellow');
            return null;
        } else {
            log(`Réponse: ${JSON.stringify(result.data, null, 2)}`, 'yellow');
            return null;
        }
    } catch (error) {
        log(`Error: ${error.message}`, 'red');
        return null;
    }
}

async function testListEndpoints() {
    log('\n=== TEST 6: Liste des endpoints disponibles ===', 'cyan');
    try {
        const result = await makeRequest('GET', '/v1/endpoints');
        if (result.status === 200 && result.data) {
            // Chercher les endpoints liés à signature
            const endpoints = result.data.endpoints || result.data;
            if (Array.isArray(endpoints)) {
                const signatureEndpoints = endpoints.filter(ep => 
                    (ep.path && ep.path.includes('signature')) || 
                    (ep.url && ep.url.includes('signature'))
                );
                log(`Endpoints signature trouvés: ${signatureEndpoints.length}`, 'green');
                signatureEndpoints.forEach(ep => {
                    log(`  - ${ep.method || 'GET'} ${ep.path || ep.url}`, 'reset');
                });
            }
            return endpoints;
        }
        return null;
    } catch (error) {
        log(`Error: ${error.message}`, 'yellow');
        return null;
    }
}

async function runAllTests() {
    log('🔍 TESTS DU BACKEND SIGNATURE', 'blue');
    log('================================', 'blue');
    log(`Base URL: ${BASE_URL}`, 'reset');
    log(`Job ID: ${JOB_ID}`, 'reset');
    
    // Test 1: Health check
    const healthOk = await testHealthCheck();
    
    // Test 2: Login
    const token = await testLogin();
    
    // Test 3: Get job details
    const jobResult = await testGetJobDetails(token);
    
    // Test 4: Get signatures list
    await testGetSignatures(token);
    
    // Test 5: Get signature
    await testGetSignature(token);
    
    // Test 6: List endpoints
    await testListEndpoints();
    
    // Résumé
    log('\n=== RÉSUMÉ ===', 'cyan');
    log(`Health Check: ${healthOk ? '✅' : '❌'}`, healthOk ? 'green' : 'red');
    log(`Token obtenu: ${token ? '✅' : '❌ (auth requise)'}`, token ? 'green' : 'yellow');
    log(`Job ${JOB_ID} accessible: ${jobResult.success ? '✅' : '❌'}`, jobResult.success ? 'green' : 'red');
    
    if (jobResult.success) {
        log(`\n📋 ÉTAT SIGNATURE JOB ${JOB_ID}:`, 'blue');
        log(`   signature_blob: ${jobResult.job.signature_blob ? '✅ EXISTE' : '❌ ABSENT'}`, jobResult.job.signature_blob ? 'green' : 'red');
        log(`   signature_date: ${jobResult.job.signature_date || 'NULL'}`, jobResult.job.signature_date ? 'green' : 'red');
    }
    
    log('\n🔍 ANALYSE:', 'blue');
    if (!token) {
        log('⚠️  Sans token, les tests sont limités. Vérifier si le backend nécessite une authentification.', 'yellow');
    }
    if (jobResult.success && !jobResult.job.signature_blob) {
        log('⚠️  Le job existe mais signature_blob est NULL dans la réponse API.', 'yellow');
        log('   → Le problème est probablement côté BACKEND (la signature n\'est pas retournée)', 'yellow');
    } else if (jobResult.success && jobResult.job.signature_blob) {
        log('✅ Le backend retourne bien signature_blob.', 'green');
        log('   → Le problème est probablement côté FRONTEND (la donnée n\'est pas utilisée)', 'green');
    }
}

runAllTests().catch(console.error);
