// Patch for /srv/www/htdocs/swiftapp/server/endPoints/v1/stripe/connect.js
// Fix: onboardingCompleted should be based on details_submitted, not all 3 conditions
// Also adds a proper 'status' field to the response

const fs = require('fs');
const path = '/srv/www/htdocs/swiftapp/server/endPoints/v1/stripe/connect.js';

let content = fs.readFileSync(path, 'utf8');

// 1. Fix onboardingCompleted logic
const oldLogic = `    // Vérifier si onboarding est complété
    const onboardingCompleted = account.charges_enabled &&
                                 account.payouts_enabled &&
                                 account.details_submitted;`;

const newLogic = `    // Vérifier si onboarding est complété
    // details_submitted = true signifie que l'utilisateur a terminé le wizard
    // charges_enabled/payouts_enabled peuvent être false pendant la vérification Stripe
    const onboardingCompleted = account.details_submitted === true;`;

if (!content.includes(oldLogic)) {
  console.error('Could not find old onboardingCompleted logic');
  process.exit(1);
}
content = content.replace(oldLogic, newLogic);

// 2. Fix the DB update condition: also update when details_submitted but onboarding_completed_at is null
const oldDbUpdate = `    if (onboardingCompleted && !localAccount[0].onboarding_completed_at) {`;
const newDbUpdate = `    if (onboardingCompleted && !localAccount[0].onboarding_completed_at) {
      console.log(\`✅ Marking onboarding as completed for company \${companyId} (details_submitted=true)\`);`;
content = content.replace(oldDbUpdate, newDbUpdate);

// 3. Add a status field to the response
const oldResponse = `    res.json({
      success: true,
      data: {
        stripe_account_id: account.id,
        charges_enabled: account.charges_enabled || false,
        payouts_enabled: account.payouts_enabled || false,
        details_submitted: account.details_submitted || false,
        onboarding_completed: onboardingCompleted,
        requirements: {
          currently_due: account.requirements?.currently_due || [],
          eventually_due: account.requirements?.eventually_due || [],
          past_due: account.requirements?.past_due || [],
          disabled_reason: account.requirements?.disabled_reason || null`;

const newResponse = `    // Determine proper status
    const currentlyDue = account.requirements?.currently_due || [];
    const pastDue = account.requirements?.past_due || [];
    const disabledReason = account.requirements?.disabled_reason || null;
    
    let accountStatus = 'not_connected';
    if (!account.details_submitted) {
      accountStatus = 'incomplete'; // User hasn't finished the onboarding wizard
    } else if (disabledReason) {
      accountStatus = 'restricted'; // Account is disabled by Stripe
    } else if (account.charges_enabled && account.payouts_enabled) {
      accountStatus = 'active'; // Fully operational
    } else if (account.charges_enabled) {
      accountStatus = 'pending_verification'; // Charges work but payouts pending
    } else if (currentlyDue.length > 0 || pastDue.length > 0) {
      accountStatus = 'pending_verification'; // Stripe is verifying documents
    } else {
      accountStatus = 'pending_verification'; // Waiting for Stripe review
    }

    res.json({
      success: true,
      data: {
        stripe_account_id: account.id,
        status: accountStatus,
        charges_enabled: account.charges_enabled || false,
        payouts_enabled: account.payouts_enabled || false,
        details_submitted: account.details_submitted || false,
        onboarding_completed: onboardingCompleted,
        requirements: {
          currently_due: account.requirements?.currently_due || [],
          eventually_due: account.requirements?.eventually_due || [],
          past_due: account.requirements?.past_due || [],
          disabled_reason: account.requirements?.disabled_reason || null`;

if (!content.includes(oldResponse)) {
  console.error('Could not find old response block');
  console.error('Looking for:', oldResponse.substring(0, 100));
  process.exit(1);
}
content = content.replace(oldResponse, newResponse);

fs.writeFileSync(path, content, 'utf8');
console.log('✅ Backend connect.js patched successfully');
console.log('   - onboardingCompleted now based on details_submitted only');
console.log('   - Added status field to response');
