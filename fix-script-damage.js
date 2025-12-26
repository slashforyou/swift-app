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

// Function to fix specific malformed patterns caused by the previous script
function fixSpecificMalformations(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let hasChanges = false;
  let newContent = content;

  // Pattern fixes for specific malformations
  const fixes = [
    {
      // Fix: () =>); pattern to () => {
      regex: /\(\s*\)\s*=>\s*\)\s*;/g,
      replacement: '() => {'
    },
    {
      // Fix: setFunction((param) =>); pattern to setFunction((param) => {
      regex: /(\w+)\s*\(\s*\([^)]*\)\s*=>\s*\)\s*;/g,
      replacement: '$1((prevJob: any) => {'
    },
    {
      // Fix: }); comment pattern where there's a missing opening
      regex: /(\s*)\}\)\s*;\s*(\s*\/\/[^\n]*)\n/g,
      replacement: '$1});$2\n'
    },
    {
      // Fix: // TEMP_DISABLED: console.log( with incomplete object
      regex: /\/\/\s*TEMP_DISABLED:\s*console\.log\([^{]*\{\s*\n(\s*[^}]*\n)*\s*\}\);\s*/gm,
      replacement: ''
    }
  ];

  for (const fix of fixes) {
    const beforeContent = newContent;
    newContent = newContent.replace(fix.regex, fix.replacement);
    if (newContent !== beforeContent) {
      hasChanges = true;
    }
  }

  if (hasChanges) {
    fs.writeFileSync(filePath, newContent, 'utf8');
  }

  return hasChanges;
}

// Main execution
const srcDir = './src';
const jsFiles = getJsFiles(srcDir);
let totalChanges = 0;

console.log(`🔧 Fixing specific malformations caused by previous script...`);
console.log(`🔍 Scanning ${jsFiles.length} files...`);

for (const file of jsFiles) {
  try {
    const hasChanges = fixSpecificMalformations(file);
    if (hasChanges) {
      totalChanges++;
      console.log(`✅ Fixed malformations in: ${file}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${file}:`, error.message);
  }
}

console.log(`\n🎉 Fixed malformations in ${totalChanges} files.`);