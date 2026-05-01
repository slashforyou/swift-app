const { connect } = require('../../swiftDb');

/**
 * Endpoint pour lister les notifications d'un utilisateur
 * 
 * @route GET /swift-app/v1/notifications
 * @auth Requis - Token utilisateur
 * @query {string} status - Filtrer par statut (unread, read, archived)
 * @query {string} type - Filtrer par type
 * @query {number} limit - Nombre maximum de notifications (défaut: 50)
 * @query {number} offset - Décalage pour la pagination (défaut: 0)
 * @query {string} sort - Tri (newest, oldest, priority) (défaut: newest)
 * @returns {Object} Liste des notifications
 */
const listNotificationsEndpoint = async (req, res) => {
  console.log('[ List Notifications ]', { 
    method: req.method, 
    url: req.originalUrl, 
    query: req.query,
    userId: req.user?.id 
  });

  let connection;

  try {
    const {
      status,
      type,
      limit = 50,
      offset = 0,
      sort = 'newest'
    } = req.query;

    // Pour cet exemple, on utilise un user_id depuis le token (à adapter selon votre auth)
    const userId = req.user?.id; // Fallback pour les tests

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    connection = await connect();

    // Construction de la requête WHERE
    let whereConditions = ['n.user_id = ?'];
    let queryParams = [userId];

    if (status) {
      whereConditions.push('n.status = ?');
      queryParams.push(status);
    }

    if (type) {
      whereConditions.push('n.type = ?');
      queryParams.push(type);
    }

    // Exclure les notifications expirées (sauf si elles sont archivées)
    whereConditions.push('(n.expires_at IS NULL OR n.expires_at > NOW() OR n.status = "archived")');

    // Construction de l'ordre de tri
    let orderBy = 'n.created_at DESC'; // Par défaut: plus récent en premier
    
    if (sort === 'oldest') {
      orderBy = 'n.created_at ASC';
    } else if (sort === 'priority') {
      orderBy = `
        CASE n.priority 
          WHEN 'urgent' THEN 1 
          WHEN 'high' THEN 2 
          WHEN 'normal' THEN 3 
          WHEN 'low' THEN 4 
        END ASC, 
        n.created_at DESC
      `;
    }

    // Récupérer les notifications
    const query = `
      SELECT 
        n.*,
        j.code as job_code,
        t.license_plate as truck_plate,
        CONCAT(c.first_name, ' ', c.last_name) as client_name
      FROM notifications n
      LEFT JOIN jobs j ON n.job_id = j.id
      LEFT JOIN trucks t ON n.truck_id = t.id
      LEFT JOIN clients c ON n.client_id = c.id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `;

    queryParams.push(parseInt(limit), parseInt(offset));

    const [notifications] = await connection.execute(query, queryParams);

    // Récupérer le nombre total pour la pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM notifications n
      WHERE ${whereConditions.join(' AND ')}
    `;

    const [countResult] = await connection.execute(countQuery, queryParams.slice(0, -2));
    const total = countResult[0].total;

    // Récupérer les statistiques
    const [stats] = await connection.execute(`
      SELECT 
        COUNT(*) as total_notifications,
        SUM(CASE WHEN status = 'unread' THEN 1 ELSE 0 END) as unread_count,
        SUM(CASE WHEN status = 'read' THEN 1 ELSE 0 END) as read_count,
        SUM(CASE WHEN status = 'archived' THEN 1 ELSE 0 END) as archived_count,
        SUM(CASE WHEN priority = 'urgent' THEN 1 ELSE 0 END) as urgent_count,
        SUM(CASE WHEN priority = 'high' THEN 1 ELSE 0 END) as high_count
      FROM notifications 
      WHERE user_id = ? AND (expires_at IS NULL OR expires_at > NOW() OR status = 'archived')
    `, [userId]);

    // Formater les notifications
    const formattedNotifications = notifications.map(notif => ({
      id: notif.id,
      type: notif.type,
      title: notif.title,
      content: notif.content,
      status: notif.status,
      priority: notif.priority,
      job: notif.job_id ? {
        id: notif.job_id,
        code: notif.job_code
      } : null,
      truck: notif.truck_id ? {
        id: notif.truck_id,
        plate: notif.truck_plate
      } : null,
      client: notif.client_id ? {
        id: notif.client_id,
        name: notif.client_name
      } : null,
      createdAt: notif.created_at,
      updatedAt: notif.updated_at,
      readAt: notif.read_at,
      archivedAt: notif.archived_at,
      expiresAt: notif.expires_at,
      metadata: notif.metadata ? JSON.parse(notif.metadata) : null
    }));

    return res.json({
      success: true,
      message: 'Notifications récupérées avec succès',
      data: {
        notifications: formattedNotifications,
        pagination: {
          total,
          count: notifications.length,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: (parseInt(offset) + notifications.length) < total
        },
        statistics: {
          total: stats[0].total_notifications,
          unread: stats[0].unread_count,
          read: stats[0].read_count,
          archived: stats[0].archived_count,
          urgent: stats[0].urgent_count,
          high: stats[0].high_count
        }
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des notifications:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur lors de la récupération des notifications'
    });
  } finally {
    if (connection) {
      await connection.release();
    }
  }
};

module.exports = { listNotificationsEndpoint };