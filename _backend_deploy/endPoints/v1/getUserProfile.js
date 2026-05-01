const { getUserByToken } = require('../database/user');
const logger = require('../../utils/consoleStyle');
const { getUserGamification, calculateLevelFromXp, getRankForLevel } = require('../../utils/gamification');

/**
 * Get complete user profile with stats and gamification data
 * @param {string} token - Access token
 * @returns {Promise<{status: number, json: Object}>}
 */
const getUserProfileEndpoint = async (token) => {
    logger.endpoint.start('GetUserProfile');
    const startTime = Date.now();

    if (!token) {
        logger.endpoint.validation('GetUserProfile', 'Missing access token');
        return { status: 401, json: { message: 'Missing access token' } };
    }

    let connection;
    try {
        // Authenticate user
        const userResponse = await getUserByToken(token);
        if (!userResponse || !userResponse.user) {
            logger.auth.tokenInvalid();
            return { status: 401, json: { message: 'Invalid access token' } };
        }

        const user = userResponse.user;
        logger.success('AUTH', 'User authenticated for profile retrieval', { userId: user.id });

        // Connect to database
        const { connect } = require("../../swiftDb");
        connection = await connect();
        logger.db.connect();

        // Get complete user info with gamification data + account_type + membership permissions
        const userSql = `
            SELECT u.id, u.first_name, u.last_name, u.email, u.role,
                   u.company_id,
                   u.company_role,
                   u.account_type,
                   u.created_at, u.updated_at, u.verification_code,
                   u.level, u.experience, u.experience_to_next_level,
                   u.total_jobs_completed, u.total_items_handled,
                   u.title, u.streak, u.last_activity, u.last_level_up, u.avatar_url, u.profile_picture,
                   u.reputation_score,
                   c.name AS company_name, c.abn AS company_abn, c.logo_url AS company_logo_url,
                   cm.role AS membership_role,
                   cm.can_create_jobs,
                   cm.can_assign_staff,
                   cm.can_view_financials,
                   cm.can_collect_payment,
                   cm.can_manage_stripe
            FROM users u
            LEFT JOIN companies c ON c.id = u.company_id
            LEFT JOIN company_memberships cm
                   ON cm.user_id = u.id AND cm.company_id = u.company_id AND cm.status = 'active'
            WHERE u.id = ?
        `;
        const [userResult] = await connection.execute(userSql, [user.id]);
        
        if (userResult.length === 0) {
            connection.release();
            return { status: 404, json: { message: 'User not found' } };
        }

        const userData = userResult[0];

        // Get user job statistics
        const statsSql = `
            SELECT 
                COUNT(*) as totalJobs,
                SUM(CASE WHEN j.status = 'completed' THEN 1 ELSE 0 END) as completedJobs,
                SUM(CASE WHEN j.status IN ('scheduled', 'in_progress', 'paused') THEN 1 ELSE 0 END) as activeJobs,
                SUM(CASE WHEN j.status = 'pending' THEN 1 ELSE 0 END) as pendingJobs
            FROM jobs j
            JOIN job_users ju ON j.id = ju.job_id
            WHERE ju.user_id = ?
        `;
        const [statsResult] = await connection.execute(statsSql, [user.id]);
        const stats = statsResult[0];

        // Get active sessions count
        const sessionsSql = `
            SELECT COUNT(*) as activeSessions
            FROM devices d
            WHERE d.user_id = ? AND d.disabled = 0
        `;
        const [sessionsResult] = await connection.execute(sessionsSql, [user.id]);
        const sessionsCount = sessionsResult[0].activeSessions;

        // Get user badges from user_badges table
        const [badgesResult] = await connection.execute(
            'SELECT badge_code FROM user_badges WHERE user_id = ?',
            [user.id]
        );
        const badges = badgesResult.map(b => b.badge_code);

        connection.release();
        logger.db.disconnect();

        // Calculate level info from current XP
        const levelInfo = calculateLevelFromXp(userData.experience || 0);
        const rank = getRankForLevel(levelInfo.level);

        // Normalise account_type: treat 'abn_contractor' as 'contractor' for frontend
        const accountType = userData.account_type === 'abn_contractor'
            ? 'contractor'
            : (userData.account_type || 'business_owner');

        // Build permissions object from membership (null-safe)
        const permissions = {
            canCreateJobs:      userData.can_create_jobs      === 1,
            canAssignStaff:     userData.can_assign_staff     === 1,
            canViewFinancials:  userData.can_view_financials  === 1,
            canCollectPayment:  userData.can_collect_payment  === 1,
            canManageStripe:    userData.can_manage_stripe    === 1,
        };

        // Prepare response matching frontend spec
        const profile = {
            user: {
                id: userData.id,
                firstName: userData.first_name,
                lastName: userData.last_name,
                email: userData.email,
                role: userData.role,
                companyId: userData.company_id,
                companyRole: userData.company_role,
                accountType,
                membershipRole: userData.membership_role || null,
                permissions,
                companyName: userData.company_name || null,
                companyAbn: userData.company_abn || null,
                companyLogoUrl: userData.company_logo_url || null,
                isVerified: userData.verification_code === 0,
                created_at: userData.created_at,
                updated_at: userData.updated_at,
                currentDevice: user.device,
                avatarId: userData.avatar_url || null,
                profilePicture: userData.profile_picture || null,
                
                // ✨ GAMIFICATION DATA (as requested by frontend team)
                gamification: {
                    level: levelInfo.level,
                    experience: userData.experience || 0,
                    experienceToNextLevel: levelInfo.xpForNextLevel,
                    totalExperienceForNextLevel: levelInfo.xpNeeded,
                    xpProgress: levelInfo.xpProgress,
                    title: levelInfo.title,
                    rank: {
                        name: rank.name,
                        emoji: rank.emoji,
                        color: rank.color
                    },
                    completedJobs: userData.total_jobs_completed || parseInt(stats.completedJobs) || 0,
                    streak: userData.streak || 0,
                    lastActivity: userData.last_activity,
                    lastLevelUp: userData.last_level_up,
                    badges: badges
                },
                
                // Legacy gamification fields (for backward compatibility)
                level: levelInfo.level,
                experience: userData.experience || 0,
                experienceToNextLevel: levelInfo.xpForNextLevel,
                title: levelInfo.title,
                
                stats: {
                    totalJobs: parseInt(stats.totalJobs) || 0,
                    completedJobs: parseInt(stats.completedJobs) || 0,
                    activeJobs: parseInt(stats.activeJobs) || 0,
                    pendingJobs: parseInt(stats.pendingJobs) || 0,
                    totalJobsCompleted: userData.total_jobs_completed || 0,
                    totalItemsHandled: userData.total_items_handled || 0
                },
                reputationScore: userData.reputation_score !== null ? parseFloat(userData.reputation_score) : null,
                security: {
                    activeSessions: parseInt(sessionsCount) || 0
                }
            }
        };

        const duration = Date.now() - startTime;
        logger.success('PROFILE', 'User profile retrieved successfully', { 
            userId: user.id, 
            level: levelInfo.level,
            xp: userData.experience || 0,
            duration: `${duration}ms` 
        });
        logger.endpoint.success('GetUserProfile', { duration: `${duration}ms` });

        return { status: 200, json: profile };

    } catch (error) {
        const duration = Date.now() - startTime;
        logger.db.error(error);
        logger.endpoint.error('GetUserProfile', { error: error.message, duration: `${duration}ms` });
        if (connection) await connection.release();
        return { status: 500, json: { message: 'Internal server error' } };
    }
};

module.exports = { getUserProfileEndpoint };
