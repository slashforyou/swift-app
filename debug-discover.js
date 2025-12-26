/**
 * Debug: Voir la réponse brute de /api/discover
 */

const API_BASE_URL = 'https://altivo.fr/swift-app/v1';

async function debugDiscover() {
    try {
        console.log('📡 GET', `${API_BASE_URL}/api/discover`);
        const response = await fetch(`${API_BASE_URL}/api/discover`);
        
        console.log('\n📊 Response status:', response.status, response.statusText);
        console.log('📊 Response headers:', Object.fromEntries(response.headers));
        
        const text = await response.text();
        console.log('\n📄 Raw response (first 500 chars):');
        console.log(text.substring(0, 500));
        
        console.log('\n\n🔍 Trying to parse as JSON:');
        try {
            const json = JSON.parse(text);
            console.log('✅ Valid JSON');
            console.log('Keys:', Object.keys(json));
            console.log('\nFull object:');
            console.log(JSON.stringify(json, null, 2).substring(0, 1000));
        } catch (e) {
            console.error('❌ Not valid JSON:', e.message);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

debugDiscover();
