const { getUserByToken } = require('./database/user');
const logger = require('../utils/consoleStyle');
const moment = require('moment-timezone');

/**
 * Endpoint to retrieve calendar days (jobs) for a user within a date range.
 * Filters jobs based on their LOCAL timezone, not UTC.
 * 
 * @param {string} token - Access token for authentication.
 * @param {string} startDate - Start date in DD-MM-YYYY format (local date).
 * @param {string} endDate - End date in DD-MM-YYYY format (local date).
 * @param {string} timezone - Optional timezone to filter by (default: per-job timezone).
 * @returns {Promise<{status: number, json: Object}>} Response object with status and JSON data.
 */
const calendarDaysEndpoint = async (token, startDate, endDate, timezone = null) => {
    logger.endpoint.start('CalendarDays', { startDate, endDate, timezone });
    
    const startTime = Date.now();

    // Validate inputs
    if (!token) {
        logger.endpoint.validation('CalendarDays', 'Missing access token');
        return { status: 401, json: { message: 'Missing access token' } };
    }
    if (!startDate || !endDate) {
        logger.endpoint.validation('CalendarDays', 'Missing startDate or endDate');
        return { status: 400, json: { message: 'Missing startDate or endDate' } };
    }

    // Convert DD-MM-YYYY to YYYY-MM-DD format for Date constructor
    const convertDateFormat = (dateStr) => {
        const [day, month, year] = dateStr.split('-');
        return `${year}-${month}-${day}`;
    };

    const startDateISO = convertDateFormat(startDate);
    const endDateISO = convertDateFormat(endDate);

    // Validate dates
    const start = new Date(startDateISO);
    const end = new Date(endDateISO);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        logger.endpoint.validation('CalendarDays', 'Invalid date format');
        return { status: 400, json: { message: 'Invalid date format' } };
    }

    logger.debug('VALIDATION', 'Date parsing', { 
        originalStart: startDate,
        originalEnd: endDate,
        convertedStart: startDateISO,
        convertedEnd: endDateISO,
        parsedStart: start.toISOString(), 
        parsedEnd: end.toISOString(),
        filterTimezone: timezone || 'per-job timezone'
    });
    
    if (start > end) {
        logger.endpoint.validation('CalendarDays', 'startDate cannot be after endDate');
        return { status: 400, json: { message: 'startDate cannot be after endDate' } };
    }

    let connection;
    try {
        // Authenticate user
        logger.debug('AUTH', 'Authenticating user with token');
        const userResponse = await getUserByToken(token);
        if (!userResponse || !userResponse.user) {
            logger.auth.tokenInvalid();
            return { status: 401, json: { message: 'Invalid access token' } };
        }
        
        const user = userResponse.user;
        logger.success('AUTH', `User authenticated successfully`, { userId: user.id });
        
        // Connect to database
        logger.debug('DATABASE', 'Establishing connection');
        const { connect } = require("../swiftDb");
        connection = await connect();
        logger.db.connect();

        // ✅ Récupérer les infos company de l'utilisateur pour déterminer la visibilité
        const [userCompanyInfo] = await connection.execute(
            'SELECT company_id, company_role FROM users WHERE id = ?',
            [user.id]
        );
        
        const userCompanyId = userCompanyInfo[0]?.company_id;
        const userCompanyRole = userCompanyInfo[0]?.company_role;
        
        // Patron/Cadre voient tous les jobs de leur company
        // Employee ne voit que ses jobs assignés
        const isManager = ['patron', 'cadre'].includes(userCompanyRole);
        
        logger.debug('VISIBILITY', `User visibility mode: ${isManager ? 'COMPANY (all jobs)' : 'PERSONAL (assigned only)'}`, {
            userId: user.id,
            companyId: userCompanyId,
            companyRole: userCompanyRole
        });

        // Calculate the range in days to determine detail level
        const rangeDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
        let detailLevel;
        
        if (rangeDays <= 2) {
            detailLevel = 'JOUR';
        } else if (rangeDays <= 32) {
            detailLevel = 'MOIS';
        } else {
            detailLevel = 'ANNÉE';
        }

        logger.debug('DETAIL_LEVEL', `Range: ${rangeDays} days, Level: ${detailLevel}`);

        /**
         * Helper function to check if a job falls within the date range in its LOCAL timezone
         * This is the key fix for the timezone filtering issue!
         */
        const jobMatchesDateRange = (job, startDateLocal, endDateLocal) => {
            const jobTimezone = job.timezone || 'Australia/Melbourne';
            
            // Convert job's UTC dates to local dates using the job's timezone
            const jobStartLocal = moment.utc(job.start_window_start).tz(jobTimezone);
            const jobEndLocal = job.start_window_end 
                ? moment.utc(job.start_window_end).tz(jobTimezone)
                : jobStartLocal;
            
            // Get just the date part (YYYY-MM-DD) in local timezone
            const jobStartDate = jobStartLocal.format('YYYY-MM-DD');
            const jobEndDate = jobEndLocal.format('YYYY-MM-DD');
            
            // Check if job overlaps with requested date range
            // A job matches if:
            // - Its start date is within range, OR
            // - Its end date is within range, OR
            // - It spans across the entire range
            const matchesStart = jobStartDate >= startDateLocal && jobStartDate <= endDateLocal;
            const matchesEnd = jobEndDate >= startDateLocal && jobEndDate <= endDateLocal;
            const spansRange = jobStartDate <= startDateLocal && jobEndDate >= endDateLocal;
            
            const matches = matchesStart || matchesEnd || spansRange;
            
            logger.debug('TIMEZONE_FILTER', `Job ${job.id} ${matches ? 'MATCHES' : 'EXCLUDED'}`, {
                jobTimezone,
                utcStart: job.start_window_start,
                localStartDate: jobStartDate,
                localEndDate: jobEndDate,
                requestedRange: `${startDateLocal} to ${endDateLocal}`,
                matches
            });
            
            return matches;
        };

        // Expand the date range by ±1 day to account for timezone differences (up to +14h offset)
        // This ensures we don't miss any jobs due to UTC vs local date differences
        const expandedStart = moment(startDateISO).subtract(1, 'day').format('YYYY-MM-DD');
        const expandedEnd = moment(endDateISO).add(1, 'day').format('YYYY-MM-DD');
        
        let sql;
        let params;
        
        // ✅ VISIBILITÉ BASÉE SUR LE RÔLE:
        // - Patron/Cadre (isManager=true): Voient TOUS les jobs de leur company
        // - Employee (isManager=false): Voit seulement ses jobs assignés via job_users
        
        if (detailLevel === 'JOUR') {
            // JOUR: Maximum detail with client and financial info
            if (isManager && userCompanyId) {
                // Manager: voir tous les jobs de la company
                sql = `
                    SELECT j.id, j.code, j.status, j.start_window_start, j.start_window_end, 
                           j.timezone,
                           j.contact_first_name, j.contact_last_name, j.contact_phone, j.created_at,
                           j.amount_total, j.payment_status,
                           j.assignment_status, j.contractee_company_id,
            jtransfers.requested_drivers,
            jtransfers.requested_offsiders,
            jtransfers.pricing_amount, jtransfers.pricing_type,
            jtransfers.preferred_truck_id, jtransfers.resource_note,
            jtransfers.hour_counting_type, jtransfers.delegated_role, jtransfers.delegated_role_label, jtransfers.vehicle_label,
            jtransfers.message AS transfer_message, j.contractor_company_id, c_contractee.name AS contractee_company_name, -- [PATCH] contractor_calendar
                           cl.first_name as client_first_name, cl.last_name as client_last_name, 
                           cl.phone as client_phone, cl.email as client_email,
                           cl.client_type as client_type, cl.status as client_status, cl.created_at as client_created_at,
                           GROUP_CONCAT(DISTINCT CONCAT(ja.type, '|', COALESCE(ja.street, ''), '|', COALESCE(ja.city, ''), '|', COALESCE(ja.zip, '')) SEPARATOR '###') as addresses,
                           GROUP_CONCAT(DISTINCT CONCAT(t.id, '|', t.license_plate, '|', COALESCE(t.name, ''), '|', COALESCE(t.capacity, ''), '|', COALESCE(jav.role, '')) SEPARATOR '###') as trucks
                    FROM jobs j
                    LEFT JOIN clients cl ON j.client_id = cl.id
                    LEFT JOIN job_addresses ja ON j.id = ja.job_id
                    LEFT JOIN job_assignments jav ON j.id = jav.job_id AND jav.resource_type = 'vehicle' AND jav.status = 'confirmed'
                    LEFT JOIN trucks t ON jav.resource_id = t.id
                    LEFT JOIN companies c_contractee ON c_contractee.id = j.contractee_company_id
                   
            LEFT JOIN job_transfers jtransfers ON jtransfers.job_id = j.id AND jtransfers.status IN ('pending', 'accepted', 'negotiating') WHERE (j.contractee_company_id = ? OR j.contractor_company_id = ?)
                      AND j.status NOT IN ('archived', 'deleted')
                      AND (
                        (DATE(j.start_window_start) BETWEEN ? AND ?)
                        OR (DATE(j.start_window_end) BETWEEN ? AND ?)
                        OR (DATE(j.start_window_start) <= ? AND DATE(j.start_window_end) >= ?)
                      )
                    GROUP BY j.id
                    ORDER BY j.start_window_start ASC
                `;
                params = [userCompanyId, userCompanyId, expandedStart, expandedEnd, expandedStart, expandedEnd, expandedStart, expandedEnd];
            } else {
                // Employee: voir seulement ses jobs assignés
                sql = `
                    SELECT j.id, j.code, j.status, j.start_window_start, j.start_window_end, 
                           j.timezone,
                           j.contact_first_name, j.contact_last_name, j.contact_phone, j.created_at,
                           j.amount_total, j.payment_status,
                           cl.first_name as client_first_name, cl.last_name as client_last_name, 
                           cl.phone as client_phone, cl.email as client_email,
                           cl.client_type as client_type, cl.status as client_status, cl.created_at as client_created_at,
                           GROUP_CONCAT(DISTINCT CONCAT(ja.type, '|', COALESCE(ja.street, ''), '|', COALESCE(ja.city, ''), '|', COALESCE(ja.zip, '')) SEPARATOR '###') as addresses,
                           GROUP_CONCAT(DISTINCT CONCAT(t.id, '|', t.license_plate, '|', COALESCE(t.name, ''), '|', COALESCE(t.capacity, ''), '|', COALESCE(jav.role, '')) SEPARATOR '###') as trucks
                    FROM jobs j
                    JOIN job_users ju ON j.id = ju.job_id
                    LEFT JOIN clients cl ON j.client_id = cl.id
                    LEFT JOIN job_addresses ja ON j.id = ja.job_id
                    LEFT JOIN job_assignments jav ON j.id = jav.job_id AND jav.resource_type = 'vehicle' AND jav.status = 'confirmed'
                    LEFT JOIN trucks t ON jav.resource_id = t.id
                    WHERE ju.user_id = ?
                      AND j.status NOT IN ('archived', 'deleted')
                      AND (
                        (DATE(j.start_window_start) BETWEEN ? AND ?)
                        OR (DATE(j.start_window_end) BETWEEN ? AND ?)
                        OR (DATE(j.start_window_start) <= ? AND DATE(j.start_window_end) >= ?)
                      )
                    GROUP BY j.id
                    ORDER BY j.start_window_start ASC
                `;
                params = [user.id, expandedStart, expandedEnd, expandedStart, expandedEnd, expandedStart, expandedEnd];
            }
        } else if (detailLevel === 'MOIS') {
            // MOIS: Medium detail with status and contact info
            if (isManager && userCompanyId) {
                sql = `
                    SELECT j.id, j.code, j.status, j.start_window_start, j.start_window_end, 
                           j.timezone,
                           j.contact_first_name, j.contact_last_name, j.contact_phone, j.created_at,
                           j.assignment_status, j.contractor_company_id -- [PATCH] contractor_calendar
                    FROM jobs j
                    WHERE (j.contractee_company_id = ? OR j.contractor_company_id = ?)
                      AND j.status NOT IN ('archived', 'deleted')
                      AND (
                        (DATE(j.start_window_start) BETWEEN ? AND ?)
                        OR (DATE(j.start_window_end) BETWEEN ? AND ?)
                        OR (DATE(j.start_window_start) <= ? AND DATE(j.start_window_end) >= ?)
                      )
                    ORDER BY j.start_window_start ASC
                `;
                params = [userCompanyId, userCompanyId, expandedStart, expandedEnd, expandedStart, expandedEnd, expandedStart, expandedEnd];
            } else {
                sql = `
                    SELECT j.id, j.code, j.status, j.start_window_start, j.start_window_end, 
                           j.timezone,
                           j.contact_first_name, j.contact_last_name, j.contact_phone, j.created_at
                    FROM jobs j
                    JOIN job_users ju ON j.id = ju.job_id
                    WHERE ju.user_id = ?
                      AND j.status NOT IN ('archived', 'deleted')
                      AND (
                        (DATE(j.start_window_start) BETWEEN ? AND ?)
                        OR (DATE(j.start_window_end) BETWEEN ? AND ?)
                        OR (DATE(j.start_window_start) <= ? AND DATE(j.start_window_end) >= ?)
                      )
                    ORDER BY j.start_window_start ASC
                `;
                params = [user.id, expandedStart, expandedEnd, expandedStart, expandedEnd, expandedStart, expandedEnd];
            }
        } else {
            // ANNÉE: Minimum detail - only essential info
            if (isManager && userCompanyId) {
                sql = `
                    SELECT j.id, j.code, j.start_window_start, j.start_window_end, j.timezone
                    FROM jobs j
                    WHERE (j.contractee_company_id = ? OR j.contractor_company_id = ?)
                      AND j.status NOT IN ('archived', 'deleted')
                      AND (
                        (DATE(j.start_window_start) BETWEEN ? AND ?)
                        OR (DATE(j.start_window_end) BETWEEN ? AND ?)
                        OR (DATE(j.start_window_start) <= ? AND DATE(j.start_window_end) >= ?)
                      )
                    ORDER BY j.start_window_start ASC
                `;
                params = [userCompanyId, userCompanyId, expandedStart, expandedEnd, expandedStart, expandedEnd, expandedStart, expandedEnd];
            } else {
                sql = `
                    SELECT j.id, j.code, j.start_window_start, j.start_window_end, j.timezone
                    FROM jobs j
                    JOIN job_users ju ON j.id = ju.job_id
                    WHERE ju.user_id = ?
                      AND j.status NOT IN ('archived', 'deleted')
                      AND (
                        (DATE(j.start_window_start) BETWEEN ? AND ?)
                        OR (DATE(j.start_window_end) BETWEEN ? AND ?)
                        OR (DATE(j.start_window_start) <= ? AND DATE(j.start_window_end) >= ?)
                      )
                    ORDER BY j.start_window_start ASC
                `;
                params = [user.id, expandedStart, expandedEnd, expandedStart, expandedEnd, expandedStart, expandedEnd];
            }
        }

        logger.db.query(`SELECT jobs for ${isManager ? 'company' : 'user'} in date range (${detailLevel} level)`, { 
            userId: user.id,
            companyId: userCompanyId,
            visibilityMode: isManager ? 'COMPANY' : 'PERSONAL',
            requestedRange: `${startDateISO} to ${endDateISO}`,
            expandedRange: `${expandedStart} to ${expandedEnd}`,
            detailLevel 
        });

        const [results] = await connection.execute(sql, params);
        
        logger.debug('QUERY_RESULTS', `Found ${results.length} jobs in expanded range, filtering by local timezone...`);

        // Close connection
        connection.release();
        logger.db.disconnect();

        // Filter results by LOCAL timezone date and map based on detail level
        const jobs = results
            .filter(row => jobMatchesDateRange(row, startDateISO, endDateISO))
            .map(row => {
                // Get timezone info for the job
                const jobTimezone = row.timezone || 'Australia/Melbourne';
                const localStart = moment.utc(row.start_window_start).tz(jobTimezone);
                const localEnd = row.start_window_end 
                    ? moment.utc(row.start_window_end).tz(jobTimezone)
                    : null;
                
                if (detailLevel === 'JOUR') {
                    // Parse addresses from GROUP_CONCAT
                    const addresses = [];
                    if (row.addresses) {
                        row.addresses.split('###').forEach(addr => {
                            const [type, street, city, zip] = addr.split('|');
                            if (type) {
                                addresses.push({ 
                                    type, 
                                    street: street || '', 
                                    city: city || '', 
                                    zip: zip || '' 
                                });
                            }
                        });
                    }

                    // Parse trucks from GROUP_CONCAT
                    const trucks = [];
                    if (row.trucks) {
                        row.trucks.split('###').forEach(truck => {
                            const [id, license_plate, name, capacity, role] = truck.split('|');
                            if (id) {
                                trucks.push({
                                    id: parseInt(id, 10),
                                    license_plate: license_plate || '',
                                    name: name || '',
                                    capacity: capacity || '',
                                    role: role || 'primary'
                                });
                            }
                        });
                    }

                    return {
                        id: row.id,
                        code: row.code,
                        status: row.status,
                        timezone: jobTimezone,
                        contact: {
                            firstName: row.contact_first_name,
                            lastName: row.contact_last_name,
                            phone: row.contact_phone
                        },
                        client: {
                            id: row.client_id,
                            firstName: row.client_first_name,
                            lastName: row.client_last_name,
                            fullName: `${row.client_first_name || ''} ${row.client_last_name || ''}`.trim(),
                            phone: row.client_phone,
                            email: row.client_email,
                            type: row.client_type,
                            status: row.client_status,
                            createdAt: row.client_created_at
                        },
                        addresses,
                        trucks,
                        financial: {
                            amount_total: row.amount_total,
                            payment_status: row.payment_status
                        },
                        // UTC dates (original)
                        start_window_start: row.start_window_start,
                        start_window_end: row.start_window_end,
                        // Local dates (converted)
                        local_start_window_start: localStart.format(),
                        local_start_window_end: localEnd ? localEnd.format() : null,
                        // Local date only (for calendar display)
                        local_date: localStart.format('YYYY-MM-DD'),
                        local_time: localStart.format('HH:mm'),
                        created_at: row.created_at,
                        // Contractor assignment info [PATCH]
                        assignment_status: row.assignment_status || 'none',
                        contractee: row.contractee_company_id ? {
                            company_id: row.contractee_company_id,
                            company_name: row.contractee_company_name || ''
                        } : null,
                        contractor: row.contractor_company_id ? {
                            company_id: row.contractor_company_id,
                            company_name: ''
                        } : null,
                        // Transfer details [PATCH]
                        requested_drivers: row.requested_drivers != null ? row.requested_drivers : null,
                        requested_offsiders: row.requested_offsiders != null ? row.requested_offsiders : null,
                        pricing_amount: row.pricing_amount != null ? row.pricing_amount : null, pricing_type: row.pricing_type || null,
                        transfer_message: row.transfer_message || null,
                        preferred_truck_id: row.preferred_truck_id != null ? row.preferred_truck_id : null,
                        resource_note: row.resource_note || null,
                        hour_counting_type: row.hour_counting_type || null,
                        delegated_role: row.delegated_role || null,
                        delegated_role_label: row.delegated_role_label || null,
                        vehicle_label: row.vehicle_label || null
                    };
                } else if (detailLevel === 'MOIS') {
                    return {
                        id: row.id,
                        code: row.code,
                        status: row.status,
                        timezone: jobTimezone,
                        contact_name: `${row.contact_first_name || ''} ${row.contact_last_name || ''}`.trim(),
                        contact_phone: row.contact_phone,
                        start_window_start: row.start_window_start,
                        start_window_end: row.start_window_end,
                        local_start_window_start: localStart.format(),
                        local_date: localStart.format('YYYY-MM-DD'),
                        local_time: localStart.format('HH:mm'),
                        created_at: row.created_at
                    };
                } else {
                    // ANNÉE level
                    return {
                        id: row.id,
                        code: row.code,
                        timezone: jobTimezone,
                        start_window_start: row.start_window_start,
                        start_window_end: row.start_window_end,
                        local_date: localStart.format('YYYY-MM-DD')
                    };
                }
            });

        const duration = Date.now() - startTime;
        logger.performance('CalendarDays query', duration);

        if (jobs.length === 0) {
            logger.info('CALENDAR', 'No jobs found for the given date range (after timezone filtering)', { 
                userId: user.id, 
                dateRange: `${startDate} to ${endDate}`, 
                detailLevel,
                rawResultsCount: results.length,
                filteredCount: 0
            });
            logger.endpoint.success('CalendarDays', { jobsFound: 0, duration: `${duration}ms`, detailLevel });
            return { 
                status: 200, 
                json: { 
                    jobs: [],
                    meta: {
                        detailLevel,
                        rangeDays,
                        totalJobs: 0,
                        requestedDateRange: {
                            from: startDateISO,
                            to: endDateISO
                        }
                    }
                } 
            };
        }

        logger.success('CALENDAR', `Retrieved ${jobs.length} jobs (filtered from ${results.length} by timezone)`, { 
            userId: user.id, 
            jobsCount: jobs.length, 
            detailLevel 
        });
        logger.endpoint.success('CalendarDays', { jobsFound: jobs.length, duration: `${duration}ms`, detailLevel });

        return { 
            status: 200, 
            json: { 
                jobs,
                meta: {
                    detailLevel,
                    rangeDays,
                    totalJobs: jobs.length,
                    requestedDateRange: {
                        from: startDateISO,
                        to: endDateISO
                    }
                }
            } 
        };

    } catch (error) {
        const duration = Date.now() - startTime;
        logger.db.error(error);
        logger.endpoint.error('CalendarDays', { error: error.message, duration: `${duration}ms` });
        if (connection) await connection.release();
        return { status: 500, json: { message: 'Internal server error' } };
    }
};

module.exports = { calendarDaysEndpoint };
