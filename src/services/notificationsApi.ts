/**
 * notificationsApi.ts - Service API pour les notifications
 * Connecte l'app aux endpoints /swift-app/v1/notifications du serveur
 *
 * @author Romain Giovanni - Slashforyou
 */
import { ServerData } from '../constants/ServerData';
import { authenticatedFetch } from '../utils/auth';
import type { AppNotification, NotificationType } from '../context/NotificationsProvider';

const API = ServerData.serverUrl;

// ========================================
// Types serveur → app
// ========================================

export interface ServerNotification {
    id: number;
    type: 'info' | 'warning' | 'error' | 'success' | 'job_update' | 'truck_assignment' | 'payment' | 'system';
    title: string;
    content: string;
    status: 'unread' | 'read' | 'archived';
    priority: 'low' | 'normal' | 'high' | 'urgent';
    job?: { id: number; code: string } | null;
    truck?: { id: number; plate: string } | null;
    client?: { id: number; name: string } | null;
    createdAt: string;
    updatedAt: string;
    readAt?: string | null;
    archivedAt?: string | null;
    expiresAt?: string | null;
    metadata?: Record<string, any> | null;
}

export interface NotificationsResponse {
    notifications: ServerNotification[];
    pagination: {
        total: number;
        count: number;
        limit: number;
        offset: number;
        hasMore: boolean;
    };
    statistics: {
        total: number;
        unread: number;
        read: number;
        archived: number;
        urgent: number;
        high: number;
    };
}

// ========================================
// Mapping type serveur → type app
// ========================================

const mapServerType = (serverType: ServerNotification['type']): NotificationType => {
    switch (serverType) {
        case 'job_update':
        case 'truck_assignment':
            return 'job';
        case 'payment':
            return 'payment';
        case 'success':
            return 'bonus';
        case 'system':
        case 'info':
        case 'warning':
        case 'error':
        default:
            return 'system';
    }
};

// ========================================
// Conversion notification serveur → AppNotification
// ========================================

export const mapServerNotification = (n: ServerNotification): AppNotification => ({
    id: `server-${n.id}`,
    title: n.title,
    message: n.content,
    type: mapServerType(n.type),
    isRead: n.status !== 'unread',
    createdAt: new Date(n.createdAt),
    data: {
        serverId: n.id,
        serverStatus: n.status,
        serverType: n.type,
        priority: n.priority,
        job: n.job ?? null,
        truck: n.truck ?? null,
        client: n.client ?? null,
        metadata: n.metadata ?? null,
    },
});

// ========================================
// API calls
// ========================================

/**
 * Récupère les notifications du serveur
 */
export const fetchNotifications = async (params?: {
    status?: 'unread' | 'read' | 'archived';
    limit?: number;
    offset?: number;
    sort?: 'newest' | 'oldest' | 'priority';
}): Promise<NotificationsResponse> => {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.limit !== undefined) query.append('limit', String(params.limit));
    if (params?.offset !== undefined) query.append('offset', String(params.offset));
    if (params?.sort) query.append('sort', params.sort);

    const url = `${API}/swift-app/v1/notifications${query.toString() ? `?${query}` : ''}`;
    const response = await authenticatedFetch(url);

    if (!response.ok) {
        throw new Error(`fetchNotifications: HTTP ${response.status}`);
    }

    const json = await response.json();
    if (!json.success) {
        throw new Error(`fetchNotifications: ${json.error || 'Unknown error'}`);
    }

    return json.data as NotificationsResponse;
};

/**
 * Marque une notification comme lue
 */
export const markNotificationRead = async (serverId: number): Promise<void> => {
    const url = `${API}/swift-app/v1/notifications/${serverId}`;
    const response = await authenticatedFetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'read' }),
    });

    if (!response.ok) {
        throw new Error(`markNotificationRead: HTTP ${response.status}`);
    }
};

/**
 * Marque toutes les notifications comme lues
 */
export const markAllNotificationsReadApi = async (): Promise<void> => {
    const url = `${API}/swift-app/v1/notifications/mark-all-read`;
    const response = await authenticatedFetch(url, { method: 'PATCH' });

    if (!response.ok) {
        throw new Error(`markAllNotificationsRead: HTTP ${response.status}`);
    }
};

/**
 * Supprime une notification
 */
export const deleteNotificationApi = async (serverId: number): Promise<void> => {
    const url = `${API}/swift-app/v1/notifications/${serverId}`;
    const response = await authenticatedFetch(url, { method: 'DELETE' });

    if (!response.ok) {
        throw new Error(`deleteNotification: HTTP ${response.status}`);
    }
};
