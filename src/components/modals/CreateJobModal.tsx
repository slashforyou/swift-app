/**
 * CreateJobModal - Modal pour créer un nouveau job
 * Permet de créer un job avec client, adresse, date/heure, et notes
 */
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
    DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { DESIGN_TOKENS } from "../../constants/Styles";
import { useTheme } from "../../context/ThemeProvider";
import { useBusinessStaff } from "../../hooks/business/useBusinessStaff";
import { useBusinessVehicles } from "../../hooks/business/useBusinessVehicles";
import { useClients } from "../../hooks/useClients";
import { getLocale, useLocalization } from "../../localization";
import {
    fetchModularTemplates,
    getDefaultModularTemplates,
} from "../../services/business/templatesService";
import {
    ClientAPI,
    createClient,
    CreateClientRequest,
    fetchClients,
} from "../../services/clients";
import { CreateJobRequest } from "../../services/jobs";
import {
    JobSegmentTemplate,
    ModularJobTemplate,
    SegmentType,
} from "../../types/jobSegment";

interface CreateJobModalProps {
  visible: boolean;
  onClose: () => void;
  onCreateJob: (data: CreateJobRequest) => Promise<void>;
  selectedDate?: Date;
}

type Step =
  | "client"
  | "new-client"
  | "organization"
  | "schedule"
  | "details"
  | "pricing"
  | "confirmation";

const PRIORITY_OPTIONS = [
  { key: "low" as const, label: "Low", emoji: "🟢", color: "#22c55e" },
  { key: "medium" as const, label: "Medium", emoji: "🟡", color: "#eab308" },
  { key: "high" as const, label: "High", emoji: "🟠", color: "#f97316" },
  { key: "urgent" as const, label: "Urgent", emoji: "🔴", color: "#ef4444" },
];

// Default time margin for job windows (in hours)
// This will be configurable in settings later
export const DEFAULT_JOB_TIME_MARGIN_HOURS = 4;

const ADDRESS_TYPES = [
  { key: "pickup", label: "Pickup Address", emoji: "📦" },
  { key: "dropoff", label: "Dropoff Address", emoji: "🏠" },
];

// États australiens pour le picker
const AUSTRALIAN_STATES = [
  { key: "NSW", label: "New South Wales" },
  { key: "VIC", label: "Victoria" },
  { key: "QLD", label: "Queensland" },
  { key: "WA", label: "Western Australia" },
  { key: "SA", label: "South Australia" },
  { key: "TAS", label: "Tasmania" },
  { key: "ACT", label: "Australian Capital Territory" },
  { key: "NT", label: "Northern Territory" },
];

// Types de véhicules disponibles
const VEHICLE_TYPES = [
  { key: "van", label: "Van", emoji: "🚐" },
  { key: "truck", label: "Truck", emoji: "🚚" },
  { key: "2-ton", label: "2 Ton Truck", emoji: "🚛" },
  { key: "pantech", label: "Pantech", emoji: "📦" },
];

// Options d'extras pour les déménagements
const EXTRAS_OPTIONS = [
  { key: "piano", label: "Piano", emoji: "🎹" },
  { key: "pool_table", label: "Pool Table", emoji: "🎱" },
  { key: "heavy_items", label: "Heavy Items (>100kg)", emoji: "🏋️" },
  { key: "antiques", label: "Antiques/Fragile", emoji: "🏺" },
  { key: "disassembly", label: "Furniture Disassembly", emoji: "🔧" },
  { key: "packing", label: "Packing Service", emoji: "📦" },
  { key: "storage", label: "Storage Required", emoji: "🏠" },
  { key: "stairs", label: "Stairs Access", emoji: "🪜" },
  { key: "lift", label: "Lift Available", emoji: "🛗" },
];

// Options de mode de paiement
const PAYMENT_METHOD_OPTIONS = [
  { key: "cash", label: "Cash", emoji: "💵" },
  { key: "card", label: "Card", emoji: "💳" },
  { key: "bank_transfer", label: "Bank Transfer", emoji: "🏦" },
  { key: "invoice", label: "Invoice Later", emoji: "📄" },
];

// Options d'arrondi du temps
const TIME_ROUNDING_OPTIONS = [
  { key: 1, label: "1 min", marginMinutes: 0 },
  { key: 15, label: "15 min", marginMinutes: 2 },
  { key: 30, label: "30 min", marginMinutes: 7 },
  { key: 60, label: "1h", marginMinutes: 7 },
];

// Options de durée minimum facturable (en heures)
const MINIMUM_HOURS_OPTIONS = [
  { key: 1, label: "1h" },
  { key: 1.5, label: "1.5h" },
  { key: 2, label: "2h" },
  { key: 3, label: "3h" },
  { key: 4, label: "4h" },
];

// Options de call-out fee (en minutes)
const CALL_OUT_FEE_OPTIONS = [
  { key: 0, label: "0 min" },
  { key: 15, label: "15 min" },
  { key: 30, label: "30 min" },
  { key: 45, label: "45 min" },
  { key: 60, label: "1h" },
];

export default function CreateJobModal({
  visible,
  onClose,
  onCreateJob,
  selectedDate,
}: CreateJobModalProps) {
  const { colors } = useTheme();
  const { t, currentLanguage } = useLocalization();
  const {
    clients,
    isLoading: isLoadingClients,
    error: clientsError,
    refetch: refetchClients,
  } = useClients();

  // Business hooks for staff and vehicles
  const {
    staff: staffList,
    isLoading: isLoadingStaff,
    getActiveStaff,
  } = useBusinessStaff();
  const {
    vehicles: vehiclesList,
    isLoading: isLoadingVehicles,
    getActiveVehicles,
  } = useBusinessVehicles();

  const [step, setStep] = useState<Step>("client");
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Scroll reset when step changes
  const stepScrollRef = useRef<any>(null);
  useEffect(() => {
    if (stepScrollRef.current?.scrollTo) {
      stepScrollRef.current.scrollTo({ y: 0, animated: false });
    } else if (stepScrollRef.current?.scrollToPosition) {
      stepScrollRef.current.scrollToPosition(0, 0, false);
    }
  }, [step]);

  // Form state
  const [selectedClient, setSelectedClient] = useState<ClientAPI | null>(null);
  const [addresses, setAddresses] = useState<CreateJobRequest["addresses"]>([
    { type: "pickup", street: "", city: "", state: "", zip: "" },
    { type: "dropoff", street: "", city: "", state: "", zip: "" },
  ]);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [priority, setPriority] =
    useState<CreateJobRequest["priority"]>("medium");
  const [estimatedDuration, setEstimatedDuration] = useState("4");
  const [notes, setNotes] = useState("");

  // 🧩 Organization / Template state
  const [templates, setTemplates] = useState<ModularJobTemplate[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] =
    useState<ModularJobTemplate | null>(null);
  const [jobSegments, setJobSegments] = useState<
    (JobSegmentTemplate & {
      address?: { street: string; city: string; state: string; zip: string };
    })[]
  >([]);

  // Staff, Vehicle and Extras state
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [selectedVehicleType, setSelectedVehicleType] = useState<string | null>(
    null,
  );
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [showStaffPicker, setShowStaffPicker] = useState(false);
  const [showVehiclePicker, setShowVehiclePicker] = useState(false);

  // Payment state
  const [amountTotal, setAmountTotal] = useState("");
  const [depositRequired, setDepositRequired] = useState(false);
  const [depositPercentage, setDepositPercentage] = useState("50");
  const [depositPaid, setDepositPaid] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);

  // 💰 Pricing state
  const [hourlyRate, setHourlyRate] = useState("180"); // $180 AUD par défaut
  const [minimumHours, setMinimumHours] = useState(2); // 2h minimum par défaut
  const [callOutFeeMinutes, setCallOutFeeMinutes] = useState(30); // 30 min par défaut
  const [depotToDepot, setDepotToDepot] = useState(false); // Désactivé par défaut
  const [timeRounding, setTimeRounding] = useState(30); // 30 min par défaut

  // New client form state
  const [newClientData, setNewClientData] = useState<CreateClientRequest>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
  });
  const [isCreatingClient, setIsCreatingClient] = useState(false);

  // State picker modal
  const [showStatePicker, setShowStatePicker] = useState(false);
  const [currentAddressIndex, setCurrentAddressIndex] = useState(0);

  // Date/Time picker states
  const [jobDate, setJobDate] = useState<Date>(selectedDate || new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  // Helper to convert "HH:MM" string to Date object
  const timeStringToDate = (timeStr: string): Date => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    const date = new Date();
    date.setHours(hours || 9, minutes || 0, 0, 0);
    return date;
  };

  // Helper to convert Date object to "HH:MM" string
  const dateToTimeString = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  // Filter clients based on search
  const filteredClients = useMemo(() => {
    // Sécurité : s'assurer que clients est un tableau
    const clientList = Array.isArray(clients) ? clients : [];
    if (!searchQuery) return clientList;
    const query = searchQuery.toLowerCase();
    return clientList.filter(
      (client) =>
        (client.firstName?.toLowerCase() ?? "").includes(query) ||
        (client.lastName?.toLowerCase() ?? "").includes(query) ||
        (client.email?.toLowerCase() ?? "").includes(query) ||
        (client.phone ?? "").includes(query),
    );
  }, [clients, searchQuery]);

  const resetModal = () => {
    setStep("client");
    setSelectedClient(null);
    setSearchQuery("");
    setAddresses([
      { type: "pickup", street: "", city: "", state: "", zip: "" },
      { type: "dropoff", street: "", city: "", state: "", zip: "" },
    ]);
    setStartTime("09:00");
    setEndTime("17:00");
    setPriority("medium");
    setEstimatedDuration("4");
    setNotes("");
    setSelectedStaffId(null);
    setSelectedVehicleType(null);
    setSelectedExtras([]);
    setShowStaffPicker(false);
    setShowVehiclePicker(false);
    // Reset payment state
    setAmountTotal("");
    setDepositRequired(false);
    setDepositPercentage("50");
    setDepositPaid(false);
    setPaymentMethod(null);
    // Reset pricing state
    setHourlyRate("180");
    setMinimumHours(2);
    setCallOutFeeMinutes(30);
    setDepotToDepot(false);
    setTimeRounding(30);
    // Reset organization state
    setSelectedTemplate(null);
    setJobSegments([]);
    setNewClientData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      company: "",
    });
    setIsCreatingClient(false);
  };

  useEffect(() => {
    if (!visible) {
      resetModal();
    }
  }, [visible]);

  // Fetch modular templates when modal opens
  useEffect(() => {
    if (visible && templates.length === 0) {
      setIsLoadingTemplates(true);
      fetchModularTemplates()
        .then((data) => setTemplates(data))
        .catch(() => setTemplates(getDefaultModularTemplates()))
        .finally(() => setIsLoadingTemplates(false));
    }
  }, [visible]);

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const handleSelectClient = (client: ClientAPI) => {
    setSelectedClient(client);
    // Pre-fill address from client if available
    if (client.address) {
      setAddresses([
        { type: "pickup", ...client.address },
        { type: "dropoff", street: "", city: "", state: "", zip: "" },
      ]);
    }
    setStep("organization");
  };

  const updateAddress = (index: number, field: string, value: string) => {
    const newAddresses = [...addresses];
    newAddresses[index] = { ...newAddresses[index], [field]: value };
    setAddresses(newAddresses);
  };

  const validateAddress = (
    address: CreateJobRequest["addresses"][0],
  ): boolean => {
    return (
      address.street.length > 0 &&
      address.city.length > 0 &&
      address.state.length > 0
    );
  };

  const canProceedFromAddress = (): boolean => {
    return addresses.every((addr) => validateAddress(addr));
  };

  const validateTime = (time: string): boolean => {
    const pattern = /^([01]\d|2[0-3]):([0-5]\d)$/;
    return pattern.test(time);
  };

  const canProceedFromSchedule = (): boolean => {
    return validateTime(startTime) && validateTime(endTime);
  };

  const handleSubmit = async () => {
    if (!selectedClient) return;

    setIsLoading(true);
    try {
      const jobDate = selectedDate || new Date();

      // Calculate start window: from startTime to startTime + margin
      const startWindowStart = new Date(jobDate);
      const [startHour, startMinute] = startTime.split(":");
      startWindowStart.setHours(
        parseInt(startHour),
        parseInt(startMinute),
        0,
        0,
      );

      const startWindowEnd = new Date(startWindowStart);
      startWindowEnd.setHours(
        startWindowEnd.getHours() + DEFAULT_JOB_TIME_MARGIN_HOURS,
      );

      // Calculate end window: from endTime to endTime + margin
      const endWindowStart = new Date(jobDate);
      const [endHour, endMinute] = endTime.split(":");
      endWindowStart.setHours(parseInt(endHour), parseInt(endMinute), 0, 0);

      const endWindowEnd = new Date(endWindowStart);
      endWindowEnd.setHours(
        endWindowEnd.getHours() + DEFAULT_JOB_TIME_MARGIN_HOURS,
      );

      const jobData: CreateJobRequest = {
        client_id: selectedClient.id,
        status: "pending",
        priority,
        addresses,
        time: {
          startWindowStart: startWindowStart.toISOString(),
          startWindowEnd: startWindowEnd.toISOString(),
          endWindowStart: endWindowStart.toISOString(),
          endWindowEnd: endWindowEnd.toISOString(),
        },
        estimatedDuration: parseInt(estimatedDuration) * 60, // Convert hours to minutes
        notes: notes || undefined,
        assigned_staff_id: selectedStaffId || undefined,
        truck: selectedVehicleType
          ? {
              licensePlate: "",
              name:
                VEHICLE_TYPES.find((v) => v.key === selectedVehicleType)
                  ?.label || selectedVehicleType,
            }
          : undefined,
        extras: selectedExtras.length > 0 ? selectedExtras : undefined,
        // Payment details
        amount_total: amountTotal ? parseFloat(amountTotal) : undefined,
        payment_method: paymentMethod || undefined,
        deposit_required: depositRequired,
        deposit_percentage: depositRequired
          ? parseFloat(depositPercentage)
          : undefined,
        deposit_paid: depositRequired ? depositPaid : undefined,
        // Pricing configuration
        hourly_rate: parseFloat(hourlyRate || "180"),
        minimum_hours: minimumHours,
        call_out_fee_minutes: depotToDepot ? 0 : callOutFeeMinutes,
        depot_to_depot: depotToDepot,
        time_rounding_minutes: timeRounding,
        // Template / segments
        template_id: selectedTemplate?.id || undefined,
        billing_mode: selectedTemplate?.billingMode || undefined,
        segments: jobSegments.length > 0
          ? jobSegments.map((seg) => ({
              id: seg.id,
              templateSegmentId: seg.id,
              order: seg.order,
              type: seg.type,
              label: seg.label,
              locationType: seg.locationType,
              isBillable: seg.isBillable,
              assignedEmployees: [],
            }))
          : undefined,
      };

      await onCreateJob(jobData);
      return true; // Return success status
    } catch (error: any) {
      console.error("❌ [CreateJobModal] Error creating job:", error);
      console.error("❌ [CreateJobModal] Error details:", {
        message: error?.message,
        status: error?.status,
        response: error?.response,
      });

      // Show more detailed error message
      const errorMessage =
        error?.message || error?.response?.data?.message || "Unknown error";
      Alert.alert(
        t("common.error"),
        `${t("jobs.createError") || "Failed to create job."}\n\nDetails: ${errorMessage}`,
      );
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Handle submit and close
  const handleSubmitAndClose = async () => {
    const success = await handleSubmit();
    if (success) {
      handleClose();
    }
  };

  // Handle submit and create another
  const handleSubmitAndAddAnother = async () => {
    const success = await handleSubmit();
    if (success) {
      resetModal(); // Reset form but keep modal open
      Alert.alert(
        t("common.success"),
        t("jobs.createSuccessAddAnother") ||
          "Job created! You can now add another.",
      );
    }
  };

  const getStepNumber = (s: Step): number => {
    const steps: Step[] = [
      "client",
      "organization",
      "schedule",
      "details",
      "pricing",
      "confirmation",
    ];
    return steps.indexOf(s) + 1;
  };

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      {[
        "client",
        "organization",
        "schedule",
        "details",
        "pricing",
        "confirmation",
      ].map((s, index) => (
        <React.Fragment key={s}>
          <View
            style={[
              styles.progressDot,
              {
                backgroundColor:
                  getStepNumber(step) >= index + 1
                    ? colors.primary
                    : colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.progressNumber,
                { color: colors.buttonPrimaryText },
              ]}
            >
              {index + 1}
            </Text>
          </View>
          {index < 5 && (
            <View
              style={[
                styles.progressLine,
                {
                  backgroundColor:
                    getStepNumber(step) > index + 1
                      ? colors.primary
                      : colors.border,
                },
              ]}
            />
          )}
        </React.Fragment>
      ))}
    </View>
  );

  const renderClientStep = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>
        {t("jobs.selectClient") || "Select Client"}
      </Text>
      <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
        {t("jobs.selectClientDescription") || "Choose a client for this job"}
      </Text>

      {/* Create new client button */}
      <Pressable
        testID="create-job-new-client-btn"
        style={[styles.createClientButton, { backgroundColor: colors.primary }]}
        onPress={() => setStep("new-client")}
      >
        <Ionicons
          name="add-circle"
          size={20}
          color={colors.buttonPrimaryText}
        />
        <Text
          style={[
            styles.createClientButtonText,
            { color: colors.buttonPrimaryText },
          ]}
        >
          {t("clients.addClient") || "Create New Client"}
        </Text>
      </Pressable>

      {/* Search */}
      <View
        style={[
          styles.searchContainer,
          { backgroundColor: colors.backgroundSecondary },
        ]}
      >
        <Ionicons name="search" size={20} color={colors.textSecondary} />
        <TextInput
          testID="create-job-client-search"
          style={[styles.searchInput, { color: colors.text }]}
          placeholder={t("common.search") || "Search clients..."}
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery("")}>
            <Ionicons
              name="close-circle"
              size={20}
              color={colors.textSecondary}
            />
          </Pressable>
        )}
      </View>

      {/* Error message */}
      {clientsError && (
        <View
          style={{
            backgroundColor: colors.error + "20",
            padding: DESIGN_TOKENS.spacing.md,
            borderRadius: DESIGN_TOKENS.radius.md,
            marginBottom: DESIGN_TOKENS.spacing.md,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.error, fontWeight: "600" }}>
              {t("common.error") || "Error"}
            </Text>
            <Text style={{ color: colors.error, fontSize: 12 }}>
              {clientsError}
            </Text>
          </View>
          <Pressable onPress={() => refetchClients()}>
            <Ionicons name="refresh" size={20} color={colors.error} />
          </Pressable>
        </View>
      )}

      {/* Client list */}
      <ScrollView
        style={styles.clientList}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
      >
        {isLoadingClients ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : filteredClients.length > 0 ? (
          filteredClients.map((client) => (
            <Pressable
              key={client.id}
              testID={`create-job-client-item-${client.id}`}
              style={[
                styles.clientCard,
                {
                  backgroundColor: colors.backgroundSecondary,
                  borderColor:
                    selectedClient?.id === client.id
                      ? colors.primary
                      : colors.border,
                },
              ]}
              onPress={() => handleSelectClient(client)}
            >
              <View
                style={[
                  styles.clientAvatar,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Text style={styles.clientInitials}>
                  {client.firstName[0]}
                  {client.lastName[0]}
                </Text>
              </View>
              <View style={styles.clientInfo}>
                <Text style={[styles.clientName, { color: colors.text }]}>
                  {client.firstName} {client.lastName}
                </Text>
                <Text
                  style={[styles.clientEmail, { color: colors.textSecondary }]}
                >
                  {client.email}
                </Text>
                <Text
                  style={[styles.clientPhone, { color: colors.textSecondary }]}
                >
                  📞 {client.phone}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textSecondary}
              />
            </Pressable>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {t("clients.noClients") || "No clients found"}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );

  const renderAddressStep = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>
        {t("jobs.enterAddresses") || "Enter Addresses"}
      </Text>
      <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
        {t("jobs.enterAddressesDescription") || "Pickup and delivery locations"}
      </Text>

      <ScrollView
        ref={stepScrollRef}
        testID="address-step-scroll"
        style={styles.addressList}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
      >
        {addresses.map((address, index) => (
          <View key={index} style={styles.addressBlock}>
            <View style={styles.addressHeader}>
              <Text style={styles.addressEmoji}>
                {ADDRESS_TYPES[index]?.emoji || "📍"}
              </Text>
              <Text style={[styles.addressLabel, { color: colors.text }]}>
                {t(`jobs.addressTypes.${ADDRESS_TYPES[index]?.key}`) ||
                  ADDRESS_TYPES[index]?.label ||
                  `Address ${index + 1}`}
              </Text>
            </View>

            <View
              style={[
                styles.inputGroup,
                { backgroundColor: colors.backgroundSecondary },
              ]}
            >
              <TextInput
                testID={`address-${index}-street`}
                style={[styles.input, { color: colors.text }]}
                placeholder={t("address.street") || "Street address"}
                placeholderTextColor={colors.textSecondary}
                value={address.street}
                onChangeText={(value) => updateAddress(index, "street", value)}
              />
            </View>

            <View style={styles.inputRow}>
              <View
                style={[
                  styles.inputGroup,
                  styles.inputHalf,
                  { backgroundColor: colors.backgroundSecondary },
                ]}
              >
                <TextInput
                  testID={`address-${index}-city`}
                  style={[styles.input, { color: colors.text }]}
                  placeholder={t("address.city") || "City"}
                  placeholderTextColor={colors.textSecondary}
                  value={address.city}
                  onChangeText={(value) => updateAddress(index, "city", value)}
                />
              </View>
              {/* State Picker - Remplace le TextInput par un bouton ouvrant un picker */}
              <Pressable
                testID={`address-${index}-state-picker`}
                style={[
                  styles.inputGroup,
                  styles.inputHalf,
                  { backgroundColor: colors.backgroundSecondary },
                ]}
                onPress={() => {
                  setCurrentAddressIndex(index);
                  setShowStatePicker(true);
                }}
              >
                <Text
                  style={[
                    styles.input,
                    {
                      color: address.state ? colors.text : colors.textSecondary,
                    },
                  ]}
                >
                  {address.state || t("address.state") || "State"}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={16}
                  color={colors.textSecondary}
                />
              </Pressable>
            </View>

            <View
              style={[
                styles.inputGroup,
                styles.inputZip,
                { backgroundColor: colors.backgroundSecondary },
              ]}
            >
              <TextInput
                testID={`address-${index}-zip`}
                style={[styles.input, { color: colors.text }]}
                placeholder={t("address.zip") || "Postal code"}
                placeholderTextColor={colors.textSecondary}
                value={address.zip}
                onChangeText={(value) => updateAddress(index, "zip", value)}
                keyboardType="numeric"
              />
            </View>
          </View>
        ))}

        {/* Boutons à l'intérieur du ScrollView pour éviter d'être masqués par le clavier */}
        <View style={[styles.buttonRow, { marginBottom: 20 }]}>
          <Pressable
            style={[
              styles.button,
              styles.buttonSecondary,
              { borderColor: colors.border },
            ]}
            onPress={() => setStep("client")}
          >
            <Text style={[styles.buttonText, { color: colors.text }]}>
              {t("common.back") || "Back"}
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.button,
              styles.buttonPrimary,
              {
                backgroundColor: canProceedFromAddress()
                  ? colors.primary
                  : colors.border,
              },
            ]}
            onPress={() => setStep("schedule")}
            disabled={!canProceedFromAddress()}
            testID="create-job-address-next-btn"
          >
            <Text
              style={[styles.buttonText, { color: colors.buttonPrimaryText }]}
            >
              {t("common.next") || "Next"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );

  // Helper: segment icon by type
  const getSegmentIcon = (type: SegmentType): string => {
    switch (type) {
      case "location":
        return "location";
      case "travel":
        return "car";
      case "storage":
        return "cube";
      case "loading":
        return "archive";
      default:
        return "ellipse";
    }
  };

  // Helper: segment color by type
  const getSegmentColor = (type: SegmentType): string => {
    switch (type) {
      case "location":
        return colors.primary;
      case "travel":
        return colors.info || "#3b82f6";
      case "storage":
        return colors.warning || "#f59e0b";
      case "loading":
        return colors.success || "#22c55e";
      default:
        return colors.textSecondary;
    }
  };

  // Select template and populate segments
  const handleSelectTemplate = useCallback(
    (template: ModularJobTemplate) => {
      setSelectedTemplate(template);
      // Copy segments from template, adding address fields for location types
      const segments = template.segments.map((seg) => ({
        ...seg,
        address:
          seg.type === "location" || seg.type === "storage" || seg.type === "loading"
            ? { street: "", city: "", state: "", zip: "" }
            : undefined,
      }));
      setJobSegments(segments);

      // Pre-fill pricing from template
      if (template.defaultHourlyRate) {
        setHourlyRate(template.defaultHourlyRate.toString());
      }
      if (template.minimumHours) {
        setMinimumHours(template.minimumHours);
      }
      if (template.timeRoundingMinutes) {
        setTimeRounding(template.timeRoundingMinutes);
      }
      setDepotToDepot(template.billingMode === "depot_to_depot");
    },
    [],
  );

  // Add a new segment to the list
  const handleAddSegment = useCallback(
    (type: SegmentType) => {
      const newOrder = jobSegments.length + 1;
      const locationCount = jobSegments.filter(
        (s) => s.type === "location" || s.type === "storage" || s.type === "loading",
      ).length;
      const newSeg: JobSegmentTemplate & {
        address?: { street: string; city: string; state: string; zip: string };
      } = {
        id: `custom-seg-${Date.now()}`,
        order: newOrder,
        type,
        label:
          type === "location"
            ? `${t("jobs.organization.addLocation").replace("+ ", "") || "Location"} #${locationCount + 1}`
            : type === "travel"
              ? t("jobs.organization.addTravel").replace("+ ", "") || "Travel"
              : type === "storage"
                ? t("jobs.organization.addStorage").replace("+ ", "") || "Storage"
                : t("jobs.organization.addLoading").replace("+ ", "") || "Loading",
        isBillable: type !== "travel",
        locationType: type === "location" ? "house" : type === "storage" ? "depot" : undefined,
        address:
          type === "location" || type === "storage" || type === "loading"
            ? { street: "", city: "", state: "", zip: "" }
            : undefined,
      };
      setJobSegments((prev) => [...prev, newSeg]);
    },
    [jobSegments],
  );

  // Remove a segment by index
  const handleRemoveSegment = useCallback((index: number) => {
    setJobSegments((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((s, i) => ({ ...s, order: i + 1 })),
    );
  }, []);

  // Toggle billable state for a segment
  const handleToggleBillable = useCallback((index: number) => {
    setJobSegments((prev) =>
      prev.map((seg, i) =>
        i === index ? { ...seg, isBillable: !seg.isBillable } : seg,
      ),
    );
  }, []);

  // Update segment address
  const updateSegmentAddress = useCallback(
    (index: number, field: string, value: string) => {
      setJobSegments((prev) =>
        prev.map((seg, i) =>
          i === index
            ? { ...seg, address: { ...seg.address!, [field]: value } }
            : seg,
        ),
      );
    },
    [],
  );

  // Can proceed from organization step
  const canProceedFromOrganization = (): boolean => {
    if (!selectedTemplate || jobSegments.length === 0) return false;
    // Check all location/storage/loading segments have at least street+city
    return jobSegments
      .filter((s) => s.address)
      .every((s) => s.address!.street.length > 0 && s.address!.city.length > 0);
  };

  // Template category icons
  const getCategoryIcon = (category: string): string => {
    switch (category) {
      case "residential":
        return "home";
      case "commercial":
        return "business";
      case "storage":
        return "cube";
      case "packing":
        return "archive";
      default:
        return "briefcase";
    }
  };

  const renderOrganizationStep = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>
        {t("jobs.organization.title") || "Job Organisation"}
      </Text>
      <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
        {t("jobs.organization.subtitle") ||
          "Choose the job type then build it step by step"}
      </Text>

      <ScrollView
        ref={stepScrollRef}
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
      >
        {/* Template selection */}
        {!selectedTemplate ? (
          <>
            <Text
              style={[
                styles.sectionLabel,
                { color: colors.text, marginTop: 0 },
              ]}
            >
              {t("jobs.organization.chooseTemplate") || "Job type"}
            </Text>
            {isLoadingTemplates ? (
              <ActivityIndicator
                size="large"
                color={colors.primary}
                style={{ marginVertical: DESIGN_TOKENS.spacing.xl }}
              />
            ) : (
              <View style={{ gap: DESIGN_TOKENS.spacing.sm }}>
                {templates.map((template) => (
                  <Pressable
                    key={template.id}
                    onPress={() => handleSelectTemplate(template)}
                    style={({ pressed }) => ({
                      flexDirection: "row",
                      alignItems: "center",
                      padding: DESIGN_TOKENS.spacing.md,
                      borderRadius: DESIGN_TOKENS.radius.md,
                      backgroundColor: pressed
                        ? colors.primary + "15"
                        : colors.backgroundSecondary,
                      borderWidth: 1,
                      borderColor: colors.border,
                    })}
                  >
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        backgroundColor: colors.primary + "20",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Ionicons
                        name={
                          getCategoryIcon(template.category) as any
                        }
                        size={22}
                        color={colors.primary}
                      />
                    </View>
                    <View style={{ flex: 1, marginLeft: DESIGN_TOKENS.spacing.md }}>
                      <Text
                        style={{
                          fontSize: DESIGN_TOKENS.typography.body.fontSize,
                          fontWeight: "600",
                          color: colors.text,
                        }}
                      >
                        {template.name}
                      </Text>
                      <Text
                        style={{
                          fontSize: DESIGN_TOKENS.typography.caption.fontSize,
                          color: colors.textSecondary,
                          marginTop: 2,
                        }}
                      >
                        {template.description}
                      </Text>
                      <Text
                        style={{
                          fontSize: 11,
                          color: colors.primary,
                          marginTop: 4,
                        }}
                      >
                        {template.segments.length}{" "}
                        {t("jobs.organization.steps") || "steps"} •{" "}
                        {template.billingMode.replace(/_/g, " ")}
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={colors.textSecondary}
                    />
                  </Pressable>
                ))}
              </View>
            )}
          </>
        ) : (
          <>
            {/* Selected template header — tap to change */}
            <Pressable
              onPress={() => {
                setSelectedTemplate(null);
                setJobSegments([]);
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: DESIGN_TOKENS.spacing.md,
                borderRadius: DESIGN_TOKENS.radius.md,
                backgroundColor: colors.primary + "15",
                borderWidth: 1,
                borderColor: colors.primary + "40",
                marginBottom: DESIGN_TOKENS.spacing.lg,
              }}
            >
              <Ionicons
                name={getCategoryIcon(selectedTemplate.category) as any}
                size={20}
                color={colors.primary}
              />
              <Text
                style={{
                  flex: 1,
                  marginLeft: DESIGN_TOKENS.spacing.sm,
                  fontSize: DESIGN_TOKENS.typography.body.fontSize,
                  fontWeight: "600",
                  color: colors.primary,
                }}
              >
                {selectedTemplate.name}
              </Text>
              <Text
                style={{
                  fontSize: DESIGN_TOKENS.typography.caption.fontSize,
                  color: colors.primary,
                }}
              >
                {t("common.change") || "Change"}
              </Text>
              <Ionicons
                name="swap-horizontal"
                size={16}
                color={colors.primary}
                style={{ marginLeft: 4 }}
              />
            </Pressable>

            {/* Segments (the lego blocks) */}
            <Text style={[styles.sectionLabel, { color: colors.text, marginTop: 0 }]}>
              {t("jobs.organization.segmentsTitle") || "Job steps"}
            </Text>
            {jobSegments.map((seg, index) => (
              <View
                key={`${seg.id}-${index}`}
                style={{
                  marginBottom: DESIGN_TOKENS.spacing.md,
                  borderRadius: DESIGN_TOKENS.radius.md,
                  borderWidth: 1,
                  borderColor: getSegmentColor(seg.type) + "40",
                  backgroundColor: getSegmentColor(seg.type) + "08",
                  overflow: "hidden",
                }}
              >
                {/* Segment header */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    padding: DESIGN_TOKENS.spacing.md,
                    backgroundColor: getSegmentColor(seg.type) + "15",
                  }}
                >
                  <View
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: getSegmentColor(seg.type) + "30",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons
                      name={getSegmentIcon(seg.type) as any}
                      size={14}
                      color={getSegmentColor(seg.type)}
                    />
                  </View>
                  <Text
                    style={{
                      flex: 1,
                      marginLeft: DESIGN_TOKENS.spacing.sm,
                      fontWeight: "600",
                      fontSize: DESIGN_TOKENS.typography.body.fontSize,
                      color: colors.text,
                    }}
                  >
                    {seg.order}. {seg.label}
                  </Text>
                  <Pressable
                    onPress={() => handleToggleBillable(index)}
                    style={{
                      paddingHorizontal: DESIGN_TOKENS.spacing.sm,
                      paddingVertical: 4,
                      borderRadius: 12,
                      backgroundColor: seg.isBillable
                        ? (colors.success || "#22c55e") + "20"
                        : (colors.textSecondary || "#999") + "20",
                      marginRight: DESIGN_TOKENS.spacing.sm,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        color: seg.isBillable
                          ? colors.success || "#22c55e"
                          : colors.textSecondary || "#999",
                        fontWeight: "600",
                      }}
                    >
                      {seg.isBillable ? "💰" : "🚫"}
                    </Text>
                  </Pressable>
                  {jobSegments.length > 1 && (
                    <Pressable onPress={() => handleRemoveSegment(index)}>
                      <Ionicons
                        name="close-circle"
                        size={22}
                        color={colors.error || "#ef4444"}
                      />
                    </Pressable>
                  )}
                </View>

                {/* Address form for location/storage/loading segments */}
                {seg.address && (
                  <View style={{ padding: DESIGN_TOKENS.spacing.md }}>
                    <View
                      style={[
                        styles.inputGroup,
                        { backgroundColor: colors.backgroundSecondary },
                      ]}
                    >
                      <TextInput
                        style={[styles.input, { color: colors.text }]}
                        placeholder={t("address.street") || "Street address"}
                        placeholderTextColor={colors.textSecondary}
                        value={seg.address.street}
                        onChangeText={(v) =>
                          updateSegmentAddress(index, "street", v)
                        }
                      />
                    </View>
                    <View style={styles.inputRow}>
                      <View
                        style={[
                          styles.inputGroup,
                          styles.inputHalf,
                          { backgroundColor: colors.backgroundSecondary },
                        ]}
                      >
                        <TextInput
                          style={[styles.input, { color: colors.text }]}
                          placeholder={t("address.city") || "City"}
                          placeholderTextColor={colors.textSecondary}
                          value={seg.address.city}
                          onChangeText={(v) =>
                            updateSegmentAddress(index, "city", v)
                          }
                        />
                      </View>
                      <Pressable
                        style={[
                          styles.inputGroup,
                          styles.inputHalf,
                          { backgroundColor: colors.backgroundSecondary },
                        ]}
                        onPress={() => {
                          setCurrentAddressIndex(index);
                          setShowStatePicker(true);
                        }}
                      >
                        <Text
                          style={[
                            styles.input,
                            {
                              color: seg.address.state
                                ? colors.text
                                : colors.textSecondary,
                            },
                          ]}
                        >
                          {seg.address.state || t("address.state") || "State"}
                        </Text>
                        <Ionicons
                          name="chevron-down"
                          size={16}
                          color={colors.textSecondary}
                        />
                      </Pressable>
                    </View>
                    <View
                      style={[
                        styles.inputGroup,
                        styles.inputZip,
                        { backgroundColor: colors.backgroundSecondary },
                      ]}
                    >
                      <TextInput
                        style={[styles.input, { color: colors.text }]}
                        placeholder={t("address.zip") || "Postal code"}
                        placeholderTextColor={colors.textSecondary}
                        value={seg.address.zip}
                        onChangeText={(v) =>
                          updateSegmentAddress(index, "zip", v)
                        }
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                )}

                {/* Connector line between segments (except last) */}
                {index < jobSegments.length - 1 && (
                  <View
                    style={{
                      alignItems: "center",
                      paddingBottom: 4,
                    }}
                  >
                    <View
                      style={{
                        width: 2,
                        height: 16,
                        backgroundColor: colors.border,
                      }}
                    />
                    <Ionicons
                      name="chevron-down"
                      size={14}
                      color={colors.border}
                    />
                  </View>
                )}
              </View>
            ))}

            {/* Add segment buttons */}
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: DESIGN_TOKENS.spacing.sm,
                marginTop: DESIGN_TOKENS.spacing.sm,
                marginBottom: DESIGN_TOKENS.spacing.md,
              }}
            >
              {(
                [
                  {
                    type: "location" as SegmentType,
                    label: t("jobs.organization.addLocation") || "+ Location",
                    icon: "location",
                  },
                  {
                    type: "travel" as SegmentType,
                    label: t("jobs.organization.addTravel") || "+ Travel",
                    icon: "car",
                  },
                  {
                    type: "storage" as SegmentType,
                    label: t("jobs.organization.addStorage") || "+ Storage",
                    icon: "cube",
                  },
                  {
                    type: "loading" as SegmentType,
                    label: t("jobs.organization.addLoading") || "+ Loading",
                    icon: "archive",
                  },
                ] as const
              ).map((btn) => (
                <Pressable
                  key={btn.type}
                  onPress={() => handleAddSegment(btn.type)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: DESIGN_TOKENS.spacing.sm,
                    paddingHorizontal: DESIGN_TOKENS.spacing.md,
                    borderRadius: DESIGN_TOKENS.radius.md,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderStyle: "dashed",
                    backgroundColor: colors.backgroundSecondary,
                  }}
                >
                  <Ionicons
                    name={btn.icon as any}
                    size={16}
                    color={colors.primary}
                  />
                  <Text
                    style={{
                      marginLeft: 6,
                      fontSize: DESIGN_TOKENS.typography.caption.fontSize,
                      color: colors.primary,
                      fontWeight: "600",
                    }}
                  >
                    {btn.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        )}

        {/* Navigation buttons */}
        <View style={[styles.buttonRow, { marginBottom: 20 }]}>
          <Pressable
            style={[
              styles.button,
              styles.buttonSecondary,
              { borderColor: colors.border },
            ]}
            onPress={() => setStep("client")}
          >
            <Text style={[styles.buttonText, { color: colors.text }]}>
              {t("common.back") || "Back"}
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.button,
              styles.buttonPrimary,
              {
                backgroundColor: canProceedFromOrganization()
                  ? colors.primary
                  : colors.border,
              },
            ]}
            onPress={() => {
              // Build addresses array from segments for compatibility
              const segAddresses = jobSegments
                .filter((s) => s.address)
                .map((s, i) => ({
                  type: i === 0 ? "pickup" : "dropoff",
                  street: s.address!.street,
                  city: s.address!.city,
                  state: s.address!.state,
                  zip: s.address!.zip,
                }));
              if (segAddresses.length > 0) {
                setAddresses(segAddresses as CreateJobRequest["addresses"]);
              }
              setStep("schedule");
            }}
            disabled={!canProceedFromOrganization()}
            testID="create-job-organization-next-btn"
          >
            <Text
              style={[styles.buttonText, { color: colors.buttonPrimaryText }]}
            >
              {t("common.next") || "Next"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );

  const renderScheduleStep = () => {
    // Handlers for date/time pickers
    const handleDateChange = (event: DateTimePickerEvent, date?: Date) => {
      setShowDatePicker(Platform.OS === "ios"); // Keep open on iOS, close on Android
      if (date) {
        setJobDate(date);
      }
    };

    const handleStartTimeChange = (event: DateTimePickerEvent, date?: Date) => {
      setShowStartTimePicker(Platform.OS === "ios");
      if (date) {
        setStartTime(dateToTimeString(date));
      }
    };

    const handleEndTimeChange = (event: DateTimePickerEvent, date?: Date) => {
      setShowEndTimePicker(Platform.OS === "ios");
      if (date) {
        setEndTime(dateToTimeString(date));
      }
    };

    return (
      <View style={styles.stepContent}>
        <Text style={[styles.stepTitle, { color: colors.text }]}>
          {t("jobs.schedule") || "Schedule"}
        </Text>
        <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
          {t("jobs.scheduleDescription") || "Set the time window for this job"}
        </Text>

        <KeyboardAwareScrollView
          ref={stepScrollRef as any}
          showsVerticalScrollIndicator={false}
          enableOnAndroid={true}
          extraScrollHeight={100}
          keyboardShouldPersistTaps="always"
        >
          {/* Date Picker - Clickable */}
          <Pressable
            style={[
              styles.dateDisplay,
              { marginBottom: DESIGN_TOKENS.spacing.lg },
            ]}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar" size={24} color={colors.primary} />
            <Text style={[styles.dateText, { color: colors.text, flex: 1 }]}>
              {jobDate.toLocaleDateString(getLocale(currentLanguage), {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </Text>
            <Ionicons
              name="chevron-down"
              size={20}
              color={colors.textSecondary}
            />
          </Pressable>

          {/* Date Picker Modal/Inline */}
          {showDatePicker &&
            (Platform.OS === "ios" ? (
              <View
                style={{
                  backgroundColor: colors.backgroundSecondary,
                  borderRadius: DESIGN_TOKENS.radius.md,
                  marginBottom: DESIGN_TOKENS.spacing.md,
                  padding: DESIGN_TOKENS.spacing.sm,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "flex-end",
                    marginBottom: 8,
                  }}
                >
                  <Pressable onPress={() => setShowDatePicker(false)}>
                    <Text style={{ color: colors.primary, fontWeight: "600" }}>
                      {t("common.done") || "Done"}
                    </Text>
                  </Pressable>
                </View>
                <DateTimePicker
                  value={jobDate}
                  mode="date"
                  display="spinner"
                  onChange={handleDateChange}
                  minimumDate={new Date()}
                  textColor={colors.text}
                />
              </View>
            ) : (
              <DateTimePicker
                value={jobDate}
                mode="date"
                display="default"
                onChange={handleDateChange}
                minimumDate={new Date()}
              />
            ))}

          <View style={styles.timeSection}>
            {/* Start Time Picker */}
            <View style={styles.timeBlock}>
              <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>
                {t("jobs.startTime") || "Start Time"}
              </Text>
              <Pressable
                style={[
                  styles.inputGroup,
                  { backgroundColor: colors.backgroundSecondary },
                ]}
                onPress={() => setShowStartTimePicker(true)}
              >
                <Ionicons name="time" size={20} color={colors.primary} />
                <Text style={[styles.input, { color: colors.text }]}>
                  {startTime}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={16}
                  color={colors.textSecondary}
                />
              </Pressable>
            </View>

            {/* End Time Picker */}
            <View style={styles.timeBlock}>
              <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>
                {t("jobs.endTime") || "End Time"}
              </Text>
              <Pressable
                style={[
                  styles.inputGroup,
                  { backgroundColor: colors.backgroundSecondary },
                ]}
                onPress={() => setShowEndTimePicker(true)}
              >
                <Ionicons name="time" size={20} color={colors.primary} />
                <Text style={[styles.input, { color: colors.text }]}>
                  {endTime}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={16}
                  color={colors.textSecondary}
                />
              </Pressable>
            </View>
          </View>

          {/* Start Time Picker Modal */}
          {showStartTimePicker &&
            (Platform.OS === "ios" ? (
              <View
                style={{
                  backgroundColor: colors.backgroundSecondary,
                  borderRadius: DESIGN_TOKENS.radius.md,
                  marginBottom: DESIGN_TOKENS.spacing.md,
                  padding: DESIGN_TOKENS.spacing.sm,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "flex-end",
                    marginBottom: 8,
                  }}
                >
                  <Pressable onPress={() => setShowStartTimePicker(false)}>
                    <Text style={{ color: colors.primary, fontWeight: "600" }}>
                      {t("common.done") || "Done"}
                    </Text>
                  </Pressable>
                </View>
                <DateTimePicker
                  value={timeStringToDate(startTime)}
                  mode="time"
                  display="spinner"
                  onChange={handleStartTimeChange}
                  textColor={colors.text}
                  is24Hour={true}
                />
              </View>
            ) : (
              <DateTimePicker
                value={timeStringToDate(startTime)}
                mode="time"
                display="default"
                onChange={handleStartTimeChange}
                is24Hour={true}
              />
            ))}

          {/* End Time Picker Modal */}
          {showEndTimePicker &&
            (Platform.OS === "ios" ? (
              <View
                style={{
                  backgroundColor: colors.backgroundSecondary,
                  borderRadius: DESIGN_TOKENS.radius.md,
                  marginBottom: DESIGN_TOKENS.spacing.md,
                  padding: DESIGN_TOKENS.spacing.sm,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "flex-end",
                    marginBottom: 8,
                  }}
                >
                  <Pressable onPress={() => setShowEndTimePicker(false)}>
                    <Text style={{ color: colors.primary, fontWeight: "600" }}>
                      {t("common.done") || "Done"}
                    </Text>
                  </Pressable>
                </View>
                <DateTimePicker
                  value={timeStringToDate(endTime)}
                  mode="time"
                  display="spinner"
                  onChange={handleEndTimeChange}
                  textColor={colors.text}
                  is24Hour={true}
                />
              </View>
            ) : (
              <DateTimePicker
                value={timeStringToDate(endTime)}
                mode="time"
                display="default"
                onChange={handleEndTimeChange}
                is24Hour={true}
              />
            ))}

          <View style={styles.durationBlock}>
            <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>
              {t("jobs.estimatedDuration") || "Estimated Duration (hours)"}
            </Text>
            <View
              style={[
                styles.inputGroup,
                { backgroundColor: colors.backgroundSecondary },
              ]}
            >
              <Ionicons
                name="hourglass"
                size={20}
                color={colors.textSecondary}
              />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="4"
                placeholderTextColor={colors.textSecondary}
                value={estimatedDuration}
                onChangeText={setEstimatedDuration}
                keyboardType="numeric"
              />
              <Text
                style={[styles.durationUnit, { color: colors.textSecondary }]}
              >
                {t("jobs.hours") || "hours"}
              </Text>
            </View>
          </View>

          <View style={[styles.buttonRow, { marginBottom: 20 }]}>
            <Pressable
              style={[
                styles.button,
                styles.buttonSecondary,
                { borderColor: colors.border },
              ]}
              onPress={() => setStep("organization")}
            >
              <Text style={[styles.buttonText, { color: colors.text }]}>
                {t("common.back") || "Back"}
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.button,
                styles.buttonPrimary,
                {
                  backgroundColor: canProceedFromSchedule()
                    ? colors.primary
                    : colors.border,
                },
              ]}
              onPress={() => setStep("details")}
              disabled={!canProceedFromSchedule()}
              testID="create-job-schedule-next-btn"
            >
              <Text
                style={[styles.buttonText, { color: colors.buttonPrimaryText }]}
              >
                {t("common.next") || "Next"}
              </Text>
            </Pressable>
          </View>
        </KeyboardAwareScrollView>
      </View>
    );
  };

  const renderDetailsStep = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>
        {t("jobs.jobDetails") || "Job Details"}
      </Text>
      <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
        {t("jobs.detailsDescription") || "Set priority and add notes"}
      </Text>

      <ScrollView
        ref={stepScrollRef}
        testID="details-step-scroll"
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
      >
        {/* Priority */}
        <Text style={[styles.sectionLabel, { color: colors.text }]}>
          {t("jobs.priority") || "Priority"}
        </Text>
        <View style={styles.priorityGrid}>
          {PRIORITY_OPTIONS.map((option) => (
            <Pressable
              key={option.key}
              style={[
                styles.priorityCard,
                {
                  backgroundColor:
                    priority === option.key
                      ? option.color + "20"
                      : colors.backgroundSecondary,
                  borderColor:
                    priority === option.key ? option.color : colors.border,
                },
              ]}
              onPress={() => setPriority(option.key)}
            >
              <Text style={styles.priorityEmoji}>{option.emoji}</Text>
              <Text style={[styles.priorityLabel, { color: colors.text }]}>
                {t(`jobs.priorityOptions.${option.key}`) || option.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Notes */}
        <Text style={[styles.sectionLabel, { color: colors.text }]}>
          {t("jobs.notes") || "Notes (optional)"}
        </Text>
        <View
          style={[
            styles.textareaContainer,
            { backgroundColor: colors.backgroundSecondary },
          ]}
        >
          <TextInput
            style={[styles.textarea, { color: colors.text }]}
            placeholder={
              t("jobs.notesPlaceholder") || "Add any special instructions..."
            }
            placeholderTextColor={colors.textSecondary}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
      </ScrollView>

      <View
        style={[
          styles.buttonRow,
          { marginBottom: 20, marginTop: DESIGN_TOKENS.spacing.lg },
        ]}
      >
        <Pressable
          style={[
            styles.button,
            styles.buttonSecondary,
            { borderColor: colors.border },
          ]}
          onPress={() => setStep("schedule")}
        >
          <Text style={[styles.buttonText, { color: colors.text }]}>
            {t("common.back") || "Back"}
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.button,
            styles.buttonPrimary,
            { backgroundColor: colors.primary },
          ]}
          onPress={() => setStep("pricing")}
          testID="create-job-details-next-btn"
        >
          <Text
            style={[styles.buttonText, { color: colors.buttonPrimaryText }]}
          >
            {t("common.next") || "Next"}
          </Text>
        </Pressable>
      </View>
    </View>
  );

  // 💰 Étape de configuration du pricing
  const renderPricingStep = () => {
    // Calcul du call-out fee en dollars
    const callOutFeeAmount = depotToDepot
      ? 0
      : (callOutFeeMinutes / 60) * parseFloat(hourlyRate || "0");

    // Trouver la marge d'arrondi pour l'option sélectionnée
    const roundingMargin =
      TIME_ROUNDING_OPTIONS.find((opt) => opt.key === timeRounding)
        ?.marginMinutes || 0;

    return (
      <View style={styles.stepContent}>
        <Text style={[styles.stepTitle, { color: colors.text }]}>
          {t("jobs.pricing") || "Pricing"}
        </Text>
        <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
          {t("jobs.pricingDescription") ||
            "Configure billing rates and options"}
        </Text>

        <ScrollView
          ref={stepScrollRef}
          testID="pricing-step-scroll"
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
        >
          {/* Hourly Rate */}
          <Text style={[styles.sectionLabel, { color: colors.text }]}>
            💵 {t("jobs.hourlyRate") || "Hourly Rate"}
          </Text>
          <View
            style={[
              styles.inputGroup,
              { backgroundColor: colors.backgroundSecondary },
            ]}
          >
            <Text
              style={{ color: colors.text, fontSize: 18, fontWeight: "600" }}
            >
              $
            </Text>
            <TextInput
              style={[styles.input, { color: colors.text, fontSize: 18 }]}
              placeholder="180"
              placeholderTextColor={colors.textSecondary}
              value={hourlyRate}
              onChangeText={setHourlyRate}
              keyboardType="decimal-pad"
            />
            <Text style={{ color: colors.textSecondary }}>/h</Text>
          </View>

          {/* Minimum Billable Hours */}
          <Text
            style={[
              styles.sectionLabel,
              { color: colors.text, marginTop: DESIGN_TOKENS.spacing.lg },
            ]}
          >
            ⏳ {t("jobs.minimumHours") || "Minimum Billable Hours"}
          </Text>
          <View style={styles.priorityGrid}>
            {MINIMUM_HOURS_OPTIONS.map((option) => (
              <Pressable
                key={option.key}
                style={[
                  styles.priorityCard,
                  {
                    backgroundColor:
                      minimumHours === option.key
                        ? colors.primary + "20"
                        : colors.backgroundSecondary,
                    borderColor:
                      minimumHours === option.key
                        ? colors.primary
                        : colors.border,
                  },
                ]}
                onPress={() => setMinimumHours(option.key)}
              >
                <Text style={[styles.priorityLabel, { color: colors.text }]}>
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Call Out Fee */}
          {!depotToDepot && (
            <>
              <Text
                style={[
                  styles.sectionLabel,
                  { color: colors.text, marginTop: DESIGN_TOKENS.spacing.lg },
                ]}
              >
                📞 {t("jobs.callOutFee") || "Call-Out Fee"}
              </Text>
              <View style={styles.priorityGrid}>
                {CALL_OUT_FEE_OPTIONS.map((option) => (
                  <Pressable
                    key={option.key}
                    style={[
                      styles.priorityCard,
                      {
                        backgroundColor:
                          callOutFeeMinutes === option.key
                            ? colors.primary + "20"
                            : colors.backgroundSecondary,
                        borderColor:
                          callOutFeeMinutes === option.key
                            ? colors.primary
                            : colors.border,
                      },
                    ]}
                    onPress={() => setCallOutFeeMinutes(option.key)}
                  >
                    <Text
                      style={[styles.priorityLabel, { color: colors.text }]}
                    >
                      {option.label}
                    </Text>
                    {callOutFeeMinutes === option.key && (
                      <Text
                        style={{
                          color: colors.primary,
                          fontSize: 12,
                          marginTop: 2,
                        }}
                      >
                        ${callOutFeeAmount.toFixed(0)}
                      </Text>
                    )}
                  </Pressable>
                ))}
              </View>
            </>
          )}

          {/* Time Rounding */}
          <Text
            style={[
              styles.sectionLabel,
              { color: colors.text, marginTop: DESIGN_TOKENS.spacing.lg },
            ]}
          >
            ⏱️ {t("jobs.timeRounding") || "Time Rounding"}
          </Text>
          <View style={styles.priorityGrid}>
            {TIME_ROUNDING_OPTIONS.map((option) => (
              <Pressable
                key={option.key}
                style={[
                  styles.priorityCard,
                  {
                    backgroundColor:
                      timeRounding === option.key
                        ? colors.primary + "20"
                        : colors.backgroundSecondary,
                    borderColor:
                      timeRounding === option.key
                        ? colors.primary
                        : colors.border,
                  },
                ]}
                onPress={() => setTimeRounding(option.key)}
              >
                <Text style={[styles.priorityLabel, { color: colors.text }]}>
                  {option.label}
                </Text>
                {timeRounding === option.key && option.marginMinutes > 0 && (
                  <Text
                    style={{
                      color: colors.textSecondary,
                      fontSize: 10,
                      marginTop: 2,
                    }}
                  >
                    {t("jobs.marginMinutes", {
                      minutes: option.marginMinutes,
                    }) || `+${option.marginMinutes}min margin`}
                  </Text>
                )}
              </Pressable>
            ))}
          </View>

          {/* Pricing Summary */}
          <View
            style={[
              styles.confirmationCard,
              {
                backgroundColor: colors.backgroundSecondary,
                marginTop: DESIGN_TOKENS.spacing.xl,
              },
            ]}
          >
            <Text
              style={[
                styles.confirmationLabel,
                { color: colors.textSecondary },
              ]}
            >
              📋 {t("jobs.pricingSummary") || "Pricing Summary"}
            </Text>
            <View style={{ marginTop: DESIGN_TOKENS.spacing.sm }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 4,
                }}
              >
                <Text style={{ color: colors.text }}>
                  {t("jobs.hourlyRate") || "Hourly Rate"}:
                </Text>
                <Text style={{ color: colors.text, fontWeight: "600" }}>
                  ${hourlyRate}/h
                </Text>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 4,
                }}
              >
                <Text style={{ color: colors.text }}>
                  {t("jobs.callOutFee") || "Call-Out Fee"}:
                </Text>
                <Text style={{ color: colors.text, fontWeight: "600" }}>
                  {depotToDepot
                    ? t("jobs.naDepotDepot") || "N/A (Depot-Depot)"
                    : `$${callOutFeeAmount.toFixed(0)}`}
                </Text>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 4,
                }}
              >
                <Text style={{ color: colors.text }}>
                  {t("jobs.minimumCharge") || "Minimum Charge"}:
                </Text>
                <Text style={{ color: colors.text, fontWeight: "600" }}>
                  2h +{" "}
                  {depotToDepot
                    ? t("jobs.travelBilling") || "travel"
                    : t("jobs.callOutBilling") || "call-out"}{" "}
                  = $
                  {(
                    2 * parseFloat(hourlyRate || "0") +
                    callOutFeeAmount
                  ).toFixed(0)}
                </Text>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Text style={{ color: colors.text }}>
                  {t("jobs.rounding") || "Rounding"}:
                </Text>
                <Text style={{ color: colors.text, fontWeight: "600" }}>
                  {timeRounding} min (
                  {roundingMargin > 0
                    ? t("jobs.marginMinutes", { minutes: roundingMargin }) ||
                      `+${roundingMargin}min margin`
                    : t("jobs.exact") || "exact"}
                  )
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Navigation Buttons */}
        <View
          style={[
            styles.buttonRow,
            { marginBottom: 20, marginTop: DESIGN_TOKENS.spacing.lg },
          ]}
        >
          <Pressable
            style={[
              styles.button,
              styles.buttonSecondary,
              { borderColor: colors.border },
            ]}
            onPress={() => setStep("details")}
          >
            <Text style={[styles.buttonText, { color: colors.text }]}>
              {t("common.back") || "Back"}
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.button,
              styles.buttonPrimary,
              { backgroundColor: colors.primary },
            ]}
            onPress={() => setStep("confirmation")}
            testID="create-job-pricing-next-btn"
          >
            <Text
              style={[styles.buttonText, { color: colors.buttonPrimaryText }]}
            >
              {t("common.next") || "Next"}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  };

  const renderConfirmationStep = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>
        {t("jobs.confirmation") || "Confirm Job"}
      </Text>
      <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
        {t("jobs.confirmationDescription") ||
          "Review job details before creating"}
      </Text>

      <ScrollView
        style={styles.confirmationList}
        showsVerticalScrollIndicator={false}
      >
        {/* Client */}
        <View
          style={[
            styles.confirmationCard,
            { backgroundColor: colors.backgroundSecondary },
          ]}
        >
          <Text
            style={[styles.confirmationLabel, { color: colors.textSecondary }]}
          >
            {t("jobs.client") || "Client"}
          </Text>
          <Text style={[styles.confirmationValue, { color: colors.text }]}>
            {selectedClient?.firstName} {selectedClient?.lastName}
          </Text>
          <Text
            style={[
              styles.confirmationSubvalue,
              { color: colors.textSecondary },
            ]}
          >
            {selectedClient?.email} • {selectedClient?.phone}
          </Text>
        </View>

        {/* Template & Segments */}
        {selectedTemplate && (
          <View
            style={[
              styles.confirmationCard,
              { backgroundColor: colors.backgroundSecondary },
            ]}
          >
            <Text
              style={[
                styles.confirmationLabel,
                { color: colors.textSecondary },
              ]}
            >
              🧩 {t("jobs.organization.title") || "Organisation"}
            </Text>
            <Text style={[styles.confirmationValue, { color: colors.text }]}>
              {selectedTemplate.name}
            </Text>
            <Text
              style={[
                styles.confirmationSubvalue,
                { color: colors.textSecondary },
              ]}
            >
              {jobSegments.length}{" "}
              {t("jobs.organization.steps") || "steps"} •{" "}
              {selectedTemplate.billingMode.replace(/_/g, " ")}
            </Text>
          </View>
        )}

        {/* Addresses from segments */}
        {jobSegments
          .filter((s) => s.address && s.address.street)
          .map((seg, index) => (
            <View
              key={`addr-${seg.id}-${index}`}
              style={[
                styles.confirmationCard,
                { backgroundColor: colors.backgroundSecondary },
              ]}
            >
              <Text
                style={[
                  styles.confirmationLabel,
                  { color: colors.textSecondary },
                ]}
              >
                📍 {seg.label}
              </Text>
              <Text style={[styles.confirmationValue, { color: colors.text }]}>
                {seg.address!.street}
              </Text>
              <Text
                style={[
                  styles.confirmationSubvalue,
                  { color: colors.textSecondary },
                ]}
              >
                {seg.address!.city}
                {seg.address!.state ? `, ${seg.address!.state}` : ""}{" "}
                {seg.address!.zip}
              </Text>
            </View>
          ))}

        {/* Schedule */}
        <View
          style={[
            styles.confirmationCard,
            { backgroundColor: colors.backgroundSecondary },
          ]}
        >
          <Text
            style={[styles.confirmationLabel, { color: colors.textSecondary }]}
          >
            {t("jobs.schedule") || "Schedule"}
          </Text>
          <Text style={[styles.confirmationValue, { color: colors.text }]}>
            {jobDate.toLocaleDateString(getLocale(currentLanguage), {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </Text>
          <Text
            style={[
              styles.confirmationSubvalue,
              { color: colors.textSecondary },
            ]}
          >
            {startTime} - {endTime} (
            {t("jobs.estimated", { hours: estimatedDuration }) ||
              `${estimatedDuration}h estimated`}
            )
          </Text>
        </View>

        {/* Priority */}
        <View
          style={[
            styles.confirmationCard,
            { backgroundColor: colors.backgroundSecondary },
          ]}
        >
          <Text
            style={[styles.confirmationLabel, { color: colors.textSecondary }]}
          >
            {t("jobs.priority") || "Priority"}
          </Text>
          <Text style={[styles.confirmationValue, { color: colors.text }]}>
            {PRIORITY_OPTIONS.find((p) => p.key === priority)?.emoji}{" "}
            {t(`jobs.priorityOptions.${priority}`) ||
              PRIORITY_OPTIONS.find((p) => p.key === priority)?.label}
          </Text>
        </View>

        {/* Notes */}
        {notes && (
          <View
            style={[
              styles.confirmationCard,
              { backgroundColor: colors.backgroundSecondary },
            ]}
          >
            <Text
              style={[
                styles.confirmationLabel,
                { color: colors.textSecondary },
              ]}
            >
              {t("jobs.notes") || "Notes"}
            </Text>
            <Text style={[styles.confirmationValue, { color: colors.text }]}>
              {notes}
            </Text>
          </View>
        )}

        {/* Staff Assignment */}
        {selectedStaffId && (
          <View
            style={[
              styles.confirmationCard,
              { backgroundColor: colors.backgroundSecondary },
            ]}
          >
            <Text
              style={[
                styles.confirmationLabel,
                { color: colors.textSecondary },
              ]}
            >
              👷 {t("jobs.assignedStaff") || "Assigned Staff"}
            </Text>
            <Text style={[styles.confirmationValue, { color: colors.text }]}>
              {
                getActiveStaff().find((s) => s.id === selectedStaffId)
                  ?.firstName
              }{" "}
              {getActiveStaff().find((s) => s.id === selectedStaffId)?.lastName}
            </Text>
          </View>
        )}

        {/* Vehicle Type */}
        {selectedVehicleType && (
          <View
            style={[
              styles.confirmationCard,
              { backgroundColor: colors.backgroundSecondary },
            ]}
          >
            <Text
              style={[
                styles.confirmationLabel,
                { color: colors.textSecondary },
              ]}
            >
              {t("jobs.vehicleType") || "Vehicle Type"}
            </Text>
            <Text style={[styles.confirmationValue, { color: colors.text }]}>
              {VEHICLE_TYPES.find((v) => v.key === selectedVehicleType)?.emoji}{" "}
              {t(`jobs.vehicleTypes.${selectedVehicleType}`) ||
                VEHICLE_TYPES.find((v) => v.key === selectedVehicleType)?.label}
            </Text>
          </View>
        )}

        {/* Extras */}
        {selectedExtras.length > 0 && (
          <View
            style={[
              styles.confirmationCard,
              { backgroundColor: colors.backgroundSecondary },
            ]}
          >
            <Text
              style={[
                styles.confirmationLabel,
                { color: colors.textSecondary },
              ]}
            >
              ✨ {t("jobs.extras") || "Extras"}
            </Text>
            <Text style={[styles.confirmationValue, { color: colors.text }]}>
              {selectedExtras
                .map((e) => {
                  const extra = EXTRAS_OPTIONS.find((opt) => opt.key === e);
                  return extra
                    ? `${extra.emoji} ${t(`jobs.extrasOptions.${extra.key}`) || extra.label}`
                    : e;
                })
                .join(", ")}
            </Text>
          </View>
        )}

        {/* Pricing Summary */}
        <View
          style={[
            styles.confirmationCard,
            { backgroundColor: colors.backgroundSecondary },
          ]}
        >
          <Text
            style={[styles.confirmationLabel, { color: colors.textSecondary }]}
          >
            💵 {t("jobs.pricingConfig") || "Pricing Configuration"}
          </Text>
          <Text style={[styles.confirmationValue, { color: colors.text }]}>
            ${hourlyRate}/h
          </Text>
          <Text
            style={[
              styles.confirmationSubvalue,
              { color: colors.textSecondary },
            ]}
          >
            {depotToDepot
              ? `🚛 ${t("jobs.depotDepotBillable") || "Depot-to-Depot (travel time billable)"}`
              : `📞 ${t("jobs.callOutSummary", { minutes: String(callOutFeeMinutes), amount: ((callOutFeeMinutes / 60) * parseFloat(hourlyRate || "0")).toFixed(0) }) || `Call-out: ${callOutFeeMinutes}min ($${((callOutFeeMinutes / 60) * parseFloat(hourlyRate || "0")).toFixed(0)})`}`}
          </Text>
          <Text
            style={[
              styles.confirmationSubvalue,
              { color: colors.textSecondary },
            ]}
          >
            ⏱️{" "}
            {t("jobs.roundingSummary", { minutes: String(timeRounding) }) ||
              `Rounding: ${timeRounding}min`}
            {TIME_ROUNDING_OPTIONS.find((o) => o.key === timeRounding)
              ?.marginMinutes
              ? ` (${t("jobs.marginMinutes", { minutes: TIME_ROUNDING_OPTIONS.find((o) => o.key === timeRounding)?.marginMinutes ?? 0 }) || `+${TIME_ROUNDING_OPTIONS.find((o) => o.key === timeRounding)?.marginMinutes}min margin`})`
              : ` (${t("jobs.exact") || "exact"})`}
          </Text>
        </View>

        {/* Payment Summary */}
        {(amountTotal || paymentMethod || depositRequired) && (
          <View
            style={[
              styles.confirmationCard,
              { backgroundColor: colors.backgroundSecondary },
            ]}
          >
            <Text
              style={[
                styles.confirmationLabel,
                { color: colors.textSecondary },
              ]}
            >
              💰 {t("jobs.paymentSummary") || "Payment Summary"}
            </Text>
            {amountTotal && (
              <Text style={[styles.confirmationValue, { color: colors.text }]}>
                {t("jobs.quoteAmount") || "Quote"}: $
                {parseFloat(amountTotal).toFixed(2)}
              </Text>
            )}
            {paymentMethod && (
              <Text
                style={[
                  styles.confirmationSubvalue,
                  { color: colors.textSecondary },
                ]}
              >
                {
                  PAYMENT_METHOD_OPTIONS.find((m) => m.key === paymentMethod)
                    ?.emoji
                }{" "}
                {t(`jobs.paymentMethods.${paymentMethod}`) ||
                  PAYMENT_METHOD_OPTIONS.find((m) => m.key === paymentMethod)
                    ?.label}
              </Text>
            )}
            {depositRequired && (
              <Text
                style={[
                  styles.confirmationSubvalue,
                  { color: depositPaid ? "#22c55e" : colors.textSecondary },
                ]}
              >
                {t("jobs.depositRequired") || "Deposit"}: {depositPercentage}%
                {amountTotal &&
                  ` ($${((parseFloat(amountTotal) * parseFloat(depositPercentage)) / 100).toFixed(2)})`}
                {depositPaid
                  ? ` ✅ ${t("jobs.paid") || "Paid"}`
                  : ` ⏳ ${t("jobs.pendingDeposit") || "Pending"}`}
              </Text>
            )}
          </View>
        )}
      </ScrollView>

      <View style={{ gap: DESIGN_TOKENS.spacing.sm }}>
        <View style={styles.buttonRow}>
          <Pressable
            style={[
              styles.button,
              styles.buttonSecondary,
              { borderColor: colors.border },
            ]}
            onPress={() => setStep("pricing")}
            disabled={isLoading}
          >
            <Text style={[styles.buttonText, { color: colors.text }]}>
              {t("common.back") || "Back"}
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.button,
              styles.buttonPrimary,
              { backgroundColor: colors.success },
            ]}
            testID="create-job-save-btn"
            onPress={handleSubmitAndClose}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator
                size="small"
                color={colors.buttonPrimaryText}
              />
            ) : (
              <>
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={colors.buttonPrimaryText}
                />
                <Text
                  style={[
                    styles.buttonText,
                    { color: colors.buttonPrimaryText, marginLeft: 8 },
                  ]}
                >
                  {t("jobs.createJob") || "Create Job"}
                </Text>
              </>
            )}
          </Pressable>
        </View>

        {/* Create and Add Another button */}
        <Pressable
          style={[
            styles.button,
            {
              backgroundColor: colors.primary + "20",
              borderWidth: 1,
              borderColor: colors.primary,
              width: "100%",
            },
          ]}
          onPress={handleSubmitAndAddAnother}
          disabled={isLoading}
        >
          <Ionicons name="add-circle" size={20} color={colors.primary} />
          <Text
            style={[
              styles.buttonText,
              { color: colors.primary, marginLeft: 8 },
            ]}
          >
            {t("jobs.createAndAddAnother") || "Create & Add Another"}
          </Text>
        </Pressable>
      </View>
    </View>
  );

  // Handler pour créer un nouveau client
  const handleCreateNewClient = async () => {
    // Validation
    if (!newClientData.firstName.trim() || !newClientData.lastName.trim()) {
      Alert.alert(
        t("common.error") || "Error",
        t("clients.validation.nameRequired") ||
          "First and last name are required",
      );
      return;
    }
    if (!newClientData.email.trim()) {
      Alert.alert(
        t("common.error") || "Error",
        t("clients.validation.emailRequired") || "Email is required",
      );
      return;
    }
    if (!newClientData.phone.trim()) {
      Alert.alert(
        t("common.error") || "Error",
        t("clients.validation.phoneRequired") || "Phone number is required",
      );
      return;
    }

    setIsCreatingClient(true);
    try {
      let newClient: ClientAPI;
      try {
        newClient = await createClient(newClientData);
      } catch (createErr: any) {
        // If creation failed (e.g. duplicate email), fetch fresh client list and reuse
        const allClients = await fetchClients();
        const existing = allClients.find(
          (c) => c.email === newClientData.email,
        );
        if (existing) {
          newClient = existing;
        } else {
          console.error(
            "❌ [CreateNewClient] No client found with email:",
            newClientData.email,
          );
          throw new Error(
            t("clients.error.createFailed") || "Failed to create client",
          );
        }
      }
      await refetchClients();
      // Sélectionner automatiquement le nouveau client
      setSelectedClient(newClient);
      // Passer à l'étape suivante (organization)
      setStep("organization");
      // Réinitialiser le formulaire
      setNewClientData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        company: "",
      });
    } catch (error: any) {
      Alert.alert(
        t("common.error") || "Error",
        error?.message ||
          t("clients.error.createFailed") ||
          "Failed to create client",
      );
    } finally {
      setIsCreatingClient(false);
    }
  };

  const renderNewClientStep = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>
        {t("clients.addClient") || "Create New Client"}
      </Text>
      <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
        {t("clients.addClientDescription") || "Fill in the client information"}
      </Text>

      <ScrollView
        ref={stepScrollRef}
        style={styles.clientList}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
      >
        {/* First Name */}
        <View style={styles.newClientInputGroup}>
          <Text style={[styles.newClientInputLabel, { color: colors.text }]}>
            {t("clients.firstName") || "First Name"} *
          </Text>
          <TextInput
            testID="create-job-new-client-firstname"
            style={[
              styles.newClientInput,
              {
                backgroundColor: colors.backgroundSecondary,
                color: colors.text,
              },
            ]}
            placeholder={
              t("clients.firstNamePlaceholder") || "Enter first name"
            }
            placeholderTextColor={colors.textSecondary}
            value={newClientData.firstName}
            onChangeText={(text) =>
              setNewClientData((prev) => ({ ...prev, firstName: text }))
            }
          />
        </View>

        {/* Last Name */}
        <View style={styles.newClientInputGroup}>
          <Text style={[styles.newClientInputLabel, { color: colors.text }]}>
            {t("clients.lastName") || "Last Name"} *
          </Text>
          <TextInput
            testID="create-job-new-client-lastname"
            style={[
              styles.newClientInput,
              {
                backgroundColor: colors.backgroundSecondary,
                color: colors.text,
              },
            ]}
            placeholder={t("clients.lastNamePlaceholder") || "Enter last name"}
            placeholderTextColor={colors.textSecondary}
            value={newClientData.lastName}
            onChangeText={(text) =>
              setNewClientData((prev) => ({ ...prev, lastName: text }))
            }
          />
        </View>

        {/* Email */}
        <View style={styles.newClientInputGroup}>
          <Text style={[styles.newClientInputLabel, { color: colors.text }]}>
            {t("clients.email") || "Email"} *
          </Text>
          <TextInput
            testID="create-job-new-client-email"
            style={[
              styles.newClientInput,
              {
                backgroundColor: colors.backgroundSecondary,
                color: colors.text,
              },
            ]}
            placeholder={t("clients.emailPlaceholder") || "Enter email address"}
            placeholderTextColor={colors.textSecondary}
            value={newClientData.email}
            onChangeText={(text) =>
              setNewClientData((prev) => ({ ...prev, email: text }))
            }
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Phone */}
        <View style={styles.newClientInputGroup}>
          <Text style={[styles.newClientInputLabel, { color: colors.text }]}>
            {t("clients.phone") || "Phone"} *
          </Text>
          <TextInput
            testID="create-job-new-client-phone"
            style={[
              styles.newClientInput,
              {
                backgroundColor: colors.backgroundSecondary,
                color: colors.text,
              },
            ]}
            placeholder={t("clients.phonePlaceholder") || "Enter phone number"}
            placeholderTextColor={colors.textSecondary}
            value={newClientData.phone}
            onChangeText={(text) =>
              setNewClientData((prev) => ({ ...prev, phone: text }))
            }
            keyboardType="phone-pad"
          />
        </View>

        {/* Company (Optional) */}
        <View style={styles.newClientInputGroup}>
          <Text style={[styles.newClientInputLabel, { color: colors.text }]}>
            {t("clients.company") || "Company"} (
            {t("common.optional") || "Optional"})
          </Text>
          <TextInput
            style={[
              styles.newClientInput,
              {
                backgroundColor: colors.backgroundSecondary,
                color: colors.text,
              },
            ]}
            placeholder={
              t("clients.companyPlaceholder") || "Enter company name"
            }
            placeholderTextColor={colors.textSecondary}
            value={newClientData.company}
            onChangeText={(text) =>
              setNewClientData((prev) => ({ ...prev, company: text }))
            }
          />
        </View>

        {/* Navigation buttons inside ScrollView */}
        <View style={[styles.buttonRow, { marginBottom: 20 }]}>
          <Pressable
            style={[
              styles.button,
              styles.buttonSecondary,
              { backgroundColor: colors.backgroundSecondary },
            ]}
            onPress={() => setStep("client")}
            disabled={isCreatingClient}
          >
            <Text style={[styles.buttonText, { color: colors.text }]}>
              {t("common.back") || "Back"}
            </Text>
          </Pressable>
          <Pressable
            testID="create-job-new-client-submit"
            style={[
              styles.button,
              styles.buttonPrimary,
              { backgroundColor: colors.primary },
            ]}
            onPress={handleCreateNewClient}
            disabled={isCreatingClient}
          >
            {isCreatingClient ? (
              <ActivityIndicator
                size="small"
                color={colors.buttonPrimaryText}
              />
            ) : (
              <>
                <Ionicons
                  name="add-circle"
                  size={20}
                  color={colors.buttonPrimaryText}
                />
                <Text
                  style={[
                    styles.buttonText,
                    { color: colors.buttonPrimaryText, marginLeft: 8 },
                  ]}
                >
                  {t("clients.createClient") || "Create Client"}
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );

  const renderCurrentStep = () => {
    switch (step) {
      case "client":
        return renderClientStep();
      case "new-client":
        return renderNewClientStep();
      case "organization":
        return renderOrganizationStep();
      case "schedule":
        return renderScheduleStep();
      case "details":
        return renderDetailsStep();
      case "pricing":
        return renderPricingStep();
      case "confirmation":
        return renderConfirmationStep();
      default:
        return null;
    }
  };

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "flex-end",
    },
    modalContent: {
      backgroundColor: colors.background,
      borderTopLeftRadius: DESIGN_TOKENS.radius.xl,
      borderTopRightRadius: DESIGN_TOKENS.radius.xl,
      maxHeight: "90%",
      flex: 1,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: DESIGN_TOKENS.spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: DESIGN_TOKENS.typography.title.fontSize,
      fontWeight: "700",
      color: colors.text,
    },
    closeButton: {
      padding: DESIGN_TOKENS.spacing.xs,
    },
    progressContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: DESIGN_TOKENS.spacing.md,
      paddingHorizontal: DESIGN_TOKENS.spacing.lg,
    },
    progressDot: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
    },
    progressNumber: {
      fontSize: 12,
      fontWeight: "600",
    },
    progressLine: {
      flex: 1,
      height: 2,
      marginHorizontal: 4,
    },
    stepContent: {
      flex: 1,
      padding: DESIGN_TOKENS.spacing.lg,
    },
    stepTitle: {
      fontSize: DESIGN_TOKENS.typography.title.fontSize,
      fontWeight: "700",
      marginBottom: DESIGN_TOKENS.spacing.xs,
    },
    stepDescription: {
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      marginBottom: DESIGN_TOKENS.spacing.lg,
    },
    createClientButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      padding: DESIGN_TOKENS.spacing.md,
      borderRadius: DESIGN_TOKENS.radius.md,
      marginBottom: DESIGN_TOKENS.spacing.md,
      gap: DESIGN_TOKENS.spacing.sm,
    },
    createClientButtonText: {
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      fontWeight: "600",
    },
    newClientInputGroup: {
      marginBottom: DESIGN_TOKENS.spacing.md,
    },
    newClientInputLabel: {
      fontSize: DESIGN_TOKENS.typography.caption.fontSize,
      fontWeight: "600",
      marginBottom: DESIGN_TOKENS.spacing.xs,
    },
    newClientInput: {
      borderRadius: DESIGN_TOKENS.radius.md,
      padding: DESIGN_TOKENS.spacing.md,
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
    },
    searchContainer: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: DESIGN_TOKENS.spacing.md,
      paddingVertical: DESIGN_TOKENS.spacing.sm,
      borderRadius: DESIGN_TOKENS.radius.md,
      marginBottom: DESIGN_TOKENS.spacing.md,
    },
    searchInput: {
      flex: 1,
      marginLeft: DESIGN_TOKENS.spacing.sm,
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
    },
    clientList: {
      flex: 1,
    },
    clientCard: {
      flexDirection: "row",
      alignItems: "center",
      padding: DESIGN_TOKENS.spacing.md,
      borderRadius: DESIGN_TOKENS.radius.md,
      borderWidth: 1,
      marginBottom: DESIGN_TOKENS.spacing.sm,
    },
    clientAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: "center",
      justifyContent: "center",
    },
    clientInitials: {
      fontSize: 18,
      fontWeight: "700",
      color: "white",
    },
    clientInfo: {
      flex: 1,
      marginLeft: DESIGN_TOKENS.spacing.md,
    },
    clientName: {
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      fontWeight: "600",
    },
    clientEmail: {
      fontSize: DESIGN_TOKENS.typography.caption.fontSize,
      marginTop: 2,
    },
    clientPhone: {
      fontSize: DESIGN_TOKENS.typography.caption.fontSize,
      marginTop: 2,
    },
    emptyState: {
      alignItems: "center",
      paddingVertical: DESIGN_TOKENS.spacing.xl,
    },
    emptyText: {
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
    },
    addressList: {
      flex: 1,
    },
    addressBlock: {
      marginBottom: DESIGN_TOKENS.spacing.lg,
    },
    addressHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: DESIGN_TOKENS.spacing.sm,
    },
    addressEmoji: {
      fontSize: 20,
      marginRight: DESIGN_TOKENS.spacing.sm,
    },
    addressLabel: {
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      fontWeight: "600",
    },
    inputGroup: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: DESIGN_TOKENS.spacing.md,
      paddingVertical: DESIGN_TOKENS.spacing.sm,
      borderRadius: DESIGN_TOKENS.radius.md,
      marginBottom: DESIGN_TOKENS.spacing.sm,
    },
    inputRow: {
      flexDirection: "row",
      gap: DESIGN_TOKENS.spacing.sm,
    },
    inputHalf: {
      flex: 1,
    },
    inputZip: {
      width: "50%",
    },
    input: {
      flex: 1,
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      marginLeft: DESIGN_TOKENS.spacing.sm,
    },
    buttonRow: {
      flexDirection: "row",
      gap: DESIGN_TOKENS.spacing.md,
      marginTop: DESIGN_TOKENS.spacing.lg,
    },
    button: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: DESIGN_TOKENS.spacing.md,
      borderRadius: DESIGN_TOKENS.radius.md,
    },
    buttonPrimary: {
      // backgroundColor set dynamically
    },
    buttonSecondary: {
      borderWidth: 1,
    },
    buttonText: {
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      fontWeight: "600",
    },
    dateDisplay: {
      flexDirection: "row",
      alignItems: "center",
      padding: DESIGN_TOKENS.spacing.md,
      borderRadius: DESIGN_TOKENS.radius.md,
      backgroundColor: colors.primaryLight || colors.primary + "20",
      marginBottom: DESIGN_TOKENS.spacing.lg,
    },
    dateText: {
      marginLeft: DESIGN_TOKENS.spacing.md,
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      fontWeight: "600",
    },
    timeSection: {
      flexDirection: "row",
      gap: DESIGN_TOKENS.spacing.md,
      marginBottom: DESIGN_TOKENS.spacing.lg,
    },
    timeBlock: {
      flex: 1,
    },
    timeLabel: {
      fontSize: DESIGN_TOKENS.typography.caption.fontSize,
      marginBottom: DESIGN_TOKENS.spacing.xs,
    },
    durationBlock: {
      marginBottom: DESIGN_TOKENS.spacing.lg,
    },
    durationUnit: {
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
    },
    sectionLabel: {
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      fontWeight: "600",
      marginBottom: DESIGN_TOKENS.spacing.sm,
      marginTop: DESIGN_TOKENS.spacing.md,
    },
    priorityGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: DESIGN_TOKENS.spacing.sm,
    },
    priorityCard: {
      width: "48%",
      flexDirection: "row",
      alignItems: "center",
      padding: DESIGN_TOKENS.spacing.md,
      borderRadius: DESIGN_TOKENS.radius.md,
      borderWidth: 1,
    },
    priorityEmoji: {
      fontSize: 20,
      marginRight: DESIGN_TOKENS.spacing.sm,
    },
    priorityLabel: {
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      fontWeight: "500",
    },
    textareaContainer: {
      borderRadius: DESIGN_TOKENS.radius.md,
      padding: DESIGN_TOKENS.spacing.md,
    },
    textarea: {
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      minHeight: 100,
    },
    confirmationList: {
      flex: 1,
    },
    confirmationCard: {
      padding: DESIGN_TOKENS.spacing.md,
      borderRadius: DESIGN_TOKENS.radius.md,
      marginBottom: DESIGN_TOKENS.spacing.sm,
    },
    confirmationLabel: {
      fontSize: DESIGN_TOKENS.typography.caption.fontSize,
      marginBottom: DESIGN_TOKENS.spacing.xs,
    },
    confirmationValue: {
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      fontWeight: "600",
    },
    confirmationSubvalue: {
      fontSize: DESIGN_TOKENS.typography.caption.fontSize,
      marginTop: 2,
    },
    selectText: {
      flex: 1,
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      marginLeft: DESIGN_TOKENS.spacing.sm,
    },
    extrasGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: DESIGN_TOKENS.spacing.sm,
    },
    extraCard: {
      width: "31%",
      alignItems: "center",
      padding: DESIGN_TOKENS.spacing.sm,
      borderRadius: DESIGN_TOKENS.radius.md,
      borderWidth: 1,
      minHeight: 80,
    },
    extraEmoji: {
      fontSize: 24,
      marginBottom: DESIGN_TOKENS.spacing.xs,
    },
    extraLabel: {
      fontSize: DESIGN_TOKENS.typography.caption.fontSize,
      textAlign: "center",
    },
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior="padding"
        style={styles.modalOverlay}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <View testID="create-job-modal" style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {t("jobs.createNewJob") || "Create New Job"}
            </Text>
            <Pressable
              testID="create-job-close-btn"
              style={styles.closeButton}
              onPress={handleClose}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>

          {/* Progress bar */}
          {renderProgressBar()}

          {/* Current step content */}
          {renderCurrentStep()}
        </View>
      </KeyboardAvoidingView>

      {/* State Picker Modal */}
      <Modal
        visible={showStatePicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowStatePicker(false)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "flex-end",
          }}
          onPress={() => setShowStatePicker(false)}
        >
          <View
            onStartShouldSetResponder={() => true}
            style={{
              backgroundColor: colors.background,
              borderTopLeftRadius: DESIGN_TOKENS.radius.xl,
              borderTopRightRadius: DESIGN_TOKENS.radius.xl,
              padding: DESIGN_TOKENS.spacing.lg,
              maxHeight: "50%",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: DESIGN_TOKENS.spacing.lg,
              }}
            >
              <Text
                testID="state-picker-title"
                style={{
                  fontSize: DESIGN_TOKENS.typography.title.fontSize,
                  fontWeight: "700",
                  color: colors.text,
                }}
              >
                {t("address.selectState") || "Select State"}
              </Text>
              <Pressable onPress={() => setShowStatePicker(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {AUSTRALIAN_STATES.map((state) => (
                <Pressable
                  key={state.key}
                  testID={`state-option-${state.key}`}
                  onPress={() => {
                    if (step === "organization") {
                      updateSegmentAddress(currentAddressIndex, "state", state.key);
                    } else {
                      updateAddress(currentAddressIndex, "state", state.key);
                    }
                    setShowStatePicker(false);
                  }}
                  style={({ pressed }) => ({
                    backgroundColor: pressed
                      ? colors.backgroundSecondary
                      : "transparent",
                    padding: DESIGN_TOKENS.spacing.md,
                    borderRadius: DESIGN_TOKENS.radius.md,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                  })}
                >
                  <View>
                    <Text
                      style={{
                        fontSize: DESIGN_TOKENS.typography.body.fontSize,
                        fontWeight: "600",
                        color: colors.text,
                      }}
                    >
                      {state.key}
                    </Text>
                    <Text
                      style={{
                        fontSize: DESIGN_TOKENS.typography.caption.fontSize,
                        color: colors.textSecondary,
                      }}
                    >
                      {state.label}
                    </Text>
                  </View>
                  {(step === "organization"
                    ? jobSegments[currentAddressIndex]?.address?.state
                    : addresses[currentAddressIndex]?.state) === state.key && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={colors.primary}
                    />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {/* Staff Picker Modal */}
      <Modal
        visible={showStaffPicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowStaffPicker(false)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "flex-end",
          }}
          onPress={() => setShowStaffPicker(false)}
        >
          <View
            style={{
              backgroundColor: colors.background,
              borderTopLeftRadius: DESIGN_TOKENS.radius.xl,
              borderTopRightRadius: DESIGN_TOKENS.radius.xl,
              padding: DESIGN_TOKENS.spacing.lg,
              maxHeight: "60%",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: DESIGN_TOKENS.spacing.lg,
              }}
            >
              <Text
                style={{
                  fontSize: DESIGN_TOKENS.typography.title.fontSize,
                  fontWeight: "700",
                  color: colors.text,
                }}
              >
                {t("jobs.selectStaff") || "Select Staff Member"}
              </Text>
              <Pressable onPress={() => setShowStaffPicker(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>

            {/* Option to clear selection */}
            <Pressable
              onPress={() => {
                setSelectedStaffId(null);
                setShowStaffPicker(false);
              }}
              style={({ pressed }) => ({
                backgroundColor: pressed
                  ? colors.backgroundSecondary
                  : "transparent",
                padding: DESIGN_TOKENS.spacing.md,
                borderRadius: DESIGN_TOKENS.radius.md,
                flexDirection: "row",
                alignItems: "center",
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              })}
            >
              <Ionicons
                name="close-circle-outline"
                size={24}
                color={colors.textSecondary}
              />
              <Text
                style={{
                  fontSize: DESIGN_TOKENS.typography.body.fontSize,
                  color: colors.textSecondary,
                  marginLeft: DESIGN_TOKENS.spacing.md,
                }}
              >
                {t("common.noSelection") || "No staff assigned"}
              </Text>
            </Pressable>

            <ScrollView showsVerticalScrollIndicator={false}>
              {isLoadingStaff ? (
                <ActivityIndicator
                  size="small"
                  color={colors.primary}
                  style={{ marginTop: 20 }}
                />
              ) : getActiveStaff().length === 0 ? (
                <Text
                  style={{
                    color: colors.textSecondary,
                    textAlign: "center",
                    marginTop: 20,
                  }}
                >
                  {t("staff.noStaffAvailable") || "No staff members available"}
                </Text>
              ) : (
                getActiveStaff().map((staffMember) => (
                  <Pressable
                    key={staffMember.id}
                    onPress={() => {
                      setSelectedStaffId(staffMember.id);
                      setShowStaffPicker(false);
                    }}
                    style={({ pressed }) => ({
                      backgroundColor: pressed
                        ? colors.backgroundSecondary
                        : "transparent",
                      padding: DESIGN_TOKENS.spacing.md,
                      borderRadius: DESIGN_TOKENS.radius.md,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border,
                    })}
                  >
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <View
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          backgroundColor: colors.primary + "20",
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: DESIGN_TOKENS.spacing.md,
                        }}
                      >
                        <Text
                          style={{ color: colors.primary, fontWeight: "600" }}
                        >
                          {staffMember.firstName?.[0]}
                          {staffMember.lastName?.[0]}
                        </Text>
                      </View>
                      <View>
                        <Text
                          style={{
                            fontSize: DESIGN_TOKENS.typography.body.fontSize,
                            fontWeight: "600",
                            color: colors.text,
                          }}
                        >
                          {staffMember.firstName} {staffMember.lastName}
                        </Text>
                        <Text
                          style={{
                            fontSize: DESIGN_TOKENS.typography.caption.fontSize,
                            color: colors.textSecondary,
                          }}
                        >
                          {staffMember.role} • {staffMember.team}
                        </Text>
                      </View>
                    </View>
                    {selectedStaffId === staffMember.id && (
                      <Ionicons
                        name="checkmark"
                        size={20}
                        color={colors.primary}
                      />
                    )}
                  </Pressable>
                ))
              )}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </Modal>
  );
}
