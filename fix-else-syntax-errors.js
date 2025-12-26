const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing } else { syntax errors...');

// Fonction pour traiter un fichier
function fixFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Pattern pour détecter et corriger } else {
        const fixedContent = content.replace(/} else\);\s*/g, '} else {\n        ');
        
        if (content !== fixedContent) {
            fs.writeFileSync(filePath, fixedContent, 'utf8');
            console.log(`✅ Fixed: ${path.basename(filePath)}`);
            return true;
        }
        return false;
    } catch (error) {
        console.error(`❌ Error fixing ${filePath}:`, error.message);
        return false;
    }
}

// Fonction pour chercher et traiter tous les fichiers
function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    let totalFixed = 0;
    
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !['node_modules', '.git', 'android', 'ios', '.expo'].includes(file)) {
            totalFixed += processDirectory(fullPath);
        } else if (file.match(/\.(ts|tsx|js|jsx)$/)) {
            if (fixFile(fullPath)) {
                totalFixed++;
            }
        }
    }
    
    return totalFixed;
}

// Traitement spécifique pour les cas complexes
function fixComplexPatterns() {
    const complexFiles = [
        'src/components/home/ProfileHeaderNewComplete.tsx',
        'src/hooks/useBusinessStats.ts',
        'src/hooks/useJobTimer.ts',
        'src/components/jobDetails/modals/PhotoSelectionModal.tsx'
    ];
    
    let fixedCount = 0;
    
    complexFiles.forEach(relativeFilePath => {
        const fullPath = path.join(__dirname, relativeFilePath);
        if (fs.existsSync(fullPath)) {
            try {
                let content = fs.readFileSync(fullPath, 'utf8');
                let hasChanges = false;
                
                // Pattern 1: } else {        quelque chose
                content = content.replace(/} else\);\s+/g, '} else {\n        ');
                
                // Pattern 2: Fermer les blocs else orphelins
                // Chercher les else { qui ne sont pas fermés correctement
                const lines = content.split('\n');
                const fixedLines = [];
                let openElseBlocks = 0;
                
                for (let i = 0; i < lines.length; i++) {
                    let line = lines[i];
                    
                    // Compter les else { ouvertes
                    if (line.includes('} else {')) {
                        openElseBlocks++;
                    }
                    
                    // Si on trouve une ligne qui devrait fermer un else
                    if (openElseBlocks > 0 && line.trim() && 
                        !line.includes('if') && !line.includes('else') && 
                        !line.includes('{') && !line.includes('}') &&
                        line.includes('lastTapTime')) {
                        // Ajouter la fermeture du bloc else avant cette ligne
                        const indentation = line.match(/^\s*/)[0];
                        fixedLines.push(indentation + '}');
                        openElseBlocks--;
                        hasChanges = true;
                    }
                    
                    fixedLines.push(line);
                }
                
                if (hasChanges) {
                    fs.writeFileSync(fullPath, fixedLines.join('\n'), 'utf8');
                    console.log(`✅ Complex fix applied to: ${path.basename(fullPath)}`);
                    fixedCount++;
                }
            } catch (error) {
                console.error(`❌ Error with complex fix for ${fullPath}:`, error.message);
            }
        }
    });
    
    return fixedCount;
}

// Exécution principale
console.log('Starting global syntax fix...');
const fixedFiles = processDirectory(path.join(__dirname, 'src'));
const complexFixed = fixComplexPatterns();

console.log(`\n📊 Results:`);
console.log(`- Standard fixes: ${fixedFiles}`);
console.log(`- Complex fixes: ${complexFixed}`);
console.log(`- Total files fixed: ${fixedFiles + complexFixed}`);
console.log('\n🎉 Global syntax fix completed!');