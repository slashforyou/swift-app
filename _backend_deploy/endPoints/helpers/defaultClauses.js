const DEFAULT_CLAUSES = [
  {
    title: 'Payment Terms',
    content: 'Full payment is due upon completion of the move unless a prior deposit arrangement has been made. We accept cash, EFTPOS, credit card, and bank transfer. A surcharge of 1.5% applies to credit card payments. Invoices not paid within 7 days of the move date will incur a late fee of 2% per month.',
    clause_order: 0
  },
  {
    title: 'Minimum Charge & Call-Out Fee',
    content: 'A minimum charge of 2 hours applies to all jobs. A 30-minute call-out fee is included to cover travel to the pickup address. Time is rounded to the nearest 30 minutes at the end of the job, applying the 7-minute rule (if the last partial 30-minute block exceeds 7 minutes, it is rounded up to 30 minutes).',
    clause_order: 1
  },
  {
    title: 'Liability & Goods in Transit',
    content: 'Our liability for loss or damage to goods is limited to $100 per item unless transit insurance has been arranged prior to the move. We strongly recommend clients arrange their own contents insurance. We are not liable for pre-existing damage, fragile items not professionally packed, items packed by the client, or damage caused by unsuitable packaging.',
    clause_order: 2
  },
  {
    title: 'Cancellation & Rescheduling Policy',
    content: 'Cancellations made less than 48 hours before the scheduled move will incur a cancellation fee equal to 2 hours at the standard hourly rate. Cancellations made less than 24 hours before the move will incur a fee equal to 4 hours at the standard hourly rate. Rescheduling is subject to availability and must be requested at least 48 hours in advance.',
    clause_order: 3
  },
  {
    title: 'Access & Site Conditions',
    content: 'The client is responsible for ensuring safe and legal access to both the pickup and delivery addresses, including valid parking permits, elevator bookings, and building access approvals. Any additional time or costs incurred due to access difficulties (e.g., no parking, no elevator access, stairs not disclosed) will be charged at the standard hourly rate.',
    clause_order: 4
  },
  {
    title: 'Prohibited & Hazardous Items',
    content: 'We do not transport illegal items, firearms, ammunition, flammable liquids, compressed gases, corrosive chemicals, perishable food, live animals, or any items prohibited by law. Clients must disclose any items that may require special handling. We reserve the right to refuse transport of any item deemed unsafe or unsuitable.',
    clause_order: 5
  },
  {
    title: 'Damage Reporting',
    content: 'Any damage to goods or property must be reported in writing within 24 hours of job completion. Claims submitted after this period may not be accepted. Photographic evidence must be provided to support any damage claim. We will not be held responsible for damage to goods that were not inspected prior to the move.',
    clause_order: 6
  },
  {
    title: 'Storage Terms',
    content: 'Items placed in storage are charged at the agreed weekly or monthly rate, payable in advance. Access to stored items must be arranged 24 hours in advance. We reserve the right to dispose of or sell unclaimed goods after 90 days of unpaid storage fees, following written notice to the client\'s last known address.',
    clause_order: 7
  },
  {
    title: 'Delays & Force Majeure',
    content: 'We will endeavour to meet all scheduled times; however, we accept no liability for delays caused by traffic, road closures, weather conditions, mechanical failure, or other circumstances beyond our control. In the event of significant delay, we will notify the client as soon as reasonably practicable.',
    clause_order: 8
  },
  {
    title: 'Client Obligations',
    content: 'The client agrees to be present or have an authorised representative present at both the pickup and delivery addresses. All items to be moved must be clearly identified and accessible. The client is responsible for disconnecting and reconnecting appliances. Furniture that cannot be safely moved in its current state (e.g., overloaded drawers, broken handles) may require dismantling, which will be charged at the standard hourly rate.',
    clause_order: 9
  }
];

/**
 * Seed default Australian contract clauses for a newly created company.
 * Idempotent: skips if clauses already exist for the given company_id.
 *
 * @param {import('mysql2/promise').PoolConnection} connection - Active DB connection
 * @param {number} companyId
 */
const seedDefaultClausesForCompany = async (connection, companyId) => {
  const [[{ count }]] = await connection.execute(
    'SELECT COUNT(*) AS count FROM contract_clauses WHERE company_id = ?',
    [companyId]
  );

  if (Number(count) > 0) {
    console.log(`[SEED_CLAUSES] company_id=${companyId} already has ${count} clause(s) — skipping`);
    return;
  }

  for (const clause of DEFAULT_CLAUSES) {
    await connection.execute(
      'INSERT INTO contract_clauses (company_id, title, content, clause_order, is_active) VALUES (?, ?, ?, ?, 1)',
      [companyId, clause.title, clause.content, clause.clause_order]
    );
  }

  console.log(`[SEED_CLAUSES] Inserted ${DEFAULT_CLAUSES.length} default clauses for company_id=${companyId}`);
};

module.exports = { seedDefaultClausesForCompany };
