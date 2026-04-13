require('dotenv').config();
const s = require('stripe')(process.env.STRIPE_SECRET_KEY);
s.accounts.retrieve('acct_1TLMSIRBgZKcTyn8').then(a => {
  console.log('Company name:', a.company?.name);
  console.log('Company tax_id:', a.company?.tax_id_provided);
  console.log('Company address:', JSON.stringify(a.company?.address));
  console.log('DBA:', a.business_profile?.name);
  console.log('URL:', a.business_profile?.url);
});
