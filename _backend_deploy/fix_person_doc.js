/**
 * Fix person document: attach front file that was never linked
 * Files already uploaded:
 * - file_1TLhiDRBgZKcTyn84Wn7Tgpi (front, 801151 bytes, created 10:27:25)
 * - file_1TLhiIRBgZKcTyn82lV0uFKY (back, 806842 bytes, created 10:27:30)
 */
require('dotenv').config();
const stripeInstance = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function fixDocuments() {
  const accountId = 'acct_1TLMSIRBgZKcTyn8';
  const personId = 'person_1TLMWKRBgZKcTyn8Of3VEooN';
  const frontFileId = 'file_1TLhiDRBgZKcTyn84Wn7Tgpi';
  const backFileId = 'file_1TLhiIRBgZKcTyn82lV0uFKY';

  console.log('Attempting to update person verification document directly...');
  
  try {
    // Attempt 1: Direct person update
    const result = await stripeInstance.accounts.updatePerson(
      accountId,
      personId,
      {
        verification: {
          document: {
            front: frontFileId,
            back: backFileId,
          },
        },
      },
    );
    console.log('✅ Person updated successfully!');
    console.log('Verification:', JSON.stringify(result.verification?.document, null, 2));
  } catch (err) {
    console.log('❌ Direct update failed:', err.message);
    
    // Attempt 2: Create person token with secret key, then update
    console.log('\nAttempting with person token...');
    try {
      const token = await stripeInstance.tokens.create({
        person: {
          verification: {
            document: {
              front: frontFileId,
              back: backFileId,
            },
          },
        },
      });
      console.log('Token created:', token.id);
      
      const result2 = await stripeInstance.accounts.updatePerson(
        accountId,
        personId,
        { person_token: token.id },
      );
      console.log('✅ Person updated via token!');
      console.log('Verification:', JSON.stringify(result2.verification?.document, null, 2));
    } catch (err2) {
      console.log('❌ Token approach failed:', err2.message);
      console.log('=> Documents need to be re-uploaded from the app');
    }
  }
  
  // Verify final state
  try {
    const person = await stripeInstance.accounts.retrievePerson(accountId, personId);
    console.log('\n=== FINAL PERSON STATE ===');
    console.log('verification.document:', JSON.stringify(person.verification?.document, null, 2));
    console.log('requirements:', JSON.stringify(person.requirements, null, 2));
  } catch(e) {
    console.log('Cannot check person:', e.message);
  }
}

fixDocuments();
