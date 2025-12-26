const fs = require('fs');
const path = require('path');

// Patterns to fix
const patterns = [
  {
    // Fix broken if statements: if (...));  -> if (...) {
    regex: /if\s*\([^)]*\)\s*\);\s*/g,
    replacement: (match) => {
      // Extract the condition from the match
      const conditionMatch = match.match(/if\s*\(([^)]*)\)/);
      if (conditionMatch) {
        return `if (${conditionMatch[1]}) {`;
      }
      return match;
    }
  },
  {
    // Fix broken for statements: for (...));  -> for (...) {
    regex: /for\s*\([^)]*\)\s*\);\s*/g,
    replacement: (match) => {
      const conditionMatch = match.match(/for\s*\(([^)]*)\)/);
      if (conditionMatch) {
        return `for (${conditionMatch[1]}) {`;
      }
      return match;
    }
  },
  {
    // Fix broken catch statements: } catch (...));  -> } catch (...) {

    regex: /}\s*catch\s*\([^)]*\)\s*\);\s*/g,
    replacement: (match) => {
      const conditionMatch = match.match(/catch\s*\(([^)]*)\)/);
      if (conditionMatch) {
        return `} catch (${conditionMatch[1]}) {
    ``;
      }
      return match;
    }
  }
];

function fixFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let fixedContent = content;
    let hasChanges = false;
    
    patterns.forEach(pattern => {
      const newContent = fixedContent.replace(pattern.regex, (match) => {
        hasChanges = true;
        console.log(`Fixing in ${filePath}: "${match.trim()}" -> "${pattern.replacement(match)}"`);
        return pattern.replacement(match);
      });
      fixedContent = newContent;
    });
    
    if (hasChanges) {
      fs.writeFileSync(filePath, fixedContent, 'utf8');
      return true;
    }
    return false;
  } catch (error) {

    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

function scanDirectory(dir) {
  let totalFixed = 0;
  
  try {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Skip node_modules and .git
        if (item !== 'node_modules' && item !== '.git' && !item.startsWith('.')) {
          totalFixed += scanDirectory(fullPath);
        }
      } else if (item.endsWith('.ts') || item.endsWith('.tsx') || item.endsWith('.js') || item.endsWith('.jsx')) {
        if (fixFile(fullPath)) {
          totalFixed++;
        }
      }
    }
  } catch (error) {

    console.error(`Error scanning directory ${dir}:`, error.message);
  }
  
  return totalFixed;
}

console.log('🔧 Starting fix for broken if/for/catch statements...');
const startTime = Date.now();
const fixedFiles = scanDirectory('./src');
const duration = Date.now() - startTime;

console.log(`\n✅ Completed in ${duration}ms`);
console.log(`📊 Files fixed: ${fixedFiles}`);
console.log('\n🚀 Ready to test compilation!');