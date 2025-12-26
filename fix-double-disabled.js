const fs = require('fs');
const path = require('path');

// Function to recursively get all .ts, .tsx, .js, .jsx files in a directory
function getJsFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const item of items) {
    if (item.isDirectory() && 
        !item.name.startsWith('.') && 
        !['node_modules', 'dist', 'build', '__mocks__', '__tests__', 'coverage'].includes(item.name)) {
      const subdirPath = path.join(dir, item.name);
      files.push(...getJsFiles(subdirPath));
    } else if (item.isFile() && /\.(ts|tsx|js|jsx)$/.test(item.name)) {
      files.push(path.join(dir, item.name));
    }
  }
  
  return files;
}

// Function to fix double-disabled console.log statements
function fixDoubleDisabled(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let hasChanges = false;
  
  // Pattern to match double disabled console logs with malformed syntax
  const patterns = [
    {
      // Pattern: // TEMP_DISABLED: // TEMP_DISABLED: console.log('message', {
      //     property: value
      // });
      regex: /(\s*)\/\/ TEMP_DISABLED: \/\/ TEMP_DISABLED: console\.log\([^{]*\{\s*\n((?:\s*[^}]*\n)*)\s*\}\);?/g,
      replacement: (match, indent, objectContent) => {
        const lines = objectContent.trim().split('\n');
        const commentedLines = lines.map(line => indent + '//     ' + line.trim()).join('\n');
        return indent + '// TEMP_DISABLED: console.log(\'...\', {\n' + commentedLines + '\n' + indent + '// });';
      }
    },
    {
      // Pattern: // TEMP_DISABLED: // TEMP_DISABLED: console.log('simple message');
      regex: /\/\/ TEMP_DISABLED: \/\/ TEMP_DISABLED: console\.log\(/g,
      replacement: '// TEMP_DISABLED: console.log('
    }
  ];

  let newContent = content;
  
  for (const pattern of patterns) {
    if (typeof pattern.replacement === 'function') {
      newContent = newContent.replace(pattern.regex, pattern.replacement);
    } else {
      newContent = newContent.replace(pattern.regex, pattern.replacement);
    }
  }
  
  if (newContent !== content) {
    hasChanges = true;
    fs.writeFileSync(filePath, newContent, 'utf8');
  }
  
  return hasChanges;
}

// Main execution
const srcDir = './src';
const jsFiles = getJsFiles(srcDir);
let totalChanges = 0;

console.log(`🔍 Scanning ${jsFiles.length} files for double-disabled console.log patterns...`);

for (const file of jsFiles) {
  try {
    const hasChanges = fixDoubleDisabled(file);
    if (hasChanges) {
      totalChanges++;
      console.log(`✅ Fixed double-disabled patterns in: ${file}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${file}:`, error.message);
  }
}

console.log(`\n🎉 Fixed double-disabled console.log patterns in ${totalChanges} files.`);