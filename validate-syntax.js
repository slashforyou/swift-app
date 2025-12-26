const fs = require('fs');
const path = require('path');

console.log('🔍 Final validation of syntax fixes...');

// Patterns potentiellement problématiques
const problemPatterns = [
    { name: '} else {', regex: /} else\);/, severity: 'HIGH' },
    { name: 'TEMP_DISABLED orphaned', regex: /TEMP_DISABLED:.*console\.log.*\);\s*$/, severity: 'MEDIUM' },
    { name: 'Orphaned setTimeout', regex: /setTimeout\s*\(\s*\(\s*\)\s*=>\s*\{/, severity: 'MEDIUM' },
    { name: 'Unclosed if blocks', regex: /if\s*\([^)]*\)\s*\{[^}]*$/, severity: 'LOW' },
    { name: 'Unclosed else blocks', regex: /else\s*\{[^}]*$/, severity: 'LOW' }
];

let totalIssues = 0;
let criticalIssues = 0;

function scanFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        const issues = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            for (const pattern of problemPatterns) {
                if (pattern.regex.test(line)) {
                    issues.push({
                        line: i + 1,
                        content: line.trim(),
                        pattern: pattern.name,
                        severity: pattern.severity
                    });
                    
                    if (pattern.severity === 'HIGH') {
                        criticalIssues++;
                    }
                    totalIssues++;
                }
            }
        }
        
        return issues;
    } catch (error) {
        console.error(`Error scanning ${filePath}:`, error.message);
        return [];
    }
}

function scanDirectory(dir) {
    const files = fs.readdirSync(dir);
    const results = {};
    
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !['node_modules', '.git', 'android', 'ios', '.expo'].includes(file)) {
            Object.assign(results, scanDirectory(fullPath));
        } else if (file.match(/\.(ts|tsx|js|jsx)$/)) {
            const issues = scanFile(fullPath);
            if (issues.length > 0) {
                results[fullPath] = issues;
            }
        }
    }
    
    return results;
}

// Scan principal
const results = scanDirectory(path.join(__dirname, 'src'));

// Affichage des résultats
console.log('\n📊 Scan Results:');
console.log(`Total issues found: ${totalIssues}`);
console.log(`Critical issues: ${criticalIssues}`);

if (Object.keys(results).length === 0) {
    console.log('✅ No syntax issues detected!');
} else {
    console.log('\n🚨 Issues found:');
    
    for (const [filePath, issues] of Object.entries(results)) {
        console.log(`\n📁 ${path.relative(__dirname, filePath)}:`);
        
        for (const issue of issues) {
            const severity = issue.severity === 'HIGH' ? '🔴' : 
                           issue.severity === 'MEDIUM' ? '🟡' : '🟢';
            console.log(`  ${severity} Line ${issue.line}: ${issue.pattern}`);
            console.log(`     ${issue.content.substring(0, 100)}${issue.content.length > 100 ? '...' : ''}`);
        }
    }
}

if (criticalIssues === 0) {
    console.log('\n🎉 No critical syntax errors detected. App should compile!');
} else {
    console.log('\n⚠️ Critical issues found that will prevent compilation.');
}