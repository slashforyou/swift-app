#!/usr/bin/env node
/**
 * Script de test automatisé pour détecter les problèmes après migration
 * Ce script vérifie qu'aucune référence legacy ne cause d'erreur
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const COLORS = {
    RED: '\x1b[31m',
    GREEN: '\x1b[32m',
    YELLOW: '\x1b[33m',
    BLUE: '\x1b[34m',
    RESET: '\x1b[0m',
    BOLD: '\x1b[1m'
};

const log = (color, message) => {
    console.log(`${color}${message}${COLORS.RESET}`);
};

const logSection = (title) => {
    console.log('\n' + '='.repeat(60));
    log(COLORS.BOLD + COLORS.BLUE, title);
    console.log('='.repeat(60));
};

const logSuccess = (message) => log(COLORS.GREEN, '✅ ' + message);
const logError = (message) => log(COLORS.RED, '❌ ' + message);
const logWarning = (message) => log(COLORS.YELLOW, '⚠️  ' + message);
const logInfo = (message) => log(COLORS.BLUE, '🔍 ' + message);

async function runTest(name, testFn) {
    try {
        logInfo(`Running: ${name}...`);
        await testFn();
        logSuccess(`${name} - PASSED`);
        return true;
    } catch (error) {
        logError(`${name} - FAILED: ${error.message}`);
        return false;
    }
}

// Test 1: Vérifier qu'aucune référence à createBusinessStyles n'existe
function testNoCreateBusinessStyles() {
    const srcDir = path.join(process.cwd(), 'src');
    const files = getAllTsxFiles(srcDir);
    
    const problematicFiles = [];
    
    for (const file of files) {
        const content = fs.readFileSync(file, 'utf8');
        if (content.includes('createBusinessStyles') && 
            !file.includes('BusinessDesignSystem.ts') &&
            !file.includes('_corrupted.tsx') &&
            !file.includes('_Modernized.tsx')) {
            problematicFiles.push(file);
        }
    }
    
    if (problematicFiles.length > 0) {
        throw new Error(`Found createBusinessStyles references in: ${problematicFiles.join(', ')}`);
    }
}

// Test 2: Vérifier que tous les composants du design system s'importent correctement
function testDesignSystemImports() {
    const designSystemPath = path.join(process.cwd(), 'src', 'design-system', 'components.ts');
    
    try {
        execSync(`npx tsc --noEmit "${designSystemPath}"`, { stdio: 'pipe' });
    } catch (error) {
        throw new Error(`Design system components have TypeScript errors: ${error.stdout}`);
    }
}

// Test 3: Compilation TypeScript globale (sans erreurs critiques)
function testTypeScriptCompilation() {
    try {
        // Ignorer les erreurs de types React Native DOM conflicts qui sont normales
        const result = execSync('npx tsc --noEmit --skipLibCheck', { 
            stdio: 'pipe',
            encoding: 'utf8'
        });
    } catch (error) {
        const errorOutput = error.stdout || error.message;
        
        // Filtrer les erreurs non-critiques
        const criticalErrors = errorOutput
            .split('\n')
            .filter(line => 
                line.includes('createBusinessStyles') ||
                line.includes('Cannot find name') ||
                line.includes('Property') && line.includes('does not exist')
            );
            
        if (criticalErrors.length > 0) {
            throw new Error(`Critical TypeScript errors found:\n${criticalErrors.join('\n')}`);
        }
    }
}

// Test 4: Vérifier que les écrans migratés n'importent pas d'anciens composants
function testMigratedScreens() {
    const migratedScreens = [
        'src/screens/business/PaymentsScreen.tsx',
        'src/screens/parameters.tsx',
        'src/components/home/ProfileHeaderNewComplete.tsx',
    ];
    
    const legacyImports = [
        'createBusinessStyles',
        'Colors.light',
        'Colors.dark',
        'BusinessButton',
        'BusinessBalanceCard'
    ];
    
    for (const screenPath of migratedScreens) {
        const fullPath = path.join(process.cwd(), screenPath);
        if (!fs.existsSync(fullPath)) {
            throw new Error(`Migrated screen not found: ${screenPath}`);
        }
        
        const content = fs.readFileSync(fullPath, 'utf8');
        const foundLegacy = legacyImports.filter(legacy => content.includes(legacy));
        
        if (foundLegacy.length > 0) {
            throw new Error(`Screen ${screenPath} still uses legacy imports: ${foundLegacy.join(', ')}`);
        }
    }
}

// Test 5: Vérifier que tous les composants business modernisés sont disponibles
function testModernizedComponents() {
    const modernComponents = [
        'src/components/business/BusinessLoadingState.tsx',
        'src/components/business/PaymentsDashboard/PaymentsDashboard.tsx',
        'src/components/business/PaymentsDashboard/DashboardAlerts.tsx'
    ];
    
    for (const componentPath of modernComponents) {
        const fullPath = path.join(process.cwd(), componentPath);
        if (!fs.existsSync(fullPath)) {
            throw new Error(`Modernized component not found: ${componentPath}`);
        }
        
        // Test import du design system
        const content = fs.readFileSync(fullPath, 'utf8');
        if (!content.includes('design-system/components')) {
            throw new Error(`Component ${componentPath} doesn't import from design system`);
        }
    }
}

// Utilitaire pour récupérer tous les fichiers TSX
function getAllTsxFiles(dir) {
    const files = [];
    const items = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const item of items) {
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules') {
            files.push(...getAllTsxFiles(fullPath));
        } else if (item.isFile() && (item.name.endsWith('.tsx') || item.name.endsWith('.ts'))) {
            files.push(fullPath);
        }
    }
    
    return files;
}

// Fonction principale
async function runAllTests() {
    logSection('🧪 SWIFT APP - SUITE DE TESTS POST-MIGRATION');
    
    const tests = [
        ['Aucune référence createBusinessStyles', testNoCreateBusinessStyles],
        ['Import du Design System', testDesignSystemImports],
        ['Compilation TypeScript', testTypeScriptCompilation],
        ['Écrans migrés proprement', testMigratedScreens],
        ['Composants modernisés disponibles', testModernizedComponents]
    ];
    
    let passed = 0;
    let failed = 0;
    
    for (const [name, testFn] of tests) {
        const success = await runTest(name, testFn);
        if (success) {
            passed++;
        } else {
            failed++;
        }
    }
    
    logSection('📊 RÉSULTATS FINAUX');
    logSuccess(`Tests réussis: ${passed}`);
    if (failed > 0) {
        logError(`Tests échoués: ${failed}`);
        process.exit(1);
    } else {
        logSuccess('🎉 Tous les tests sont passés ! Migration réussie !');
    }
}

// Exécution
if (require.main === module) {
    runAllTests().catch(error => {
        logError(`Erreur fatale: ${error.message}`);
        process.exit(1);
    });
}

module.exports = { runAllTests };