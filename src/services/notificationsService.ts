/**
 * NotificationsService - Gestion des notifications automatiques
 * Génère des notifications basées sur les événements de l'app
 *
 * @author Romain Giovanni - Slashforyou
 * @created 16/01/2026
 */

import { NotificationType } from "../context/NotificationsProvider";

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
    title: "Nouveau job assigné",
    message: `Le job #${jobId} vous a été assigné`,
    type: "job",
  }),

  jobStartingSoon: (jobId: string, time: string): NotificationTemplate => ({
    title: "Job bientôt",
    message: `Le job #${jobId} commence dans ${time}`,
    type: "reminder",
  }),

  jobCompleted: (jobId: string): NotificationTemplate => ({
    title: "Job terminé",
    message: `Le job #${jobId} a été marqué comme complété`,
    type: "job",
  }),

  // Gamification
  xpGained: (amount: number, reason: string): NotificationTemplate => ({
    title: `+${amount} XP !`,
    message: reason,
    type: "bonus",
  }),

  levelUp: (newLevel: number): NotificationTemplate => ({
    title: `🎉 Niveau ${newLevel} !`,
    message: `Félicitations ! Vous êtes passé au niveau ${newLevel}`,
    type: "bonus",
  }),

  badgeUnlocked: (badgeName: string): NotificationTemplate => ({
    title: "Nouveau badge débloqué !",
    message: `Vous avez obtenu le badge "${badgeName}"`,
    type: "bonus",
  }),

  streakMilestone: (days: number): NotificationTemplate => ({
    title: `🔥 ${days} jours de suite !`,
    message: `Vous maintenez votre série depuis ${days} jours`,
    type: "bonus",
  }),

  // Paiements
  paymentReceived: (amount: string): NotificationTemplate => ({
    title: "Paiement reçu",
    message: `Vous avez reçu ${amount}`,
    type: "payment",
  }),

  paymentPending: (jobId: string): NotificationTemplate => ({
    title: "Paiement en attente",
    message: `Le paiement pour le job #${jobId} est en attente`,
    type: "payment",
  }),

  // Appels
  missedCall: (callerName: string): NotificationTemplate => ({
    title: "Appel manqué",
    message: `Vous avez manqué un appel de ${callerName}`,
    type: "call",
  }),

  // Délégation de job (transferts B2B)
  transferSent: (recipientName: string): NotificationTemplate => ({
    title: "Délégation envoyée",
    message: `${recipientName} a reçu votre demande de délégation`,
    type: "job",
  }),
  transferAccepted: (
    jobId: string,
    recipientName: string,
  ): NotificationTemplate => ({
    title: "\u2705 Délégation acceptée",
    message: `${recipientName} a accepté le job #${jobId}`,
    type: "job",
  }),
  transferDeclined: (
    jobId: string,
    recipientName: string,
    reason?: string,
  ): NotificationTemplate => ({
    title: "\u274c Délégation refusée",
    message: reason
      ? `${recipientName} a refusé le job #${jobId} : "${reason}"`
      : `${recipientName} a refusé le job #${jobId}`,
    type: "job",
  }),
  transferCancelled: (jobId: string): NotificationTemplate => ({
    title: "Délégation annulée",
    message: `La délégation pour le job #${jobId} a été annulée par l\'émetteur`,
    type: "job",
  }),
  transferReceived: (
    jobId: string,
    senderName: string,
    role: string,
  ): NotificationTemplate => ({
    title: "\ud83d\udce9 Nouveau job \u00e0 accepter",
    message: `${senderName} vous délègue le rôle "${role}" sur le job #${jobId}`,
    type: "job",
  }),

  appUpdate: (version: string): NotificationTemplate => ({
    title: "Mise à jour disponible",
    message: `La version ${version} est disponible`,
    type: "system",
  }),

  maintenanceScheduled: (date: string): NotificationTemplate => ({
    title: "Maintenance prévue",
    message: `Une maintenance est prévue le ${date}`,
    type: "system",
  }),
};

// ========================================
// Export par défaut
// ========================================

export default {
  templates: NotificationTemplates,
};
