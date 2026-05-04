/**
 * Summary Page - Page de résumé du job avec modals améliorés
 */

import Ionicons from "@react-native-vector-icons/ionicons";
import React, { useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { JobAssignmentActions } from "../../components/jobs/JobAssignmentActions";
import { JobStepHistoryCard } from "../../components/jobDetails/JobStepHistoryCard";
import JobSummarySkeleton from "../../components/jobDetails/JobSummarySkeleton";
import JobTimerDisplay from "../../components/jobDetails/JobTimerDisplay";
import ImprovedNoteModal from "../../components/jobDetails/modals/ImprovedNoteModal";
import PhotoSelectionModal from "../../components/jobDetails/modals/PhotoSelectionModal";
import AddressesSection from "../../components/jobDetails/sections/AddressesSection";

import FinancialSummarySection from "../../components/jobDetails/sections/FinancialSummarySection";
import JobHistorySection from "../../components/jobDetails/sections/JobHistorySection";
import PrepareJobSection from "../../components/jobDetails/sections/PrepareJobSection";
import QuickActionsSection from "../../components/jobDetails/sections/QuickActionsSection";
import ScorecardSummarySection from "../../components/jobDetails/sections/ScorecardSummarySection";
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
import { updateJob } from "../../services/jobs";
import type { JobSummaryData } from "../../types/jobSummary";

const JobSummary = ({
  job,
  setJob,
  onOpenPaymentPanel,
  isLoading = false,
  onRefresh,
  onOpenDelegateWizard,
  onAcceptStaffAssignment,
  onDeclineStaffAssignment,
}: {
  job: JobSummaryData;
  setJob: React.Dispatch<React.SetStateAction<JobSummaryData>>;
  onOpenPaymentPanel?: () => void;
  isLoading?: boolean;
  onRefresh?: () => void;
  onOpenDelegateWizard?: (
    mode: "resources" | "delegate_part" | "delegate_full",
  ) => void;
  onAcceptStaffAssignment?: (notes?: string) => Promise<void>;
  onDeclineStaffAssignment?: (reason: string) => Promise<void>;
}) => {
  const [isSigningVisible, setIsSigningVisible] = useState(false);
  const [isPhotoModalVisible, setIsPhotoModalVisible] = useState(false);
  const [isNoteModalVisible, setIsNoteModalVisible] = useState(false);
  const [isDifficultyModalVisible, setIsDifficultyModalVisible] = useState(false);
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

  const handleSetDifficulty = async (
    difficulty: "easy" | "medium" | "hard" | "expert" | null,
  ) => {
    track.userAction("difficulty_set", { jobId: job?.id, difficulty: difficulty ?? "none" });
    setIsDifficultyModalVisible(false);
    try {
      await updateJob(String(job.id), { difficulty });
      setJob((prev) => ({ ...prev, difficulty }));
    } catch {
      showError(t("common.error" as any) ?? "Error", t("common.tryAgain" as any) ?? "Please try again");
    }
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
      {/* Modal sélecteur de difficulté */}
      <Modal
        visible={isDifficultyModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsDifficultyModalVisible(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" }}
          onPress={() => setIsDifficultyModalVisible(false)}
        >
          <Pressable
            style={{
              backgroundColor: colors.background,
              borderRadius: DESIGN_TOKENS.radius.lg,
              padding: DESIGN_TOKENS.spacing.lg,
              width: 260,
              gap: 8,
            }}
            onPress={() => {}}
          >
            <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text, marginBottom: 4 }}>
              {t("jobDetails.difficulty.label" as any) ?? "Difficulty"}
            </Text>
            {(["easy", "medium", "hard", "expert"] as const).map((d) => {
              const color = DIFFICULTY_CFG[d].color;
              const isSelected = job.difficulty === d;
              return (
                <Pressable
                  key={d}
                  onPress={() => handleSetDifficulty(d)}
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 10,
                    paddingHorizontal: 14,
                    borderRadius: DESIGN_TOKENS.radius.md,
                    backgroundColor: isSelected ? color + "20" : colors.backgroundSecondary,
                    borderWidth: isSelected ? 1.5 : 1,
                    borderColor: isSelected ? color : colors.border,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color, marginRight: 10 }} />
                  <Text style={{ fontSize: 14, color: isSelected ? color : colors.text, fontWeight: isSelected ? "700" : "400", flex: 1 }}>
                    {t(`jobDetails.difficulty.${d}` as any) ?? d}
                  </Text>
                  {isSelected && <Ionicons name="checkmark" size={16} color={color} />}
                </Pressable>
              );
            })}
            {job.difficulty && (
              <Pressable
                onPress={() => handleSetDifficulty(null)}
                style={({ pressed }) => ({
                  alignItems: "center",
                  paddingVertical: 8,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                  {t("common.remove" as any) ?? "Remove"}
                </Text>
              </Pressable>
            )}
          </Pressable>
        </Pressable>
      </Modal>

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
        ) : job.staff_assignment_status === "pending" ? (
          // ── Vue restreinte : employee non-confirmé (staff cross-company pending) ──
          <JobPendingStaffView
            job={job}
            onAccept={onAcceptStaffAssignment ?? (() => Promise.resolve())}
            onDecline={onDeclineStaffAssignment ?? (() => Promise.resolve())}
          />
        ) : (
          <>
            {/* ── Hero card : identité du job ── */}
            <JobHeroCard
              job={job}
              canEditDifficulty={job.permissions?.can_edit ?? false}
              onEditDifficulty={() => { track.userAction("difficulty_modal_open", { jobId: job?.id }); setIsDifficultyModalVisible(true); }}
            />

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
                onShowNoteModal={() => { track.userAction("note_modal_open", { jobId: job?.id }); setIsNoteModalVisible(true); }}
                onShowPhotoModal={() => { track.userAction("photo_modal_open", { jobId: job?.id }); setIsPhotoModalVisible(true); }}
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

            {/* Scorecard + bannière avis client (jobs complétés) */}
            {job.status === "completed" && (
              <ScorecardSummarySection job={job} />
            )}

            {/* Aperçu signature (si job signé) */}
            <SignaturePreviewSection job={job} />

            {/* Historique des actions du job */}
            <JobHistorySection jobId={String(job.id)} />
          </>
        )}
      </View>
    </>
  );
};

// ─────────────────────────────────────────────────────────────
// Vue restreinte : employee cross-company en attente d'acceptation
// ─────────────────────────────────────────────────────────────

const JobPendingStaffView: React.FC<{
  job: JobSummaryData;
  onAccept: (notes?: string) => Promise<void>;
  onDecline: (reason: string) => Promise<void>;
}> = ({ job, onAccept, onDecline }) => {
  const { colors } = useTheme();
  const { t } = useLocalization();

  const clientName =
    job.client?.name ||
    [job.client?.firstName, job.client?.lastName].filter(Boolean).join(" ").trim() ||
    null;

  const pickupAddress = job.addresses?.find((a) => a.type === "pickup") ?? job.addresses?.[0];
  const suburb = pickupAddress?.city || pickupAddress?.state || null;

  const formatDateTime = (iso: string | undefined) => {
    if (!iso) return { date: null, time: null };
    const d = new Date(iso);
    if (isNaN(d.getTime())) return { date: null, time: null };
    return {
      date: d.toLocaleDateString(undefined, { weekday: "short", day: "2-digit", month: "short", year: "numeric" }),
      time: d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
    };
  };

  const { date, time } = formatDateTime(job.start_window_start);
  const hourlyRate = job.hourly_rate ?? job.rate ?? null;
  const drivers = job.required_driver ?? 0;
  const offsiders = job.required_offsider ?? 0;
  const vehicles = job.required_vehicle ?? 0;

  return (
    <View style={{ gap: DESIGN_TOKENS.spacing.md }}>
      {/* ── Info card ── */}
      <View
        style={{
          backgroundColor: colors.backgroundSecondary,
          borderRadius: DESIGN_TOKENS.radius.lg,
          borderWidth: 1,
          borderColor: colors.border + "60",
          overflow: "hidden",
        }}
      >
        {/* Accent strip bleu */}
        <View style={{ height: 3, backgroundColor: "#3B82F6" }} />
        <View style={{ padding: DESIGN_TOKENS.spacing.md, gap: DESIGN_TOKENS.spacing.sm }}>
          {/* Code + client */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
            <Text style={{ fontSize: 18, fontWeight: "800", color: colors.text, letterSpacing: -0.3 }}>
              {job.code ?? `#${job.id}`}
            </Text>
            <View
              style={{
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: DESIGN_TOKENS.radius.full,
                backgroundColor: "#3B82F620",
                borderWidth: 1,
                borderColor: "#3B82F640",
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: "700", color: "#3B82F6" }}>
                {t("jobDetails.components.statusBanner.accepted" as any) ?? "Pending"}
              </Text>
            </View>
          </View>

          {/* Séparateur */}
          <View style={{ height: 1, backgroundColor: colors.border + "40" }} />

          {/* Infos */}
          <View style={{ gap: 10 }}>
            {clientName && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Ionicons name="person-outline" size={16} color={colors.textSecondary} />
                <Text style={{ fontSize: 14, color: colors.text, fontWeight: "500" }}>{clientName}</Text>
              </View>
            )}
            {suburb && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
                <Text style={{ fontSize: 14, color: colors.text, fontWeight: "500" }}>{suburb}</Text>
              </View>
            )}
            {date && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
                <Text style={{ fontSize: 14, color: colors.text, fontWeight: "500" }}>{date}</Text>
              </View>
            )}
            {time && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                <Text style={{ fontSize: 14, color: colors.text, fontWeight: "500" }}>{time}</Text>
              </View>
            )}
            {(drivers > 0 || offsiders > 0 || vehicles > 0) && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Ionicons name="people-outline" size={16} color={colors.textSecondary} />
                <Text style={{ fontSize: 14, color: colors.text, fontWeight: "500" }}>
                  {[
                    drivers > 0 ? `${drivers} driver${drivers > 1 ? "s" : ""}` : null,
                    offsiders > 0 ? `${offsiders} offsider${offsiders > 1 ? "s" : ""}` : null,
                    vehicles > 0 ? `${vehicles} vehicle${vehicles > 1 ? "s" : ""}` : null,
                  ].filter(Boolean).join(" · ")}
                </Text>
              </View>
            )}
            {hourlyRate != null && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Ionicons name="cash-outline" size={16} color={colors.textSecondary} />
                <Text style={{ fontSize: 14, color: colors.text, fontWeight: "600" }}>
                  ${Number(hourlyRate).toFixed(2)} / hr
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* ── Accept / Decline ── */}
      <JobAssignmentActions
        jobId={String(job.id)}
        jobTitle={job.code ?? String(job.id)}
        canAccept
        canDecline
        onAccept={onAccept}
        onDecline={onDecline}
      />
    </View>
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

const DIFFICULTY_CFG: Record<string, { color: string }> = {
  easy:   { color: "#22C55E" },
  medium: { color: "#3B82F6" },
  hard:   { color: "#F59E0B" },
  expert: { color: "#EF4444" },
};

const PAYMENT_CFG: Record<string, { color: string; labelKey: string }> = {
  paid:    { color: "#22C55E", labelKey: "paid" },
  partial: { color: "#F59E0B", labelKey: "partialPayment" },
  pending: { color: "#94A3B8", labelKey: "paymentPending" },
};

const JobHeroCard: React.FC<{
  job: JobSummaryData;
  canEditDifficulty?: boolean;
  onEditDifficulty?: () => void;
}> = ({ job, canEditDifficulty, onEditDifficulty }) => {
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

          {/* Difficulty chip (si présent) */}
          {job.difficulty && (
            <Pressable
              onPress={canEditDifficulty ? onEditDifficulty : undefined}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: DESIGN_TOKENS.radius.full,
                backgroundColor: DIFFICULTY_CFG[job.difficulty!].color + "18",
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: DIFFICULTY_CFG[job.difficulty!].color,
                }}
              />
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: "600",
                  color: DIFFICULTY_CFG[job.difficulty!].color,
                }}
              >
                {t(`jobDetails.difficulty.${job.difficulty}` as any) ?? job.difficulty}
              </Text>
            </Pressable>
          )}

          {/* Bouton d'ajout de difficulté (si aucune difficulté et peut éditer) */}
          {!job.difficulty && canEditDifficulty && (
            <Pressable
              onPress={onEditDifficulty}
              style={({ pressed }) => ({
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: DESIGN_TOKENS.radius.full,
                backgroundColor: colors.border + "30",
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text style={{ fontSize: 10, color: colors.textSecondary }}>
                + {t("jobDetails.difficulty.label" as any) ?? "Difficulty"}
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
};

export default JobSummary;
