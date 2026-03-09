const { connect } = require("/srv/www/htdocs/swiftapp/server/swiftDb");

async function main() {
  const c = await connect();
  try {
    // Jobs in negotiation
    const [jobs] = await c.execute(`
      SELECT id, code, title, assignment_status, scheduled_date,
             counter_proposed_start, counter_proposed_end,
             counter_proposal_note, counter_proposed_at
      FROM jobs
      WHERE assignment_status = 'negotiating'
      ORDER BY counter_proposed_at DESC
      LIMIT 5
    `);
    console.log("NEGOTIATING_JOBS:");
    if (jobs.length === 0) {
      console.log("  (none found)");
    } else {
      jobs.forEach((j) => {
        console.log(
          `  Job ${j.code}: start=${j.counter_proposed_start}, end=${j.counter_proposed_end}`,
        );
        console.log(`    note_raw=${j.counter_proposal_note}`);
        try {
          const parsed = JSON.parse(j.counter_proposal_note);
          console.log(`    note_parsed=`, JSON.stringify(parsed));
        } catch {
          console.log(`    note_is_plain_text=${j.counter_proposal_note}`);
        }
      });
    }
  } finally {
    c.release();
    process.exit(0);
  }
}

main().catch((e) => {
  console.error("ERROR:" + e.message);
  process.exit(1);
});
