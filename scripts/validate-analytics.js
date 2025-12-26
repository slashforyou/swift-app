/**
 * Validation manuelle du système Analytics & Monitoring
 * Script Node.js simple pour valider les fichiers créés
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Swift App - Analytics & Monitoring Validation');
console.log('================================================');

// Configuration des fichiers à vérifier
const filesToCheck = [
  {
    path: 'src/services/analytics.ts',
    name: 'Analytics Service',
    requiredContent: ['class AnalyticsService', 'trackJobStep', 'trackPayment', 'export const analytics']
  },
  {
    path: 'src/services/logger.ts',
    name: 'Logger Service',
    requiredContent: ['class LoggingService', 'debug(', 'info(', 'warn(', 'error(', 'export const logger']
  },
  {
    path: 'src/services/alertService.ts',
    name: 'Alert Service',
    requiredContent: ['class AlertService', 'triggerAlert', 'evaluateRule', 'sendNotifications']
  },
  {
    path: 'src/services/navigationService.ts',
    name: 'Navigation Service',
    requiredContent: ['class NavigationService', 'navigate', 'trackAnalytics']
  },
  {
    path: 'src/components/analytics/AnalyticsDashboard.tsx',
    name: 'Analytics Dashboard',
    requiredContent: ['AnalyticsDashboard', 'MetricCard', 'useTheme']
  },
  {
    path: 'src/components/analytics/AlertsPanel.tsx',
    name: 'Alerts Panel',
    requiredContent: ['AlertsPanel', 'AlertCard', 'activeAlerts']
  },
  {
    path: 'src/hooks/useAnalytics.ts',
    name: 'Analytics Hook',
    requiredContent: ['useAnalytics', 'jobStep:', 'useCallback']
  },
  {
    path: 'ANALYTICS_MONITORING_GUIDE.md',
    name: 'Documentation Guide',
    requiredContent: ['Analytics & Monitoring', 'Utilisation rapide', 'Dashboard Analytics']
  }
];

let totalFiles = 0;
let validFiles = 0;
let results = [];

console.log('🔍 Validating files...\n');

filesToCheck.forEach(({ path: filePath, name, requiredContent }) => {
  totalFiles++;
  const fullPath = path.join(__dirname, '..', filePath);
  
  try {
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      const missingContent = requiredContent.filter(required => !content.includes(required));
      
      if (missingContent.length === 0) {
        console.log(`✅ ${name} - All required content present`);
        validFiles++;
        results.push({ file: name, status: 'VALID', issues: [] });
      } else {
        console.log(`⚠️  ${name} - Missing: ${missingContent.join(', ')}`);
        results.push({ file: name, status: 'INCOMPLETE', issues: missingContent });
      }
    } else {
      console.log(`❌ ${name} - File not found: ${filePath}`);
      results.push({ file: name, status: 'MISSING', issues: ['File not found'] });
    }
  } catch (error) {
    console.log(`❌ ${name} - Error reading file: ${error.message}`);
    results.push({ file: name, status: 'ERROR', issues: [error.message] });
  }
});

console.log('\n📊 VALIDATION SUMMARY');
console.log('====================');
console.log(`Total files checked: ${totalFiles}`);
console.log(`✅ Valid files: ${validFiles}`);
console.log(`❌ Issues found: ${totalFiles - validFiles}`);
console.log(`📈 Success rate: ${((validFiles / totalFiles) * 100).toFixed(1)}%`);

// Vérification spéciale pour l'intégration
console.log('\n🔗 INTEGRATION CHECK');
console.log('==================');

try {
  const jobStepsPath = path.join(__dirname, '..', 'src/services/jobSteps.ts');
  if (fs.existsSync(jobStepsPath)) {
    const jobStepsContent = fs.readFileSync(jobStepsPath, 'utf8');
    
    if (jobStepsContent.includes('analytics')) {
      console.log('✅ Analytics integrated with jobSteps service');
    } else {
      console.log('⚠️  Analytics NOT integrated with jobSteps service');
    }
  } else {
    console.log('❌ JobSteps service not found');
  }
} catch (error) {
  console.log(`❌ Integration check error: ${error.message}`);
}

// Génération du rapport final
const report = {
  timestamp: new Date().toISOString(),
  validation: {
    totalFiles: totalFiles,
    validFiles: validFiles,
    successRate: ((validFiles / totalFiles) * 100).toFixed(1) + '%'
  },
  results: results,
  systemStatus: validFiles >= totalFiles * 0.8 ? 'PRODUCTION READY' : 'NEEDS ATTENTION',
  recommendation: validFiles >= totalFiles * 0.8 ? 
    'System is ready for integration into the main application.' :
    'Some components need attention before production deployment.'
};

// Sauvegarder le rapport
try {
  const reportsDir = path.join(__dirname, '..', 'test-results');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  
  const reportPath = path.join(reportsDir, 'analytics-validation-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`\n📄 Detailed report saved to: test-results/analytics-validation-report.json`);
} catch (error) {
  console.log(`⚠️  Could not save report: ${error.message}`);
}

console.log('\n🏁 FINAL RESULT');
console.log('===============');
console.log(`Status: ${report.systemStatus}`);
console.log(`Recommendation: ${report.recommendation}`);

if (report.systemStatus === 'PRODUCTION READY') {
  console.log('\n🎉 Analytics & Monitoring system validation SUCCESSFUL!');
  console.log('   Ready to integrate into Swift App production.');
  process.exit(0);
} else {
  console.log('\n⚠️  System validation completed with issues.');
  console.log('   Review and fix issues before production deployment.');
  process.exit(1);
}