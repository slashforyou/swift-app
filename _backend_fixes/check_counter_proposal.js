const { connect } = require("/srv/www/htdocs/swiftapp/server/swiftDb");

async function main() {
  const c = await connect();
  try {
    // 1. Table structure
    const [desc] = await c.execute("DESCRIBE job_counter_proposals");
    console.log("=== job_counter_proposals schema ===");
    console.log(
      JSON.stringify(
        desc.map((r) => ({ Field: r.Field, Type: r.Type, Null: r.Null })),
        null,
        2,
      ),
    );

    // 2. Recent counter proposals
    const [rows] = await c.execute(`
      SELECT cp.*, j.code as job_code, j.title as job_title, 
             j.counter_proposed_start, j.counter_proposed_end,
             j.counter_proposal_note, j.counter_proposed_at,
             j.assignment_status
      FROM job_counter_proposals cp
      LEFT JOIN jobs j ON j.id = cp.job_id
      ORDER BY cp.created_at DESC
      LIMIT 10
    `);
    console.log("\n=== Recent counter proposals ===");
    console.log(JSON.stringify(rows, null, 2));

    // 3. Jobs with assignment_status = negotiating
    const [jobs] = await c.execute(`
      SELECT id, code, title, assignment_status,
             counter_proposed_start, counter_proposed_end,
             counter_proposal_note, counter_proposed_at, counter_proposed_by
      FROM jobs
      WHERE assignment_status = 'negotiating'
      ORDER BY counter_proposed_at DESC
      LIMIT 5
    `);
    console.log("\n=== Jobs in negotiation ===");
    console.log(JSON.stringify(jobs, null, 2));
  } finally {
    c.release();
    process.exit(0);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
