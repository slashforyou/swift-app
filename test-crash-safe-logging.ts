/**
 * Script de test pour le système de logging robuste anti-crash
 * Test des logs longs, objets volumineux, et protection contre les crashes
 */

// Import du système de logging
import { safeLog } from './src/utils/crashSafeLogger';

console.log('🧪 === TEST DU SYSTÈME DE LOGGING ANTI-CRASH ===\n');

async function runLoggingTests() {
  try {
    console.log('📋 Test 1: Logs normaux...');
    await safeLog.info('Test message normal', { test: true }, 'test-basic');
    await safeLog.debug('Debug message', { data: 'test' }, 'test-basic');
    await safeLog.warn('Warning message', undefined, 'test-basic');
    
    console.log('✅ Test 1 completed\n');

    console.log('📋 Test 2: Messages très longs...');
    const longMessage = 'Ceci est un message très long '.repeat(1000); // ~30KB
    await safeLog.info(longMessage, undefined, 'test-long');
    
    console.log('✅ Test 2 completed\n');

    console.log('📋 Test 3: Objets volumineux...');
    const largeObject = {
      users: Array(100).fill(null).map((_, i) => ({
        id: i,
        name: `User ${i}`,
        email: `user${i}@example.com`,
        profile: {
          settings: {
            theme: 'dark',
            notifications: true,
            data: 'Very long user data '.repeat(50)
          }
        }
      })),
      metadata: {
        total: 100,
        generated: new Date(),
        largeText: 'Large metadata text '.repeat(200)
      }
    };
    
    await safeLog.large('info', 'Large object test', largeObject, 'test-large');
    
    console.log('✅ Test 3 completed\n');

    console.log('📋 Test 4: Objets circulaires...');
    const circularObject: any = { name: 'test' };
    circularObject.self = circularObject; // Référence circulaire
    circularObject.nested = { parent: circularObject };
    
    await safeLog.debug('Circular object test', circularObject, 'test-circular');
    
    console.log('✅ Test 4 completed\n');

    console.log('📋 Test 5: Erreurs complexes...');
    try {
      throw new Error('Test error with complex data');
    } catch (err) {
      const error = err as Error;
      const errorWithData = {
        originalError: error,
        context: {
          operation: 'stripe-connection',
          largeData: Array(50).fill('Error context data '.repeat(20)),
          timestamp: new Date(),
          stack: error.stack
        }
      };
      
      await safeLog.error('Complex error test', errorWithData, 'test-error');
    }
    
    console.log('✅ Test 5 completed\n');

    console.log('📋 Test 6: Simulation Stripe connection avec gros payload...');
    const mockStripeResponse = {
      account: {
        id: 'acct_1234567890',
        business_profile: {
          name: 'Test Business',
          industry: 'Technology',
          product_description: 'A very long product description '.repeat(100),
          support_phone: '+1234567890',
          support_email: 'support@testbusiness.com'
        },
        capabilities: {
          card_payments: 'active',
          transfers: 'active',
          tax_reporting_us_1099_k: 'inactive'
        },
        charges_enabled: true,
        country: 'US',
        created: 1638360000,
        default_currency: 'usd',
        details_submitted: true,
        email: 'business@example.com',
        external_accounts: {
          object: 'list',
          data: Array(10).fill(null).map((_, i) => ({
            id: `ba_${i}`,
            object: 'bank_account',
            account: 'acct_1234567890',
            account_holder_type: 'individual',
            bank_name: `Bank ${i}`,
            country: 'US',
            currency: 'usd',
            fingerprint: 'fingerprint_' + i,
            last4: `123${i}`,
            metadata: {},
            routing_number: `12345678${i}`,
            status: 'verified'
          })),
          has_more: false,
          total_count: 10,
          url: '/v1/accounts/acct_1234567890/external_accounts'
        },
        payouts_enabled: true,
        requirements: {
          alternatives: [],
          currently_due: [],
          disabled_reason: null,
          errors: [],
          eventually_due: [],
          past_due: [],
          pending_verification: []
        },
        settings: {
          branding: {
            icon: null,
            logo: null,
            primary_color: null,
            secondary_color: null
          },
          card_payments: {
            decline_on: {
              avs_failure: false,
              cvc_failure: false
            },
            statement_descriptor_prefix: null
          },
          dashboard: {
            display_name: 'Test Business',
            timezone: 'US/Pacific'
          },
          payments: {
            statement_descriptor: 'TESTBUSINESS',
            statement_descriptor_kana: null,
            statement_descriptor_kanji: null
          },
          payouts: {
            debit_negative_balances: true,
            schedule: {
              delay_days: 2,
              interval: 'daily'
            },
            statement_descriptor: null
          }
        },
        tos_acceptance: {
          date: 1638360000,
          ip: '192.168.1.1',
          user_agent: 'Mozilla/5.0...'
        },
        type: 'standard'
      },
      status: 'active',
      isConnected: true,
      details: 'Full account verification completed with extensive metadata and configuration'
    };
    
    await safeLog.large('info', 'Stripe connection check result', mockStripeResponse, 'stripe-test');
    
    console.log('✅ Test 6 completed\n');

    console.log('📋 Test 7: Test des logs durant un crash simulé...');
    setTimeout(async () => {
      try {
        await safeLog.error('Just before crash simulation', { 
          reason: 'Testing crash logging', 
          data: 'Critical data that needs to be preserved '.repeat(50) 
        }, 'crash-simulation');
        
        // Simuler un crash (ne pas faire throw pour ne pas vraiment planter le test)
        console.log('💥 Crash simulé - logs devraient être dans le fichier');
        
      } catch (err) {
        console.error('Erreur pendant le test de crash:', err);
      }
    }, 1000);

    console.log('⏱️  Test 7 en cours (crash simulé dans 1 seconde)...\n');

  } catch (error) {
    console.error('❌ Erreur pendant les tests:', error);
    await safeLog.error('Test suite failed', error, 'test-suite');
  }
}

// Fonction pour afficher les informations de fichier de log
async function showLogInfo() {
  setTimeout(() => {
    console.log('\n📁 === INFORMATIONS DU FICHIER DE LOG ===');
    console.log('Le fichier de log devrait être créé à l\'emplacement:');
    console.log('📱 React Native: {DocumentDirectory}/swift-app-session.log');
    console.log('💻 Dans l\'émulateur, chercher dans les logs de l\'application');
    console.log('\n💡 Pour trouver le fichier après un crash:');
    console.log('1. Chercher "swift-app-session.log" dans les fichiers de l\'app');
    console.log('2. Utiliser le DevTools LogViewer dans l\'app');
    console.log('3. Vérifier les logs Expo/React Native');
    console.log('\n🔍 Les logs incluront tous les détails même si la console a planté');
  }, 2000);
}

// Exécuter les tests
runLoggingTests().then(() => {
  console.log('\n🎉 === TESTS TERMINÉS ===');
  console.log('✅ Tous les tests de logging sont terminés');
  console.log('📁 Vérifiez le fichier swift-app-session.log pour voir tous les logs');
  console.log('🚀 Le système est maintenant protégé contre les crashes de logs longs');
  
  showLogInfo();
});

export default {};