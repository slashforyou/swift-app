const fs = require('fs');
const path = require('path');

let totalErrors = 0;
let totalFiles = 0;

function scanDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // Skip node_modules and other directories
      if (file === 'node_modules' || file === '.git' || file === '.expo' || file === 'coverage' || file === 'build' || file === 'dist') {
        continue;
      }
      scanDirectory(fullPath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        const lines = content.split('\n');
        let fileErrors = 0;
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const lineNum = i + 1;
          
          // Pattern 1: =); au lieu de = {
          if (line.includes('=);')) {
            console.log(`❌ ${fullPath}:${lineNum} - Malformed assignment: ${line.trim()}`);
            fileErrors++;
          }
          
          // Pattern 2: try); au lieu de try {
          if (line.match(/\btry\s*\);\s*/) || line.trim().startsWith('try);')) {
            console.log(`❌ ${fullPath}:${lineNum} - Malformed try: ${line.trim()}`);
            fileErrors++;
          }
          
          // Pattern 3: } catch); au lieu de } catch (e) {
          if (line.includes('} catch);') || line.includes('}catch);')) {
            console.log(`❌ ${fullPath}:${lineNum} - Malformed catch: ${line.trim()}`);
            fileErrors++;
          }
          
          // Pattern 4: if (...));
          if (line.match(/if\s*\([^)]*\)\s*\);/)) {
            console.log(`❌ ${fullPath}:${lineNum} - Malformed if: ${line.trim()}`);
            fileErrors++;
          }
          
          // Pattern 5: while (...));
          if (line.match(/while\s*\([^)]*\)\s*\);/)) {
            console.log(`❌ ${fullPath}:${lineNum} - Malformed while: ${line.trim()}`);
            fileErrors++;
          }
          
          // Pattern 6: for (...));
          if (line.match(/for\s*\([^)]*\)\s*\);/)) {
            console.log(`❌ ${fullPath}:${lineNum} - Malformed for: ${line.trim()}`);
            fileErrors++;
          }
          
          // Pattern 7: => // TEMP_DISABLED dans JSX (malformed arrow function)
          if (line.match(/=>\s*\/\/\s*TEMP_DISABLED/) && line.includes('console.log')) {
            console.log(`❌ ${fullPath}:${lineNum} - Malformed arrow function with comment: ${line.trim()}`);
            fileErrors++;
          }
          
          // Pattern 8: } else);
          if (line.includes('} else);') || line.includes('}else);')) {
            console.log(`❌ ${fullPath}:${lineNum} - Malformed else: ${line.trim()}`);
            fileErrors++;
          }
          
          // Pattern 9: } catch { without parameter
          if (line.match(/}\s*catch\s*{/)) {
            console.log(`❌ ${fullPath}:${lineNum} - Catch without parameter: ${line.trim()}`);
            fileErrors++;
          }
        }
        
        if (fileErrors > 0) {
          totalFiles++;
          totalErrors += fileErrors;
        }
        
      } catch (err) {
        console.log(`❌ Could not read ${fullPath}: ${err.message}`);
      }
    }
  }
}

console.log('🔍 Scanning for syntax errors...');
scanDirectory('./src');

console.log('\n📊 SCAN SUMMARY:');
console.log(`Files with errors: ${totalFiles}`);
console.log(`Total errors found: ${totalErrors}`);

if (totalErrors === 0) {
  console.log('✅ No syntax errors found!');
} else {
  console.log(`❌ ${totalErrors} syntax errors found in ${totalFiles} files`);
}