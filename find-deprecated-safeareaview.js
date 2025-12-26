/**
 * Script de détection automatique des imports SafeAreaView dépréciés
 * Recherche tous les fichiers qui importent SafeAreaView depuis 'react-native'
 */

const fs = require('fs');
const path = require('path');

const SEARCH_DIR = './src';
const DEPRECATED_PATTERN = /SafeAreaView.*from\s+['"]react-native['"]/;
const MULTILINE_IMPORT_PATTERN = /from\s+['"]react-native['"]/;

function searchDeprecatedSafeAreaView(dir, results = []) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Ignore node_modules
      if (file !== 'node_modules' && file !== '.expo') {
        searchDeprecatedSafeAreaView(filePath, results);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Check if file has SafeAreaView in a react-native import
      const lines = content.split('\n');
      let inReactNativeImport = false;
      let importStartLine = -1;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Detect start of react-native import
        if (line.includes("from 'react-native'") || line.includes('from "react-native"')) {
          // Check if SafeAreaView is in the same line
          if (line.includes('SafeAreaView')) {
            results.push({
              file: filePath,
              line: i + 1,
              content: line.trim(),
              type: 'single-line'
            });
          } else if (line.includes('{') && !line.includes('}')) {
            // Multi-line import starts
            inReactNativeImport = true;
            importStartLine = i;
          }
        } else if (inReactNativeImport) {
          // Check if SafeAreaView is in multi-line import
          if (line.includes('SafeAreaView')) {
            results.push({
              file: filePath,
              line: i + 1,
              content: lines.slice(importStartLine, i + 2).join('\n').trim(),
              type: 'multi-line'
            });
            inReactNativeImport = false;
          } else if (line.includes('}')) {
            // End of import without SafeAreaView
            inReactNativeImport = false;
          }
        }
      }
    }
  }

  return results;
}

// Run search
console.log('🔍 Recherche des imports SafeAreaView dépréciés...\n');
const results = searchDeprecatedSafeAreaView(SEARCH_DIR);

if (results.length === 0) {
  console.log('✅ Aucun import SafeAreaView déprécié trouvé !');
  console.log('✅ Tous les fichiers utilisent react-native-safe-area-context\n');
} else {
  console.log(`❌ ${results.length} fichier(s) avec SafeAreaView déprécié :\n`);
  
  results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.file}:${result.line}`);
    console.log(`   Type: ${result.type}`);
    console.log(`   Code: ${result.content.substring(0, 100)}...\n`);
  });

  console.log('\n📝 Correction recommandée :');
  console.log('   Remplacer :');
  console.log('   ❌ import { ..., SafeAreaView, ... } from "react-native";');
  console.log('   ✅ import { SafeAreaView } from "react-native-safe-area-context";\n');
}

process.exit(results.length > 0 ? 1 : 0);
