const { connect } = require("/srv/www/htdocs/swiftapp/server/swiftDb");

async function main() {
  const c = await connect();
  try {
    // Recent counter proposals with job data
    const [rows] = await c.execute(`
      SELECT cp.id, cp.job_id, cp.proposed_start, cp.proposed_end,
             cp.proposed_price, cp.note, cp.status, cp.created_at,
             j.code as job_code, j.title as job_title, 
             j.counter_proposed_start, j.counter_proposed_end,
             j.counter_proposal_note, j.counter_proposed_at,
             j.assignment_status, j.scheduled_date
      FROM job_counter_proposals cp
      LEFT JOIN jobs j ON j.id = cp.job_id
      ORDER BY cp.created_at DESC
      LIMIT 5
    `);
    console.log("COUNTER_PROPOSALS_DATA:" + JSON.stringify(rows, null, 2));

    // Jobs currently in negotiation
    const [jobs] = await c.execute(`
      SELECT id, code, title, assignment_status, scheduled_date,
             counter_proposed_start, counter_proposed_end,
             counter_proposal_note, counter_proposed_at, counter_proposed_price
      FROM jobs
      WHERE assignment_status = 'negotiating'
      ORDER BY counter_proposed_at DESC
      LIMIT 5
    `);
    console.log("NEGOTIATING_JOBS:" + JSON.stringify(jobs, null, 2));
  } finally {
    c.release();
    process.exit(0);
  }
}

main().catch((e) => {
  console.error("ERROR:" + e.message);
  process.exit(1);
});
