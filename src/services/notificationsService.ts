/**
 * NotificationsService - Gestion des notifications automatiques
 * Génère des notifications basées sur les événements de l'app
 * 
 * @author Romain Giovanni - Slashforyou
 * @created 16/01/2026
 */

import { NotificationType } from '../context/NotificationsProvider';

// ========================================
// Types
// ========================================

export interface NotificationTemplate {
    title: string;
    message: string;
    type: NotificationType;
}

// ========================================
// Templates de notifications
// ========================================

export const NotificationTemplates = {
    // Jobs
    jobAssigned: (jobId: string): NotificationTemplate => ({
        title: 'Nouveau job assigné',
        message: `Le job #${jobId} vous a été assigné`,
        type: 'job',
    }),
    
    jobStartingSoon: (jobId: string, time: string): NotificationTemplate => ({
        title: 'Job bientôt',
        message: `Le job #${jobId} commence dans ${time}`,
        type: 'reminder',
    }),
    
    jobCompleted: (jobId: string): NotificationTemplate => ({
        title: 'Job terminé',
        message: `Le job #${jobId} a été marqué comme complété`,
        type: 'job',
    }),
    
    // Gamification
    xpGained: (amount: number, reason: string): NotificationTemplate => ({
        title: `+${amount} XP !`,
        message: reason,
        type: 'bonus',
    }),
    
    levelUp: (newLevel: number): NotificationTemplate => ({
        title: `🎉 Niveau ${newLevel} !`,
        message: `Félicitations ! Vous êtes passé au niveau ${newLevel}`,
        type: 'bonus',
    }),
    
    badgeUnlocked: (badgeName: string): NotificationTemplate => ({
        title: 'Nouveau badge débloqué !',
        message: `Vous avez obtenu le badge "${badgeName}"`,
        type: 'bonus',
    }),
    
    streakMilestone: (days: number): NotificationTemplate => ({
        title: `🔥 ${days} jours de suite !`,
        message: `Vous maintenez votre série depuis ${days} jours`,
        type: 'bonus',
    }),
    
    // Paiements
    paymentReceived: (amount: string): NotificationTemplate => ({
        title: 'Paiement reçu',
        message: `Vous avez reçu ${amount}`,
        type: 'payment',
    }),
    
    paymentPending: (jobId: string): NotificationTemplate => ({
        title: 'Paiement en attente',
        message: `Le paiement pour le job #${jobId} est en attente`,
        type: 'payment',
    }),
    
    // Appels
    missedCall: (callerName: string): NotificationTemplate => ({
        title: 'Appel manqué',
        message: `Vous avez manqué un appel de ${callerName}`,
        type: 'call',
    }),
    
    // Système
    welcomeBack: (): NotificationTemplate => ({
        title: 'Bon retour ! 👋',
        message: 'Vous avez des jobs à venir cette semaine',
        type: 'system',
    }),
    
    appUpdate: (version: string): NotificationTemplate => ({
        title: 'Mise à jour disponible',
        message: `La version ${version} est disponible`,
        type: 'system',
    }),
    
    maintenanceScheduled: (date: string): NotificationTemplate => ({
        title: 'Maintenance prévue',
        message: `Une maintenance est prévue le ${date}`,
        type: 'system',
    }),
};

// ========================================
// Notifications de démonstration
// ========================================

export const getDemoNotifications = (): NotificationTemplate[] => [
    NotificationTemplates.jobAssigned('JOB-2026-001'),
    NotificationTemplates.xpGained(50, 'Livraison parfaite et ponctuelle'),
    NotificationTemplates.jobStartingSoon('JOB-2026-002', '30 minutes'),
    NotificationTemplates.paymentReceived('150,00 €'),
    NotificationTemplates.welcomeBack(),
];

// ========================================
// Export par défaut
// ========================================

export default {
    templates: NotificationTemplates,
    getDemoNotifications,
};
