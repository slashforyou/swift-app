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

// Function to find and fix malformed console.log statements
function fixMalformedConsoleLog(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let hasChanges = false;
  let newContent = content;

  // Pattern to find console.log statements with unclosed objects due to commented properties
  const patterns = [
    {
      // Pattern: console.log('message', {
      //   // commented properties
      // });
      regex: /console\.log\([^{]*\{\s*\n(\s*\/\/[^\n]*\n)+\s*\/\/\s*\}\);?/gm,
      replacement: (match) => {
        // Extract the message part before the {
        const messageMatch = match.match(/console\.log\(([^{]*)\{/);
        if (messageMatch) {
          const message = messageMatch[1].trim();
          return `console.log(${message.endsWith(',') ? message.slice(0, -1) : message});`;
        }
        return match;
      }
    },
    {
      // Pattern: console.log('message', {
      //    commented properties without closing
      regex: /console\.log\([^{]*\{\s*\n(\s*\/\/[^\n]*\n)+(?!\s*\}\);?)/gm,
      replacement: (match) => {
        // Extract the message part before the {
        const messageMatch = match.match(/console\.log\(([^{]*)\{/);
        if (messageMatch) {
          let message = messageMatch[1].trim();
          // Remove trailing comma if present
          if (message.endsWith(',')) {
            message = message.slice(0, -1);
          }
          return `console.log(${message});`;
        }
        return match;
      }
    }
  ];

  for (const pattern of patterns) {
    const newContentTemp = newContent.replace(pattern.regex, pattern.replacement);
    if (newContentTemp !== newContent) {
      hasChanges = true;
      newContent = newContentTemp;
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

console.log(`🔍 Scanning ${jsFiles.length} files for malformed console.log statements...`);

for (const file of jsFiles) {
  try {
    const hasChanges = fixMalformedConsoleLog(file);
    if (hasChanges) {
      totalChanges++;
      console.log(`✅ Fixed malformed console.log in: ${file}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${file}:`, error.message);
  }
}

console.log(`\n🎉 Fixed malformed console.log statements in ${totalChanges} files.`);