/**
 * useAppPermissions - Hook central de gestion des permissions
 * Source de vérité unique pour toutes les vérifications d'accès de l'app.
 *
 * DEUX COUCHES DE PERMISSIONS :
 *
 *  1. User-level (rôle global dans l'entreprise) :
 *     isPatron, isManager, canCreateJob, canViewAllJobs…
 *     → Dérivé du `company_role` stocké dans SecureStore au login.
 *
 *  2. Job-level (contexte d'un job précis) :
 *     canEdit, canDelete, canAssignResources, canRespondTransfer…
 *     → Dérivé des `job.permissions` retournées par l'API (getJobDetails).
 *     → Utilisé via la méthode `forJob(job.permissions)`.
 *
 * USAGE :
 *   const perms = useAppPermissions();
 *
 *   // Permissions global (niveau utilisateur)
 *   {perms.canCreateJob && <CreateJobButton />}
 *   {perms.isManager && <ManagementPanel />}
 *
 *   // Permissions contextuelles (niveau job)
 *   const jp = perms.forJob(job.permissions);
 *   {jp.canEdit && <EditButton />}
 *   {jp.canAssignResources && <ResourcesButton />}
 *   {jp.canRespondTransfer && <AcceptDeclinePanel />}
 */

import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useState } from "react";
import type { CompanyRole } from "../services/user";

// ─── Types ────────────────────────────────────────────────────────────────────

/** Données utilisateur telles qu'elles sont stockées dans SecureStore au login */
interface StoredUser {
  id?: number;
  email?: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  company_id?: number;
  company_role?: CompanyRole;
  company?: { id: number; name: string } | null;
}

/**
 * Permissions contextuelles d'un job.
 * Correspond exactement au champ `permissions` dans le type Job (services/jobs.ts).
 * Tous les champs sont optionnels pour être compatible avec n'importe quel état partiel.
 */
export interface JobPermissionInput {
  is_owner?: boolean;
  is_contractee?: boolean;
  is_contractor?: boolean;
  is_assigned?: boolean;
  can_accept?: boolean;
  can_decline?: boolean;
  can_start?: boolean;
  can_complete?: boolean;
  can_edit?: boolean;
  can_delete?: boolean;
  can_create_transfer?: boolean;
  can_cancel_transfer?: boolean;
  can_respond_transfer?: boolean;
  can_assign_resources?: boolean;
}

/**
 * Gates résolues pour un job — booleans propres à utiliser dans les composants.
 * Toutes les valeurs sont garanties non-nullables.
 */
export interface JobPermissionGates {
  // Identité vis-à-vis du job
  isOwner: boolean; // Job interne (même entreprise)
  isContractee: boolean; // Viewer = créateur/donneur du job
  isContractor: boolean; // Viewer = exécutant/receveur du job
  isAssigned: boolean; // Viewer est assigné à ce job

  // Actions sur le job lui-même
  canEdit: boolean;
  canDelete: boolean;
  canStart: boolean;
  canComplete: boolean;
  canAccept: boolean;
  canDecline: boolean;

  // Transferts B2B
  canCreateTransfer: boolean;
  canCancelTransfer: boolean;
  canRespondTransfer: boolean;

  // Ressources (équipe & véhicule)
  canAssignResources: boolean;
}

/** Retour complet du hook useAppPermissions */
export interface AppPermissions {
  /** Vrai dès que les données SecureStore ont été lues */
  isLoaded: boolean;

  // ── Identité ──
  userId: number | null;
  companyId: number | null;
  companyRole: CompanyRole | null;
  companyName: string | null;

  // ── Rôles company ──
  isPatron: boolean; // Propriétaire (patron)
  isManager: boolean; // Patron OU cadre — peut créer/gérer des jobs
  isCadre: boolean; // Cadre uniquement
  isEmployee: boolean; // Employé (accès restreint)

  // ── Gates globales (indépendantes d'un job) ──
  canCreateJob: boolean; // Peut créer un nouveau job
  canViewAllJobs: boolean; // Voit tous les jobs de l'entreprise (vs. seulement les siens)
  canManageTeam: boolean; // Peut gérer les membres de l'équipe
  canViewReports: boolean; // Accès aux rapports / statistiques

  // ── Gates contextuelles par job ──
  /**
   * Résout les permissions d'un job spécifique en booleans propres.
   * Passer `job.permissions` directement.
   * Retourne toutes les gates à `false` si aucune permission n'est fournie.
   *
   * @example
   * const jp = perms.forJob(job.permissions);
   * {jp.canEdit && <EditButton />}
   */
  forJob: (permissions?: JobPermissionInput | null) => JobPermissionGates;

  /** Recharge les données utilisateur depuis SecureStore (utile après re-login) */
  reload: () => Promise<void>;
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const SECURE_STORE_KEY = "user_data";

/** Valeur par défaut quand aucune permission job n'est disponible → tout fermé */
const CLOSED_JOB_GATES: JobPermissionGates = {
  isOwner: false,
  isContractee: false,
  isContractor: false,
  isAssigned: false,
  canEdit: false,
  canDelete: false,
  canStart: false,
  canComplete: false,
  canAccept: false,
  canDecline: false,
  canCreateTransfer: false,
  canCancelTransfer: false,
  canRespondTransfer: false,
  canAssignResources: false,
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAppPermissions(): AppPermissions {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // ── Chargement depuis SecureStore ─────────────────────────────────────────

  const load = useCallback(async () => {
    try {
      const raw = await SecureStore.getItemAsync(SECURE_STORE_KEY);
      setUser(raw ? (JSON.parse(raw) as StoredUser) : null);
    } catch (e) {
      setUser(null);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ── Dérivés rôle ──────────────────────────────────────────────────────────

  const companyRole = user?.company_role ?? null;

  const isPatron = companyRole === "patron";
  const isCadre = companyRole === "cadre";
  const isEmployee = companyRole === "employee";
  const isManager = isPatron || isCadre;

  // Si aucun rôle n'est encore chargé → comportement permissif (dev / premier rendu)
  const noRole = companyRole === null;

  const canCreateJob = noRole || isManager;
  const canViewAllJobs = noRole || isManager;
  const canManageTeam = noRole || isManager;
  const canViewReports = noRole || isManager;

  // ── forJob ────────────────────────────────────────────────────────────────

  const forJob = useCallback(
    (permissions?: JobPermissionInput | null): JobPermissionGates => {
      if (!permissions) return CLOSED_JOB_GATES;

      return {
        isOwner: permissions.is_owner ?? false,
        isContractee: permissions.is_contractee ?? false,
        isContractor: permissions.is_contractor ?? false,
        isAssigned: permissions.is_assigned ?? false,

        canEdit: permissions.can_edit ?? false,
        canDelete: permissions.can_delete ?? false,
        canStart: permissions.can_start ?? false,
        canComplete: permissions.can_complete ?? false,
        canAccept: permissions.can_accept ?? false,
        canDecline: permissions.can_decline ?? false,

        canCreateTransfer: permissions.can_create_transfer ?? false,
        canCancelTransfer: permissions.can_cancel_transfer ?? false,
        canRespondTransfer: permissions.can_respond_transfer ?? false,

        canAssignResources: permissions.can_assign_resources ?? false,
      };
    },
    [],
  );

  // ── Retour ────────────────────────────────────────────────────────────────

  return {
    isLoaded,

    userId: user?.id ?? null,
    companyId: user?.company_id ?? null,
    companyRole,
    companyName: user?.company?.name ?? null,

    isPatron,
    isManager,
    isCadre,
    isEmployee,

    canCreateJob,
    canViewAllJobs,
    canManageTeam,
    canViewReports,

    forJob,
    reload: load,
  };
}
