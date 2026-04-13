/**
 * Check company document details and any rejection reasons
 */
require('dotenv').config();
const stripeInstance = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function checkCompanyDoc() {
  const accountId = 'acct_1TLMSIRBgZKcTyn8';
  
  try {
    const account = await stripeInstance.accounts.retrieve(accountId);
    
    console.log('=== COMPANY VERIFICATION DETAILS ===');
    console.log('Full verification object:', JSON.stringify(account.company?.verification, null, 2));
    
    // Check the file details
    const frontFileId = account.company?.verification?.document?.front;
    if (frontFileId) {
      try {
        const file = await stripeInstance.files.retrieve(frontFileId, { stripeAccount: accountId });
        console.log('\nFront file details:', JSON.stringify({
          id: file.id,
          purpose: file.purpose,
          type: file.type,
          size: file.size,
          created: new Date(file.created * 1000).toISOString(),
        }, null, 2));
      } catch(e) {
        console.log('Cannot retrieve file:', e.message);
      }
    }
    
    // Check requirements errors
    console.log('\n=== REQUIREMENTS ERRORS ===');
    const errors = account.requirements?.errors || [];
    for (const err of errors) {
      console.log(`- code: ${err.code}`);
      console.log(`  reason: ${err.reason}`);
      console.log(`  requirement: ${err.requirement}`);
    }
    
    // Check past_due details
    console.log('\n=== PAST DUE ===');
    console.log(JSON.stringify(account.requirements?.past_due, null, 2));
    
    // Check current_deadline
    console.log('\n=== DEADLINE ===');
    console.log('current_deadline:', account.requirements?.current_deadline
      ? new Date(account.requirements.current_deadline * 1000).toISOString()
      : 'none');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkCompanyDoc();
