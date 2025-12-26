const fs = require('fs');
const path = require('path');

console.log('🔍 Scanning for syntax errors...\n');

function scanFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const errors = [];
    
    lines.forEach((line, index) => {
      const lineNum = index + 1;
      
      // Détecter les patterns problématiques
      if (line.includes('} catch (error) {
    ')) {
        errors.push(`Line ${lineNum}: Invalid catch syntax: "${line.trim()}"`);
      }
      
      if (line.includes('} else {')) {
        errors.push(`Line ${lineNum}: Invalid else syntax: "${line.trim()}"`);
      }
      
      if (line.includes('async () => {')) {
        errors.push(`Line ${lineNum}: Invalid async arrow syntax: "${line.trim()}"`);
      }
      
      // Détecter les commentaires multi-lignes malformés
      if (line.includes('// TEMP_DISABLED:') && line.includes('{') && !line.includes('}')) {
        // Vérifier si les lignes suivantes sont correctement commentées
        let nextLineIndex = index + 1;
        while (nextLineIndex < lines.length && lines[nextLineIndex].trim() !== '') {
          const nextLine = lines[nextLineIndex];
          if (!nextLine.trim().startsWith('//') && !nextLine.trim().startsWith('*') && nextLine.trim() !== '') {
            errors.push(`Line ${lineNum}: TEMP_DISABLED comment may have malformed structure - next uncommented line: "${nextLine.trim()}"`);
            break;
          }
          if (nextLine.includes('});') && nextLine.trim().startsWith('//')) {
            break; // Trouvé la fin du commentaire
          }
          nextLineIndex++;
        }
      }
      
      // Détecter les accolades collées
      if (line.match(/\}\s*catch\s*\([^)]*\)\s*\{[^}]/)) {
        errors.push(`Line ${lineNum}: Malformed catch block: "${line.trim()}"`);
      }
      
      // Détecter les points-virgules manquants après des objets
      if (line.includes(':') && line.includes('!!') && !line.includes('//') && !line.trim().endsWith(';') && !line.trim().endsWith(',') && !line.trim().endsWith('{')) {
        errors.push(`Line ${lineNum}: Possible missing semicolon: "${line.trim()}"`);
      }
    });
    
    return errors;
  } catch (e) {

    return [`Error reading file: ${e.message}`];
  }
}

function scanDirectory(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  const results = {};
  
  function scanRecursive(currentDir) {
    try {
      const items = fs.readdirSync(currentDir);
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          // Skip node_modules, coverage, etc.
          if (!['node_modules', '.git', 'coverage', 'dist', 'build', '.expo'].includes(item)) {
            scanRecursive(fullPath);
          }
        } else if (stat.isFile()) {
          const ext = path.extname(fullPath);
          if (extensions.includes(ext)) {
            const errors = scanFile(fullPath);
            if (errors.length > 0) {
              results[fullPath] = errors;
            }
          }
        }
      }
    } catch (e) {

      console.error(`Error scanning directory ${currentDir}:`, e.message);
    }
  }
  
  scanRecursive(dir);
  return results;
}

// Scanner le projet
const projectRoot = process.cwd();
const results = scanDirectory(projectRoot);

if (Object.keys(results).length === 0) {
  console.log('✅ No syntax errors found!');
} else {
  console.log(`❌ Found syntax errors in ${Object.keys(results).length} files:\n`);
  
  for (const [filePath, errors] of Object.entries(results)) {
    const relativePath = path.relative(projectRoot, filePath);
    console.log(`📄 ${relativePath}:`);
    errors.forEach(error => console.log(`  ${error}`));
    console.log('');
  }
}