/**
 * JobDetails - Écran principal des détails de tâche
 * Architecture moderne avec gestion correcte des Safe Areas et marges
 *
 * ⚠️ Utilise JobStepsConfig.ts comme source unique de vérité pour les steps
 */
import React, { useCallback, useRef, useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import JobDetailsHeader from "../components/jobDetails/JobDetailsHeader";
import AssignStaffModal from "../components/modals/AssignStaffModal";
import EditJobModal from "../components/modals/EditJobModal";
import TabMenu from "../components/ui/TabMenu";
import Toast from "../components/ui/toastNotification";
import {
  generateStepsFromAddresses,
  DEFAULT_STEPS,
} from "../constants/JobStepsConfig";
import { DESIGN_TOKENS } from "../constants/Styles";
import { JobStateProvider } from "../context/JobStateProvider";
import { JobTimerProvider } from "../context/JobTimerProvider";
import { useTheme } from "../context/ThemeProvider";
import { useJobDetails } from "../hooks/useJobDetails";
import { useJobNotes } from "../hooks/useJobNotes";
import { usePerformanceMetrics } from "../hooks/usePerformanceMetrics";
import { useLocalization } from "../localization/useLocalization";
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
  deleteJob,
  updateJob as updateJobAPI,
  UpdateJobRequest,
} from "../services/jobs";
import { useAuthCheck } from "../utils/checkAuth";
import {
  formatValidationReport,
  validateJobConsistency,
} from "../utils/jobValidation";
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
  const { isLoading: authLoading, LoadingComponent } = useAuthCheck(navigation);
  const { colors } = useTheme();
  const { t } = useLocalization();

  // 📊 Performance monitoring
  const perf = usePerformanceMetrics("JobDetails");

  // Récupération de l'ID du job depuis les paramètres de route ou props
  const actualJobId = route?.params?.jobId || jobId || route?.params?.id;
  
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
  const [job, setJob] = useState({
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
      firstName: "Client A",
      lastName: "Last Name",
      phone: "+1234567890",
      email: "mail@mail.com",
      type: t("jobDetails.client.firstTimeClient"),
    },
    contact: {
      firstName: "Contact A",
      lastName: "Last Name",
      phone: "+1234567890",
    },
    addresses: [
      {
        type: "pickup",
        street: "123 Main St",
        city: "City A",
        state: "State A",
        zip: "12345",
      },
      {
        type: "dropoff",
        street: "456 Elm St",
        city: "City B",
        state: "State B",
        zip: "67890",
      },
    ],
    time: {
      startWindowStart: "2023-10-01T08:00:00Z",
      startWindowEnd: "2023-10-01T10:00:00Z",
      endWindowStart: "2023-10-01T12:00:00Z",
      endWindowEnd: "2023-10-01T14:00:00Z",
    },
    truck: {
      licensePlate: "ABC123",
      name: "Truck A",
    },
    notes: [],
    payment: {
      status: "unsettled",
      amount: "550.00",
      amountWithoutTax: "500.00",
      amountPaid: "0.00",
      amountToBePaid: "550.00",
      taxe: {
        gst: "50.00",
        gstRate: 10,
        amountWithoutTax: "500.00",
      },
      currency: "AUD",
      dueDate: "N/A",
      paymentMethod: "N/A",
      transactionId: "N/A",
      paymentLink: "N/A",
      paymentTime: "N/A",
      paymentDetails: "N/A",
      savedCards: [
        {
          id: 1,
          cardNumber: "4242 4242 4242 4242",
          cardHolderName: "John Doe",
          expiryDate: "12/25",
          cvv: "123",
        },
        {
          id: 2,
          cardNumber: "5555 5555 5555 4444",
          cardHolderName: "Jane Doe",
          expiryDate: "11/24",
          cvv: "456",
        },
      ],
    },
    items: [
      {
        id: 1,
        name: "Toy-boy",
        number: 1,
        checked: false,
      },
      {
        id: 2,
        name: "TV Unit",
        number: 1,
        checked: false, // true if the item is checked
      },
      {
        id: 3,
        name: "Sofa",
        number: 1,
        checked: false, // true if the item is checked
      },
      {
        id: 4,
        name: "Bed",
        number: 1,
        checked: false, // true if the item is checked
      },
    ],
    contractor: {
      Name: "Contractor A",
      ContactName: "Contact A",
      Phone: "+1234567890",
      Email: "contractor@example.com",
    },
    contractee: {
      Name: "Contractee A",
      ContactName: "Contact A",
      Phone: "+1234567890",
      Email: "contractee@example.com",
    },
  });

  // State for Edit Job Modal
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  // State for Assign Staff Modal
  const [isAssignStaffModalVisible, setIsAssignStaffModalVisible] =
    useState(false);

  // ✅ FIX BOUCLE INFINIE: Ref pour tracker si validation déjà effectuée
  const hasValidatedRef = useRef(false);

  // Handle Edit Job
  const handleEditJob = useCallback(() => {
    console.log("📝 [JOB_ACTION] handleEditJob called", { jobId: actualJobId });
    setIsEditModalVisible(true);
  }, [actualJobId]);

  // Handle Update Job (called from EditJobModal)
  const handleUpdateJob = useCallback(
    async (updateData: UpdateJobRequest) => {
      console.log("📝 [JOB_ACTION] handleUpdateJob called", {
        jobId: actualJobId,
        updateData: JSON.stringify(updateData, null, 2),
      });
      if (!actualJobId) return;
      await updateJobAPI(actualJobId, updateData);
      console.log("✅ [JOB_ACTION] handleUpdateJob completed");
      await refreshJobDetails(); // Refresh after update
    },
    [actualJobId, refreshJobDetails],
  );

  // Handle Assign Staff
  const handleOpenAssignStaff = useCallback(() => {
    console.log("👥 [JOB_ACTION] handleOpenAssignStaff called", {
      jobId: actualJobId,
    });
    setIsAssignStaffModalVisible(true);
  }, [actualJobId]);

  const handleAssignStaff = useCallback(
    async (staffId: string) => {
      console.log("👥 [JOB_ACTION] handleAssignStaff called", {
        jobId: actualJobId,
        staffId,
      });
      if (!actualJobId) return;
      try {
        if (staffId === "") {
          console.log("👥 [JOB_ACTION] Unassigning all staff...");
          // Unassign: retirer tous les membres du crew
          const currentCrew = await getJobCrew(actualJobId);
          await Promise.all(
            currentCrew.map((member) =>
              removeCrewMember(actualJobId, member.id),
            ),
          );
          console.log("✅ [JOB_ACTION] Staff unassigned successfully");
          showToast(
            t("staff.unassignSuccess") || "Staff unassigned successfully",
            "success",
          );
        } else {
          console.log("👥 [JOB_ACTION] Assigning staff to job...");
          // Assign: ajouter au crew via POST /job/:id/crew
          await assignStaffToJob(actualJobId, staffId);
          console.log("✅ [JOB_ACTION] Staff assigned successfully");
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
    console.log("🗑️ [JOB_ACTION] handleDeleteJob called", {
      jobId: actualJobId,
    });
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
              console.log("🗑️ [JOB_ACTION] Deleting job...", {
                jobId: actualJobId,
              });
              await deleteJob(actualJobId);
              console.log("✅ [JOB_ACTION] Job deleted successfully");
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

  // Effet pour mettre à jour les données locales quand jobDetails change
  React.useEffect(() => {
    if (jobDetails) {
      // 📊 Marquer l'écran comme interactif quand les données sont chargées
      perf.markInteractive();

      console.log("🔄 [JobDetails] Updating local job data from API data...");
      console.log("🔍 [JobDetails] jobDetails structure:", {
        hasJob: !!jobDetails.job,
        hasClient: !!jobDetails.client,
        clientKeys: jobDetails.client ? Object.keys(jobDetails.client) : [],
        jobKeys: jobDetails.job ? Object.keys(jobDetails.job) : [],
      });

      // 🔍 VALIDATION: Vérifier la cohérence du job à chaque chargement
      // ✅ Rate-limiting restauré: Une seule validation par job
      if (jobDetails.job && !hasValidatedRef.current) {
        hasValidatedRef.current = true; // Marquer comme validé (évite boucle infinie)
        console.log(
          "🔍 [JobDetails] Starting validation for job:",
          jobDetails.job.id,
        );

        validateJobConsistency(jobDetails.job)
          .then(async (validation) => {
            if (!validation.isValid) {
              console.warn(
                "⚠️ [JobDetails] Incohérences détectées:",
                validation.inconsistencies,
              );
              const report = formatValidationReport(validation);
              // TEMP_DISABLED: console.log(report);

              // ✅ PRIORITÉ: Correction serveur AVANT auto-correction locale
              const serverCorrectableIssues = filterServerCorrectableIssues(
                validation.inconsistencies,
              );

              if (serverCorrectableIssues.length > 0) {
                console.log(
                  "🔧 [JobDetails] Requesting server correction for",
                  serverCorrectableIssues.length,
                  "issues",
                );
                console.log(
                  "📋 [JobDetails] Issues to correct:",
                  serverCorrectableIssues.map((i) => i.type),
                );

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
                    console.log("🔄 [JobDetails] Reloading corrected job...");
                    await new Promise((resolve) => setTimeout(resolve, 1500));
                    refreshJobDetails();
                    console.log(
                      "✅ [JobDetails] Job reloaded after server correction",
                    );
                    return; // ⚡ STOP ICI, ne pas faire auto-correction locale
                  } else if (result.success && !result.fixed) {
                    console.log(
                      "ℹ️ [JobDetails] Server analyzed but no corrections needed",
                    );
                  } else {
                    console.warn(
                      "⚠️ [JobDetails] Server correction failed:",
                      result.error,
                    );
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
              console.log(
                "ℹ️ [JobDetails] Auto-correction locale désactivée, utiliser correction serveur",
              );
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
        // TEMP_DISABLED: console.log('🔍 [JobDetails] Validation déjà effectuée pour ce job, skip');
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
          // ✅ Steps dynamiques basés sur les adresses (source unique: JobStepsConfig)
          steps: dynamicSteps,
          step: {
            ...prevJob.step,
            actualStep:
              jobDetails.job?.current_step || prevJob.step?.actualStep || 0,
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
        };
      });
      // TEMP_DISABLED: console.log('✅ [JobDetails] Local job data updated with API data');
    }
  }, [jobDetails]);

  // ✅ FIX BOUCLE INFINIE: Reset du flag de validation quand on change de job
  React.useEffect(() => {
    hasValidatedRef.current = false; // Permettre la validation pour le nouveau job
  }, [actualJobId]);

  const [jobPanel, setJobPanel] = useState("summary");
  // jobPanel: 'summary', 'job', 'client', 'notes', 'payment'

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
    console.log("🔄 [JOB_ACTION] handleStepChange called", {
      jobId: actualJobId,
      oldStep: job.step?.actualStep,
      newStep,
      totalSteps: dynamicTotalSteps,
    });
    setJob((prevJob: any) => ({
      ...prevJob,
      step: {
        ...prevJob.step,
        actualStep: newStep,
      },
      current_step: newStep,
    }));
    console.log("✅ [JOB_ACTION] Step updated locally to", newStep);
  };

  // ✅ Handler pour la complétion du job
  const handleJobCompleted = (finalCost: number, billableHours: number) => {
    console.log("🎉 [JOB_ACTION] handleJobCompleted called", {
      jobId: actualJobId,
      finalCost,
      billableHours,
    });

    // Basculer automatiquement vers le panel de paiement
    setJobPanel("payment");

    // Afficher un toast de succès
    showToast(
      `Job terminé ! Montant: $${finalCost.toFixed(2)} AUD (${billableHours.toFixed(2)}h facturables)`,
      "success",
    );
  };

  // Handler pour TabMenu
  const handleTabPress = (tabId: string) => {
    console.log("📑 [JOB_ACTION] Tab pressed:", tabId);
    setJobPanel(tabId);
    
    // ✅ Marquer toutes les notes comme lues quand l'utilisateur ouvre l'onglet Notes
    if (tabId === "notes" && unreadCount > 0) {
      console.log("🔔 [NOTES] Marking all notes as read, unreadCount:", unreadCount);
      markAllAsRead();
    }
  };

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

  const currentStep = job.step.actualStep || 0;
  // ✅ NOUVEAU: Calcul dynamique basé sur les adresses
  // Formule: 1 (départ) + 2×N (arrivée + fin par adresse) + 1 (retour) = 2 + 2×N
  const addressCount = job.addresses?.length || 2;
  const totalSteps = 2 + addressCount * 2; // Pour 2 adresses = 6 steps (+ step 0 = 7 total)

  // 🔍 DEBUG: Afficher les infos de step pour diagnostiquer le problème
  console.log("🔍 [JobDetails] Step configuration:", {
    actualStep: job.step?.actualStep,
    currentStep,
    totalSteps,
    addressCount,
    stepsArray: job.steps?.map((s) => s.name),
    jobStatus: jobDetails?.job?.status,
    isCompleted: currentStep >= totalSteps,
  });

  return (
    <JobTimerProvider
      jobId={actualJobId}
      currentStep={currentStep}
      totalSteps={totalSteps}
      addresses={job.addresses || []} // ✅ NOUVEAU: Passer les adresses pour calcul dynamique des steps
      jobStatus={jobDetails?.job?.status}
      onStepChange={handleStepChange}
      onJobCompleted={handleJobCompleted}
    >
      <View
        style={{
          backgroundColor: colors.background,
          width: "100%",
          height: "100%",
          flex: 1,
        }}
      >
        {/* Header moderne avec navigation et RefBookMark */}
        <JobDetailsHeader
          navigation={navigation}
          jobRef={job.code || jobDetails?.job?.code || job.id}
          title={getPanelTitle()}
          onToast={showToast}
          showLanguageButton={false}
          onEdit={handleEditJob}
          onDelete={handleDeleteJob}
          onAssignStaff={handleOpenAssignStaff}
        />

        {/* ScrollView principal */}
        <ScrollView
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
            />
          )}
          {jobPanel === "job" && (
            <JobPage job={job} setJob={setJob} isVisible={jobPanel === "job"} />
          )}
          {jobPanel === "client" && <JobClient job={job} setJob={setJob} />}
          {jobPanel === "notes" && <JobNote job={job} setJob={setJob} jobId={numericJobId} />}
          {jobPanel === "payment" && (
            <PaymentScreen job={job} setJob={setJob} />
          )}
        </ScrollView>

        {/* Job Menu fixé en bas */}
        <View
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
          />
        </View>

        {/* Toast au-dessus de tout */}
        <View
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
