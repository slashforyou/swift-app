-- =============================================================================
-- Migration 067 : Seed default contract clauses for existing companies
-- Target        : contract_clauses
-- Idempotent    : YES — skips any company that already has at least one clause
-- Strategy      : CROSS JOIN companies × default_clauses WHERE NOT EXISTS
-- Date          : 2026-05-02
-- Author        : Nora / Cobbr DB
-- =============================================================================

-- NOTE: This migration is safe to run on production.
-- It will only INSERT rows for companies that have zero rows in contract_clauses.
-- Companies that already have clauses (even partial) are left untouched.

INSERT INTO contract_clauses (company_id, title, content, clause_order, is_active)
SELECT
    c.id                   AS company_id,
    defaults.title         AS title,
    defaults.content       AS content,
    defaults.clause_order  AS clause_order,
    1                      AS is_active
FROM companies c
CROSS JOIN (

    SELECT
        0  AS clause_order,
        'Payment Terms' AS title,
        'Full payment is due upon completion of the move unless a prior deposit arrangement has been made. We accept cash, EFTPOS, credit card, and bank transfer. A surcharge of 1.5% applies to credit card payments. Invoices not paid within 7 days of the move date will incur a late fee of 2% per month.' AS content

    UNION ALL SELECT
        1,
        'Minimum Charge & Call-Out Fee',
        'A minimum charge of 2 hours applies to all jobs. A 30-minute call-out fee is included to cover travel to the pickup address. Time is rounded to the nearest 30 minutes at the end of the job, applying the 7-minute rule (if the last partial 30-minute block exceeds 7 minutes, it is rounded up to 30 minutes).'

    UNION ALL SELECT
        2,
        'Liability & Goods in Transit',
        'Our liability for loss or damage to goods is limited to $100 per item unless transit insurance has been arranged prior to the move. We strongly recommend clients arrange their own contents insurance. We are not liable for pre-existing damage, fragile items not professionally packed, items packed by the client, or damage caused by unsuitable packaging.'

    UNION ALL SELECT
        3,
        'Cancellation & Rescheduling Policy',
        'Cancellations made less than 48 hours before the scheduled move will incur a cancellation fee equal to 2 hours at the standard hourly rate. Cancellations made less than 24 hours before the move will incur a fee equal to 4 hours at the standard hourly rate. Rescheduling is subject to availability and must be requested at least 48 hours in advance.'

    UNION ALL SELECT
        4,
        'Access & Site Conditions',
        'The client is responsible for ensuring safe and legal access to both the pickup and delivery addresses, including valid parking permits, elevator bookings, and building access approvals. Any additional time or costs incurred due to access difficulties (e.g., no parking, no elevator access, stairs not disclosed) will be charged at the standard hourly rate.'

    UNION ALL SELECT
        5,
        'Prohibited & Hazardous Items',
        'We do not transport illegal items, firearms, ammunition, flammable liquids, compressed gases, corrosive chemicals, perishable food, live animals, or any items prohibited by law. Clients must disclose any items that may require special handling. We reserve the right to refuse transport of any item deemed unsafe or unsuitable.'

    UNION ALL SELECT
        6,
        'Damage Reporting',
        'Any damage to goods or property must be reported in writing within 24 hours of job completion. Claims submitted after this period may not be accepted. Photographic evidence must be provided to support any damage claim. We will not be held responsible for damage to goods that were not inspected prior to the move.'

    UNION ALL SELECT
        7,
        'Storage Terms',
        'Items placed in storage are charged at the agreed weekly or monthly rate, payable in advance. Access to stored items must be arranged 24 hours in advance. We reserve the right to dispose of or sell unclaimed goods after 90 days of unpaid storage fees, following written notice to the client''s last known address.'

    UNION ALL SELECT
        8,
        'Delays & Force Majeure',
        'We will endeavour to meet all scheduled times; however, we accept no liability for delays caused by traffic, road closures, weather conditions, mechanical failure, or other circumstances beyond our control. In the event of significant delay, we will notify the client as soon as reasonably practicable.'

    UNION ALL SELECT
        9,
        'Client Obligations',
        'The client agrees to be present or have an authorised representative present at both the pickup and delivery addresses. All items to be moved must be clearly identified and accessible. The client is responsible for disconnecting and reconnecting appliances. Furniture that cannot be safely moved in its current state (e.g., overloaded drawers, broken handles) may require dismantling, which will be charged at the standard hourly rate.'

) AS defaults
WHERE NOT EXISTS (
    SELECT 1
    FROM contract_clauses cc
    WHERE cc.company_id = c.id
);

-- =============================================================================
-- Verification query (run after migration to confirm results)
-- =============================================================================
-- SELECT
--     c.id                        AS company_id,
--     c.name                      AS company_name,
--     COUNT(cc.id)                AS clause_count
-- FROM companies c
-- LEFT JOIN contract_clauses cc ON cc.company_id = c.id
-- GROUP BY c.id, c.name
-- ORDER BY c.id;
-- =============================================================================
