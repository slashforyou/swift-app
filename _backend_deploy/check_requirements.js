// Fix: Create account token with publishable key and update account
const { stripeLive, stripeTest } = require("./config/stripe");
const stripe = stripeLive || stripeTest;

const PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY_LIVE || process.env.STRIPE_PUBLISHABLE_KEY;

async function main() {
  const accountId = "acct_1TLMSIRBgZKcTyn8";
  
  console.log("Creating account token with publishable key...");
  console.log("Key prefix:", PUBLISHABLE_KEY?.substring(0, 15));
  
  // Create account token via Stripe API with publishable key
  const params = new URLSearchParams();
  params.append("account[company][directors_provided]", "true");
  params.append("account[company][executives_provided]", "true");
  params.append("account[company][owners_provided]", "true");
  
  const tokenResponse = await fetch("https://api.stripe.com/v1/tokens", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${PUBLISHABLE_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });
  
  const tokenData = await tokenResponse.json();
  
  if (!tokenResponse.ok) {
    console.error("❌ Token creation failed:", tokenData.error?.message);
    return;
  }
  
  console.log("✅ Token created:", tokenData.id);
  
  // Now update the account with the token
  const updated = await stripe.accounts.update(accountId, {
    account_token: tokenData.id,
  });
  
  console.log("✅ Account updated via token");
  console.log("  directors_provided:", updated.company?.directors_provided);
  console.log("  executives_provided:", updated.company?.executives_provided);
  console.log("  owners_provided:", updated.company?.owners_provided);
  
  // Re-check requirements
  const account = await stripe.accounts.retrieve(accountId);
  console.log("\ncurrently_due:", JSON.stringify(account.requirements?.currently_due, null, 2));
}

main().catch(e => console.error("Error:", e.message));
