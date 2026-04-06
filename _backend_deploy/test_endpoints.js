// Get a valid session token + run endpoint tests
// Run from /srv/www/htdocs/swiftapp/server/
require('dotenv').config();
const http = require('http');

async function getToken() {
  const { connect } = require('./swiftDb');
  const conn = await connect();
  try {
    const [rows] = await conn.execute(
      `SELECT d.session_token, u.id as user_id, u.email, u.company_id
       FROM devices d
       JOIN users u ON u.id = d.user_id
       WHERE d.disabled = 0 AND d.session_token IS NOT NULL AND u.company_id IS NOT NULL
       ORDER BY d.id DESC LIMIT 1`
    );
    if (rows.length === 0) {
      console.log('No active session found');
      process.exit(1);
    }
    return rows[0];
  } finally {
    conn.release();
  }
}

function req(method, path, token, body) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: 'localhost',
      port: 3021,
      path: '/swift-app/v1' + path,
      method,
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json',
      },
    };
    const r = http.request(opts, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch(e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    r.on('error', reject);
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

async function main() {
  const session = await getToken();
  const TOKEN = session.session_token;
  console.log('=== Test user:', session.email, '(company:', session.company_id, ') ===\n');

  // 1. LIST templates (should be empty or defaults)
  console.log('--- 1. GET /templates/modular ---');
  const list = await req('GET', '/templates/modular', TOKEN);
  console.log('Status:', list.status, '| Templates:', list.body.templates?.length || 0);
  if (list.status !== 200) { console.log('Body:', JSON.stringify(list.body)); }

  // 2. CREATE template
  console.log('\n--- 2. POST /templates/modular ---');
  const create = await req('POST', '/templates/modular', TOKEN, {
    name: 'Test Modular Template',
    description: 'Template de test auto',
    category: 'residential',
    billingMode: 'location_to_location',
    defaultHourlyRate: 45,
    minimumHours: 2,
    timeRoundingMinutes: 15,
    returnTripDefaultMinutes: 30,
    segments: [
      { type: 'loading', label: 'Chargement depart', isBillable: true },
      { type: 'travel', label: 'Trajet aller', isBillable: false },
      { type: 'loading', label: 'Dechargement arrivee', isBillable: true },
      { type: 'travel', label: 'Trajet retour', isBillable: false },
    ],
  });
  console.log('Status:', create.status, '| ID:', create.body.template?.id);
  if (create.status !== 201) { console.log('Body:', JSON.stringify(create.body)); }
  const templateId = create.body.template?.id;

  if (!templateId) {
    console.log('Cannot continue without template ID');
    process.exit(1);
  }

  // 3. GET single template
  console.log('\n--- 3. GET /templates/modular/' + templateId + ' ---');
  const get = await req('GET', '/templates/modular/' + templateId, TOKEN);
  console.log('Status:', get.status, '| Name:', get.body.template?.name, '| Segments:', get.body.template?.segments?.length);

  // 4. UPDATE template
  console.log('\n--- 4. PUT /templates/modular/' + templateId + ' ---');
  const update = await req('PUT', '/templates/modular/' + templateId, TOKEN, {
    name: 'Test Modular Updated',
    description: 'Updated desc',
    segments: [
      { type: 'loading', label: 'Chargement', isBillable: true },
      { type: 'travel', label: 'Trajet', isBillable: false },
      { type: 'loading', label: 'Dechargement', isBillable: true },
    ],
  });
  console.log('Status:', update.status, '| Name:', update.body.template?.name, '| Segments:', update.body.template?.segments?.length);

  // 5. LIST again to confirm
  console.log('\n--- 5. GET /templates/modular (after update) ---');
  const list2 = await req('GET', '/templates/modular', TOKEN);
  console.log('Status:', list2.status, '| Templates:', list2.body.templates?.length);

  // 6. Init segments on a test job — first find/create a job
  const { connect } = require('./swiftDb');
  const conn = await connect();
  const [jobs] = await conn.execute(
    'SELECT id FROM jobs LIMIT 1'
  );
  conn.release();

  if (jobs.length > 0) {
    const jobId = jobs[0].id;
    console.log('\n--- 6. POST /jobs/' + jobId + '/segments (init from template) ---');
    const init = await req('POST', '/jobs/' + jobId + '/segments', TOKEN, { templateId });
    console.log('Status:', init.status, '| Segments created:', init.body.segments?.length);

    // 7. GET segments
    console.log('\n--- 7. GET /jobs/' + jobId + '/segments ---');
    const segs = await req('GET', '/jobs/' + jobId + '/segments', TOKEN);
    console.log('Status:', segs.status, '| Segments:', segs.body.segments?.length);

    if (segs.body.segments?.length > 0) {
      const segId = segs.body.segments[0].id;

      // 8. START segment
      console.log('\n--- 8. POST /jobs/' + jobId + '/segments/' + segId + '/start ---');
      const start = await req('POST', '/jobs/' + jobId + '/segments/' + segId + '/start', TOKEN);
      console.log('Status:', start.status, '| Started:', start.body.startedAt);

      // 9. COMPLETE segment
      console.log('\n--- 9. POST /jobs/' + jobId + '/segments/' + segId + '/complete ---');
      const complete = await req('POST', '/jobs/' + jobId + '/segments/' + segId + '/complete', TOKEN);
      console.log('Status:', complete.status, '| Duration:', complete.body.durationMs, 'ms');
    }

    // 10. PATCH return trip
    console.log('\n--- 10. PATCH /jobs/' + jobId + '/return-trip ---');
    const rt = await req('PATCH', '/jobs/' + jobId + '/return-trip', TOKEN, { minutes: 25 });
    console.log('Status:', rt.status, '| Minutes:', rt.body.returnTripMinutes);

    // 11. GET flat rate options
    console.log('\n--- 11. GET /jobs/' + jobId + '/flat-rate-options ---');
    const fro = await req('GET', '/jobs/' + jobId + '/flat-rate-options', TOKEN);
    console.log('Status:', fro.status, '| Options:', fro.body.options?.length);

    // 12. GET time breakdown
    console.log('\n--- 12. GET /jobs/' + jobId + '/time-breakdown ---');
    const tb = await req('GET', '/jobs/' + jobId + '/time-breakdown', TOKEN);
    console.log('Status:', tb.status, '| Billing:', tb.body.breakdown?.billingMode, '| Total:', tb.body.breakdown?.totalCost);
  } else {
    console.log('\nNo jobs found for this company, skipping segment tests');
  }

  // 13. DELETE template
  console.log('\n--- 13. DELETE /templates/modular/' + templateId + ' ---');
  const del = await req('DELETE', '/templates/modular/' + templateId, TOKEN);
  console.log('Status:', del.status, '| Message:', del.body.message);

  console.log('\n=== ALL TESTS COMPLETE ===');
  process.exit(0);
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
