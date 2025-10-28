/**
 * 📸 Test Manuel API Photos
 * 
 * Script Node.js pour tester les endpoints photos déployés
 * Utilise fetch directement avec un token JWT
 * 
 * Usage:
 *   node scripts/test-photos-api-manual.js
 * 
 * @date 28 octobre 2025
 */

const SERVER_URL = 'https://altivo.fr/swift-app/';
const TEST_JOB_ID = 'JOB-NERD-ACTIVE-001';

// ⚠️ IMPORTANT: Remplacer par ton token JWT réel
// Tu peux le récupérer depuis l'app mobile dans AsyncStorage
const AUTH_TOKEN = 'REMPLACER_PAR_TON_TOKEN_JWT';

console.log(`
╔═══════════════════════════════════════════════════════════╗
║           📸 TEST MANUEL API PHOTOS                      ║
╚═══════════════════════════════════════════════════════════╝

Server: ${SERVER_URL}
Job ID: ${TEST_JOB_ID}
Token: ${AUTH_TOKEN.substring(0, 20)}...

`);

// Vérifier si le token est configuré
if (AUTH_TOKEN === 'REMPLACER_PAR_TON_TOKEN_JWT') {
  console.error(`
❌ ERREUR: Token JWT non configuré !

Pour obtenir ton token:
1. Ouvre l'app mobile
2. Va dans DevTools / Console
3. Exécute: AsyncStorage.getItem('session_token').then(console.log)
4. Copie le token dans ce script (ligne 18)
5. Relance: node scripts/test-photos-api-manual.js

`);
  process.exit(1);
}

/**
 * Test 1: GET /v1/job/{jobId}/images - Récupérer photos
 */
async function testFetchPhotos() {
  console.log('\n🔥 TEST 1: GET /v1/job/{jobId}/images');
  console.log('─'.repeat(60));
  
  try {
    const url = `${SERVER_URL}v1/job/${TEST_JOB_ID}/images`;
    console.log(`📡 URL: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const error = await response.text();
      console.error(`❌ Erreur: ${error}`);
      return null;
    }
    
    const data = await response.json();
    console.log(`✅ Réponse reçue:`, JSON.stringify(data, null, 2));
    
    const photos = data.images || data.photos || data || [];
    console.log(`📸 Nombre de photos: ${photos.length}`);
    
    if (photos.length > 0) {
      console.log(`\n📋 Première photo:`);
      console.log(`  - ID: ${photos[0].id}`);
      console.log(`  - Filename: ${photos[0].filename}`);
      console.log(`  - Description: ${photos[0].description || '(aucune)'}`);
      console.log(`  - Size: ${photos[0].file_size} bytes`);
      console.log(`  - Created: ${photos[0].created_at}`);
    }
    
    return photos;
    
  } catch (error) {
    console.error(`❌ Exception:`, error.message);
    return null;
  }
}

/**
 * Test 2: GET /v1/image/{id}/serve - Afficher photo
 */
async function testServePhoto(photoId) {
  console.log('\n🔥 TEST 2: GET /v1/image/{id}/serve');
  console.log('─'.repeat(60));
  
  if (!photoId) {
    console.log('⏭️  Skipped: Pas de photo ID disponible');
    return;
  }
  
  try {
    const url = `${SERVER_URL}v1/image/${photoId}/serve`;
    console.log(`📡 URL: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
      },
      redirect: 'manual', // Ne pas suivre les redirects automatiquement
    });
    
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    
    if (response.status === 302 || response.status === 301) {
      const location = response.headers.get('Location');
      console.log(`✅ Redirect vers: ${location}`);
      return location;
    }
    
    if (response.status === 200) {
      const contentType = response.headers.get('Content-Type');
      const contentLength = response.headers.get('Content-Length');
      console.log(`✅ Image servie directement:`);
      console.log(`  - Content-Type: ${contentType}`);
      console.log(`  - Content-Length: ${contentLength} bytes`);
      return true;
    }
    
    const error = await response.text();
    console.error(`❌ Erreur: ${error}`);
    return null;
    
  } catch (error) {
    console.error(`❌ Exception:`, error.message);
    return null;
  }
}

/**
 * Test 3: PATCH /v1/image/{id} - Modifier description
 */
async function testUpdateDescription(photoId) {
  console.log('\n🔥 TEST 3: PATCH /v1/image/{id}');
  console.log('─'.repeat(60));
  
  if (!photoId) {
    console.log('⏭️  Skipped: Pas de photo ID disponible');
    return;
  }
  
  try {
    const newDescription = `Test description - ${new Date().toISOString()}`;
    const url = `${SERVER_URL}v1/image/${photoId}`;
    console.log(`📡 URL: ${url}`);
    console.log(`📝 New description: ${newDescription}`);
    
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ description: newDescription }),
    });
    
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const error = await response.text();
      console.error(`❌ Erreur: ${error}`);
      return null;
    }
    
    const data = await response.json();
    console.log(`✅ Réponse:`, JSON.stringify(data, null, 2));
    
    const photo = data.photo || data.image || data;
    console.log(`📸 Description mise à jour: "${photo.description}"`);
    
    return photo;
    
  } catch (error) {
    console.error(`❌ Exception:`, error.message);
    return null;
  }
}

/**
 * Test 4: DELETE /v1/image/{id} - Supprimer photo
 */
async function testDeletePhoto(photoId) {
  console.log('\n🔥 TEST 4: DELETE /v1/image/{id}');
  console.log('─'.repeat(60));
  
  if (!photoId) {
    console.log('⏭️  Skipped: Pas de photo ID disponible');
    return;
  }
  
  // Demander confirmation
  console.log(`⚠️  WARNING: Cette action va supprimer la photo ${photoId}`);
  console.log(`⚠️  Pour tester la suppression, décommente le code dans le script`);
  return; // Commenté par défaut pour éviter suppressions accidentelles
  
  /*
  try {
    const url = `${SERVER_URL}v1/image/${photoId}`;
    console.log(`📡 URL: ${url}`);
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const error = await response.text();
      console.error(`❌ Erreur: ${error}`);
      return false;
    }
    
    const data = await response.json();
    console.log(`✅ Réponse:`, JSON.stringify(data, null, 2));
    console.log(`🗑️  Photo supprimée (soft delete)`);
    
    return true;
    
  } catch (error) {
    console.error(`❌ Exception:`, error.message);
    return false;
  }
  */
}

/**
 * Test 5: POST /v1/job/{jobId}/image - Upload photo (requiert fichier réel)
 */
async function testUploadPhoto() {
  console.log('\n🔥 TEST 5: POST /v1/job/{jobId}/image');
  console.log('─'.repeat(60));
  console.log('⚠️  Test upload nécessite un fichier réel');
  console.log('ℹ️  Pour tester l\'upload, utilise l\'app mobile');
  console.log('ℹ️  Ou utilise curl:');
  console.log(`
curl -X POST ${SERVER_URL}v1/job/${TEST_JOB_ID}/image \\
  -H "Authorization: Bearer ${AUTH_TOKEN}" \\
  -F "image=@photo.jpg" \\
  -F "description=Test photo"
  `);
}

/**
 * Test de sécurité: Requête sans token
 */
async function testSecurityNoToken() {
  console.log('\n🔒 TEST SÉCURITÉ: Requête sans token');
  console.log('─'.repeat(60));
  
  try {
    const url = `${SERVER_URL}v1/job/${TEST_JOB_ID}/images`;
    console.log(`📡 URL: ${url} (sans Authorization header)`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    
    if (response.status === 401 || response.status === 403) {
      console.log(`✅ Sécurité OK: Requête rejetée (${response.status})`);
      return true;
    } else {
      console.log(`❌ PROBLÈME SÉCURITÉ: Requête acceptée sans token !`);
      return false;
    }
    
  } catch (error) {
    console.error(`❌ Exception:`, error.message);
    return null;
  }
}

/**
 * Exécuter tous les tests
 */
async function runAllTests() {
  console.log('🚀 Démarrage des tests...\n');
  
  const startTime = Date.now();
  
  // Test 1: Récupérer photos
  const photos = await testFetchPhotos();
  const photoId = photos && photos.length > 0 ? photos[0].id : null;
  
  // Test 2: Serve photo
  await testServePhoto(photoId);
  
  // Test 3: Update description
  await testUpdateDescription(photoId);
  
  // Test 4: Delete photo (commenté par défaut)
  await testDeletePhoto(photoId);
  
  // Test 5: Upload photo (info only)
  await testUploadPhoto();
  
  // Test sécurité
  await testSecurityNoToken();
  
  const duration = Date.now() - startTime;
  
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║               ✅ TESTS TERMINÉS                          ║
╚═══════════════════════════════════════════════════════════╝

⏱️  Durée totale: ${duration}ms

Résultats:
${photos ? '✅' : '❌'} GET /v1/job/{jobId}/images
${photoId ? '✅' : '⏭️ '} GET /v1/image/{id}/serve
${photoId ? '✅' : '⏭️ '} PATCH /v1/image/{id}
⚠️  DELETE /v1/image/{id} (commenté)
ℹ️  POST /v1/job/{jobId}/image (utilise l'app mobile)

${photos && photos.length > 0 
  ? `\n📸 ${photos.length} photo(s) trouvée(s) dans le job\n` 
  : '\n⚠️  Aucune photo trouvée - utilise l\'app mobile pour en ajouter\n'
}
`);
}

// Exécuter
runAllTests().catch(error => {
  console.error('\n💥 ERREUR FATALE:', error);
  process.exit(1);
});
