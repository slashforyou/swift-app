/**
 * Test Stripe Elements & PaymentSheet Integration
 * ✅ Valide l'intégration PaymentSheet et analytics
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  projectRoot: process.cwd(),
  testTimeout: 30000,
  environments: ['development', 'production'],
};

class StripeIntegrationValidator {
  constructor() {
    this.results = {
      package_installation: false,
      stripe_provider_config: false,
      paymentsheet_integration: false,
      analytics_integration: false,
      error_handling: false,
      code_quality: false
    };
  }

  async validatePackageInstallation() {
    console.log('🔍 Validating Stripe package installation...');
    
    try {
      const packageJson = JSON.parse(fs.readFileSync(path.join(TEST_CONFIG.projectRoot, 'package.json'), 'utf8'));
      const hasStripe = packageJson.dependencies && packageJson.dependencies['@stripe/stripe-react-native'];
      
      if (hasStripe) {
        console.log(`✅ @stripe/stripe-react-native installed: ${packageJson.dependencies['@stripe/stripe-react-native']}`);
        this.results.package_installation = true;
      } else {
        console.log('❌ @stripe/stripe-react-native not found in dependencies');
      }
    } catch (error) {
      console.log('❌ Error reading package.json:', error.message);
    }
  }

  async validateStripeProvider() {
    console.log('🔍 Validating StripeProvider configuration...');
    
    try {
      const appTsxPath = path.join(TEST_CONFIG.projectRoot, 'src', 'App.tsx');
      const appContent = fs.readFileSync(appTsxPath, 'utf8');
      
      const hasStripeImport = appContent.includes('@stripe/stripe-react-native');
      const hasStripeProvider = appContent.includes('<StripeProvider');
      const hasPublishableKey = appContent.includes('publishableKey=');
      
      if (hasStripeImport && hasStripeProvider && hasPublishableKey) {
        console.log('✅ StripeProvider correctly configured in App.tsx');
        this.results.stripe_provider_config = true;
      } else {
        console.log('❌ StripeProvider configuration issues:', {
          import: hasStripeImport,
          provider: hasStripeProvider,
          key: hasPublishableKey
        });
      }
    } catch (error) {
      console.log('❌ Error validating StripeProvider:', error.message);
    }
  }

  async validatePaymentSheetIntegration() {
    console.log('🔍 Validating PaymentSheet integration...');
    
    try {
      const paymentWindowPath = path.join(TEST_CONFIG.projectRoot, 'src', 'screens', 'JobDetailsScreens', 'paymentWindow.tsx');
      const paymentContent = fs.readFileSync(paymentWindowPath, 'utf8');
      
      const hasUsePaymentSheet = paymentContent.includes('usePaymentSheet');
      const hasInitPaymentSheet = paymentContent.includes('initPaymentSheet');
      const hasPresentPaymentSheet = paymentContent.includes('presentPaymentSheet');
      const hasHandlePaymentSheet = paymentContent.includes('handlePaymentSheet');
      const hasReturnURL = paymentContent.includes('returnURL');
      
      if (hasUsePaymentSheet && hasInitPaymentSheet && hasPresentPaymentSheet && hasHandlePaymentSheet && hasReturnURL) {
        console.log('✅ PaymentSheet integration complete');
        this.results.paymentsheet_integration = true;
      } else {
        console.log('❌ PaymentSheet integration issues:', {
          hook: hasUsePaymentSheet,
          init: hasInitPaymentSheet,
          present: hasPresentPaymentSheet,
          handler: hasHandlePaymentSheet,
          returnURL: hasReturnURL
        });
      }
    } catch (error) {
      console.log('❌ Error validating PaymentSheet:', error.message);
    }
  }

  async validateAnalyticsIntegration() {
    console.log('🔍 Validating Analytics integration...');
    
    try {
      // Check if stripeAnalytics service exists
      const stripeAnalyticsPath = path.join(TEST_CONFIG.projectRoot, 'src', 'services', 'stripeAnalytics.ts');
      const stripeAnalyticsExists = fs.existsSync(stripeAnalyticsPath);
      
      if (!stripeAnalyticsExists) {
        console.log('❌ StripeAnalytics service not found');
        return;
      }

      const analyticsContent = fs.readFileSync(stripeAnalyticsPath, 'utf8');
      const hasTrackingFunctions = [
        'trackPaymentStarted',
        'trackPaymentSuccess',
        'trackPaymentError',
        'trackPaymentMethodSelected',
        'trackPaymentFunnelStep'
      ].every(fn => analyticsContent.includes(fn));

      // Check PaymentWindow integration
      const paymentWindowPath = path.join(TEST_CONFIG.projectRoot, 'src', 'screens', 'JobDetailsScreens', 'paymentWindow.tsx');
      const paymentContent = fs.readFileSync(paymentWindowPath, 'utf8');
      
      const hasAnalyticsImport = paymentContent.includes('stripeAnalytics');
      const hasTrackingCalls = paymentContent.includes('trackPayment');
      
      if (hasTrackingFunctions && hasAnalyticsImport && hasTrackingCalls) {
        console.log('✅ Analytics integration complete');
        this.results.analytics_integration = true;
      } else {
        console.log('❌ Analytics integration issues:', {
          trackingFunctions: hasTrackingFunctions,
          import: hasAnalyticsImport,
          calls: hasTrackingCalls
        });
      }
    } catch (error) {
      console.log('❌ Error validating Analytics:', error.message);
    }
  }

  async validateErrorHandling() {
    console.log('🔍 Validating Error Handling...');
    
    try {
      const paymentWindowPath = path.join(TEST_CONFIG.projectRoot, 'src', 'screens', 'JobDetailsScreens', 'paymentWindow.tsx');
      const paymentContent = fs.readFileSync(paymentWindowPath, 'utf8');
      
      const hasTryCatch = paymentContent.includes('try {') && paymentContent.includes('} catch');
      const hasErrorTracking = paymentContent.includes('trackPaymentError');
      const hasErrorAlert = paymentContent.includes('Alert.alert');
      const hasErrorLogging = paymentContent.includes('console.error');
      
      if (hasTryCatch && hasErrorTracking && hasErrorAlert && hasErrorLogging) {
        console.log('✅ Error handling implemented correctly');
        this.results.error_handling = true;
      } else {
        console.log('❌ Error handling issues:', {
          tryCatch: hasTryCatch,
          tracking: hasErrorTracking,
          alert: hasErrorAlert,
          logging: hasErrorLogging
        });
      }
    } catch (error) {
      console.log('❌ Error validating error handling:', error.message);
    }
  }

  async validateCodeQuality() {
    console.log('🔍 Validating Code Quality...');
    
    return new Promise((resolve) => {
      exec('npx tsc --noEmit', { cwd: TEST_CONFIG.projectRoot }, (error, stdout, stderr) => {
        if (error && error.code !== 0) {
          console.log('❌ TypeScript compilation errors found');
          console.log(stderr);
          this.results.code_quality = false;
        } else {
          console.log('✅ No TypeScript compilation errors');
          this.results.code_quality = true;
        }
        resolve();
      });
    });
  }

  async generateReport() {
    const totalTests = Object.keys(this.results).length;
    const passedTests = Object.values(this.results).filter(Boolean).length;
    const successRate = (passedTests / totalTests) * 100;

    console.log('\n' + '='.repeat(60));
    console.log('🎯 STRIPE ELEMENTS & PAYMENTSHEET INTEGRATION REPORT');
    console.log('='.repeat(60));
    
    Object.entries(this.results).forEach(([test, passed]) => {
      const icon = passed ? '✅' : '❌';
      const status = passed ? 'PASS' : 'FAIL';
      console.log(`${icon} ${test.replace(/_/g, ' ').toUpperCase()}: ${status}`);
    });
    
    console.log('\n' + '-'.repeat(60));
    console.log(`📊 SUCCESS RATE: ${passedTests}/${totalTests} (${successRate.toFixed(1)}%)`);
    
    if (successRate >= 85) {
      console.log('🎉 EXCELLENT! Integration is production-ready');
    } else if (successRate >= 70) {
      console.log('⚠️  GOOD! Minor improvements needed');
    } else {
      console.log('🚨 ATTENTION! Major issues require fixing');
    }
    
    console.log('='.repeat(60));
    
    return {
      totalTests,
      passedTests,
      successRate,
      results: this.results
    };
  }

  async runAllValidations() {
    console.log('🚀 Starting Stripe Elements & PaymentSheet Integration Validation...\n');
    
    await this.validatePackageInstallation();
    await this.validateStripeProvider();
    await this.validatePaymentSheetIntegration();
    await this.validateAnalyticsIntegration();
    await this.validateErrorHandling();
    await this.validateCodeQuality();
    
    return this.generateReport();
  }
}

// Execute validation
const validator = new StripeIntegrationValidator();
validator.runAllValidations()
  .then(report => {
    process.exit(report.successRate >= 70 ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  });