/**
 * Fix Stripe status detection: if disabled_reason is set but currently_due and past_due
 * are empty, documents have been re-submitted → pending_verification, not restricted
 */
const { Client } = require('ssh2');
const fs = require('fs');

const SERVER = {
  host: 'cobbr-app.com',
  username: 'romai',
  privateKey: require('os').homedir() + '/.ssh/id_rsa',
};

const CONNECT_PATH = '/srv/www/htdocs/swiftapp/server/endPoints/v1/stripe/connect.js';

// Old logic: disabledReason → restricted (always)
const oldLogic = `    if (!account.details_submitted) {
      accountStatus = 'incomplete'; // User hasn't finished the onboarding wizard
    } else if (disabledReason) {
      accountStatus = 'restricted'; // Account is disabled by Stripe
    } else if (account.charges_enabled && account.payouts_enabled) {`;

// New logic: disabledReason but no currently_due/past_due → pending_verification (documents under review)
const newLogic = `    const pendingVerification = account.requirements?.pending_verification || [];
    
    if (!account.details_submitted) {
      accountStatus = 'incomplete'; // User hasn't finished the onboarding wizard
    } else if (disabledReason && (currentlyDue.length > 0 || pastDue.length > 0)) {
      accountStatus = 'restricted'; // Account is disabled and requires action
    } else if (disabledReason && currentlyDue.length === 0 && pastDue.length === 0) {
      accountStatus = 'pending_verification'; // Documents re-submitted, Stripe reviewing
    } else if (account.charges_enabled && account.payouts_enabled) {`;

async function deploy() {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    conn.on('ready', () => {
      console.log('Connected to server');
      
      // Read the file
      conn.exec(`cat "${CONNECT_PATH}"`, (err, stream) => {
        if (err) { reject(err); return; }
        
        let content = '';
        stream.on('data', (data) => { content += data.toString(); });
        stream.on('close', () => {
          console.log('File read, length:', content.length);
          
          if (!content.includes(oldLogic)) {
            console.log('Old pattern not found. Checking current content...');
            // Maybe already fixed?
            if (content.includes('pending_verification; // Documents re-submitted')) {
              console.log('Already fixed!');
              conn.end();
              resolve();
              return;
            }
            console.error('Cannot find the expected pattern to replace');
            conn.end();
            reject(new Error('Pattern not found'));
            return;
          }
          
          content = content.replace(oldLogic, newLogic);
          
          // Write the file
          const escaped = content.replace(/'/g, "'\\''");
          conn.exec(`echo '${escaped}' > "${CONNECT_PATH}"`, (err2, stream2) => {
            if (err2) { reject(err2); return; }
            
            let writeErr = '';
            stream2.stderr.on('data', (d) => { writeErr += d.toString(); });
            stream2.on('close', (code) => {
              if (code !== 0) {
                console.error('Write failed:', writeErr);
                // Fallback: use sftp
                conn.sftp((err3, sftp) => {
                  if (err3) { reject(err3); return; }
                  const writeStream = sftp.createWriteStream(CONNECT_PATH);
                  writeStream.on('close', () => {
                    console.log('File written via SFTP');
                    // Restart PM2
                    conn.exec('cd /srv/www/htdocs/swiftapp/server && pm2 restart all', (err4, stream4) => {
                      if (err4) { reject(err4); return; }
                      let pm2Out = '';
                      stream4.on('data', (d) => { pm2Out += d.toString(); });
                      stream4.on('close', () => {
                        console.log('PM2 restart:', pm2Out);
                        conn.end();
                        resolve();
                      });
                    });
                  });
                  writeStream.end(content, 'utf8');
                });
              } else {
                console.log('File written');
                // Restart PM2
                conn.exec('cd /srv/www/htdocs/swiftapp/server && pm2 restart all', (err4, stream4) => {
                  if (err4) { reject(err4); return; }
                  let pm2Out = '';
                  stream4.on('data', (d) => { pm2Out += d.toString(); });
                  stream4.on('close', () => {
                    console.log('PM2 restart:', pm2Out);
                    conn.end();
                    resolve();
                  });
                });
              }
            });
          });
        });
      });
    });
    
    const key = fs.readFileSync(SERVER.privateKey);
    conn.connect({ host: SERVER.host, username: SERVER.username, privateKey: key });
  });
}

deploy().then(() => {
  console.log('Done!');
  process.exit(0);
}).catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
