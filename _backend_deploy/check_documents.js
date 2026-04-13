/**
 * Check document status on Stripe for acct_1TLMSIRBgZKcTyn8
 */
require('dotenv').config();
const stripeInstance = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function checkDocuments() {

  const accountId = 'acct_1TLMSIRBgZKcTyn8';
  
  try {
    // Get account details
    const account = await stripeInstance.accounts.retrieve(accountId);
    
    console.log('=== ACCOUNT STATUS ===');
    console.log('details_submitted:', account.details_submitted);
    console.log('charges_enabled:', account.charges_enabled);
    console.log('payouts_enabled:', account.payouts_enabled);
    console.log('business_type:', account.business_type);
    
    console.log('\n=== REQUIREMENTS ===');
    console.log('currently_due:', JSON.stringify(account.requirements?.currently_due, null, 2));
    console.log('past_due:', JSON.stringify(account.requirements?.past_due, null, 2));
    console.log('eventually_due:', JSON.stringify(account.requirements?.eventually_due, null, 2));
    console.log('disabled_reason:', account.requirements?.disabled_reason);
    
    console.log('\n=== COMPANY VERIFICATION ===');
    console.log('company.verification:', JSON.stringify(account.company?.verification, null, 2));
    
    // List persons
    const persons = await stripeInstance.accounts.listPersons(accountId, { limit: 10 });
    
    for (const person of persons.data) {
      console.log(`\n=== PERSON: ${person.id} ===`);
      console.log('name:', person.first_name, person.last_name);
      console.log('relationship:', JSON.stringify(person.relationship));
      console.log('verification.status:', person.verification?.status);
      console.log('verification.document:', JSON.stringify(person.verification?.document, null, 2));
      console.log('verification.additional_document:', JSON.stringify(person.verification?.additional_document, null, 2));
      console.log('requirements:', JSON.stringify(person.requirements, null, 2));
    }
    
    // List recent files on the account
    console.log('\n=== FILES ON ACCOUNT ===');
    try {
      const files = await stripeInstance.files.list({ limit: 10 }, { stripeAccount: accountId });
      for (const f of files.data) {
        console.log(`  ${f.id}: purpose=${f.purpose}, created=${new Date(f.created*1000).toISOString()}, size=${f.size}`);
      }
    } catch(e) {
      console.log('Cannot list files:', e.message);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkDocuments();
