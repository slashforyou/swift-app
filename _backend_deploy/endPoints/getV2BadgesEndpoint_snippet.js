// ─── GET /swift-app/v1/user/gamification/v2/badges ──────────────────────────
// Returns { ok, data: { earned[], available[], stats } }
const getV2BadgesEndpoint = async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ ok: false, error: 'Missing token' });

  let connection;
  try {
    const userResponse = await getUserByToken(token);
    if (!userResponse?.user) return res.status(401).json({ ok: false, error: 'Invalid token' });
    const userId = userResponse.user.id;

    connection = await connect();

    // 1. All active badges
    const [allBadges] = await connection.execute(
      'SELECT * FROM gamification_badge_definitions WHERE is_active = 1 ORDER BY category, sort_order'
    );

    // 2. Earned badges for this user
    const [earnedRows] = await connection.execute(
      'SELECT badge_code, earned_at FROM user_badges WHERE user_id = ?',
      [userId]
    );
    const earnedMap = new Map(earnedRows.map(r => [r.badge_code, r.earned_at]));

    // 3. Profile stats
    const [[profile]] = await connection.execute(
      `SELECT current_level, current_streak_days,
              total_jobs_completed, total_5star_reviews
       FROM gamification_profiles
       WHERE entity_type = 'user' AND entity_id = ?`,
      [userId]
    );

    // 4. Role stats
    const [[roleStats]] = await connection.execute(
      `SELECT
         COALESCE(SUM(role = 'driver'),   0) AS driver_jobs,
         COALESCE(SUM(role = 'offsider'), 0) AS offsider_jobs
       FROM job_users
       WHERE user_id = ? AND unassigned_at IS NULL`,
      [userId]
    );

    // 5. Business jobs (company total)
    const [[userRow]] = await connection.execute(
      'SELECT company_id FROM users WHERE id = ?',
      [userId]
    );
    let businessJobs = 0;
    if (userRow?.company_id) {
      const [[bizProfile]] = await connection.execute(
        `SELECT total_jobs_completed FROM gamification_profiles
         WHERE entity_type = 'company' AND entity_id = ?`,
        [userRow.company_id]
      );
      businessJobs = bizProfile?.total_jobs_completed ?? 0;
    }

    const stats = {
      level_reached:   profile?.current_level       || 0,
      streak_days:     profile?.current_streak_days  || 0,
      five_star_count: profile?.total_5star_reviews  || 0,
      jobs_count:      profile?.total_jobs_completed  || 0,
      driver_jobs:     parseInt(roleStats?.driver_jobs   || 0, 10),
      offsider_jobs:   parseInt(roleStats?.offsider_jobs || 0, 10),
      business_jobs:   businessJobs,
    };

    const earned = [];
    const available = [];

    for (const badge of allBadges) {
      // Hide secret badges until earned
      if (badge.is_secret && !earnedMap.has(badge.code)) continue;

      const earnedAt = earnedMap.get(badge.code) ?? null;
      const currentVal = stats[badge.requirement_type] ?? null;

      const badgeOut = {
        code:             badge.code,
        name:             badge.name,
        description:      badge.description,
        icon:             badge.icon,
        category:         badge.category,
        earnedAt:         earnedAt,
        requirementType:  badge.requirement_type,
        requirementValue: badge.requirement_value,
        currentValue:     currentVal,
        xpBonus:          badge.xp_bonus || 0,
      };

      if (earnedAt) {
        earned.push(badgeOut);
      } else {
        available.push(badgeOut);
      }
    }

    return res.json({ ok: true, data: { earned, available, stats } });
  } catch (e) {
    console.error('[gamifV2 badges]', e);
    return res.status(500).json({ ok: false, error: 'internal' });
  } finally {
    if (connection) connection.release();
  }
};
