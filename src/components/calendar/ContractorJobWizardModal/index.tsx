/**
 * ContractorJobWizardModal
 */

import Ionicons from "@react-native-vector-icons/ionicons";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DESIGN_TOKENS } from "../../../constants/Styles";
import { useTheme } from "../../../context/ThemeProvider";
import { useStaff } from "../../../hooks/useStaff";
import { useVehicles } from "../../../hooks/useVehicles";
import { useTranslation } from "../../../localization";
import { assignStaffToJob } from "../../../services/crewService";
import { acceptJob, counterProposalJob, declineJob } from "../../../services/jobs";
import { createStyles } from "./styles";
import { ContractorJobWizardModalProps, formatDate, formatTime, WizardStep } from "./types";


export const ContractorJobWizardModal: React.FC<
  ContractorJobWizardModalProps
> = ({ visible, job, onClose, onJobUpdated }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { staff, isLoading: isStaffLoading, refreshStaff } = useStaff();
  const { vehicles } = useVehicles();

  const [step, setStep] = useState<WizardStep>("overview");
  const [declineReason, setDeclineReason] = useState("");
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [staffSearchQuery, setStaffSearchQuery] = useState("");

  // Contre-proposition
  const [proposedStart, setProposedStart] = useState("");
  const [proposedEnd, setProposedEnd] = useState("");
  const [proposedPrice, setProposedPrice] = useState("");
  const [priceType, setPriceType] = useState<"hourly" | "flat">("flat");
  const [proposedVehicleId, setProposedVehicleId] = useState<string | null>(
    null,
  );
  const [proposedDrivers, setProposedDrivers] = useState(0);
  const [proposedOffsiders, setProposedOffsiders] = useState(0);
  const [proposedPackers, setProposedPackers] = useState(0);
  const [counterNote, setCounterNote] = useState("");

  // RÃ©initialiser l'Ã©tat Ã  chaque ouverture
  useEffect(() => {
    if (visible && job) {
      // Si le job est en nÃ©gociation, montrer directement l'Ã©cran d'attente
      setStep(
        job.assignment_status === "negotiating"
          ? "counter_proposed"
          : "overview",
      );
      setDeclineReason("");
      setSelectedStaffIds([]);
      setStaffSearchQuery("");
      setIsSubmitting(false);
      // PrÃ©-remplir les crÃ©neaux avec les valeurs du job
      setProposedStart(job.time?.startWindowStart?.substring(11, 16) ?? "");
      setProposedEnd(job.time?.startWindowEnd?.substring(11, 16) ?? "");
      setProposedPrice(
        job.transfer?.pricing_amount != null
          ? String(job.transfer.pricing_amount)
          : "",
      );
      setPriceType(job.transfer?.pricing_type === "hourly" ? "hourly" : "flat");
      setProposedVehicleId(null);
      setProposedDrivers(job.transfer?.requested_drivers ?? 0);
      setProposedOffsiders(job.transfer?.requested_offsiders ?? 0);
      setProposedPackers(0);
      setCounterNote("");
    }
  }, [visible, job]);

  // Charger le staff quand on arrive Ã  l'Ã©tape d'assignation
  useEffect(() => {
    if (step === "assign_staff") {
      refreshStaff();
    }
  }, [step, refreshStaff]);

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Handlers
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const handleAccept = useCallback(async () => {
    if (!job) return;
    setIsSubmitting(true);
    try {
      await acceptJob(job.id);
      setStep("assign_staff");
    } catch {
      Alert.alert(t("common.error"), t("contractorWizard.errorAcceptJob"), [
        { text: t("common.ok") },
      ]);
    } finally {
      setIsSubmitting(false);
    }
  }, [job]);

  const handleDeclineConfirm = useCallback(async () => {
    if (!job) return;
    if (!declineReason.trim()) {
      Alert.alert(
        t("contractorWizard.reasonRequired"),
        t("contractorWizard.reasonRequiredMsg"),
      );
      return;
    }
    setIsSubmitting(true);
    try {
      await declineJob(job.id, declineReason.trim());
      setStep("declined");
      onJobUpdated();
    } catch {
      Alert.alert(t("common.error"), t("contractorWizard.errorDeclineJob"), [
        { text: t("common.ok") },
      ]);
    } finally {
      setIsSubmitting(false);
    }
  }, [job, declineReason, onJobUpdated]);

  const toggleStaff = useCallback((staffId: string) => {
    setSelectedStaffIds((prev) =>
      prev.includes(staffId)
        ? prev.filter((id) => id !== staffId)
        : [...prev, staffId],
    );
  }, []);

  const handleAssignAndFinish = useCallback(async () => {
    if (!job) return;
    setIsSubmitting(true);
    try {
      // Assigner chaque employÃ© sÃ©lectionnÃ©
      if (selectedStaffIds.length > 0) {
        await Promise.all(
          selectedStaffIds.map((staffId) =>
            assignStaffToJob(job.id, staffId).catch(() => {
              // Silently handle individual assignment failures
            }),
          ),
        );
      }
      setStep("success");
      onJobUpdated();
    } catch {
      Alert.alert(t("common.error"), t("contractorWizard.errorAssign"));
      setStep("success");
      onJobUpdated();
    } finally {
      setIsSubmitting(false);
    }
  }, [job, selectedStaffIds, onJobUpdated]);

  const handleSkipAssignment = useCallback(() => {
    setStep("success");
    onJobUpdated();
  }, [onJobUpdated]);

  const handleCounterProposal = useCallback(async () => {
    if (!job) return;
    if (!proposedStart || !proposedEnd) {
      Alert.alert(
        t("contractorWizard.slotsRequired"),
        t("contractorWizard.slotsRequiredMsg"),
      );
      return;
    }
    // Construire les datetimes ISO Ã  partir de la date du job + crÃ©neaux saisis
    const jobDate = job.time?.startWindowStart?.substring(0, 10) ?? "";
    const proposed_start = `${jobDate}T${proposedStart}:00.000Z`;
    const proposed_end = `${jobDate}T${proposedEnd}:00.000Z`;
    const parsedPrice = proposedPrice.trim()
      ? parseFloat(proposedPrice.replace(",", "."))
      : undefined;

    setIsSubmitting(true);
    try {
      await counterProposalJob(job.id, {
        proposed_start,
        proposed_end,
        proposed_price:
          parsedPrice && !isNaN(parsedPrice) ? parsedPrice : undefined,
        price_type: priceType,
        vehicle_id: proposedVehicleId ?? undefined,
        proposed_drivers: proposedDrivers,
        proposed_offsiders: proposedOffsiders,
        proposed_packers: proposedPackers,
        note: counterNote.trim() || undefined,
      });
      setStep("counter_proposed");
      onJobUpdated();
    } catch {
      Alert.alert(
        t("common.error"),
        t("contractorWizard.errorCounterProposal"),
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [
    job,
    proposedStart,
    proposedEnd,
    proposedPrice,
    counterNote,
    priceType,
    proposedVehicleId,
    proposedDrivers,
    proposedOffsiders,
    proposedPackers,
    onJobUpdated,
  ]);

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Filtered staff
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const filteredStaff = staff
    .filter((m) => m.status === "active")
    .filter((m) => {
      if (!staffSearchQuery) return true;
      const name = `${m.firstName} ${m.lastName}`.toLowerCase();
      const role = (m.role || "").toLowerCase();
      return (
        name.includes(staffSearchQuery.toLowerCase()) ||
        role.includes(staffSearchQuery.toLowerCase())
      );
    });


  // Styles
  const styles = createStyles(colors);

  if (!job) return null;

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Step helpers
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const isExternalJob =
    job.contractee &&
    job.contractor &&
    job.contractee.company_id !== job.contractor.company_id;

  const contracteeName =
    job.contractee?.company_name || t("contractorWizard.unknownCompany");

  const getPriorityColor = () => {
    switch (job.priority) {
      case "urgent":
        return colors.error;
      case "high":
        return colors.warning;
      case "medium":
        return colors.info;
      default:
        return colors.success;
    }
  };

  const getPriorityLabel = () => {
    switch (job.priority) {
      case "urgent":
        return t("contractorWizard.priorityUrgent");
      case "high":
        return t("contractorWizard.priorityHigh");
      case "medium":
        return t("contractorWizard.priorityMedium");
      default:
        return t("contractorWizard.priorityLow");
    }
  };

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Step renderers
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const renderOverview = () => (
    <>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Company banner */}
        {isExternalJob && (
          <View style={styles.companyBadge}>
            <Ionicons name="business" size={22} color={colors.info} />
            <View style={styles.companyBadgeText}>
              <Text style={styles.companyLabel}>
                {t("contractorWizard.assignedBy")}
              </Text>
              <Text style={styles.companyName}>{contracteeName}</Text>
              {job.contractee?.created_by_name && (
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.textSecondary,
                    marginTop: 1,
                  }}
                >
                  {t("contractorWizard.contact")} :{" "}
                  {job.contractee.created_by_name}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Assignment status */}
        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  job.assignment_status === "pending"
                    ? colors.warning + "22"
                    : job.assignment_status === "negotiating"
                      ? colors.info + "22"
                      : job.assignment_status === "accepted"
                        ? colors.success + "22"
                        : colors.backgroundTertiary,
              },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                {
                  color:
                    job.assignment_status === "pending"
                      ? colors.warning
                      : job.assignment_status === "negotiating"
                        ? colors.info
                        : job.assignment_status === "accepted"
                          ? colors.success
                          : colors.textSecondary,
                },
              ]}
            >
              {job.assignment_status === "pending"
                ? t("contractorWizard.pendingResponse")
                : job.assignment_status === "negotiating"
                  ? t("contractorWizard.counterProposalSent")
                  : job.assignment_status === "accepted"
                    ? t("contractorWizard.accepted")
                    : job.assignment_status === "declined"
                      ? t("contractorWizard.declined")
                      : t("contractorWizard.internalJob")}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getPriorityColor() + "20" },
            ]}
          >
            <Text style={[styles.statusText, { color: getPriorityColor() }]}>
              {t("contractorWizard.priority")} : {getPriorityLabel()}
            </Text>
          </View>
        </View>

        {/* Transfer details â€“ Ce qui est demandÃ© */}
        {isExternalJob && job.assignment_status === "pending" && (
          <>
            <Text style={styles.sectionTitle}>
              {t("contractorWizard.whatIsRequested")}
            </Text>
            <View style={styles.infoCard}>
              {/* Proposition â€“ description du rÃ´le */}
              {job.transfer?.delegated_role ? (
                <View
                  style={[
                    styles.infoRow,
                    {
                      backgroundColor: colors.primaryLight || "#EEF2FF",
                      borderRadius: DESIGN_TOKENS.borderRadius.md,
                      padding: 10,
                      marginBottom: 8,
                    },
                  ]}
                >
                  <Ionicons
                    name="briefcase-outline"
                    size={20}
                    color={colors.primary}
                    style={styles.infoIcon}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.infoLabel, { fontWeight: "700" }]}>
                      {t("contractorWizard.propositionLabel") || "Proposition"}
                    </Text>
                    <Text style={[styles.infoValue, { fontWeight: "600" }]}>
                      {job.transfer.delegated_role === "driver"
                        ? job.transfer.vehicle_label
                          ? `ÃŠtre chauffeur du camion ${job.transfer.vehicle_label}`
                          : "ÃŠtre chauffeur"
                        : job.transfer.delegated_role === "offsider"
                          ? "ÃŠtre offsider"
                          : job.transfer.delegated_role === "full_job"
                            ? "Job entier dÃ©lÃ©guÃ©"
                            : job.transfer.delegated_role_label ||
                              "RÃ´le personnalisÃ©"}
                    </Text>
                  </View>
                </View>
              ) : null}

              {/* Chauffeurs */}
              <View style={styles.infoRow}>
                <Ionicons
                  name="person-outline"
                  size={18}
                  color={colors.primary}
                  style={styles.infoIcon}
                />
                <View>
                  <Text style={styles.infoLabel}>
                    {t("contractorWizard.driversLabel")}
                  </Text>
                  <Text style={styles.infoValue}>
                    {job.transfer?.requested_drivers != null
                      ? String(job.transfer.requested_drivers)
                      : t("negotiation.notSpecified")}
                  </Text>
                </View>
              </View>

              {/* Offsiders */}
              <View style={styles.infoRow}>
                <Ionicons
                  name="people-outline"
                  size={18}
                  color={colors.primary}
                  style={styles.infoIcon}
                />
                <View>
                  <Text style={styles.infoLabel}>
                    {t("contractorWizard.offsidersLabel")}
                  </Text>
                  <Text style={styles.infoValue}>
                    {job.transfer?.requested_offsiders != null
                      ? String(job.transfer.requested_offsiders)
                      : t("negotiation.notSpecified")}
                  </Text>
                </View>
              </View>

              {/* Camion prÃ©fÃ©rÃ© */}
              {job.transfer?.preferred_truck_id != null && (
                <View style={styles.infoRow}>
                  <Ionicons
                    name="car-outline"
                    size={18}
                    color={colors.primary}
                    style={styles.infoIcon}
                  />
                  <View>
                    <Text style={styles.infoLabel}>
                      {t("contractorWizard.requestedTruck")}
                    </Text>
                    <Text style={styles.infoValue}>
                      #{job.transfer.preferred_truck_id}
                    </Text>
                  </View>
                </View>
              )}

              {/* Prix */}
              <View style={styles.infoRow}>
                <Ionicons
                  name="cash-outline"
                  size={18}
                  color={colors.success}
                  style={styles.infoIcon}
                />
                <View>
                  <Text style={styles.infoLabel}>
                    {job.transfer?.pricing_type === "hourly"
                      ? t("contractorWizard.hourlyPrice")
                      : job.transfer?.pricing_type === "daily"
                        ? t("contractorWizard.dailyPrice")
                        : t("contractorWizard.flatPrice")}
                  </Text>
                  <Text
                    style={[
                      styles.infoValue,
                      {
                        color:
                          job.transfer?.pricing_amount != null
                            ? colors.success
                            : colors.textSecondary,
                        fontWeight:
                          job.transfer?.pricing_amount != null ? "700" : "400",
                      },
                    ]}
                  >
                    {job.transfer?.pricing_amount != null
                      ? `${Number(job.transfer.pricing_amount).toLocaleString(
                          "en-AU",
                          {
                            style: "currency",
                            currency: "AUD",
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 2,
                          },
                        )}${job.transfer.pricing_type === "hourly" ? " / heure" : job.transfer.pricing_type === "daily" ? " / jour" : ""}`
                      : t("negotiation.notSpecified")}
                  </Text>
                </View>
              </View>

              {/* Type de comptage d'heures */}
              {job.transfer?.hour_counting_type ? (
                <View style={styles.infoRow}>
                  <Ionicons
                    name="time-outline"
                    size={18}
                    color={colors.primary}
                    style={styles.infoIcon}
                  />
                  <View>
                    <Text style={styles.infoLabel}>
                      {t("contractorWizard.hourCountingLabel") ||
                        "Comptage des heures"}
                    </Text>
                    <Text style={styles.infoValue}>
                      {job.transfer.hour_counting_type === "depot_to_depot"
                        ? "DÃ©pÃ´t Ã  dÃ©pÃ´t"
                        : "Sur site uniquement"}
                    </Text>
                  </View>
                </View>
              ) : null}

              {/* Note de ressource */}
              {job.transfer?.resource_note ? (
                <View style={styles.infoRow}>
                  <Ionicons
                    name="document-text-outline"
                    size={18}
                    color={colors.primary}
                    style={styles.infoIcon}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.infoLabel}>
                      {t("contractorWizard.resourceNote")}
                    </Text>
                    <Text style={[styles.infoValue, { flexWrap: "wrap" }]}>
                      {job.transfer.resource_note}
                    </Text>
                  </View>
                </View>
              ) : null}

              {/* Message */}
              {job.transfer?.transfer_message ? (
                <View style={styles.infoRow}>
                  <Ionicons
                    name="chatbubble-outline"
                    size={18}
                    color={colors.primary}
                    style={styles.infoIcon}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.infoLabel}>
                      {t("contractorWizard.messageLabel")}
                    </Text>
                    <Text style={[styles.infoValue, { flexWrap: "wrap" }]}>
                      {job.transfer.transfer_message}
                    </Text>
                  </View>
                </View>
              ) : null}
            </View>
          </>
        )}

        {/* Client info */}
        <Text style={styles.sectionTitle}>
          {t("contractorWizard.clientSection")}
        </Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons
              name="person-outline"
              size={18}
              color={colors.primary}
              style={styles.infoIcon}
            />
            <View>
              <Text style={styles.infoLabel}>
                {t("contractorWizard.nameLabel")}
              </Text>
              <Text style={styles.infoValue}>
                {job.client?.name ||
                  `${job.client?.firstName || ""} ${job.client?.lastName || ""}`.trim() ||
                  "â€”"}
              </Text>
            </View>
          </View>
          {job.client?.phone ? (
            <View style={styles.infoRow}>
              <Ionicons
                name="call-outline"
                size={18}
                color={colors.primary}
                style={styles.infoIcon}
              />
              <View>
                <Text style={styles.infoLabel}>
                  {t("contractorWizard.phoneLabel")}
                </Text>
                <Text style={styles.infoValue}>{job.client.phone}</Text>
              </View>
            </View>
          ) : null}
        </View>

        {/* Date & Time */}
        <Text style={styles.sectionTitle}>
          {t("contractorWizard.dateTimeSection")}
        </Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons
              name="calendar-outline"
              size={18}
              color={colors.primary}
              style={styles.infoIcon}
            />
            <View>
              <Text style={styles.infoLabel}>
                {t("contractorWizard.dateLabel")}
              </Text>
              <Text style={styles.infoValue}>
                {formatDate(job.time?.startWindowStart)}
              </Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Ionicons
              name="time-outline"
              size={18}
              color={colors.primary}
              style={styles.infoIcon}
            />
            <View>
              <Text style={styles.infoLabel}>
                {t("contractorWizard.slotLabel")}
              </Text>
              <Text style={styles.infoValue}>
                {formatTime(job.time?.startWindowStart)} â€“{" "}
                {formatTime(job.time?.startWindowEnd)}
              </Text>
            </View>
          </View>
          {job.estimatedDuration ? (
            <View style={styles.infoRow}>
              <Ionicons
                name="hourglass-outline"
                size={18}
                color={colors.primary}
                style={styles.infoIcon}
              />
              <View>
                <Text style={styles.infoLabel}>
                  {t("contractorWizard.estimatedDuration")}
                </Text>
                <Text style={styles.infoValue}>
                  {Math.floor(job.estimatedDuration / 60)}h
                  {job.estimatedDuration % 60 > 0
                    ? ` ${job.estimatedDuration % 60}min`
                    : ""}
                </Text>
              </View>
            </View>
          ) : null}
        </View>

        {/* Addresses */}
        {job.addresses?.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>
              {t("contractorWizard.addressesSection")}
            </Text>
            <View style={styles.infoCard}>
              {job.addresses.map((addr, i) => (
                <View key={i} style={styles.infoRow}>
                  <Ionicons
                    name={i === 0 ? "location" : "flag"}
                    size={18}
                    color={i === 0 ? colors.info : colors.success}
                    style={styles.infoIcon}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.infoLabel}>
                      {addr.type === "pickup"
                        ? t("contractorWizard.pickupLabel")
                        : addr.type === "delivery"
                          ? t("contractorWizard.deliveryLabel")
                          : addr.type}
                    </Text>
                    <Text style={styles.infoValue}>
                      {addr.street}
                      {addr.city ? `, ${addr.city}` : ""}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Notes */}
        {job.notes ? (
          <>
            <Text style={styles.sectionTitle}>
              {t("contractorWizard.notesSection")}
            </Text>
            <View style={styles.infoCard}>
              <Text
                style={{ fontSize: 14, color: colors.text, lineHeight: 20 }}
              >
                {job.notes}
              </Text>
            </View>
          </>
        ) : null}
      </ScrollView>

      {/* Action bar */}
      {job.assignment_status === "pending" && (
        <View style={styles.actionBar}>
          <Pressable
            style={styles.primaryActionBtn}
            onPress={() => setStep("decision")}
          >
            <Ionicons
              name="arrow-forward"
              size={18}
              color={colors.buttonPrimaryText}
            />
            <Text style={styles.primaryActionBtnText}>
              {t("contractorWizard.respond")}
            </Text>
          </Pressable>
        </View>
      )}
    </>
  );

  const renderDecision = () => (
    <>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Company reminder */}
        <View style={styles.companyBadge}>
          <Ionicons name="business" size={20} color={colors.info} />
          <View style={styles.companyBadgeText}>
            <Text style={styles.companyLabel}>
              {t("contractorWizard.jobFrom")}
            </Text>
            <Text style={styles.companyName}>{contracteeName}</Text>
          </View>
        </View>

        {/* Job reference */}
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>
            {t("contractorWizard.reference")}
          </Text>
          <Text style={[styles.infoValue, { fontSize: 16 }]}>
            {job.code || job.id}
          </Text>
          <Text
            style={[styles.infoLabel, { marginTop: DESIGN_TOKENS.spacing.sm }]}
          >
            Date
          </Text>
          <Text style={styles.infoValue}>
            {formatDate(job.time?.startWindowStart)} â€¢{" "}
            {formatTime(job.time?.startWindowStart)}
          </Text>
        </View>

        <View style={styles.decisionContainer}>
          <Text style={styles.decisionTitle}>
            {t("contractorWizard.acceptJobQuestion")}
          </Text>
          <View style={styles.decisionRow}>
            <Pressable
              style={({ pressed }) => [
                styles.declineBtn,
                { opacity: pressed ? 0.75 : 1 },
              ]}
              onPress={() => setStep("decline_reason")}
              disabled={isSubmitting}
            >
              <Ionicons
                name="close-circle-outline"
                size={20}
                color={colors.error}
              />
              <Text style={styles.declineBtnText}>
                {t("contractorWizard.refuse")}
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.acceptBtn,
                { opacity: pressed ? 0.75 : 1 },
              ]}
              onPress={handleAccept}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size={18} color={colors.success} />
              ) : (
                <Ionicons
                  name="checkmark-circle-outline"
                  size={20}
                  color={colors.success}
                />
              )}
              <Text style={styles.acceptBtnText}>
                {t("negotiation.accept")}
              </Text>
            </Pressable>
          </View>

          {/* Contre-proposition */}
          <Pressable
            testID="counter-proposal-btn"
            style={[
              styles.secondaryActionBtn,
              {
                marginTop: DESIGN_TOKENS.spacing.md,
                alignSelf: "center",
                flexDirection: "row",
                gap: 6,
              },
            ]}
            onPress={() => setStep("counter_proposal")}
            disabled={isSubmitting}
          >
            <Ionicons
              name="swap-horizontal-outline"
              size={16}
              color={colors.textSecondary}
            />
            <Text style={styles.secondaryActionBtnText}>
              {t("contractorWizard.newProposal")}
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      <View style={styles.actionBar}>
        <Pressable
          style={styles.secondaryActionBtn}
          onPress={() => setStep("overview")}
        >
          <Text style={styles.secondaryActionBtnText}>
            {t("contractorWizard.backButton")}
          </Text>
        </Pressable>
      </View>
    </>
  );

  const renderAssignStaff = () => (
    <>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
      >
        <View
          style={[
            styles.companyBadge,
            {
              backgroundColor: colors.success + "15",
              borderLeftColor: colors.success,
            },
          ]}
        >
          <Ionicons name="checkmark-circle" size={22} color={colors.success} />
          <View style={styles.companyBadgeText}>
            <Text style={[styles.companyLabel, { color: colors.success }]}>
              {t("contractorWizard.jobAccepted")}
            </Text>
            <Text style={styles.companyName}>
              {t("contractorWizard.assignEmployees")}
            </Text>
          </View>
        </View>

        <TextInput
          style={styles.searchInput}
          placeholder={t("contractorWizard.searchEmployee")}
          placeholderTextColor={colors.textSecondary}
          value={staffSearchQuery}
          onChangeText={setStaffSearchQuery}
        />

        {isStaffLoading ? (
          <ActivityIndicator
            size="large"
            color={colors.primary}
            style={{ marginTop: 20 }}
          />
        ) : filteredStaff.length === 0 ? (
          <View style={styles.emptyStaff}>
            <Ionicons
              name="people-outline"
              size={48}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyStaffText}>
              {t("contractorWizard.noActiveEmployee")}
            </Text>
          </View>
        ) : (
          filteredStaff.map((member) => {
            const isSelected = selectedStaffIds.includes(member.id);
            return (
              <Pressable
                key={member.id}
                style={[
                  styles.staffItem,
                  {
                    borderColor: isSelected ? colors.primary : colors.border,
                    backgroundColor: isSelected
                      ? colors.primary + "10"
                      : colors.backgroundSecondary,
                  },
                ]}
                onPress={() => toggleStaff(member.id)}
              >
                <View style={styles.staffAvatar}>
                  <Text style={styles.staffAvatarText}>
                    {(member.firstName[0] || "") + (member.lastName[0] || "")}
                  </Text>
                </View>
                <View style={styles.staffInfo}>
                  <Text style={styles.staffName}>
                    {member.firstName} {member.lastName}
                  </Text>
                  {member.role ? (
                    <Text style={styles.staffRole}>{member.role}</Text>
                  ) : null}
                </View>
                <View
                  style={[
                    styles.staffCheck,
                    {
                      borderColor: isSelected ? colors.primary : colors.border,
                      backgroundColor: isSelected
                        ? colors.primary
                        : "transparent",
                    },
                  ]}
                >
                  {isSelected && (
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  )}
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>

      <View style={styles.actionBar}>
        <Pressable
          style={styles.secondaryActionBtn}
          onPress={handleSkipAssignment}
          disabled={isSubmitting}
        >
          <Text style={styles.secondaryActionBtnText}>
            {t("contractorWizard.later")}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.primaryActionBtn, { opacity: isSubmitting ? 0.6 : 1 }]}
          onPress={handleAssignAndFinish}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size={18} color={colors.buttonPrimaryText} />
          ) : (
            <Ionicons
              name="checkmark"
              size={18}
              color={colors.buttonPrimaryText}
            />
          )}
          <Text style={styles.primaryActionBtnText}>
            {selectedStaffIds.length > 0
              ? t("contractorWizard.confirmCount", {
                  count: selectedStaffIds.length,
                })
              : t("contractorWizard.finish")}
          </Text>
        </Pressable>
      </View>
    </>
  );

  const renderDeclineReason = () => (
    <>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={[
            styles.companyBadge,
            {
              backgroundColor: colors.error + "12",
              borderLeftColor: colors.error,
            },
          ]}
        >
          <Ionicons
            name="close-circle-outline"
            size={22}
            color={colors.error}
          />
          <View style={styles.companyBadgeText}>
            <Text style={[styles.companyLabel, { color: colors.error }]}>
              {t("contractorWizard.jobRefusal")}
            </Text>
            <Text style={styles.companyName}>{job.code || job.id}</Text>
          </View>
        </View>

        <Text
          style={[
            styles.sectionTitle,
            { marginBottom: DESIGN_TOKENS.spacing.sm },
          ]}
        >
          {t("contractorWizard.refusalReason")}
        </Text>
        <TextInput
          style={styles.reasonInput}
          placeholder={t("contractorWizard.refusalPlaceholder")}
          placeholderTextColor={colors.textSecondary}
          value={declineReason}
          onChangeText={setDeclineReason}
          multiline
          maxLength={500}
          autoFocus
        />
        <Text
          style={{
            fontSize: 12,
            color: colors.textSecondary,
            textAlign: "right",
            marginTop: -DESIGN_TOKENS.spacing.sm,
          }}
        >
          {declineReason.length}/500
        </Text>
      </ScrollView>

      <View style={styles.actionBar}>
        <Pressable
          style={styles.secondaryActionBtn}
          onPress={() => setStep("decision")}
          disabled={isSubmitting}
        >
          <Text style={styles.secondaryActionBtnText}>
            {t("contractorWizard.backButton")}
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.dangerActionBtn,
            {
              opacity: isSubmitting || !declineReason.trim() ? 0.5 : 1,
            },
          ]}
          onPress={handleDeclineConfirm}
          disabled={isSubmitting || !declineReason.trim()}
        >
          {isSubmitting ? (
            <ActivityIndicator size={18} color="#fff" />
          ) : (
            <Ionicons name="close-circle" size={18} color="#fff" />
          )}
          <Text style={styles.dangerActionBtnText}>
            {t("contractorWizard.confirmRefusal")}
          </Text>
        </Pressable>
      </View>
    </>
  );

  const renderCounterProposal = () => {
    // Petit composant +/- pour les counts de ressources
    const CountRow = ({
      label,
      value,
      onInc,
      onDec,
      originalValue,
    }: {
      label: string;
      value: number;
      onInc: () => void;
      onDec: () => void;
      originalValue?: number | null;
    }) => (
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingVertical: DESIGN_TOKENS.spacing.sm,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <View>
          <Text style={{ fontSize: 14, color: colors.text, fontWeight: "500" }}>
            {label}
          </Text>
          {originalValue != null && (
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>
              {t("contractorWizard.requested")} : {originalValue}
            </Text>
          )}
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
          <Pressable
            onPress={onDec}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              borderWidth: 2,
              borderColor: value > 0 ? colors.warning : colors.border,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                fontSize: 20,
                lineHeight: 22,
                fontWeight: "700",
                color: value > 0 ? colors.warning : colors.border,
              }}
            >
              âˆ’
            </Text>
          </Pressable>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "700",
              color: colors.text,
              minWidth: 24,
              textAlign: "center",
            }}
          >
            {value}
          </Text>
          <Pressable
            onPress={onInc}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              borderWidth: 2,
              borderColor: colors.warning,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                fontSize: 20,
                lineHeight: 22,
                fontWeight: "700",
                color: colors.warning,
              }}
            >
              +
            </Text>
          </Pressable>
        </View>
      </View>
    );

    const origDrivers = job.transfer?.requested_drivers ?? null;
    const origOffsiders = job.transfer?.requested_offsiders ?? null;
    const origPrice = job.transfer?.pricing_amount;
    const origPriceType = job.transfer?.pricing_type;
    const hasVehicleRequest = job.transfer?.preferred_truck_id != null;
    const origStart = formatTime(job.time?.startWindowStart);
    const origEnd = formatTime(job.time?.startWindowEnd);

    return (
      <>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header badge */}
          <View
            style={[
              styles.companyBadge,
              {
                backgroundColor: colors.warning + "15",
                borderLeftColor: colors.warning,
              },
            ]}
          >
            <Ionicons
              name="swap-horizontal-outline"
              size={22}
              color={colors.warning}
            />
            <View style={styles.companyBadgeText}>
              <Text style={[styles.companyLabel, { color: colors.warning }]}>
                {t("contractorWizard.counterProposalLabel")}
              </Text>
              <Text style={styles.companyName}>{job.code || job.id}</Text>
            </View>
          </View>

          {/* RÃ©sumÃ© de la proposition originale */}
          <Text style={styles.sectionTitle}>
            {t("contractorWizard.originalProposal")}
          </Text>
          <View
            style={[
              styles.infoCard,
              {
                backgroundColor: colors.backgroundSecondary,
                borderRadius: DESIGN_TOKENS.radius.md,
                padding: DESIGN_TOKENS.spacing.md,
                gap: 6,
              },
            ]}
          >
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>
              ðŸ“… {formatDate(job.time?.startWindowStart)} Â· {origStart} â€“{" "}
              {origEnd}
            </Text>
            {origPrice != null && (
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                ðŸ’°{" "}
                {origPriceType === "hourly"
                  ? `${origPrice} A$/h`
                  : `${origPrice} A$ (forfait)`}
              </Text>
            )}
            {origDrivers != null && (
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                ðŸš— Chauffeurs : {origDrivers} Â· Offsiders : {origOffsiders ?? 0}
              </Text>
            )}
            {hasVehicleRequest && (
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                ðŸš› Camion demandÃ© : #{job.transfer?.preferred_truck_id}
              </Text>
            )}
          </View>

          {/* CrÃ©neau */}
          <Text style={styles.sectionTitle}>
            {t("contractorWizard.newSlot")}
          </Text>
          <View
            style={{
              flexDirection: "row",
              gap: DESIGN_TOKENS.spacing.md,
              marginBottom: DESIGN_TOKENS.spacing.md,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.infoLabel, { marginBottom: 4 }]}>
                {t("contractorWizard.startHHMM")}
              </Text>
              <TextInput
                style={styles.searchInput}
                placeholder="ex: 09:00"
                placeholderTextColor={colors.textSecondary}
                value={proposedStart}
                onChangeText={setProposedStart}
                keyboardType="numbers-and-punctuation"
                maxLength={5}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.infoLabel, { marginBottom: 4 }]}>
                {t("contractorWizard.endHHMM")}
              </Text>
              <TextInput
                style={styles.searchInput}
                placeholder="ex: 14:00"
                placeholderTextColor={colors.textSecondary}
                value={proposedEnd}
                onChangeText={setProposedEnd}
                keyboardType="numbers-and-punctuation"
                maxLength={5}
              />
            </View>
          </View>

          {/* Prix */}
          <Text style={styles.sectionTitle}>
            {t("contractorWizard.proposedPrice")}
          </Text>
          <View
            style={{
              flexDirection: "row",
              gap: DESIGN_TOKENS.spacing.sm,
              marginBottom: DESIGN_TOKENS.spacing.sm,
            }}
          >
            {(["flat", "hourly"] as const).map((type) => (
              <Pressable
                key={type}
                onPress={() => setPriceType(type)}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: DESIGN_TOKENS.radius.md,
                  alignItems: "center",
                  borderWidth: 2,
                  borderColor:
                    priceType === type ? colors.warning : colors.border,
                  backgroundColor:
                    priceType === type
                      ? colors.warning + "15"
                      : colors.backgroundTertiary,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "700",
                    color:
                      priceType === type
                        ? colors.warning
                        : colors.textSecondary,
                  }}
                >
                  {type === "flat"
                    ? t("contractorWizard.flatType")
                    : t("contractorWizard.hourlyType")}
                </Text>
              </Pressable>
            ))}
          </View>
          <TextInput
            testID="counter-proposal-price-input"
            style={[
              styles.searchInput,
              { marginBottom: DESIGN_TOKENS.spacing.md },
            ]}
            placeholder={priceType === "hourly" ? "ex: 85" : "ex: 320"}
            placeholderTextColor={colors.textSecondary}
            value={proposedPrice}
            onChangeText={setProposedPrice}
            keyboardType="decimal-pad"
            maxLength={10}
          />

          {/* VÃ©hicule â€” seulement si le commanditaire a demandÃ© un vÃ©hicule */}
          {hasVehicleRequest && vehicles.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>
                {t("contractorWizard.proposedVehicle")}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginBottom: DESIGN_TOKENS.spacing.md }}
                contentContainerStyle={{ gap: DESIGN_TOKENS.spacing.sm }}
              >
                {/* Option "aucun" */}
                <Pressable
                  onPress={() => setProposedVehicleId(null)}
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderRadius: DESIGN_TOKENS.radius.md,
                    borderWidth: 2,
                    borderColor:
                      proposedVehicleId === null ? colors.error : colors.border,
                    backgroundColor:
                      proposedVehicleId === null
                        ? colors.error + "15"
                        : colors.backgroundTertiary,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "700",
                      color:
                        proposedVehicleId === null
                          ? colors.error
                          : colors.textSecondary,
                    }}
                  >
                    {t("contractorWizard.noneOption")}
                  </Text>
                </Pressable>
                {vehicles.map((v) => (
                  <Pressable
                    key={v.id}
                    onPress={() =>
                      setProposedVehicleId(
                        proposedVehicleId === v.id ? null : v.id,
                      )
                    }
                    style={{
                      paddingVertical: 8,
                      paddingHorizontal: 12,
                      borderRadius: DESIGN_TOKENS.radius.md,
                      borderWidth: 2,
                      borderColor:
                        proposedVehicleId === v.id
                          ? colors.primary
                          : colors.border,
                      backgroundColor:
                        proposedVehicleId === v.id
                          ? colors.primary + "15"
                          : colors.backgroundTertiary,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "700",
                        color:
                          proposedVehicleId === v.id
                            ? colors.primary
                            : colors.text,
                      }}
                    >
                      {v.make} {v.model}
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                      {v.registration}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </>
          )}

          {/* Ressources */}
          <Text style={styles.sectionTitle}>
            {t("contractorWizard.proposedResources")}
          </Text>
          <View
            style={[
              styles.infoCard,
              {
                backgroundColor: colors.backgroundSecondary,
                borderRadius: DESIGN_TOKENS.radius.md,
                padding: DESIGN_TOKENS.spacing.md,
              },
            ]}
          >
            <CountRow
              label={t("contractorWizard.driversLabel")}
              value={proposedDrivers}
              originalValue={origDrivers}
              onInc={() => setProposedDrivers((n) => Math.min(n + 1, 10))}
              onDec={() => setProposedDrivers((n) => Math.max(n - 1, 0))}
            />
            <CountRow
              label={t("contractorWizard.offsidersLabel")}
              value={proposedOffsiders}
              originalValue={origOffsiders}
              onInc={() => setProposedOffsiders((n) => Math.min(n + 1, 10))}
              onDec={() => setProposedOffsiders((n) => Math.max(n - 1, 0))}
            />
            <CountRow
              label={t("contractorWizard.packersLabel")}
              value={proposedPackers}
              originalValue={null}
              onInc={() => setProposedPackers((n) => Math.min(n + 1, 10))}
              onDec={() => setProposedPackers((n) => Math.max(n - 1, 0))}
            />
          </View>

          {/* Note */}
          <Text
            style={[
              styles.sectionTitle,
              { marginTop: DESIGN_TOKENS.spacing.md },
            ]}
          >
            {t("contractorWizard.noteOptional")}
          </Text>
          <TextInput
            style={styles.reasonInput}
            placeholder={t("contractorWizard.counterNotePlaceholder")}
            placeholderTextColor={colors.textSecondary}
            value={counterNote}
            onChangeText={setCounterNote}
            multiline
            maxLength={400}
          />
        </ScrollView>

        <View style={styles.actionBar}>
          <Pressable
            style={styles.secondaryActionBtn}
            onPress={() => setStep("decision")}
            disabled={isSubmitting}
          >
            <Text style={styles.secondaryActionBtnText}>
              {t("contractorWizard.backButton")}
            </Text>
          </Pressable>
          <Pressable
            testID="counter-proposal-submit-btn"
            style={[
              styles.primaryActionBtn,
              {
                backgroundColor: colors.warning,
                opacity:
                  isSubmitting || !proposedStart || !proposedEnd ? 0.5 : 1,
              },
            ]}
            onPress={handleCounterProposal}
            disabled={isSubmitting || !proposedStart || !proposedEnd}
          >
            {isSubmitting ? (
              <ActivityIndicator size={18} color="#fff" />
            ) : (
              <Ionicons name="swap-horizontal" size={18} color="#fff" />
            )}
            <Text style={styles.primaryActionBtnText}>
              {t("contractorWizard.sendProposal")}
            </Text>
          </Pressable>
        </View>
      </>
    );
  };

  const renderCounterProposed = () => (
    <>
      <View style={{ flex: 1, justifyContent: "center" }}>
        <View style={styles.resultContainer}>
          <View
            style={[
              styles.resultIcon,
              { backgroundColor: colors.warning + "20" },
            ]}
          >
            <Ionicons name="swap-horizontal" size={44} color={colors.warning} />
          </View>
          <Text style={styles.resultTitle}>
            {t("contractorWizard.proposalSent")}
          </Text>
          <Text style={styles.resultSubtitle}>
            {t("contractorWizard.proposalSentDesc", {
              company: contracteeName,
            })}
          </Text>
        </View>
      </View>
      <View style={styles.actionBar}>
        <Pressable style={styles.primaryActionBtn} onPress={onClose}>
          <Ionicons
            name="checkmark"
            size={18}
            color={colors.buttonPrimaryText}
          />
          <Text style={styles.primaryActionBtnText}>{t("common.close")}</Text>
        </Pressable>
      </View>
    </>
  );

  const renderSuccess = () => (
    <>
      <View style={{ flex: 1, justifyContent: "center" }}>
        <View style={styles.resultContainer}>
          <View
            style={[
              styles.resultIcon,
              { backgroundColor: colors.success + "20" },
            ]}
          >
            <Ionicons
              name="checkmark-circle"
              size={44}
              color={colors.success}
            />
          </View>
          <Text style={styles.resultTitle}>
            {t("contractorWizard.jobAcceptedSuccess")}
          </Text>
          <Text style={styles.resultSubtitle}>
            {selectedStaffIds.length > 0
              ? t("contractorWizard.employeesAssigned", {
                  count: selectedStaffIds.length,
                })
              : t("contractorWizard.jobAcceptedNoStaff")}
          </Text>
        </View>
      </View>
      <View style={styles.actionBar}>
        <Pressable style={styles.primaryActionBtn} onPress={onClose}>
          <Ionicons
            name="checkmark"
            size={18}
            color={colors.buttonPrimaryText}
          />
          <Text style={styles.primaryActionBtnText}>{t("common.close")}</Text>
        </Pressable>
      </View>
    </>
  );

  const renderDeclined = () => (
    <>
      <View style={{ flex: 1, justifyContent: "center" }}>
        <View style={styles.resultContainer}>
          <View
            style={[
              styles.resultIcon,
              { backgroundColor: colors.error + "20" },
            ]}
          >
            <Ionicons name="close-circle" size={44} color={colors.error} />
          </View>
          <Text style={styles.resultTitle}>
            {t("contractorWizard.jobDeclined")}
          </Text>
          <Text style={styles.resultSubtitle}>
            {t("contractorWizard.jobDeclinedDesc", { company: contracteeName })}
          </Text>
        </View>
      </View>
      <View style={styles.actionBar}>
        <Pressable style={styles.primaryActionBtn} onPress={onClose}>
          <Text style={styles.primaryActionBtnText}>{t("common.close")}</Text>
        </Pressable>
      </View>
    </>
  );

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Step config
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const stepConfig: Record<WizardStep, { label: string; title: string }> = {
    overview: {
      label: t("contractorWizard.stepOverview"),
      title: t("contractorWizard.stepOverviewTitle"),
    },
    decision: {
      label: t("contractorWizard.stepDecision"),
      title: t("contractorWizard.stepDecisionTitle"),
    },
    assign_staff: {
      label: t("contractorWizard.stepTeam"),
      title: t("contractorWizard.stepTeamTitle"),
    },
    decline_reason: {
      label: t("contractorWizard.stepRefusal"),
      title: t("contractorWizard.stepRefusalTitle"),
    },
    counter_proposal: {
      label: t("contractorWizard.stepCounter"),
      title: t("contractorWizard.stepCounterTitle"),
    },
    counter_proposed: {
      label: t("contractorWizard.stepDone"),
      title: t("contractorWizard.proposalSent"),
    },
    success: {
      label: t("contractorWizard.stepDone"),
      title: t("contractorWizard.stepConfirmed"),
    },
    declined: {
      label: t("contractorWizard.stepDone"),
      title: t("contractorWizard.stepDeclinedTitle"),
    },
  };

  const { label: stepLabel, title: stepTitle } = stepConfig[step];

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Render
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.sheet} edges={["bottom"]}>
          {/* Handle bar */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.stepLabel}>{stepLabel}</Text>
              <Text style={styles.headerTitle}>{stepTitle}</Text>
            </View>
            {step !== "success" && step !== "declined" && (
              <Pressable
                style={styles.closeButton}
                onPress={onClose}
                hitSlop={8}
              >
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </Pressable>
            )}
          </View>

          {/* Step content */}
          {step === "overview" && renderOverview()}
          {step === "decision" && renderDecision()}
          {step === "assign_staff" && renderAssignStaff()}
          {step === "decline_reason" && renderDeclineReason()}
          {step === "counter_proposal" && renderCounterProposal()}
          {step === "counter_proposed" && renderCounterProposed()}
          {step === "success" && renderSuccess()}
          {step === "declined" && renderDeclined()}
        </SafeAreaView>
      </View>
    </Modal>
  );
};

export default ContractorJobWizardModal;
