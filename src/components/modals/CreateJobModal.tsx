/**
 * CreateJobModal - Modal pour créer un nouveau job
 * Permet de créer un job avec client, adresse, date/heure, et notes
 */
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
    DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import React, { useEffect, useMemo, useState } from "react";
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
import { useTranslation } from "../../localization";
import {
    ClientAPI,
    createClient,
    CreateClientRequest,
} from "../../services/clients";
import { CreateJobRequest } from "../../services/jobs";
import { TravelBillingMode } from "../../services/pricing";

interface CreateJobModalProps {
  visible: boolean;
  onClose: () => void;
  onCreateJob: (data: CreateJobRequest) => Promise<void>;
  selectedDate?: Date;
}

type Step =
  | "client"
  | "new-client"
  | "address"
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
  { key: "delivery", label: "Delivery Address", emoji: "🏠" },
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
  const { t } = useTranslation();
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

  // Form state
  const [selectedClient, setSelectedClient] = useState<ClientAPI | null>(null);
  const [addresses, setAddresses] = useState<CreateJobRequest["addresses"]>([
    { type: "pickup", street: "", city: "", state: "", zip: "" },
    { type: "delivery", street: "", city: "", state: "", zip: "" },
  ]);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [priority, setPriority] =
    useState<CreateJobRequest["priority"]>("medium");
  const [estimatedDuration, setEstimatedDuration] = useState("4");
  const [notes, setNotes] = useState("");

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
        client.firstName.toLowerCase().includes(query) ||
        client.lastName.toLowerCase().includes(query) ||
        client.email.toLowerCase().includes(query) ||
        client.phone.includes(query),
    );
  }, [clients, searchQuery]);

  const resetModal = () => {
    setStep("client");
    setSelectedClient(null);
    setSearchQuery("");
    setAddresses([
      { type: "pickup", street: "", city: "", state: "", zip: "" },
      { type: "delivery", street: "", city: "", state: "", zip: "" },
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
    setCallOutFeeMinutes(30);
    setDepotToDepot(false);
    setTimeRounding(30);
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
        { type: "delivery", street: "", city: "", state: "", zip: "" },
      ]);
    }
    setStep("address");
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
      };

      console.log(
        "📤 [CreateJobModal] Submitting job data:",
        JSON.stringify(jobData, null, 2),
      );
      await onCreateJob(jobData);
      console.log("✅ [CreateJobModal] Job created successfully");
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
      Alert.alert(
        t("common.success"),
        t("jobs.createSuccess") || "Job created successfully!",
      );
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
      "address",
      "schedule",
      "details",
      "pricing",
      "confirmation",
    ];
    return steps.indexOf(s) + 1;
  };

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      {["client", "address", "schedule", "details", "pricing", "confirmation"].map(
        (s, index) => (
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
        ),
      )}
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
        keyboardShouldPersistTaps="handled"
      >
        {isLoadingClients ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : filteredClients.length > 0 ? (
          filteredClients.map((client) => (
            <Pressable
              key={client.id}
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

      <KeyboardAwareScrollView
        style={styles.addressList}
        showsVerticalScrollIndicator={false}
        enableOnAndroid={true}
        extraScrollHeight={120}
        keyboardShouldPersistTaps="handled"
      >
        {addresses.map((address, index) => (
          <View key={index} style={styles.addressBlock}>
            <View style={styles.addressHeader}>
              <Text style={styles.addressEmoji}>
                {ADDRESS_TYPES[index]?.emoji || "📍"}
              </Text>
              <Text style={[styles.addressLabel, { color: colors.text }]}>
                {ADDRESS_TYPES[index]?.label || `Address ${index + 1}`}
              </Text>
            </View>

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
                  style={[styles.input, { color: colors.text }]}
                  placeholder={t("address.city") || "City"}
                  placeholderTextColor={colors.textSecondary}
                  value={address.city}
                  onChangeText={(value) => updateAddress(index, "city", value)}
                />
              </View>
              {/* State Picker - Remplace le TextInput par un bouton ouvrant un picker */}
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
          showsVerticalScrollIndicator={false}
          enableOnAndroid={true}
          extraScrollHeight={100}
          keyboardShouldPersistTaps="handled"
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
              {jobDate.toLocaleDateString("en-US", {
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
                hours
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
              onPress={() => setStep("address")}
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
        {t("jobs.details") || "Job Details"}
      </Text>
      <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
        {t("jobs.detailsDescription") || "Set priority and add notes"}
      </Text>

      <KeyboardAwareScrollView
        showsVerticalScrollIndicator={false}
        enableOnAndroid={true}
        extraScrollHeight={120}
        keyboardShouldPersistTaps="handled"
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
                {option.label}
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

        {/* Staff Assignment (Optional) */}
        <Text style={[styles.sectionLabel, { color: colors.text }]}>
          {t("jobs.assignStaff") || "Assign Staff (optional)"}
        </Text>
        <Pressable
          style={[
            styles.inputGroup,
            { backgroundColor: colors.backgroundSecondary },
          ]}
          onPress={() => setShowStaffPicker(true)}
        >
          <Ionicons
            name="person"
            size={20}
            color={selectedStaffId ? colors.primary : colors.textSecondary}
          />
          <Text
            style={[
              styles.selectText,
              { color: selectedStaffId ? colors.text : colors.textSecondary },
            ]}
          >
            {selectedStaffId
              ? getActiveStaff().find((s) => s.id === selectedStaffId)
                  ?.firstName +
                " " +
                getActiveStaff().find((s) => s.id === selectedStaffId)?.lastName
              : t("jobs.selectStaff") || "Select a staff member..."}
          </Text>
          <Ionicons
            name="chevron-down"
            size={20}
            color={colors.textSecondary}
          />
        </Pressable>

        {/* Vehicle Type (Optional) */}
        <Text
          style={[
            styles.sectionLabel,
            { color: colors.text, marginTop: DESIGN_TOKENS.spacing.md },
          ]}
        >
          {t("jobs.vehicleType") || "Vehicle Type (optional)"}
        </Text>
        <View style={styles.priorityGrid}>
          {VEHICLE_TYPES.map((vehicle) => (
            <Pressable
              key={vehicle.key}
              style={[
                styles.priorityCard,
                {
                  backgroundColor:
                    selectedVehicleType === vehicle.key
                      ? colors.primary + "20"
                      : colors.backgroundSecondary,
                  borderColor:
                    selectedVehicleType === vehicle.key
                      ? colors.primary
                      : colors.border,
                },
              ]}
              onPress={() =>
                setSelectedVehicleType(
                  selectedVehicleType === vehicle.key ? null : vehicle.key,
                )
              }
            >
              <Text style={styles.priorityEmoji}>{vehicle.emoji}</Text>
              <Text style={[styles.priorityLabel, { color: colors.text }]}>
                {vehicle.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Extras */}
        <Text
          style={[
            styles.sectionLabel,
            { color: colors.text, marginTop: DESIGN_TOKENS.spacing.md },
          ]}
        >
          {t("jobs.extras") || "Extras (optional)"}
        </Text>
        <View style={styles.extrasGrid}>
          {EXTRAS_OPTIONS.map((extra) => {
            const isSelected = selectedExtras.includes(extra.key);
            return (
              <Pressable
                key={extra.key}
                style={[
                  styles.extraCard,
                  {
                    backgroundColor: isSelected
                      ? colors.primary + "20"
                      : colors.backgroundSecondary,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => {
                  if (isSelected) {
                    setSelectedExtras(
                      selectedExtras.filter((e) => e !== extra.key),
                    );
                  } else {
                    setSelectedExtras([...selectedExtras, extra.key]);
                  }
                }}
              >
                <Text style={styles.extraEmoji}>{extra.emoji}</Text>
                <Text
                  style={[
                    styles.extraLabel,
                    { color: isSelected ? colors.primary : colors.text },
                  ]}
                  numberOfLines={2}
                >
                  {extra.label}
                </Text>
                {isSelected && (
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={colors.primary}
                    style={{ position: "absolute", top: 4, right: 4 }}
                  />
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Payment Section */}
        <Text
          style={[
            styles.sectionLabel,
            { color: colors.text, marginTop: DESIGN_TOKENS.spacing.lg },
          ]}
        >
          💰 {t("jobs.payment") || "Payment Details (optional)"}
        </Text>

        {/* Quote / Total Amount */}
        <View
          style={[
            styles.inputGroup,
            { backgroundColor: colors.backgroundSecondary },
          ]}
        >
          <Ionicons
            name="cash-outline"
            size={20}
            color={colors.textSecondary}
          />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder={t("jobs.quoteAmount") || "Quote Amount ($)"}
            placeholderTextColor={colors.textSecondary}
            value={amountTotal}
            onChangeText={setAmountTotal}
            keyboardType="decimal-pad"
          />
        </View>

        {/* Payment Method */}
        <Text
          style={[
            styles.sectionLabel,
            { color: colors.text, marginTop: DESIGN_TOKENS.spacing.md },
          ]}
        >
          {t("jobs.paymentMethod") || "Payment Method"}
        </Text>
        <View style={styles.priorityGrid}>
          {PAYMENT_METHOD_OPTIONS.map((method) => (
            <Pressable
              key={method.key}
              style={[
                styles.priorityCard,
                {
                  backgroundColor:
                    paymentMethod === method.key
                      ? colors.primary + "20"
                      : colors.backgroundSecondary,
                  borderColor:
                    paymentMethod === method.key
                      ? colors.primary
                      : colors.border,
                },
              ]}
              onPress={() =>
                setPaymentMethod(
                  paymentMethod === method.key ? null : method.key,
                )
              }
            >
              <Text style={styles.priorityEmoji}>{method.emoji}</Text>
              <Text style={[styles.priorityLabel, { color: colors.text }]}>
                {method.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Deposit Required Toggle */}
        <Pressable
          style={[
            styles.inputGroup,
            {
              backgroundColor: colors.backgroundSecondary,
              marginTop: DESIGN_TOKENS.spacing.md,
            },
          ]}
          onPress={() => setDepositRequired(!depositRequired)}
        >
          <Ionicons
            name={depositRequired ? "checkbox" : "square-outline"}
            size={24}
            color={depositRequired ? colors.primary : colors.textSecondary}
          />
          <Text style={[styles.input, { color: colors.text, flex: 1 }]}>
            {t("jobs.depositRequired") || "Deposit Required"}
          </Text>
        </Pressable>

        {/* Deposit Details (shown if deposit required) */}
        {depositRequired && (
          <>
            <View
              style={[
                styles.inputGroup,
                {
                  backgroundColor: colors.backgroundSecondary,
                  marginTop: DESIGN_TOKENS.spacing.sm,
                },
              ]}
            >
              <Ionicons
                name="pie-chart-outline"
                size={20}
                color={colors.textSecondary}
              />
              <TextInput
                style={[styles.input, { color: colors.text, flex: 1 }]}
                placeholder={
                  t("jobs.depositPercentage") || "Deposit % (e.g. 50)"
                }
                placeholderTextColor={colors.textSecondary}
                value={depositPercentage}
                onChangeText={setDepositPercentage}
                keyboardType="number-pad"
              />
              <Text style={{ color: colors.textSecondary }}>%</Text>
            </View>

            {/* Calculated deposit amount */}
            {amountTotal && depositPercentage && (
              <View
                style={{
                  paddingHorizontal: DESIGN_TOKENS.spacing.md,
                  paddingVertical: DESIGN_TOKENS.spacing.sm,
                }}
              >
                <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
                  {t("jobs.depositAmount") || "Deposit amount"}: $
                  {(
                    (parseFloat(amountTotal) * parseFloat(depositPercentage)) /
                    100
                  ).toFixed(2)}
                </Text>
              </View>
            )}

            {/* Deposit Paid Toggle */}
            <Pressable
              style={[
                styles.inputGroup,
                {
                  backgroundColor: colors.backgroundSecondary,
                  marginTop: DESIGN_TOKENS.spacing.sm,
                },
              ]}
              onPress={() => setDepositPaid(!depositPaid)}
            >
              <Ionicons
                name={depositPaid ? "checkmark-circle" : "ellipse-outline"}
                size={24}
                color={depositPaid ? "#22c55e" : colors.textSecondary}
              />
              <Text style={[styles.input, { color: colors.text, flex: 1 }]}>
                {t("jobs.depositPaid") || "Deposit Already Paid"}
              </Text>
              {depositPaid && (
                <Ionicons name="checkmark" size={20} color="#22c55e" />
              )}
            </Pressable>
          </>
        )}

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

        <KeyboardAwareScrollView
          showsVerticalScrollIndicator={false}
          enableOnAndroid={true}
          extraScrollHeight={120}
          keyboardShouldPersistTaps="handled"
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
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: "600" }}>
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

          {/* Depot to Depot Toggle */}
          <Text
            style={[
              styles.sectionLabel,
              { color: colors.text, marginTop: DESIGN_TOKENS.spacing.lg },
            ]}
          >
            🚛 {t("jobs.depotToDepot") || "Depot to Depot"}
          </Text>
          <Pressable
            style={[
              styles.inputGroup,
              {
                backgroundColor: depotToDepot
                  ? colors.primary + "20"
                  : colors.backgroundSecondary,
                borderWidth: 1,
                borderColor: depotToDepot ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setDepotToDepot(!depotToDepot)}
          >
            <Ionicons
              name={depotToDepot ? "checkbox" : "square-outline"}
              size={24}
              color={depotToDepot ? colors.primary : colors.textSecondary}
            />
            <View style={{ flex: 1, marginLeft: DESIGN_TOKENS.spacing.sm }}>
              <Text style={[styles.input, { color: colors.text }]}>
                {t("jobs.depotToDepotLabel") ||
                  "Bill from depot departure to return"}
              </Text>
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: 12,
                  marginTop: 2,
                }}
              >
                {depotToDepot
                  ? t("jobs.depotToDepotActiveDesc") ||
                    "All travel time is billable, no call-out fee"
                  : t("jobs.depotToDepotInactiveDesc") ||
                    "Fixed call-out fee, travel time not billed separately"}
              </Text>
            </View>
          </Pressable>

          {/* Call Out Fee - Hidden if Depot to Depot is active */}
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
                    <Text style={[styles.priorityLabel, { color: colors.text }]}>
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
                    +{option.marginMinutes}min margin
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
              style={[styles.confirmationLabel, { color: colors.textSecondary }]}
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
                  {depotToDepot ? "N/A (Depot-Depot)" : `$${callOutFeeAmount.toFixed(0)}`}
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
                  2h + {depotToDepot ? "travel" : "call-out"} = $
                  {(2 * parseFloat(hourlyRate || "0") + callOutFeeAmount).toFixed(0)}
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
                  {timeRounding} min ({roundingMargin > 0 ? `+${roundingMargin}min margin` : "exact"})
                </Text>
              </View>
            </View>
          </View>

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

        {/* Addresses */}
        {addresses.map((address, index) => (
          <View
            key={index}
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
              {ADDRESS_TYPES[index]?.emoji} {ADDRESS_TYPES[index]?.label}
            </Text>
            <Text style={[styles.confirmationValue, { color: colors.text }]}>
              {address.street}
            </Text>
            <Text
              style={[
                styles.confirmationSubvalue,
                { color: colors.textSecondary },
              ]}
            >
              {address.city}, {address.state} {address.zip}
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
            {jobDate.toLocaleDateString("en-US", {
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
            {startTime} - {endTime} ({estimatedDuration}h estimated)
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
            {PRIORITY_OPTIONS.find((p) => p.key === priority)?.label}
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
              {VEHICLE_TYPES.find((v) => v.key === selectedVehicleType)?.label}
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
                  return extra ? `${extra.emoji} ${extra.label}` : e;
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
            style={[
              styles.confirmationLabel,
              { color: colors.textSecondary },
            ]}
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
              ? "🚛 Depot-to-Depot (travel time billable)"
              : `📞 Call-out: ${callOutFeeMinutes}min ($${((callOutFeeMinutes / 60) * parseFloat(hourlyRate || "0")).toFixed(0)})`}
          </Text>
          <Text
            style={[
              styles.confirmationSubvalue,
              { color: colors.textSecondary },
            ]}
          >
            ⏱️ Rounding: {timeRounding}min
            {TIME_ROUNDING_OPTIONS.find((o) => o.key === timeRounding)
              ?.marginMinutes
              ? ` (+${TIME_ROUNDING_OPTIONS.find((o) => o.key === timeRounding)?.marginMinutes}min margin)`
              : " (exact)"}
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
                {
                  PAYMENT_METHOD_OPTIONS.find((m) => m.key === paymentMethod)
                    ?.label
                }
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
                {depositPaid ? " ✅ Paid" : " ⏳ Pending"}
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
      const newClient = await createClient(newClientData);
      // Refresh la liste des clients
      await refetchClients();
      // Sélectionner automatiquement le nouveau client
      setSelectedClient(newClient);
      // Passer à l'étape suivante (address)
      setStep("address");
      // Réinitialiser le formulaire
      setNewClientData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        company: "",
      });
      Alert.alert(
        t("clients.success.created") || "Success",
        t("clients.success.clientCreated") || "Client created successfully",
      );
    } catch (error) {
      Alert.alert(
        t("common.error") || "Error",
        t("clients.error.createFailed") || "Failed to create client",
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

      <KeyboardAwareScrollView
        style={styles.clientList}
        showsVerticalScrollIndicator={false}
        enableOnAndroid={true}
        extraScrollHeight={120}
        keyboardShouldPersistTaps="handled"
      >
        {/* First Name */}
        <View style={styles.newClientInputGroup}>
          <Text style={[styles.newClientInputLabel, { color: colors.text }]}>
            {t("clients.firstName") || "First Name"} *
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

        {/* Navigation buttons - à l'intérieur du KeyboardAwareScrollView */}
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
      </KeyboardAwareScrollView>
    </View>
  );

  const renderCurrentStep = () => {
    switch (step) {
      case "client":
        return renderClientStep();
      case "new-client":
        return renderNewClientStep();
      case "address":
        return renderAddressStep();
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
      minHeight: "70%",
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
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalOverlay}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {t("jobs.createNewJob") || "Create New Job"}
            </Text>
            <Pressable style={styles.closeButton} onPress={handleClose}>
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
                  onPress={() => {
                    updateAddress(currentAddressIndex, "state", state.key);
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
                  {addresses[currentAddressIndex]?.state === state.key && (
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
