/**
 * Fix: Remove extra closing brace in startOnboarding
 */
const fs = require('fs');
const FILE = '/srv/www/htdocs/swiftapp/server/endPoints/v1/stripe/onboarding.js';

let content = fs.readFileSync(FILE, 'utf8');

// The problematic pattern: double closing brace
const bad = `        console.log("\\ud83d\\udcdd [Stripe Onboarding] Custom account: business_type=" + businessType + ", tos accepted (no token)");
      }
      }
    } else {`;

const good = `        console.log("\\ud83d\\udcdd [Stripe Onboarding] Custom account: business_type=" + businessType + ", tos accepted (no token)");
      }
    } else {`;

if (content.includes(bad)) {
  content = content.replace(bad, good);
  fs.writeFileSync(FILE, content, 'utf8');
  console.log('✅ Fixed: removed extra closing brace');
} else {
  console.log('Pattern not found. Checking for the issue...');
  const lines = content.split('\n');
  for (let i = 400; i < 435; i++) {
    console.log(`${i+1}: ${lines[i]}`);
  }
}
