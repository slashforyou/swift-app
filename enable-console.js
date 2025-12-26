// Script pour réactiver tous les console.log
// Utilisation: node enable-console.js

const fs = require('fs');
const path = require('path');

function enableConsoleLogs(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
            enableConsoleLogs(fullPath);
        } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            
            // Restaurer console.log
            const originalContent = content;
            content = content.replace(/\/\/ TEMP_DISABLED: console\.log\(/g, 'console.log(');
            
            if (content !== originalContent) {
                fs.writeFileSync(fullPath, content);
                console.log(`✅ Enabled console.log in: ${fullPath}`);
            }
        }
    });
}

console.log('✅ Re-enabling all console.log statements...');
enableConsoleLogs('./src');
console.log('✅ All console.log statements re-enabled');