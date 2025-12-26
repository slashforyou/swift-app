// Script temporaire pour désactiver tous les console.log
// Utilisation: node disable-console.js

const fs = require('fs');
const path = require('path');

function disableConsoleLogs(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
            disableConsoleLogs(fullPath);
        } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            
            // Remplacer console.log par un commentaire temporaire
            const originalContent = content;
            content = content.replace(/console\.log\(/g, '// TEMP_DISABLED: console.log(');
            
            if (content !== originalContent) {
                fs.writeFileSync(fullPath, content);
                console.log(`✅ Disabled console.log in: ${fullPath}`);
            }
        }
    });
}

console.log('🚫 Disabling all console.log statements...');
disableConsoleLogs('./src');
console.log('✅ All console.log statements disabled');
console.log('📝 To re-enable, run: node enable-console.js');