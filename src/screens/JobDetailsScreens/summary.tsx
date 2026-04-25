/**
 * Summary Page - Page de résumé du job avec modals améliorés
 */

import Ionicons from "@react-native-vector-icons/ionicons";
import React, { useState } from "react";
import { Text, View } from "react-native";
import { JobStepHistoryCard } from "../../components/jobDetails/JobStepHistoryCard";
import JobSummarySkeleton from "../../components/jobDetails/JobSummarySkeleton";
import JobTimerDisplay from "../../components/jobDetails/JobTimerDisplay";
import ImprovedNoteModal from "../../components/jobDetails/modals/ImprovedNoteModal";
import PhotoSelectionModal from "../../components/jobDetails/modals/PhotoSelectionModal";
import AddressesSection from "../../components/jobDetails/sections/AddressesSection";

import FinancialSummarySection from "../../components/jobDetails/sections/FinancialSummarySection";
import PrepareJobSection from "../../components/jobDetails/sections/PrepareJobSection";
import QuickActionsSection from "../../components/jobDetails/sections/QuickActionsSection";
import SignaturePreviewSection from "../../components/jobDetails/sections/SignaturePreviewSection";
import StaffingSection from "../../components/jobDetails/sections/StaffingSection";
import TimeWindowsSection from "../../components/jobDetails/sections/TimeWindowsSection";
import TransferBannerSection from "../../components/jobDetails/sections/TransferBannerSection";

import SigningBloc from "../../components/signingBloc";
import { DESIGN_TOKENS } from "../../constants/Styles";
import { useOnboardingTarget } from "../../context/OnboardingSpotlightContext";
import { useTheme } from "../../context/ThemeProvider";
import { useToast } from "../../context/ToastProvider";
import { useAnalytics } from "../../hooks/useAnalytics";
import { useJobNotes } from "../../hooks/useJobNotes";
import { useJobPhotos } from "../../hooks/useJobPhotos";
import { useLocalization } from "../../localization/useLocalization";
import { saveJobSignature } from "../../services/jobDetails";
import type { JobSummaryData } from "../../types/jobSummary";

const JobSummary = ({
  job,
  setJob,
  onOpenPaymentPanel,
  isLoading = false,
  onRefresh,
  onOpenDelegateWizard,
}: {
  job: JobSummaryData;
  setJob: React.Dispatch<React.SetStateAction<JobSummaryData>>;
  onOpenPaymentPanel?: () => void;
  isLoading?: boolean;
  onRefresh?: () => void;
  onOpenDelegateWizard?: (
    mode: "resources" | "delegate_part" | "delegate_full",
  ) => void;
}) => {
  const [isSigningVisible, setIsSigningVisible] = useState(false);
  const [isPhotoModalVisible, setIsPhotoModalVisible] = useState(false);
  const [isNoteModalVisible, setIsNoteModalVisible] = useState(false);
  const { t } = useLocalization();
  const { colors } = useTheme();
  const { track } = useAnalytics("job_summary", "job_details");

  // Hooks pour la gestion des notes et photos
  const { addNote } = useJobNotes(String(job.id));
  const { uploadPhoto } = useJobPhotos(String(job.id));
  const { showSuccess, showError } = useToast();

  // Onboarding targets for the intro tour
  const quickActionsTarget = useOnboardingTarget(14);
  const timerTarget = useOnboardingTarget(15);
  const staffingTarget = useOnboardingTarget(16);

  const handleSignContract = () => {
    track.userAction("contract_signing_opened", { jobId: job?.id });
    setIsSigningVisible(true);
  };

  // Gestion des notes avec API - nouvelle structure
  const handleAddNote = async (
    content: string,
    note_type: "general" | "important" | "client" | "internal" = "general",
    title?: string,
  ) => {
    try {
      track.userAction("note_add_started", { jobId: job?.id, note_type });

      const result = await addNote({
        title:
          title ||
          `${t("jobDetails.defaultNote")} ${new Date().toLocaleDateString()}`,
        content,
        note_type,
      });

      if (result) {
        track.businessEvent("note_added", {
          jobId: job?.id,
          note_type,
          success: true,
        });
        showSuccess(
          t("jobDetails.messages.noteAdded"),
          t("jobDetails.messages.noteAddedSuccess"),
        );
        return Promise.resolve();
      } else {
        throw new Error(t("jobDetails.messages.noteAddErrorMessage"));
      }
    } catch (error) {
      track.error("api_error", `Failed to add note: ${error}`, {
        jobId: job?.id,
        note_type,
      });
      showError(
        t("jobDetails.messages.noteAddError"),
        t("jobDetails.messages.noteAddErrorMessage"),
      );
      throw error;
    }
  };

  // Gestion des photos avec API
  const handlePhotoSelected = async (photoUri: string) => {
    try {
      track.userAction("photo_upload_started", { jobId: job?.id });

      const result = await uploadPhoto(
        photoUri,
        `${t("jobDetails.messages.photoDescription")} ${job?.id || "N/A"}`,
      );
      if (result) {
        track.businessEvent("photo_uploaded", {
          jobId: job?.id,
          success: true,
        });
        showSuccess(
          t("jobDetails.messages.photoAdded"),
          t("jobDetails.messages.photoAddedSuccess"),
        );
      } else {
        throw new Error(t("jobDetails.messages.photoAddErrorMessage"));
      }
    } catch (error) {
      showError(
        t("jobDetails.messages.photoAddError"),
        t("jobDetails.messages.photoAddErrorMessage"),
      );
    }
  };

  return (
    <>
      {/* Modal de signature */}
      {isSigningVisible && (
        <SigningBloc
          isVisible={isSigningVisible}
          setIsVisible={setIsSigningVisible}
          onSave={async (signature: string) => {
            try {
              // ✅ Passer l'ID numérique et le type "client"
              const result = await saveJobSignature(
                job.id,
                signature,
                "client",
              );
              if (result.success) {
                setJob({
                  ...job,
                  signature_blob: result.signatureUrl,
                  signatureDataUrl: signature, // Garder aussi la data URL locale
                  signatureFileUri: "", // Sera mis à jour par signingBloc
                });
                showSuccess(t("jobDetails.messages.signatureSaved"));
              } else {
                showError(
                  t("jobDetails.messages.signatureSaveError"),
                  result.message ||
                    t("jobDetails.messages.signatureSaveErrorMessage"),
                );
              }
            } catch (error) {
              showError(
                t("jobDetails.messages.signatureSaveError"),
                t("jobDetails.messages.signatureSaveErrorMessage"),
              );
            }
          }}
          job={job as any}
          setJob={setJob as any}
        />
      )}

      {/* Modal de sélection de photo */}
      <PhotoSelectionModal
        isVisible={isPhotoModalVisible}
        onClose={() => setIsPhotoModalVisible(false)}
        onPhotoSelected={handlePhotoSelected}
        jobId={String(job.id)}
      />

      {/* Modal amélioré de note */}
      <ImprovedNoteModal
        isVisible={isNoteModalVisible}
        onClose={() => setIsNoteModalVisible(false)}
        onAddNote={handleAddNote}
        jobId={String(job.id)}
      />

      {/* Sections modulaires */}
      <View testID="job-summary-root">
        {isLoading ? (
          <JobSummarySkeleton />
        ) : (
          <>
            {/* ── Hero card : identité du job ── */}
            <JobHeroCard job={job} />

            {/* Bandeau de délégation active */}
            {job.active_transfer && (
              <TransferBannerSection
                jobId={String(job.id)}
                transfer={job.active_transfer}
                isOwner={
                  job.permissions?.is_contractee ??
                  job.permissions?.is_owner ??
                  false
                }
                canRespond={job.permissions?.can_respond_transfer ?? false}
                onTransferUpdated={onRefresh ?? (() => {})}
              />
            )}

            {/* Actions rapides (Call/GPS/Note/Photo) */}
            <View ref={quickActionsTarget.ref} onLayout={quickActionsTarget.onLayout}>
              <QuickActionsSection
                job={job}
                setJob={setJob}
                onAddNote={handleAddNote}
                onShowNoteModal={() => setIsNoteModalVisible(true)}
                onShowPhotoModal={() => setIsPhotoModalVisible(true)}
              />
            </View>

            {/* Timer + Progression */}
            <View ref={timerTarget.ref} onLayout={timerTarget.onLayout}>
              <JobTimerDisplay
                job={job}
                onOpenSignatureModal={() => setIsSigningVisible(true)}
                onOpenPaymentPanel={onOpenPaymentPanel}
              />
            </View>

            {/* Véhicule & équipe assignés + bouton d'ajout */}
            <View ref={staffingTarget.ref} onLayout={staffingTarget.onLayout}>
              <StaffingSection
                job={{
                id: job.id,
                start_window_start: job.start_window_start,
                end_window_start: job.end_window_start,
                end_window_end: job.end_window_end,
                contractor: job.contractor
                  ? {
                      companyId: job.contractor.company_id,
                      companyName: job.contractor.company_name,
                    }
                  : undefined,
                contractee: job.contractee
                  ? {
                      companyId: job.contractee.company_id,
                      companyName: job.contractee.company_name,
                    }
                  : undefined,
                permissions: {
                  is_assigned: job.permissions?.is_assigned,
                  is_owner: job.permissions?.is_owner,
                },
              }}
              activeTransfer={job.active_transfer}
              onJobRefresh={onRefresh}
            />
            </View>

            {/* Section préparation / délégation (avant démarrage uniquement) */}
            {job.status !== "in-progress" &&
              job.status !== "completed" &&
              job.status !== "cancelled" &&
              !job.timer_info?.timer_is_running &&
              !(Number(job.timer_info?.timer_billable_hours ?? 0) > 0) &&
              job.permissions?.can_create_transfer && (
                <PrepareJobSection
                  jobId={String(job.id)}
                  activeTransfer={job.active_transfer}
                  onOpenWizard={onOpenDelegateWizard ?? (() => {})}
                  onRefresh={onRefresh ?? (() => {})}
                  companyId={
                    job.contractor?.company_id ??
                    job.contractee?.company_id ??
                    0
                  }
                  startAt={job.start_window_start}
                  endAt={job.end_window_end ?? job.end_window_start}
                />
              )}

            {/* Historique des étapes (si disponible) */}
            {!!job?.timer_info?.step_history?.length && (
              <JobStepHistoryCard timerInfo={job.timer_info!} />
            )}

            {/* Adresses */}
            <AddressesSection job={job} />

            {/* Créneaux horaires */}
            <TimeWindowsSection job={job} />

            {/* Résumé financier (si données dispo) */}
            <FinancialSummarySection job={job} />

            {/* Aperçu signature (si job signé) */}
            <SignaturePreviewSection job={job} />
          </>
        )}
      </View>
    </>
  );
};

// ─────────────────────────────────────────────────────────────
// Hero card — identité compacte du job
// ─────────────────────────────────────────────────────────────

const STATUS_CFG: Record<
  string,
  { icon: string; color: string; labelKey: string }
> = {
  pending:     { icon: "time-outline",            color: "#94A3B8", labelKey: "pending" },
  accepted:    { icon: "checkmark-circle-outline", color: "#3B82F6", labelKey: "accepted" },
  assigned:    { icon: "person-circle-outline",   color: "#3B82F6", labelKey: "assigned" },
  "in-progress":{ icon: "play-circle-outline",    color: "#F59E0B", labelKey: "inProgress" },
  completed:   { icon: "checkmark-done-outline",  color: "#22C55E", labelKey: "completed" },
  cancelled:   { icon: "close-circle-outline",    color: "#EF4444", labelKey: "cancelled" },
  declined:    { icon: "ban-outline",             color: "#EF4444", labelKey: "declined" },
};

const PAYMENT_CFG: Record<string, { color: string; labelKey: string }> = {
  paid:    { color: "#22C55E", labelKey: "paid" },
  partial: { color: "#F59E0B", labelKey: "partialPayment" },
  pending: { color: "#94A3B8", labelKey: "paymentPending" },
};

const JobHeroCard: React.FC<{ job: JobSummaryData }> = ({ job }) => {
  const { colors } = useTheme();
  const { t } = useLocalization();

  const status = job?.status ?? "pending";
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.pending;

  const clientName =
    job?.client?.name ||
    [job?.client?.firstName, job?.client?.lastName]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    null;

  const formatDate = (iso: string | undefined) => {
    if (!iso) return null;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString(undefined, {
      day: "2-digit",
      month: "short",
    });
  };

  const date = formatDate(job?.start_window_start);

  const paymentStatus = job?.payment_status;
  const payCfg = paymentStatus ? PAYMENT_CFG[paymentStatus] : null;

  return (
    <View
      style={{
        marginBottom: DESIGN_TOKENS.spacing.sm,
        backgroundColor: colors.backgroundSecondary,
        borderRadius: DESIGN_TOKENS.radius.lg,
        borderWidth: 1,
        borderColor: colors.border + "60",
        overflow: "hidden",
      }}
    >
      {/* Accent strip coloré selon statut */}
      <View style={{ height: 3, backgroundColor: cfg.color }} />

      <View
        style={{
          padding: DESIGN_TOKENS.spacing.md,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Gauche : ref + client */}
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "800",
              color: colors.text,
              letterSpacing: -0.3,
            }}
            numberOfLines={1}
          >
            {job?.code ?? `#${job?.id}`}
          </Text>
          {clientName && (
            <Text
              style={{
                fontSize: 13,
                color: colors.textSecondary,
                marginTop: 2,
              }}
              numberOfLines={1}
            >
              {clientName}
            </Text>
          )}
        </View>

        {/* Droite : chips status + date */}
        <View
          style={{ alignItems: "flex-end", gap: 6 }}
        >
          {/* Status chip */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: DESIGN_TOKENS.radius.full,
              backgroundColor: cfg.color + "18",
              borderWidth: 1,
              borderColor: cfg.color + "40",
            }}
          >
            <Ionicons name={cfg.icon as any} size={12} color={cfg.color} />
            <Text
              style={{ fontSize: 11, fontWeight: "700", color: cfg.color }}
            >
              {t(
                `jobDetails.components.statusBanner.${cfg.labelKey}` as any,
              )}
            </Text>
          </View>

          {/* Date chip */}
          {date && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 3,
              }}
            >
              <Ionicons
                name="calendar-outline"
                size={11}
                color={colors.textSecondary}
              />
              <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                {date}
              </Text>
            </View>
          )}

          {/* Payment chip (si présent) */}
          {payCfg && (
            <View
              style={{
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: DESIGN_TOKENS.radius.full,
                backgroundColor: payCfg.color + "18",
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: "600",
                  color: payCfg.color,
                }}
              >
                {t(
                  `jobDetails.components.statusBanner.${payCfg.labelKey}` as any,
                )}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

export default JobSummary;
