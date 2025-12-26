const fs = require('fs');
const path = require('path');

let totalFixed = 0;
let totalFiles = 0;

function fixDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // Skip node_modules and other directories
      if (file === 'node_modules' || file === '.git' || file === '.expo' || file === 'coverage' || file === 'build' || file === 'dist') {
        continue;
      }
      fixDirectory(fullPath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
      try {
        let content = fs.readFileSync(fullPath, 'utf8');
        let fileFixed = 0;
        let originalContent = content;
        
        // Fix: } catch { -> } catch (e) {
        content = content.replace(/}\s*catch\s*{/g, '} catch (e) {');
        
        // Count how many replacements were made
        const matches1 = (originalContent.match(/}\s*catch\s*{/g) || []).length;
        const matches2 = (content.match(/}\s*catch\s*{/g) || []).length;
        fileFixed += matches1 - matches2;
        
        if (fileFixed > 0) {
          fs.writeFileSync(fullPath, content);
          console.log(`✅ Fixed ${fileFixed} catch statements in: ${fullPath}`);
          totalFiles++;
          totalFixed += fileFixed;
        }
        
      } catch (err) {
        console.log(`❌ Could not process ${fullPath}: ${err.message}`);
      }
    }
  }
}

console.log('🔧 Fixing catch statement syntax errors...');
fixDirectory('./src');

console.log('\n📊 FIX SUMMARY:');
console.log(`Files fixed: ${totalFiles}`);
console.log(`Total fixes applied: ${totalFixed}`);

if (totalFixed === 0) {
  console.log('✅ No fixes needed!');
} else {
  console.log(`✅ ${totalFixed} syntax errors fixed in ${totalFiles} files`);
}