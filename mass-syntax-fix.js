const fs = require('fs');
const path = require('path');

console.log('🔧 Mass fixing all syntax errors...\n');

function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let changes = 0;
    
    // Fix 1: Malformed catch blocks: "} catch (error) {
    "" without proper spacing
    // IMPORTANT: Ne pas casser les catch corrects
    const malformedCatchPattern = /}\s*catch\s*\([^)]+\)\s*\{([^}])/g;
    if (content.match(malformedCatchPattern)) {
      content = content.replace(malformedCatchPattern, (match, nextChar) => {
        const cleanMatch = match.replace(/}\s*catch\s*\(([^)]+)\)\s*\{/, '} catch ($1) {
    '');
        return cleanMatch + (nextChar || '');
      });
      changes++;
    }
    
    // Fix 2: Invalid else syntax: } else {
    const elsePattern = /}\s*else\s*\)\s*;/g;
    if (content.match(elsePattern)) {
      content = content.replace(elsePattern, '} else {');
      changes++;
    }
    
    // Fix 3: Invalid async arrow syntax: async () => {
    const asyncArrowPattern = /async\s*\(\s*\)\s*=>\s*\)\s*;/g;
    if (content.match(asyncArrowPattern)) {
      content = content.replace(asyncArrowPattern, 'async () => {');
      changes++;
    }
    
    // Fix 4: Invalid catch syntax: } catch (error) {
    const invalidCatchPattern = /}\s*catch\s*\)\s*;/g;
    if (content.match(invalidCatchPattern)) {
      content = content.replace(invalidCatchPattern, '} catch (error) {
    '');
      changes++;
    }
    
    // Fix 5: Malformed comment objects in TEMP_DISABLED
    // Pattern: // TEMP_DISABLED: console.log('...', {
    //            someProperty: value,  <-- Cette ligne et suivantes doivent être commentées
    // const tempDisabledPattern = /\/\/\s*TEMP_DISABLED:\s*console\.log\([^)]*,\s*\{[^}]*$/gm;
    // const lines = content.split('\n');
    // let fixedLines = [];
    // let inTempDisabledBlock = false;
    
    // for (let i = 0; i < lines.length; i++) {
      // const line = lines[i];
      
      // Détecter le début d'un bloc TEMP_DISABLED malformé
      // if (line.match(/\/\/\s*TEMP_DISABLED:\s*console\.log\([^)]*,\s*\{/) && !line.includes('});')) {
        inTempDisabledBlock = true;
        fixedLines.push(line);
        continue;
      }
      
      // Si on est dans un bloc TEMP_DISABLED et la ligne n'est pas commentée
      if (inTempDisabledBlock) {
        if (line.trim().startsWith('//') || line.trim() === '') {
          // Déjà commentée ou ligne vide
          fixedLines.push(line);
          if (line.includes('});') && line.trim().startsWith('//')) {
            inTempDisabledBlock = false;
          }
        } else {
          // Ligne non commentée dans le bloc TEMP_DISABLED
          const indent = line.match(/^\s*/)[0];
          fixedLines.push(indent + '// ' + line.trimStart());
          changes++;
          if (line.includes('});')) {
            inTempDisabledBlock = false;
          }
        }
      } else {
        fixedLines.push(line);
      }
    }
    
    content = fixedLines.join('\n');
    
    // Fix 6: Coller les accolades de catch: } catch (error) {
    ssomething
    // Séparer le catch du code qui suit
    const collapsedCatchPattern = /}\s*catch\s*\([^)]+\)\s*\{([^};\s][^}]*)/g;
    if (content.match(collapsedCatchPattern)) {
      content = content.replace(collapsedCatchPattern, (match, followingCode) => {
        const catchPart = match.replace(/\{[^}]*$/, '{');
        return catchPart + '\n    ' + followingCode;
      });
      changes++;
    }
    
    // Fix 7: Missing semicolons for object properties 
    const missingSemicolonPattern = /:\s*!![^,;}\n]+$/gm;
    if (content.match(missingSemicolonPattern)) {
      content = content.replace(missingSemicolonPattern, (match) => {
        if (!match.endsWith(';') && !match.endsWith(',')) {
          return match + ';';
        }
        return match;
      });
      changes++;
    }
    
    if (changes > 0) {
      fs.writeFileSync(filePath, content, 'utf8');
      return { fixed: true, changes };
    }
    
    return { fixed: false, changes: 0 };
    
  } catch (error) {

    return { error: error.message };
  }
}

function fixDirectory(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  const results = {
    totalFiles: 0,
    fixedFiles: 0,
    totalChanges: 0,
    errors: []
  };
  
  function fixRecursive(currentDir) {
    try {
      const items = fs.readdirSync(currentDir);
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          // Skip node_modules, coverage, etc.
          if (!['node_modules', '.git', 'coverage', 'dist', 'build', '.expo'].includes(item)) {
            fixRecursive(fullPath);
          }
        } else if (stat.isFile()) {
          const ext = path.extname(fullPath);
          if (extensions.includes(ext)) {
            results.totalFiles++;
            const result = fixFile(fullPath);
            
            if (result.error) {
              results.errors.push({ file: fullPath, error: result.error });
            } else if (result.fixed) {
              results.fixedFiles++;
              results.totalChanges += result.changes;
              console.log(`✅ Fixed ${result.changes} issues in: ${path.relative(process.cwd(), fullPath)}`);
            }
          }
        }
      }
    } catch (e) {

      results.errors.push({ dir: currentDir, error: e.message });
    }
  }
  
  fixRecursive(dir);
  return results;
}

// Réparer le projet
const projectRoot = process.cwd();
console.log(`🔧 Starting mass syntax fix in: ${projectRoot}\n`);

const results = fixDirectory(projectRoot);

console.log('\n📊 Fix Results:');
console.log(`Total files scanned: ${results.totalFiles}`);
console.log(`Files fixed: ${results.fixedFiles}`);
console.log(`Total changes: ${results.totalChanges}`);

if (results.errors.length > 0) {
  console.log(`\n❌ Errors encountered:`);
  results.errors.forEach(error => {
    console.log(`  ${error.file || error.dir}: ${error.error}`);
  });
} else {
  console.log('\n✅ All syntax errors have been fixed!');
}