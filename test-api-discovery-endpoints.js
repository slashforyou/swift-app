/**
 * 🔍 TEST API DISCOVERY - Vérification des endpoints disponibles
 * 
 * Ce script teste quels endpoints sont réellement disponibles sur le backend
 * pour comprendre pourquoi les steps ne fonctionnent pas.
 */

const API_BASE_URL = 'https://altivo.fr/swift-app/v1';

async function testApiDiscovery() {
    console.log('🔍 Testing API Discovery...\n');
    
    try {
        // 1. Tester l'endpoint de découverte
        console.log('1️⃣ Fetching endpoint discovery...');
        const response = await fetch(`${API_BASE_URL}/api/discover`);
        const data = await response.json();
        
        if (!data.success) {
            console.error('❌ Discovery failed:', data);
            return;
        }
        
        console.log(`✅ Found ${data.data.endpoints.length} endpoints\n`);
        
        // 2. Chercher les endpoints relatifs aux jobs/steps
        console.log('2️⃣ Searching for job-related endpoints...\n');
        
        const jobEndpoints = data.data.endpoints.filter(e => 
            e.path.includes('/job') || 
            e.path.includes('/step') ||
            e.path.includes('/timer')
        );
        
        console.log(`📊 Found ${jobEndpoints.length} job-related endpoints:\n`);
        
        // Grouper par type
        const byType = {
            step: [],
            timer: [],
            job: [],
            other: []
        };
        
        jobEndpoints.forEach(endpoint => {
            if (endpoint.path.includes('/step')) {
                byType.step.push(endpoint);
            } else if (endpoint.path.includes('/timer')) {
                byType.timer.push(endpoint);
            } else if (endpoint.path.includes('/job')) {
                byType.job.push(endpoint);
            } else {
                byType.other.push(endpoint);
            }
        });
        
        // Afficher les résultats
        console.log('📍 STEP ENDPOINTS:');
        if (byType.step.length === 0) {
            console.log('  ❌ NO STEP ENDPOINTS FOUND!\n');
        } else {
            byType.step.forEach(e => {
                console.log(`  ✅ ${e.method.padEnd(6)} ${e.path}`);
            });
            console.log('');
        }
        
        console.log('⏱️  TIMER ENDPOINTS:');
        if (byType.timer.length === 0) {
            console.log('  ❌ NO TIMER ENDPOINTS FOUND!\n');
        } else {
            byType.timer.forEach(e => {
                console.log(`  ✅ ${e.method.padEnd(6)} ${e.path}`);
            });
            console.log('');
        }
        
        console.log('💼 JOB ENDPOINTS:');
        if (byType.job.length === 0) {
            console.log('  ❌ NO JOB ENDPOINTS FOUND!\n');
        } else {
            byType.job.forEach(e => {
                console.log(`  ✅ ${e.method.padEnd(6)} ${e.path}`);
            });
            console.log('');
        }
        
        // 3. Chercher des alternatives possibles
        console.log('3️⃣ Looking for alternative endpoints...\n');
        
        const alternatives = data.data.endpoints.filter(e => 
            e.path.includes('/update') ||
            e.path.includes('/complete') ||
            e.path.includes('/status')
        );
        
        if (alternatives.length > 0) {
            console.log('🔄 POTENTIAL ALTERNATIVES:');
            alternatives.forEach(e => {
                console.log(`  💡 ${e.method.padEnd(6)} ${e.path}`);
            });
            console.log('');
        }
        
        // 4. Afficher les catégories disponibles
        console.log('4️⃣ Available categories:\n');
        Object.keys(data.data.categories || {}).forEach(cat => {
            const count = data.data.categories[cat];
            console.log(`  📁 ${cat}: ${count} endpoints`);
        });
        console.log('');
        
        // 5. Recommandations
        console.log('💡 RECOMMENDATIONS:\n');
        
        if (byType.step.length === 0) {
            console.log('⚠️  NO STEP ENDPOINTS DETECTED!');
            console.log('   Possible solutions:');
            console.log('   1. Use job update endpoint instead: PATCH /swift-app/v1/job/:job_id');
            console.log('   2. Backend needs to implement step endpoints');
            console.log('   3. Use local-only step tracking (current fallback)\n');
        }
        
        if (byType.timer.length === 0) {
            console.log('⚠️  NO TIMER ENDPOINTS DETECTED!');
            console.log('   Possible solutions:');
            console.log('   1. Backend needs to implement timer endpoints');
            console.log('   2. Use local-only timer tracking\n');
        }
        
        // 6. Sauvegarder les résultats dans un fichier
        const fs = require('fs');
        const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
        const filename = `api-discovery-results-${timestamp}.json`;
        
        fs.writeFileSync(filename, JSON.stringify({
            timestamp: new Date().toISOString(),
            totalEndpoints: data.data.endpoints.length,
            jobRelated: jobEndpoints,
            stepEndpoints: byType.step,
            timerEndpoints: byType.timer,
            jobEndpoints: byType.job,
            categories: data.data.categories,
            recommendations: {
                hasStepEndpoints: byType.step.length > 0,
                hasTimerEndpoints: byType.timer.length > 0,
                needsBackendImplementation: byType.step.length === 0 || byType.timer.length === 0
            }
        }, null, 2));
        
        console.log(`📄 Results saved to: ${filename}\n`);
        
    } catch (error) {
        console.error('❌ Error testing API Discovery:', error);
    }
}

// Exécuter le test
testApiDiscovery();
