/**
 * JobDetails - Écran principal des détails de tâche
 * Architecture moderne avec gestion correcte des Safe Areas et marges
 *
 * ⚠️ Utilise JobStepsConfig.ts comme source unique de vérité pour les steps
 */
import Ionicons from "@react-native-vector-icons/ionicons";
import React, { useCallback, useRef, useState } from "react";
import { Alert, Modal, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import JobDetailsHeader from "../components/jobDetails/JobDetailsHeader";
import { JobAssignmentActions, JobOwnershipBanner } from "../components/jobs";
import ContracteeNegotiationModal from "../components/jobs/ContracteeNegotiationModal";
import AssignStaffModal from "../components/modals/AssignStaffModal";
import DelegateJobWizard from "../components/modals/DelegateJobWizard";
import EditJobModal from "../components/modals/EditJobModal";
import HeaderLogo from "../components/ui/HeaderLogo";
import TabMenu from "../components/ui/TabMenu";
import Toast from "../components/ui/toastNotification";
import {
    DEFAULT_STEPS,
    generateStepsFromAddresses,
} from "../constants/JobStepsConfig";
import { DESIGN_TOKENS } from "../constants/Styles";
import { JobStateProvider } from "../context/JobStateProvider";
import { JobTimerProvider } from "../context/JobTimerProvider";
import { useOnboardingTarget } from "../context/OnboardingSpotlightContext";
import { useOnboardingTour } from "../context/OnboardingTourContext";
import { useTheme } from "../context/ThemeProvider";
import { useJobDetails } from "../hooks/useJobDetails";
import { useJobNotes } from "../hooks/useJobNotes";
import { usePerformanceMetrics } from "../hooks/usePerformanceMetrics";
import { useLocalization } from "../localization/useLocalization";
import { analytics } from "../services/analytics";
import {
    assignStaffToJob,
    getJobCrew,
    removeCrewMember,
} from "../services/crewService";
import {
    filterServerCorrectableIssues,
    requestServerCorrection,
} from "../services/jobCorrection";
import {
    acceptJob,
    acceptStaffAssignment,
    declineJob,
    declineStaffAssignment,
    deleteJob,
    updateJob as updateJobAPI,
    UpdateJobRequest,
} from "../services/jobs";
import { useAuthCheck } from "../utils/checkAuth";
import {
    formatValidationReport,
    validateJobConsistency,
} from "../utils/jobValidation";
import CreateStorageLotModal from "./business/CreateStorageLotModal";
import JobClient from "./JobDetailsScreens/client";
import JobPage from "./JobDetailsScreens/job";
import JobNote from "./JobDetailsScreens/note";
import PaymentScreen from "./JobDetailsScreens/payment";
import JobSummary from "./JobDetailsScreens/summary";

// Types et interfaces
interface JobDetailsProps {
  route?: any;
  navigation: any;
  jobId?: string;
  day?: string;
  month?: string;
  year?: string;
}

interface ToastState {
  message: string;
  type: "info" | "success" | "error";
  status: boolean;
}

/**
 * Merge les données client de façon intelligente
 * Ne remplace un champ que s'il a une vraie valeur (non null, non vide)
 */
const mergeClientData = (
  prevClient: any,
  apiClient: any,
  jobData: any,
): any => {
  // Helper: retourne la valeur si elle est "vraie" (non null, non undefined, non vide)
  const getValidValue = (...sources: any[]) => {
    for (const val of sources) {
      if (val !== null && val !== undefined && val !== "" && val !== "N/A") {
        return val;
      }
    }
    return null;
  };

  const firstName =
    getValidValue(
      apiClient?.firstName,
      jobData?.client_first_name,
      prevClient?.firstName,
    ) || "Client";

  const lastName =
    getValidValue(
      apiClient?.lastName,
      jobData?.client_last_name,
      prevClient?.lastName,
    ) || "";

  const phone =
    getValidValue(apiClient?.phone, jobData?.client_phone, prevClient?.phone) ||
    "N/A";

  const email =
    getValidValue(apiClient?.email, jobData?.client_email, prevClient?.email) ||
    "N/A";

  const name = getValidValue(
    apiClient?.name,
    apiClient?.fullName,
    prevClient?.name,
    // Construire le nom si firstName et lastName existent
    firstName && lastName && firstName !== "Client"
      ? `${firstName} ${lastName}`.trim()
      : null,
  );

  const type = getValidValue(apiClient?.type, prevClient?.type) || "Client";

  return {
    firstName,
    lastName,
    phone,
    email,
    name,
    type,
  };
};

// Hook personnalisé pour les toasts
const useToast = () => {
  const [toastDetails, setToastDetails] = useState<ToastState>({
    message: "",
    type: "info",
    status: false,
  });

  const showToast = (message: string, type: "info" | "success" | "error") => {
    setToastDetails({ message, type, status: true });
    setTimeout(() => {
      setToastDetails({ message: "", type: "info", status: false });
    }, 3000);
  };

  return { toastDetails, showToast };
};

const JobDetails: React.FC<JobDetailsProps> = ({
  route,
  navigation,
  jobId,
  day,
  month,
  year,
}) => {
  const insets = useSafeAreaInsets();
  const { toastDetails, showToast } = useToast();
  const { colors } = useTheme();
  const { t } = useLocalization();
  const { isLoading: authLoading, LoadingComponent } = useAuthCheck(
    navigation,
    t("common.checkingAuth"),
  );

  // 📊 Performance monitoring
  const perf = usePerformanceMetrics("JobDetails");

  // Récupération de l'ID du job depuis les paramètres de route ou props
  const actualJobId = route?.params?.jobId || jobId || route?.params?.id;
  const initialTab = route?.params?.initialTab;
  // Origine de la navigation (pour le bouton retour quand la pile est vide,
  // ex: ouverture via deep-link ou notification push).
  const fromRoute = route?.params?.from as
    | string
    | [string, Record<string, any> | undefined]
    | undefined;

  // Hook principal pour les données du job
  const {
    jobDetails,
    isLoading: jobLoading,
    error,
    refreshJobDetails,
    addNote,
    startJob,
    pauseJob,
    resumeJob,
    completeJob,
    isUpdating,
    isAddingNote,
    isPerformingAction,
    isSessionExpired,
  } = useJobDetails(actualJobId);

  // Hook pour les notes avec compteur de non lues
  // Utiliser jobDetails?.job?.id (ID numérique) au lieu de actualJobId (code du job)
  const numericJobId = jobDetails?.job?.id || actualJobId;
  const { unreadCount, markAllAsRead } = useJobNotes(numericJobId);

  // États locaux pour l'UI et données adaptées des vraies données API
  const [job, setJob] = useState<any>({
    id: actualJobId || "#LM0000000001",
    code: actualJobId || "#LM0000000001", // Ajouter le code dans la structure par défaut
    signatureDataUrl: "",
    signatureFileUri: "",
    step: {
      actualStep: 0, // ✅ Commence à 0 (job pas démarré)
      steps: [
        {
          id: 1,
          name: t("jobDetails.steps.pickup"),
          description: t("jobDetails.steps.pickupDescription"),
        },
        {
          id: 2,
          name: t("jobDetails.steps.intermediate"),
          description: t("jobDetails.steps.intermediateDescription"),
        },
        {
          id: 3,
          name: t("jobDetails.steps.dropoff"),
          description: t("jobDetails.steps.dropoffDescription"),
        },
      ],
    },
    // ✅ Steps dynamiques depuis JobStepsConfig (source unique de vérité)
    steps: DEFAULT_STEPS,
    client: {
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      type: "",
    },
    contact: {
      firstName: "",
      lastName: "",
      phone: "",
    },
    addresses: [],
    time: {
      startWindowStart: "",
      startWindowEnd: "",
      endWindowStart: "",
      endWindowEnd: "",
    },
    truck: {
      licensePlate: "",
      name: "",
    },
    notes: [],
    payment: {
      status: "unsettled",
      amount: "0.00",
      amountWithoutTax: "0.00",
      amountPaid: "0.00",
      amountToBePaid: "0.00",
      taxe: {
        gst: "0.00",
        gstRate: 10,
        amountWithoutTax: "0.00",
      },
      currency: "AUD",
      dueDate: "",
      paymentMethod: "",
      transactionId: "",
      paymentLink: "",
      paymentTime: "",
      paymentDetails: "",
      savedCards: [],
    },
    items: [],
    contractor: null,
    contractee: null,
    assignment_status: null as string | null,
    permissions: null as null | {
      can_accept?: boolean;
      can_decline?: boolean;
      can_respond_transfer?: boolean;
    },
    staff_assignment_status: null as string | null,
    active_transfer: null as null | { status: string; [key: string]: unknown },
  });

  // State for Edit Job Modal
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  // State for Assign Staff Modal
  const [isAssignStaffModalVisible, setIsAssignStaffModalVisible] =
    useState(false);

  // State for Delegate Job Wizard
  const [isDelegateWizardVisible, setIsDelegateWizardVisible] = useState(false);
  const [wizardInitialMode, setWizardInitialMode] = useState<
    "resources" | "delegate_part" | "delegate_full" | undefined
  >(undefined);

  // State for Contractee Negotiation Modal (réponse à une contre-proposition)
  const [isNegotiationModalVisible, setIsNegotiationModalVisible] =
    useState(false);

  // Storage lot creation from job
  const [showStorageLotModal, setShowStorageLotModal] = useState(false);

  // ✅ FIX BOUCLE INFINIE: Ref pour tracker si validation déjà effectuée
  const hasValidatedRef = useRef(false);

  // 🔔 Ref + state pour la modal d'action en attente (assignment pending)
  const hasShownPendingActionRef = useRef(false);
  const [isPendingActionModalVisible, setIsPendingActionModalVisible] =
    useState(false);

  // Handle Edit Job
  const handleEditJob = useCallback(() => {
    analytics.trackButtonPress('edit_job', 'JobDetails', { job_id: actualJobId });
    setIsEditModalVisible(true);
  }, [actualJobId]);

  // Handle Update Job (called from EditJobModal)
  const handleUpdateJob = useCallback(
    async (updateData: UpdateJobRequest) => {
      if (!actualJobId) return;
      await updateJobAPI(actualJobId, updateData);
      await refreshJobDetails(); // Refresh after update
    },
    [actualJobId, refreshJobDetails],
  );

  // Handle Assign Staff
  const handleOpenAssignStaff = useCallback(() => {
    analytics.trackButtonPress('assign_staff_open', 'JobDetails', { job_id: actualJobId });
    setIsAssignStaffModalVisible(true);
  }, [actualJobId]);

  const handleAssignStaff = useCallback(
    async (staffId: string) => {
      if (!actualJobId) return;
      try {
        if (staffId === "") {
          // Unassign: retirer tous les membres du crew
          const currentCrew = await getJobCrew(actualJobId);
          await Promise.all(
            currentCrew.map((member) =>
              removeCrewMember(actualJobId, member.id),
            ),
          );
          analytics.trackCustomEvent('staff_unassigned', 'business', { job_id: actualJobId });
          showToast(
            t("staff.unassignSuccess") || "Staff unassigned successfully",
            "success",
          );
        } else {
          // Assign: ajouter au crew via POST /job/:id/crew
          await assignStaffToJob(actualJobId, staffId);
          analytics.trackCustomEvent('staff_assigned', 'business', { job_id: actualJobId, staff_id: staffId });
          showToast(
            t("staff.assignSuccess") || "Staff assigned successfully",
            "success",
          );
        }
        await refreshJobDetails();
      } catch (error) {
        console.error("❌ [JOB_ACTION] Error assigning staff:", error);
        showToast(t("staff.assignError") || "Failed to assign staff", "error");
        throw error;
      }
    },
    [actualJobId, refreshJobDetails, showToast, t],
  );

  // Handle Delete Job
  const handleDeleteJob = useCallback(() => {
    Alert.alert(
      t("jobs.deleteConfirmTitle") || "Delete Job",
      t("jobs.deleteConfirmMessage") ||
        "Are you sure you want to delete this job? This action cannot be undone.",
      [
        {
          text: t("common.cancel") || "Cancel",
          style: "cancel",
        },
        {
          text: t("common.delete") || "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              analytics.trackCustomEvent('job_archive', 'business', { job_id: numericJobId });
              await deleteJob(String(numericJobId));
              showToast(
                t("jobs.deleteSuccess") || "Job deleted successfully",
                "success",
              );
              navigation.goBack();
            } catch (error) {
              console.error("❌ [JOB_ACTION] Error deleting job:", error);
              showToast(
                t("jobs.deleteError") || "Failed to delete job",
                "error",
              );
            }
          },
        },
      ],
    );
  }, [actualJobId, navigation, showToast, t]);

  // Handle Accept Job
  const handleAcceptJob = useCallback(
    async (notes?: string) => {
      try {
        analytics.trackCustomEvent('job_accept', 'business', { job_id: actualJobId });
        await acceptJob(actualJobId, notes);
        showToast(
          t("jobs.acceptSuccess") || "Job accepted successfully",
          "success",
        );
        await refreshJobDetails();
      } catch (error) {
        console.error("❌ [JOB_ACTION] Error accepting job:", error);
        showToast(t("jobs.acceptError") || "Failed to accept job", "error");
        throw error;
      }
    },
    [actualJobId, refreshJobDetails, showToast, t],
  );

  // Handle Decline Job
  const handleDeclineJob = useCallback(
    async (reason: string) => {
      try {
        analytics.trackCustomEvent('job_decline', 'business', { job_id: actualJobId, reason });
        await declineJob(actualJobId, reason);
        showToast(
          t("jobs.declineSuccess") || "Job declined successfully",
          "success",
        );
        navigation.goBack();
      } catch (error) {
        console.error("❌ [JOB_ACTION] Error declining job:", error);
        showToast(t("jobs.declineError") || "Failed to decline job", "error");
        throw error;
      }
    },
    [actualJobId, navigation, showToast, t],
  );

  // Handle Accept Staff Assignment (cross-company)
  const handleAcceptStaffAssignment = useCallback(async (notes?: string) => {
    try {
      await acceptStaffAssignment(numericJobId);
      showToast(t("jobs.acceptSuccess") || "Assignment accepted", "success");
      await refreshJobDetails();
    } catch (error) {
      showToast(t("jobs.acceptError") || "Failed to accept", "error");
      throw error;
    }
  }, [numericJobId, refreshJobDetails, showToast, t]);

  // Handle Decline Staff Assignment (cross-company)
  const handleDeclineStaffAssignment = useCallback(async (reason: string) => {
    try {
      await declineStaffAssignment(numericJobId, reason);
      showToast(t("jobs.declineSuccess") || "Assignment declined", "success");
      navigation.goBack();
    } catch (error) {
      showToast(t("jobs.declineError") || "Failed to decline", "error");
      throw error;
    }
  }, [numericJobId, navigation, refreshJobDetails, showToast, t]);

  // Effet pour mettre à jour les données locales quand jobDetails change
  React.useEffect(() => {
    if (jobDetails) {
      // 📊 Marquer l'écran comme interactif quand les données sont chargées
      perf.markInteractive();


      // 🔍 VALIDATION: Vérifier la cohérence du job à chaque chargement
      // ✅ Rate-limiting restauré: Une seule validation par job
      if (jobDetails.job && !hasValidatedRef.current) {
        hasValidatedRef.current = true; // Marquer comme validé (évite boucle infinie)

        validateJobConsistency(jobDetails.job)
          .then(async (validation) => {
            if (!validation.isValid) {
              const report = formatValidationReport(validation);

              // ✅ PRIORITÉ: Correction serveur AVANT auto-correction locale
              const serverCorrectableIssues = filterServerCorrectableIssues(
                validation.inconsistencies,
              );

              if (serverCorrectableIssues.length > 0) {

                // Afficher message à l'utilisateur
                showToast("Correction automatique en cours...", "info");

                try {
                  // ⚡ DEMANDER CORRECTION AU SERVEUR (PRIORITÉ 1)
                  const result = await requestServerCorrection(
                    jobDetails.job.id || jobDetails.job.code,
                    serverCorrectableIssues,
                  );

                  if (result.success && result.fixed) {
                    showToast(
                      `✅ ${result.corrections.length} corrections appliquées`,
                      "success",
                    );

                    // ✅ RECHARGER le job corrigé
                    await new Promise((resolve) => setTimeout(resolve, 1500));
                    refreshJobDetails();
                    return; // ⚡ STOP ICI, ne pas faire auto-correction locale
                  } else if (result.success && !result.fixed) {
                  } else {
                    showToast(
                      `⚠️ ${t("jobDetails.components.stepValidation.autoCorrectionFailed")}`,
                      "error",
                    );
                  }
                } catch (error: any) {
                  console.error(
                    "❌ [JobDetails] Error requesting server correction:",
                    error,
                  );
                  showToast(
                    `❌ ${t("jobDetails.components.stepValidation.correctionError")}`,
                    "error",
                  );
                }
              }
            }

            // ⚠️ DÉSACTIVÉ: Auto-correction locale (on priorise correction serveur)
            // Auto-correction locale (si reste des incohérences)
            if (validation.autoCorrected) {
              // ANCIEN CODE (désactivé):
              // showToast('Incohérence corrigée localement', 'success');
              // await new Promise(resolve => setTimeout(resolve, 1000));
              // refreshJobDetails();
            }
          })
          .catch((error) => {
            console.error(
              "❌ [JobDetails] Erreur lors de la validation:",
              error,
            );
          });
      } else if (jobDetails.job && hasValidatedRef.current) {
      }

      // Mise à jour des données avec les vraies données de l'API transformées
      setJob((prevJob: any) => {
        // ✅ NOUVEAU: Générer les steps dynamiquement depuis les adresses
        const jobAddresses =
          jobDetails.addresses && jobDetails.addresses.length > 0
            ? jobDetails.addresses
            : [{ street: "Adresse 1" }, { street: "Adresse 2" }]; // Fallback 2 adresses

        const dynamicSteps = generateStepsFromAddresses(jobAddresses, true, t);

        return {
          ...prevJob,
          id: jobDetails.job?.id || actualJobId,
          code: jobDetails.job?.code || actualJobId, // Ajouter le code du job
          status: jobDetails.job?.status, // ✅ FIX: Copier le status pour que JobTimerDisplay sache si le job est "completed"
          // ✅ Steps dynamiques basés sur les adresses (source unique: JobStepsConfig)
          steps: dynamicSteps,
          step: {
            ...prevJob.step,
            // ✅ FIX: Si le job est "completed" mais current_step est invalide, utiliser totalSteps
            actualStep: (() => {
              const backendStep = jobDetails.job?.current_step;
              const isCompletedJob = jobDetails.job?.status === "completed";
              const calculatedTotalSteps = 2 + (jobAddresses.length || 2) * 2;

              if (
                backendStep !== undefined &&
                backendStep !== null &&
                backendStep > 0
              ) {
                // Backend a un step valide - utiliser si completed, forcer au dernier step
                return isCompletedJob
                  ? Math.max(backendStep, calculatedTotalSteps)
                  : backendStep;
              }
              if (isCompletedJob) {
                // Job completed mais pas de step valide - forcer au dernier step
                return calculatedTotalSteps;
              }
              return prevJob.step?.actualStep || 0;
            })(),
          },
          // ✅ MERGE CLIENT: On ne remplace que les champs qui ont de vraies valeurs
          client: mergeClientData(
            prevJob.client,
            jobDetails.client,
            jobDetails.job,
          ),
          notes:
            jobDetails.notes?.map((note: any) => ({
              id: parseInt(note.id),
              title: note.title || t("jobDetails.defaultNote"),
              content: note.content,
              createdAt: note.created_at,
              type: note.note_type || 0,
            })) || [],
          truck:
            jobDetails.trucks?.length > 0
              ? {
                  licensePlate: jobDetails.trucks[0].license_plate,
                  name: jobDetails.trucks[0].truck_name,
                }
              : prevJob.truck,
          items:
            jobDetails.items?.map((item: any, index: number) => ({
              id: item.id, // Garder l'ID API réel !
              name: item.name,
              number: item.quantity,
              checked: item.is_checked === 1,
              item_checked: item.is_checked === 1,
            })) || [],
          addresses:
            jobDetails.addresses && jobDetails.addresses.length > 0
              ? jobDetails.addresses.map((address: any) => ({
                  id: address.id,
                  type: address.type,
                  street: address.street,
                  city: address.city,
                  state: address.state,
                  zip: address.zip,
                  position: address.position,
                }))
              : prevJob.addresses, // Fallback sur les adresses par défaut si pas d'adresses API
          time: {
            startWindowStart:
              jobDetails.job?.start_window_start ||
              prevJob.time.startWindowStart,
            startWindowEnd:
              jobDetails.job?.start_window_end || prevJob.time.startWindowEnd,
            endWindowStart:
              jobDetails.job?.end_window_start || prevJob.time.endWindowStart,
            endWindowEnd:
              jobDetails.job?.end_window_end || prevJob.time.endWindowEnd,
          },
          // Ajouter aussi les champs directement sur l'objet pour compatibilité
          start_window_start: jobDetails.job?.start_window_start,
          start_window_end: jobDetails.job?.start_window_end,
          end_window_start: jobDetails.job?.end_window_start,
          end_window_end: jobDetails.job?.end_window_end,
          // Crew assigné au job
          crew: jobDetails.crew || [],
          // ✅ Multi-entreprise: Ownership data
          contractee: jobDetails.job?.contractee || prevJob.contractee,
          contractor: jobDetails.job?.contractor || prevJob.contractor,
          assignment_status:
            jobDetails.job?.assignment_status || prevJob.assignment_status,
          permissions: jobDetails.job?.permissions || prevJob.permissions,
          // ✅ FIX: Copier payment & signature depuis l'API
          payment_status:
            jobDetails.job?.payment_status ?? prevJob.payment_status,
          amount_due: jobDetails.job?.amount_due ?? prevJob.amount_due,
          amount_total: jobDetails.job?.amount_total ?? prevJob.amount_total,
          amount_paid: jobDetails.job?.amount_paid ?? prevJob.amount_paid,
          signature_blob:
            jobDetails.job?.signature_blob ?? prevJob.signature_blob,
          signature_date:
            jobDetails.job?.signature_date ?? prevJob.signature_date,
          // Délégation B2B active
          active_transfer:
            jobDetails.job?.active_transfer ?? prevJob.active_transfer,
          staff_assignment_status:
            jobDetails.job?.staff_assignment_status ?? prevJob.staff_assignment_status ?? null,
        };
      });
    }
  }, [jobDetails]);

  // ✅ FIX BOUCLE INFINIE: Reset du flag de validation quand on change de job
  React.useEffect(() => {
    hasValidatedRef.current = false; // Permettre la validation pour le nouveau job
    hasShownPendingActionRef.current = false; // Permettre la modal pour le nouveau job
  }, [actualJobId]);

  // 🔔 Auto-affichage si action en attente (une seule fois par chargement de job)
  React.useEffect(() => {
    if (hasShownPendingActionRef.current) return;

    // Cas 1 : assignment pending → ouvrir la modal bottom-sheet
    if (
      job.assignment_status === "pending" &&
      (job.permissions?.can_accept || job.permissions?.can_decline)
    ) {
      hasShownPendingActionRef.current = true;
      setIsPendingActionModalVisible(true);
      return;
    }

    // Cas 2 : transfert B2B pending/negotiating → naviguer vers l'onglet summary
    const transfer = job.active_transfer;
    if (
      transfer &&
      (transfer.status === "pending" || transfer.status === "negotiating") &&
      job.permissions?.can_respond_transfer
    ) {
      hasShownPendingActionRef.current = true;
      setJobPanel("summary");
    }
  }, [
    job.assignment_status,
     
    job.active_transfer?.status,
    job.permissions?.can_accept,
    job.permissions?.can_decline,
    job.permissions?.can_respond_transfer,
  ]);

  const [jobPanel, setJobPanel] = useState(initialTab || "summary");
  // jobPanel: 'summary', 'job', 'client', 'notes', 'payment'

  // Onboarding: when the user lands on job details at step 12, advance to
  // step 13 so the "intro tour" bubble appears on the TabMenu summary tab.
  const { currentStep: onboardingStep, advanceToStep } = useOnboardingTour();

  // Onboarding targets for the tab menu intro tour (steps 13–19)
  const tabSummaryTarget = useOnboardingTarget(13);
  const tabJobTarget = useOnboardingTarget(17);
  const tabNotesTarget = useOnboardingTarget(18);
  const tabPaymentTarget = useOnboardingTarget(19);

  React.useEffect(() => {
    if (onboardingStep === 12) {
      advanceToStep(13);
    }
  }, [onboardingStep, advanceToStep]);

  // 🔔 Calcul des compteurs de notifications pour les onglets
  const notificationCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};

    // Nombre de notes NON LUES (API v1.1.0+)
    if (unreadCount > 0) {
      counts["notes"] = unreadCount;
    }

    // Nombre d'items non cochés
    const uncheckedItems =
      job?.items?.filter((item: any) => !item.checked)?.length || 0;
    if (uncheckedItems > 0) {
      counts["job"] = uncheckedItems;
    }

    // Paiement en attente
    if (
      job?.payment?.status === "unsettled" ||
      job?.payment?.status === "pending"
    ) {
      counts["payment"] = 1;
    }

    return counts;
  }, [unreadCount, job?.items, job?.payment?.status]);

  // ✅ Handler pour mettre à jour l'étape du job quand le timer change
  const handleStepChange = (newStep: number) => {
    const addressCount = job.addresses?.length || 2;
    const dynamicTotalSteps = 2 + addressCount * 2;
    setJob((prevJob: any) => ({
      ...prevJob,
      step: {
        ...prevJob.step,
        actualStep: newStep,
      },
      current_step: newStep,
    }));
  };

  // ✅ Handler pour la complétion du job
  const handleJobCompleted = (finalCost: number, billableHours: number) => {
    analytics.trackJobCompleted({ job_id: numericJobId, company_id: 0, duration_minutes: Math.round(billableHours * 60) });

    // Basculer automatiquement vers le panel de paiement
    setJobPanel("payment");

    // Afficher un toast de succès
    showToast(
      `Job terminé ! Montant: $${finalCost.toFixed(2)} AUD (${billableHours.toFixed(2)}h facturables)`,
      "success",
    );

    // Proposer la création d'un lot de stockage
    setTimeout(() => {
      Alert.alert(
        t("storage.jobCompleted.title") || "Send to Storage?",
        t("storage.jobCompleted.message") || "Would you like to create a storage lot for this client's items?",
        [
          { text: t("common.no") || "No", style: "cancel" },
          {
            text: t("common.yes") || "Yes",
            onPress: () => setShowStorageLotModal(true),
          },
        ],
      );
    }, 1500);
  };

  // Handler pour TabMenu
  const handleTabPress = (tabId: string) => {
    analytics.trackButtonPress(`job_tab_${tabId}`, 'JobDetails', { job_id: actualJobId });
    setJobPanel(tabId);

    // ✅ Marquer toutes les notes comme lues quand l'utilisateur ouvre l'onglet Notes
    if (tabId === "notes" && unreadCount > 0) {
      markAllAsRead();
    }
  };;

  // Titres des panneaux
  const getPanelTitle = () => {
    switch (jobPanel) {
      case "summary":
        return t("jobDetails.panels.summary");
      case "job":
        return t("jobDetails.panels.jobDetails");
      case "client":
        return t("jobDetails.panels.clientInfo");
      case "notes":
        return t("jobDetails.panels.notes");
      case "payment":
        return t("jobDetails.panels.payment");
      default:
        return t("jobDetails.panels.jobDetails");
    }
  };

  // Gestion des états de chargement
  if (authLoading || (jobLoading && !jobDetails)) {
    return LoadingComponent;
  }

  // Si on n'a pas d'ID de job valide
  if (!actualJobId || actualJobId === "undefined" || actualJobId === "null") {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.background,
        }}
      >
        <Text style={{ color: colors.text, fontSize: 18, fontWeight: "600" }}>
          ❌ {t("jobDetails.errors.invalidJobId")}
        </Text>
        <Text
          style={{ color: colors.textSecondary, fontSize: 14, marginTop: 8 }}
        >
          {t("jobDetails.errors.cannotLoadDetails")}
        </Text>
      </View>
    );
  }

  // Affichage d'erreur
  if (error && !isSessionExpired) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.background,
          padding: 20,
        }}
      >
        <Text
          style={{
            color: colors.error,
            fontSize: 18,
            fontWeight: "600",
            textAlign: "center",
          }}
        >
          ❌ {t("jobDetails.errors.loadingError")}
        </Text>
        <Text
          style={{
            color: colors.textSecondary,
            fontSize: 14,
            marginTop: 8,
            textAlign: "center",
          }}
        >
          {error}
        </Text>
      </View>
    );
  }

  const rawCurrentStep = job.step?.actualStep ?? job.current_step ?? 0;
  // ✅ NOUVEAU: Calcul dynamique basé sur les adresses
  // Formule: 1 (départ) + 2×N (arrivée + fin par adresse) + 1 (retour) = 2 + 2×N
  const addressCount = job.addresses?.length || 2;
  const totalSteps = 2 + addressCount * 2; // Pour 2 adresses = 6 steps (+ step 0 = 7 total)

  // ✅ FIX: Si le job est "completed" par le backend, forcer le currentStep au dernier step
  const jobStatus = jobDetails?.job?.status;
  const isJobCompletedByBackend = jobStatus === "completed";
  const currentStep = isJobCompletedByBackend ? totalSteps : rawCurrentStep;

  // 🔍 DEBUG: Afficher les infos de step pour diagnostiquer le problème

  return (
    <JobTimerProvider
      jobId={actualJobId}
      realJobId={jobDetails?.job?.id} // ✅ FIX SESSION 10: Passer le vrai ID numérique
      currentStep={currentStep}
      totalSteps={totalSteps}
      addresses={job.addresses || []} // ✅ NOUVEAU: Passer les adresses pour calcul dynamique des steps
      jobStatus={jobDetails?.job?.status}
      onStepChange={handleStepChange}
      onJobCompleted={handleJobCompleted}
    >
      <View
        testID="job-details-screen"
        style={{
          backgroundColor: colors.background,
          width: "100%",
          height: "100%",
          flex: 1,
        }}
      >
        {/* Logo */}
        <View style={{ alignItems: "center", paddingTop: insets.top }}>
          <HeaderLogo preset="sm" variant="rectangle" marginVertical={0} />
        </View>

        {/* Header moderne avec navigation et RefBookMark */}
        <JobDetailsHeader
          navigation={navigation}
          jobRef={job.code || jobDetails?.job?.code || job.id}
          title={getPanelTitle()}
          onToast={showToast}
          showHelpButton={false}
          onEdit={job.permissions?.can_edit ? handleEditJob : undefined}
          onDelete={job.permissions?.can_delete ? handleDeleteJob : undefined}
          onAssignStaff={handleOpenAssignStaff}
          fromRoute={fromRoute}
        />

        {/* Job Ownership Banner - Show if job is assigned from another company */}
        {job.contractee &&
          job.contractor &&
          job.permissions &&
          job.assignment_status && (
            <JobOwnershipBanner
              ownership={{
                contractee: job.contractee,
                contractor: job.contractor,
                assignment_status: job.assignment_status,
                permissions: job.permissions,
              }}
              variant="full"
            />
          )}

        {/* Job Assignment Actions - B2B only (staff pending is handled inside summary tab) */}
        {(job.permissions?.can_accept || job.permissions?.can_decline) &&
          job.staff_assignment_status !== "pending" && (
          <JobAssignmentActions
            jobId={job.id}
            jobTitle={job.title || job.code || "Job"}
            canAccept={job.permissions?.can_accept || false}
            canDecline={job.permissions?.can_decline || false}
            onAccept={job.staff_assignment_status === "pending" ? handleAcceptStaffAssignment : handleAcceptJob}
            onDecline={job.staff_assignment_status === "pending" ? handleDeclineStaffAssignment : handleDeclineJob}
          />
        )}

        {/* Contractee: pending assignment awaiting contractor response */}
        {job.assignment_status === "pending" &&
          !job.permissions?.can_accept &&
          !job.permissions?.can_decline &&
          job.permissions?.is_contractee &&
          !job.permissions?.is_owner && (
            <View
              style={{
                backgroundColor: colors.warning + "12",
                borderRadius: DESIGN_TOKENS.radius.md,
                padding: DESIGN_TOKENS.spacing.md,
                borderWidth: 1,
                borderColor: colors.warning + "40",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 4,
                }}
              >
                <Ionicons
                  name="hourglass-outline"
                  size={18}
                  color={colors.warning}
                />
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: colors.warning,
                  }}
                >
                  {t("jobs.awaitingContractorResponse") ||
                    "En attente de réponse"}
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 13,
                  color: colors.textSecondary,
                  lineHeight: 18,
                }}
              >
                {t("jobs.awaitingContractorMessage", {
                  contractor:
                    job.contractor?.company_name || t("common.contractor"),
                }) ||
                  `${job.contractor?.company_name || "Le prestataire"} n'a pas encore répondu à cette assignation.`}
              </Text>
            </View>
          )}

        {/* 🔄 Négociation en cours — visible uniquement pour le CRÉATEUR (contractee)
            quand le prestataire a soumis une contre-proposition */}
        {job.assignment_status === "negotiating" &&
          job.permissions?.is_contractee &&
          !job.permissions?.is_owner && (
            <Pressable
              testID="job-details-negotiation-btn"
              onPress={() => {
                analytics.trackButtonPress('negotiation_modal_open', 'JobDetails', { job_id: actualJobId });
                setIsNegotiationModalVisible(true);
              }}
            >
              <Ionicons name="swap-horizontal-outline" size={16} color="#fff" />
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>
                Voir la négociation
              </Text>
            </Pressable>
          )}

        {/* Déléguer ce job — SUPPRIMÉ : remplacé par PrepareJobSection dans summary */}

        {/* 📦 Send to Storage — visible when job is completed */}
        {jobStatus === "completed" && (
          <Pressable
            testID="job-details-send-to-storage"
            onPress={() => {
              analytics.trackButtonPress('send_to_storage', 'JobDetails', { job_id: actualJobId });
              setShowStorageLotModal(true);
            }}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              marginHorizontal: DESIGN_TOKENS.spacing.lg,
              marginBottom: DESIGN_TOKENS.spacing.sm,
              paddingVertical: DESIGN_TOKENS.spacing.sm,
              paddingHorizontal: DESIGN_TOKENS.spacing.md,
              backgroundColor: pressed ? colors.primary + "30" : colors.primary + "15",
              borderRadius: DESIGN_TOKENS.radius.md,
              borderWidth: 1,
              borderColor: colors.primary + "40",
            })}
          >
            <Ionicons name="cube-outline" size={20} color={colors.primary} />
            <Text style={{ color: colors.primary, fontWeight: "600", fontSize: 14, flex: 1 }}>
              {t("storage.sendToStorage") || "Send to Storage"}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </Pressable>
        )}

        {/* ScrollView principal */}
        <ScrollView
          testID="job-details-scroll"
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingTop: DESIGN_TOKENS.spacing.lg,
            paddingBottom: 60 + insets.bottom + DESIGN_TOKENS.spacing.lg, // JobMenu + Safe area + espacement
            paddingHorizontal: DESIGN_TOKENS.spacing.lg,
          }}
        >
          {jobPanel === "summary" && (
            <JobSummary
              job={job}
              setJob={setJob}
              onOpenPaymentPanel={() => setJobPanel("payment")}
              isLoading={jobLoading}
              onRefresh={refreshJobDetails}
              onOpenDelegateWizard={(mode) => {
                setWizardInitialMode(mode);
                setIsDelegateWizardVisible(true);
              }}
              onAcceptStaffAssignment={handleAcceptStaffAssignment}
              onDeclineStaffAssignment={handleDeclineStaffAssignment}
            />
          )}
          {jobPanel === "job" && (
            <JobPage
              job={job}
              setJob={setJob}
              isVisible={jobPanel === "job"}
              onAssignStaff={handleOpenAssignStaff}
              onRefresh={refreshJobDetails}
              onVehicleUpdated={(vehicle) => {
                setJob((prevJob: any) => ({
                  ...prevJob,
                  truck: vehicle
                    ? { name: vehicle.name, licensePlate: vehicle.licensePlate }
                    : null,
                }));
              }}
            />
          )}
          {jobPanel === "client" && <JobClient job={job} setJob={setJob} />}
          {jobPanel === "notes" && (
            <JobNote job={job} setJob={setJob} jobId={numericJobId} />
          )}
          {jobPanel === "payment" && (
            <PaymentScreen job={job} setJob={setJob} />
          )}
        </ScrollView>

        {/* Job Menu fixé en bas */}
        <View
          testID="job-details-tab-menu"
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: colors.backgroundSecondary,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            zIndex: 10,
          }}
        >
          <TabMenu
            activeTab={jobPanel}
            onTabPress={handleTabPress}
            page="jobDetails"
            notificationCounts={notificationCounts}
            onboardingTargets={{
              summary: tabSummaryTarget,
              job:     tabJobTarget,
              notes:   tabNotesTarget,
              payment: tabPaymentTarget,
            }}
          />
        </View>

        {/* Toast au-dessus de tout */}
        <View
          testID="job-details-toast"
          style={{
            position: "absolute",
            top: 100, // Position fixe sous le header
            left: DESIGN_TOKENS.spacing.lg,
            right: DESIGN_TOKENS.spacing.lg,
            zIndex: 20,
            pointerEvents: "none",
          }}
        >
          <Toast
            message={toastDetails.message}
            type={toastDetails.type}
            status={toastDetails.status}
          />
        </View>

        {/* Modal d'édition du job */}
        <EditJobModal
          visible={isEditModalVisible}
          job={jobDetails?.job}
          onClose={() => setIsEditModalVisible(false)}
          onUpdateJob={handleUpdateJob}
        />

        {/* Modal d'assignation de staff */}
        <AssignStaffModal
          visible={isAssignStaffModalVisible}
          jobId={actualJobId}
          currentStaffId={
            jobDetails?.crew?.[0]?.id || jobDetails?.job?.assigned_staff_id
          }
          onAssign={handleAssignStaff}
          onClose={() => setIsAssignStaffModalVisible(false)}
        />

        {/* Wizard de délégation / ressources */}
        <DelegateJobWizard
          visible={isDelegateWizardVisible}
          jobId={job.id}
          initialMode={wizardInitialMode}
          onClose={() => {
            setIsDelegateWizardVisible(false);
            setWizardInitialMode(undefined);
          }}
          onSuccess={() => {
            setIsDelegateWizardVisible(false);
            setWizardInitialMode(undefined);
            refreshJobDetails();
            showToast(t("delegateWizard.delegationSuccess"), "success");
          }}
        />

        {/* 📦 Contractee Negotiation Modal — réponse à une contre-proposition */}
        <ContracteeNegotiationModal
          visible={isNegotiationModalVisible}
          info={{
            jobId: job.id || actualJobId,
            jobTitle: job.title || job.code,
            contractorName: job.contractor?.company_name,
            proposedStart:
              jobDetails?.job?.counter_proposed_start ||
              job.counter_proposed_start,
            proposedEnd:
              jobDetails?.job?.counter_proposed_end || job.counter_proposed_end,
            proposedAt:
              jobDetails?.job?.counter_proposed_at || job.counter_proposed_at,
            notePayload:
              jobDetails?.job?.counter_proposal_note ||
              job.counter_proposal_note,
          }}
          onClose={() => setIsNegotiationModalVisible(false)}
          onJobUpdated={() => {
            setIsNegotiationModalVisible(false);
            refreshJobDetails();
          }}
        />

        {/* �🔔 Modal bottom-sheet : notification action en attente (assignment pending) */}
        <Modal
          visible={isPendingActionModalVisible}
          transparent={true}
          animationType="slide"
          statusBarTranslucent={true}
          onRequestClose={() => setIsPendingActionModalVisible(false)}
        >
          <View
            style={{
              flex: 1,
              justifyContent: "flex-end",
              backgroundColor: "rgba(0,0,0,0.55)",
            }}
          >
            <Pressable
              style={{ flex: 1 }}
              onPress={() => setIsPendingActionModalVisible(false)}
            />
            <View
              style={{
                backgroundColor: colors.background,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                paddingHorizontal: DESIGN_TOKENS.spacing.lg,
                paddingTop: DESIGN_TOKENS.spacing.lg,
                paddingBottom: insets.bottom + DESIGN_TOKENS.spacing.xl,
              }}
            >
              {/* Handle bar */}
              <View
                style={{
                  width: 40,
                  height: 4,
                  backgroundColor: colors.border,
                  borderRadius: 2,
                  alignSelf: "center",
                  marginBottom: DESIGN_TOKENS.spacing.md,
                }}
              />

              {/* Header */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: DESIGN_TOKENS.spacing.sm,
                }}
              >
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                >
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: colors.warning + "20",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons
                      name="notifications"
                      size={18}
                      color={colors.warning}
                    />
                  </View>
                  <Text
                    style={{
                      fontSize: 17,
                      fontWeight: "700",
                      color: colors.text,
                    }}
                  >
                    {t("jobs.pendingActionTitle") || "Action requise"}
                  </Text>
                </View>
                <Pressable
                  onPress={() => setIsPendingActionModalVisible(false)}
                  hitSlop={12}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: colors.backgroundSecondary,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons
                    name="close"
                    size={18}
                    color={colors.textSecondary}
                  />
                </Pressable>
              </View>

              {/* Sous-titre contextuel */}
              {job.contractee?.company_name && (
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: 14,
                    marginBottom: DESIGN_TOKENS.spacing.lg,
                    lineHeight: 20,
                  }}
                >
                  {t("jobs.pendingActionMessage") ||
                    `${job.contractee.company_name} vous a assigné ce job et attend votre confirmation.`}
                </Text>
              )}

              {/* Boutons Accepter / Refuser */}
              <JobAssignmentActions
                jobId={job.id}
                jobTitle={job.title || job.code || "Job"}
                canAccept={job.permissions?.can_accept || false}
                canDecline={job.permissions?.can_decline || false}
                onAccept={async (notes) => {
                  setIsPendingActionModalVisible(false);
                  await (job.staff_assignment_status === "pending" ? handleAcceptStaffAssignment : handleAcceptJob)(notes);
                }}
                onDecline={async (reason) => {
                  setIsPendingActionModalVisible(false);
                  await (job.staff_assignment_status === "pending" ? handleDeclineStaffAssignment : handleDeclineJob)(reason);
                }}
              />

              {/* Voir plus tard */}
              <Pressable
                onPress={() => setIsPendingActionModalVisible(false)}
                style={({ pressed }) => ({
                  marginTop: DESIGN_TOKENS.spacing.sm,
                  paddingVertical: DESIGN_TOKENS.spacing.md,
                  alignItems: "center",
                  opacity: pressed ? 0.5 : 1,
                })}
              >
                <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
                  {t("common.later") || "Voir plus tard"}
                </Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* 📦 Create Storage Lot Modal — pre-filled from job data */}
        <CreateStorageLotModal
          visible={showStorageLotModal}
          onClose={() => setShowStorageLotModal(false)}
          onCreated={(lot) => {
            setShowStorageLotModal(false);
            showToast(
              t("storage.lotCreatedFromJob") || `Storage lot created: ${lot.identifier_tag || lot.id}`,
              "success",
            );
          }}
          prefillJobId={jobDetails?.job?.id}
          prefillClientName={
            job.client?.name ||
            [job.client?.firstName, job.client?.lastName].filter(Boolean).join(" ") ||
            undefined
          }
          prefillClientEmail={job.client?.email !== "N/A" ? job.client?.email : undefined}
          prefillClientPhone={job.client?.phone !== "N/A" ? job.client?.phone : undefined}
        />
      </View>
    </JobTimerProvider>
  );
};

// Wrapper avec JobStateProvider pour persistence et state management
const JobDetailsWithProvider: React.FC<JobDetailsProps> = (props) => {
  const actualJobId =
    props.route?.params?.jobId || props.jobId || props.route?.params?.id;

  // Si pas de jobId, afficher le composant sans provider (fallback)
  if (!actualJobId) {
    return <JobDetails {...props} />;
  }

  return (
    <JobStateProvider jobId={actualJobId}>
      <JobDetails {...props} />
    </JobStateProvider>
  );
};

export default JobDetailsWithProvider;
