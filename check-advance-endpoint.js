const fetch = require('node-fetch');

async function checkAdvanceStep() {
    const response = await fetch('https://altivo.fr/swift-app/v1/api/discover');
    const data = await response.json();
    
    const allEndpoints = [];
    Object.values(data.data.categories).forEach(cat => {
        if (cat.routes) {
            cat.routes.forEach(route => allEndpoints.push(route));
        }
    });
    
    const advanceStep = allEndpoints.filter(e => e.path.includes('advance'));
    console.log('\n📋 Endpoints avec "advance":');
    console.log(JSON.stringify(advanceStep, null, 2));
    
    const startEndpoint = allEndpoints.filter(e => e.path.includes('/job/') && e.path.includes('/start'));
    console.log('\n📋 Endpoints avec "/start":');
    console.log(JSON.stringify(startEndpoint.slice(0, 5), null, 2));
}

checkAdvanceStep().catch(console.error);
