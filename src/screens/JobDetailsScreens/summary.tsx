/**
 * Summary Page - Page de résumé du job avec modals améliorés
 */

import React, { useState } from "react";
import { View } from "react-native";
import { JobStepHistoryCard } from "../../components/jobDetails/JobStepHistoryCard";
import JobSummarySkeleton from "../../components/jobDetails/JobSummarySkeleton";
import JobTimerDisplay from "../../components/jobDetails/JobTimerDisplay";
import ImprovedNoteModal from "../../components/jobDetails/modals/ImprovedNoteModal";
import PhotoSelectionModal from "../../components/jobDetails/modals/PhotoSelectionModal";
import AddressesSection from "../../components/jobDetails/sections/AddressesSection";
import ClientDetailsSection from "../../components/jobDetails/sections/ClientDetailsSection";
import CompanyDetailsSection from "../../components/jobDetails/sections/CompanyDetailsSection";
import FinancialSummarySection from "../../components/jobDetails/sections/FinancialSummarySection";
import JobStatusBanner from "../../components/jobDetails/sections/JobStatusBanner";
import QuickActionsSection from "../../components/jobDetails/sections/QuickActionsSection";
import SignaturePreviewSection from "../../components/jobDetails/sections/SignaturePreviewSection";
import StaffingBannerSection from "../../components/jobDetails/sections/StaffingBannerSection";
import TimeWindowsSection from "../../components/jobDetails/sections/TimeWindowsSection";
import TransferBannerSection from "../../components/jobDetails/sections/TransferBannerSection";

import SigningBloc from "../../components/signingBloc";
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
}: {
  job: JobSummaryData;
  setJob: React.Dispatch<React.SetStateAction<JobSummaryData>>;
  onOpenPaymentPanel?: () => void;
  isLoading?: boolean;
  onRefresh?: () => void;
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
            {/* Bandeau de statut global */}
            <JobStatusBanner job={job} />

            {/* Bandeau de délégation active */}
            {job.active_transfer && (
              <TransferBannerSection
                jobId={String(job.id)}
                transfer={job.active_transfer}
                isOwner={job.permissions?.is_owner ?? false}
                canRespond={job.permissions?.can_respond_transfer ?? false}
                onTransferUpdated={onRefresh ?? (() => {})}
              />
            )}

            {/* Bandeau d'avancement du staffing (visible par A) */}
            {job.staffing_status && job.staffing_status !== "unassigned" && (
              <StaffingBannerSection
                staffingStatus={job.staffing_status}
                contractorName={job.contractor?.company_name?.toString()}
              />
            )}

            {/* Timer + Progression */}
            <JobTimerDisplay
              job={job}
              onOpenSignatureModal={() => setIsSigningVisible(true)}
              onOpenPaymentPanel={onOpenPaymentPanel}
            />

            {/* Historique des étapes (si disponible) */}
            {!!job?.timer_info?.step_history?.length && (
              <JobStepHistoryCard timerInfo={job.timer_info!} />
            )}

            {/* Actions rapides (contextuelles : masque Appeler/GPS si job terminé) */}
            <QuickActionsSection
              job={job}
              setJob={setJob}
              onAddNote={handleAddNote}
              onShowNoteModal={() => setIsNoteModalVisible(true)}
              onShowPhotoModal={() => setIsPhotoModalVisible(true)}
            />

            {/* Résumé financier (si données dispo) */}
            <FinancialSummarySection job={job} />

            {/* Aperçu signature (si job signé) */}
            <SignaturePreviewSection job={job} />

            {/* Informations entreprise (Contractee/Contractor) */}
            <CompanyDetailsSection job={job} />

            {/* Informations client */}
            <ClientDetailsSection job={job} />

            {/* Adresses */}
            <AddressesSection job={job} />

            {/* Créneaux horaires */}
            <TimeWindowsSection job={job} />
          </>
        )}
      </View>
    </>
  );
};

export default JobSummary;
