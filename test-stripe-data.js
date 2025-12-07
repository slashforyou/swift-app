/**
 * Script de test pour récupérer les vraies données Stripe du compte acct_1SV8KSIsgSU2xbML
 * Usage: node test-stripe-data.js
 */

const SERVER_URL = 'https://altivo.fr/swift-app/v1/';
const COMPANY_ID = '1'; // Company ID pour l'utilisateur 15 (Nerd-Test)

// Simuler un token d'authentification (remplacer par un vrai token)
const AUTH_TOKEN = '4b40ce7b7b72b630ad6c...'; // Début du token de test

async function fetchWithAuth(url, options = {}) {
  const headers = {
    'Authorization': `Bearer ${AUTH_TOKEN}`,
    'Content-Type': 'application/json',
    ...options.headers
  };

  return fetch(url, { ...options, headers });
}

async function testStripeEndpoints() {
  console.log('🔍 [TEST] Testing Stripe endpoints for Company ID:', COMPANY_ID);
  console.log('🌐 [TEST] Server URL:', SERVER_URL);
  console.log('');

  const endpoints = [
    {
      name: 'Stripe Connect Status',
      url: `${SERVER_URL}stripe/connect/status?company_id=${COMPANY_ID}`,
      description: 'Statut de connexion et infos du compte'
    },
    {
      name: 'Stripe Balance',
      url: `${SERVER_URL}stripe/balance?company_id=${COMPANY_ID}`,
      description: 'Balance disponible et en attente'
    },
    {
      name: 'Stripe Payments',
      url: `${SERVER_URL}stripe/payments?company_id=${COMPANY_ID}`,
      description: 'Liste des paiements reçus'
    },
    {
      name: 'Stripe Payouts',
      url: `${SERVER_URL}stripe/payouts?company_id=${COMPANY_ID}`,
      description: 'Liste des virements effectués'
    },
    {
      name: 'Stripe Account Details',
      url: `${SERVER_URL}stripe/account?company_id=${COMPANY_ID}`,
      description: 'Détails complets du compte Stripe'
    }
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`🧪 [TEST] ${endpoint.name}`);
      console.log(`📍 URL: ${endpoint.url}`);
      console.log(`ℹ️  Description: ${endpoint.description}`);
      
      const response = await fetchWithAuth(endpoint.url);
      
      console.log(`📡 Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Response:`, JSON.stringify(data, null, 2));
        
        // Analyse spécifique selon l'endpoint
        if (endpoint.name === 'Stripe Connect Status' && data.success && data.data) {
          console.log(`🏢 Account ID: ${data.data.stripe_account_id}`);
          console.log(`💳 Charges Enabled: ${data.data.charges_enabled}`);
          console.log(`💸 Payouts Enabled: ${data.data.payouts_enabled}`);
          console.log(`🏪 Business Name: ${data.data.business_profile?.name}`);
        }
        
        if (endpoint.name === 'Stripe Balance' && data.success && data.data) {
          console.log(`💰 Available: ${data.data.available || 'N/A'}`);
          console.log(`⏳ Pending: ${data.data.pending || 'N/A'}`);
        }
        
      } else {
        const errorText = await response.text().catch(() => 'No error text');
        console.log(`❌ Error: ${errorText}`);
      }
      
    } catch (error) {
      console.log(`💥 Exception: ${error.message}`);
    }
    
    console.log('');
  }
}

// Exécuter les tests
if (typeof window === 'undefined') {
  // Node.js environment
  testStripeEndpoints().catch(console.error);
} else {
  // Browser environment - export la fonction
  window.testStripeEndpoints = testStripeEndpoints;
}

module.exports = { testStripeEndpoints };