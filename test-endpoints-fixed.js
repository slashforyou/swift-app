/**
 * SCRIPT SIMPLE: Test des endpoints disponibles
 * Usage: node test-endpoints-simple.js
 */

const API_BASE_URL = 'https://altivo.fr/swift-app/v1';

async function testEndpoints() {
    console.log('\n🔍 ANALYSE DES ENDPOINTS DISPONIBLES\n');
    console.log('='.repeat(60));
    
    try {
        // Fetch all endpoints
        console.log('\n📡 Récupération des endpoints depuis /api/discover...');
        const response = await fetch(`${API_BASE_URL}/api/discover`);
        const result = await response.json();
        
        if (!result.success || !result.data || !result.data.categories) {
            throw new Error('❌ Réponse invalide de /api/discover');
        }
        
        const data = result.data;
        
        // Flatten all routes from all categories
        const allEndpoints = [];
        Object.entries(data.categories).forEach(([category, info]) => {
            if (info.routes && Array.isArray(info.routes)) {
                info.routes.forEach(route => {
                    allEndpoints.push({ ...route, category });
                });
            }
        });
        
        console.log(`✅ ${allEndpoints.length} endpoints récupérés\n`);
        
        // Filtrer les endpoints liés aux jobs/steps/timer
        const jobEndpoints = allEndpoints.filter(ep => 
            ep.path.includes('/job') || 
            ep.path.includes('/step') ||
            ep.path.includes('/timer')
        );
        
        console.log('📋 ENDPOINTS JOB/STEP/TIMER TROUVÉS:');
        console.log('='.repeat(60));
        
        if (jobEndpoints.length === 0) {
            console.log('❌ AUCUN endpoint job/step/timer trouvé!\n');
        } else {
            jobEndpoints.forEach(ep => {
                const method = (ep.method || 'GET').padEnd(6);
                console.log(`  ${method} ${ep.path}`);
                if (ep.description) {
                    console.log(`         📝 ${ep.description}`);
                }
            });
        }
        
        console.log('\n' + '='.repeat(60));
        
        // Rechercher des endpoints spécifiques qui nous manquent
        console.log('\n🔎 RECHERCHE DES ENDPOINTS MANQUANTS:\n');
        
        const missingEndpoints = [
            { method: 'PATCH', path: '/swift-app/v1/job/:job_id/step', name: 'Update Job Step' },
            { method: 'POST', path: '/swift-app/v1/job/:job_id/timer/start', name: 'Start Timer' },
            { method: 'POST', path: '/swift-app/v1/job/:job_id/timer/stop', name: 'Stop Timer' },
            { method: 'GET', path: '/swift-app/v1/job/:job_id/step', name: 'Get Job Step' },
            { method: 'GET', path: '/swift-app/v1/job/:job_id/steps/history', name: 'Get Steps History' }
        ];
        
        missingEndpoints.forEach(missing => {
            const found = allEndpoints.find(ep => 
                ep.method === missing.method && 
                (ep.path === missing.path || ep.path.replace(/:\w+/g, ':id') === missing.path.replace(/:\w+/g, ':id'))
            );
            
            if (found) {
                console.log(`  ✅ ${missing.name}: TROUVÉ`);
                console.log(`     ${missing.method} ${found.path}`);
            } else {
                console.log(`  ❌ ${missing.name}: MANQUANT`);
                console.log(`     Cherché: ${missing.method} ${missing.path}`);
                
                // Chercher des alternatives
                const alternatives = allEndpoints.filter(ep => 
                    ep.path.includes('/job') && 
                    (ep.path.includes('step') || ep.path.includes('timer') || ep.path.includes('update'))
                );
                
                if (alternatives.length > 0) {
                    console.log(`     Alternatives possibles:`);
                    alternatives.slice(0, 3).forEach(alt => {
                        console.log(`       - ${alt.method} ${alt.path}`);
                    });
                }
            }
            console.log('');
        });
        
        // Catégories
        console.log('='.repeat(60));
        console.log('\n📂 ENDPOINTS PAR CATÉGORIE:\n');
        
        Object.entries(data.categories)
            .sort((a, b) => b[1].count - a[1].count)
            .forEach(([cat, info]) => {
                console.log(`  ${cat.padEnd(30)} ${info.count} endpoints`);
            });
        
        console.log('\n' + '='.repeat(60));
        console.log('\n✅ ANALYSE TERMINÉE\n');
        
        // Recommendations
        console.log('💡 RECOMMANDATIONS:\n');
        
        const stepEndpoint = allEndpoints.find(ep => 
            ep.method === 'PATCH' && ep.path.includes('/job') && ep.path.includes('step')
        );
        
        if (!stepEndpoint) {
            console.log('  ⚠️  Les endpoints step/timer semblent manquants sur le backend');
            console.log('  ➡️  Option 1: Implémenter ces endpoints sur le backend');
            console.log('  ➡️  Option 2: Utiliser un endpoint générique PATCH /job/:id');
            console.log('  ➡️  Option 3: Continuer en mode local-only (actuel)\n');
        } else {
            console.log('  ✅ Les endpoints existent, vérifier les paths dans le code frontend\n');
        }
        
    } catch (error) {
        console.error('❌ ERREUR:', error.message);
        console.error(error.stack);
    }
}

// Run
testEndpoints().then(() => process.exit(0)).catch(err => {
    console.error('FATAL:', err);
    process.exit(1);
});
