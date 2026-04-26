/**
 * AddStaffModal - Modal pour ajouter un membre du personnel
 * Permet d'ajouter un employé (TFN) ou un prestataire (ABN)
 */
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Contacts from "expo-contacts";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { DESIGN_TOKENS } from "../../constants/Styles";
import { useOnboardingTarget } from "../../context/OnboardingSpotlightContext";
import { useOnboardingTour } from "../../context/OnboardingTourContext";
import { useTheme } from "../../context/ThemeProvider";
import { useLocalization } from "../../localization/useLocalization";
import {
    CobbrUserMatch,
    lookupUsersByPhones,
} from "../../services/usersLookup";
import { Contractor, InviteEmployeeData } from "../../types/staff";
import { OnboardingTourOverlay } from "../onboarding/OnboardingTourOverlay";

interface AddStaffModalProps {
  visible: boolean;
  onClose: () => void;
  onInviteEmployee: (data: InviteEmployeeData) => Promise<void>;
  onSearchContractor: (searchTerm: string) => Promise<Contractor[]>;
  onAddContractor: (
    contractorId: string,
    contractStatus: Contractor["contractStatus"],
  ) => Promise<void>;
  onInviteContractor?: (
    email: string,
    firstName: string,
    lastName: string,
  ) => Promise<{ success: boolean; message: string }>;
}

type StaffType = "employee" | "contractor";
type Step =
  | "type"
  | "contacts-import"
  | "employee-form"
  | "contractor-search"
  | "contractor-results"
  | "contractor-invite";

interface ContactEntry {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export default function AddStaffModal({
  visible,
  onClose,
  onInviteEmployee,
  onSearchContractor,
  onAddContractor,
  onInviteContractor,
}: AddStaffModalProps) {
  const { colors } = useTheme();
  const { t } = useLocalization();
  const [step, setStep] = useState<Step>("type");
  const [staffType, setStaffType] = useState<StaffType>("employee");
  const [isLoading, setIsLoading] = useState(false);

  // Onboarding: anchor the step-16 bubble on the employee-vs-contractor choice.
  const typeChoiceTarget = useOnboardingTarget(23);
  const {
    currentStep: onboardingStep,
    advanceToStep,
    markStepSeen,
  } = useOnboardingTour();

  // When the modal opens while the user is on step 22 (from the assign-resource
  // flow) OR step 26 (from the resources page), advance to step 23 so the
  // "Employee or contractor?" bubble shows on the first screen.
  useEffect(() => {
    if (!visible) return;
    if (onboardingStep === 22) {
      advanceToStep(23);
    } else if (onboardingStep === 26) {
      markStepSeen(26);
      advanceToStep(23);
    }
  }, [visible, onboardingStep, advanceToStep, markStepSeen]);

  // Formulaire employé
  const [employeeData, setEmployeeData] = useState<InviteEmployeeData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "",
    team: "",
    hourlyRate: 0,
  });

  // Recherche prestataire
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Contractor[]>([]);

  // Invitation prestataire
  const [contractorInviteData, setContractorInviteData] = useState({
    email: "",
    firstName: "",
    lastName: "",
  });

  // ── Import depuis les contacts du téléphone ──
  const [contactsPermission, setContactsPermission] =
    useState<Contacts.PermissionStatus | null>(null);
  const [contactsList, setContactsList] = useState<ContactEntry[]>([]);
  const [contactsSearch, setContactsSearch] = useState("");
  const [contactsLoading, setContactsLoading] = useState(false);
  // Map of normalized phone (last 9 digits) -> Cobbr user info
  const [cobbrUsersByPhone, setCobbrUsersByPhone] = useState<
    Record<string, CobbrUserMatch["user"]>
  >({});

  const loadContacts = useCallback(async () => {
    setContactsLoading(true);
    try {
      const { data } = await Contacts.getContactsAsync({
        fields: [
          Contacts.Fields.FirstName,
          Contacts.Fields.LastName,
          Contacts.Fields.Emails,
          Contacts.Fields.PhoneNumbers,
        ],
        sort: Contacts.SortTypes.FirstName,
      });
      const normalized: ContactEntry[] = data
        .map((c) => ({
          id: c.id ?? `${c.firstName ?? ""}-${c.lastName ?? ""}-${Math.random()}`,
          firstName: c.firstName ?? "",
          lastName: c.lastName ?? "",
          email: c.emails?.[0]?.email ?? "",
          phone: c.phoneNumbers?.[0]?.number ?? "",
        }))
        .filter((c) => (c.firstName || c.lastName) && (c.email || c.phone));
      setContactsList(normalized);

      // Identify which contacts are already Cobbr users (by phone match).
      const phones = normalized.map((c) => c.phone).filter(Boolean);
      if (phones.length > 0) {
        const matches = await lookupUsersByPhones(phones);
        const map: Record<string, CobbrUserMatch["user"]> = {};
        for (const m of matches) {
          const key = (m.phone || "").replace(/\D+/g, "").slice(-9);
          if (key) map[key] = m.user;
        }
        setCobbrUsersByPhone(map);
      }
    } catch (e) {
      Alert.alert(
        t("staffModals.addStaff.validation.error"),
        t("staffModals.addStaff.importContacts.loadError" as any),
      );
    } finally {
      setContactsLoading(false);
    }
  }, [t]);

  const phoneKey = useCallback((phone: string) => {
    return (phone || "").replace(/\D+/g, "").slice(-9);
  }, []);

  const isCobbrUser = useCallback(
    (c: ContactEntry) => !!cobbrUsersByPhone[phoneKey(c.phone)],
    [cobbrUsersByPhone, phoneKey],
  );

  const handleOpenContactsImport = useCallback(async () => {
    const current = await Contacts.getPermissionsAsync();
    setContactsPermission(current.status);
    setStep("contacts-import");
    if (current.status === Contacts.PermissionStatus.GRANTED) {
      loadContacts();
    }
  }, [loadContacts]);

  const handleRequestContactsPermission = useCallback(async () => {
    const { status } = await Contacts.requestPermissionsAsync();
    setContactsPermission(status);
    if (status === Contacts.PermissionStatus.GRANTED) {
      loadContacts();
    }
  }, [loadContacts]);

  // When the search box is empty, only Cobbr-registered contacts are shown.
  // As soon as the user types something, we search through ALL device contacts.
  const cobbrContacts = useMemo(
    () => contactsList.filter(isCobbrUser),
    [contactsList, isCobbrUser],
  );

  const filteredContacts = useMemo(() => {
    const q = contactsSearch.trim().toLowerCase();
    if (!q) return cobbrContacts;
    return contactsList.filter((c) =>
      `${c.firstName} ${c.lastName} ${c.email} ${c.phone}`
        .toLowerCase()
        .includes(q),
    );
  }, [cobbrContacts, contactsList, contactsSearch]);

  const handleContactAddAsEmployee = (c: ContactEntry) => {
    setEmployeeData((prev) => ({
      ...prev,
      firstName: c.firstName,
      lastName: c.lastName,
      email: c.email,
      phone: c.phone,
    }));
    setStaffType("employee");
    setStep("employee-form");
  };

  const handleContactInviteAsContractor = (c: ContactEntry) => {
    setContractorInviteData({
      firstName: c.firstName,
      lastName: c.lastName,
      email: c.email,
    });
    setStaffType("contractor");
    setStep("contractor-invite");
  };

  const resetModal = () => {
    setStep("type");
    setStaffType("employee");
    setEmployeeData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      role: "",
      team: "",
      hourlyRate: 0,
    });
    setSearchTerm("");
    setSearchResults([]);
    setContractorInviteData({ email: "", firstName: "", lastName: "" });
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const handleSelectType = (type: StaffType) => {
    setStaffType(type);
    // Onboarding: the user answered the "Employee or contractor?" question.
    // Mark step 23 (and beyond) done — the tour ends here.
    markStepSeen(23);
    markStepSeen(24);
    markStepSeen(25);
    if (type === "employee") {
      setStep("employee-form");
    } else {
      setStep("contractor-search");
    }
  };

  const handleInviteEmployee = async () => {
    // Validation
    if (!employeeData.firstName) {
      Alert.alert(
        t("staffModals.addStaff.validation.error"),
        t("staffModals.addStaff.validation.nameRequired"),
      );
      return;
    }
    if (!employeeData.email) {
      Alert.alert(
        t("staffModals.addStaff.validation.error"),
        t("staffModals.addStaff.validation.emailRequired"),
      );
      return;
    }

    setIsLoading(true);
    try {
      await onInviteEmployee(employeeData);
      Alert.alert(
        t("staffModals.addStaff.success.invitationSent"),
        t("staffModals.addStaff.success.invitationSentMessage", {
          email: employeeData.email,
        }),
      );
      handleClose();
    } catch (error) {
      Alert.alert(
        t("staffModals.addStaff.validation.error"),
        t("staffModals.addStaff.validation.emailRequired"),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchContractor = async () => {
    if (!searchTerm.trim()) {
      Alert.alert(
        t("staffModals.addStaff.validation.error"),
        t("staffModals.addStaff.contractorSearch.placeholder"),
      );
      return;
    }

    setIsLoading(true);
    try {
      const results = await onSearchContractor(searchTerm);
      setSearchResults(results);
      setStep("contractor-results");
    } catch (error) {
      Alert.alert(
        t("staffModals.addStaff.validation.error"),
        t("staffModals.addStaff.validation.error"),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddContractor = async (contractor: Contractor) => {
    Alert.alert(
      t("staffModals.addStaff.confirm.addContractor"),
      t("staffModals.addStaff.confirm.addContractorMessage", {
        name: `${contractor.firstName} ${contractor.lastName}`,
      }),
      [
        { text: t("staffModals.addStaff.confirm.cancel"), style: "cancel" },
        {
          text: t("staffModals.addStaff.confirm.add"),
          onPress: async () => {
            setIsLoading(true);
            try {
              await onAddContractor(contractor.id, "standard");
              Alert.alert(
                t("staffModals.addStaff.success.contractorAdded"),
                t("staffModals.addStaff.success.contractorAddedMessage", {
                  name: `${contractor.firstName} ${contractor.lastName}`,
                }),
              );
              handleClose();
            } catch (error) {
              Alert.alert(
                t("staffModals.addStaff.validation.error"),
                t("staffModals.addStaff.validation.error"),
              );
            } finally {
              setIsLoading(false);
            }
          },
        },
      ],
    );
  };

  const handleInviteContractor = () => {
    // Passer à l'étape d'invitation
    setStep("contractor-invite");
  };

  // ── Invite link (contractor only) ─────────────────────────────────────────
  // Generates a unique token for the invitation link. The landing page on
  // cobbr-app.com/invite/contractor/{token} doesn't exist yet — the backend
  // will eventually accept the token to create the invite. For now we just
  // produce a stable token per opening of the contractor-invite step so the
  // user can share it. New token each time the user re-enters this step.
  const [inviteToken, setInviteToken] = useState<string>("");
  useEffect(() => {
    if (step !== "contractor-invite") return;
    if (inviteToken) return;
    const ts = Date.now().toString(36);
    const rand = Array.from({ length: 12 }, () =>
      Math.floor(Math.random() * 36).toString(36),
    ).join("");
    setInviteToken(`${ts}-${rand}`);
  }, [step, inviteToken]);
  // Reset the token when leaving the contractor-invite step so the next open
  // generates a fresh link.
  useEffect(() => {
    if (step !== "contractor-invite" && inviteToken) {
      setInviteToken("");
    }
  }, [step, inviteToken]);

  const inviteLink = useMemo(
    () =>
      inviteToken
        ? `https://cobbr-app.com/invite/contractor/${inviteToken}`
        : "",
    [inviteToken],
  );

  const handleCopyInviteLink = async () => {
    if (!inviteLink) return;
    try {
      await Clipboard.setStringAsync(inviteLink);
      Alert.alert(
        t("staffModals.addStaff.contractorInvite.shareLink.copiedTitle"),
        t("staffModals.addStaff.contractorInvite.shareLink.copiedMessage"),
      );
    } catch {
      // ignore — non-critical
    }
  };

  const handleShareInviteLink = async () => {
    if (!inviteLink) return;
    try {
      await Share.share({
        message: t(
          "staffModals.addStaff.contractorInvite.shareLink.shareMessage",
          { url: inviteLink } as any,
        ),
        url: inviteLink,
        title: t("staffModals.addStaff.contractorInvite.shareLink.shareTitle"),
      });
    } catch {
      // user cancelled or platform error — silent
    }
  };

  const handleSendContractorInvite = async () => {
    if (!contractorInviteData.email) {
      Alert.alert(
        t("staffModals.addStaff.validation.error"),
        t("staffModals.addStaff.validation.contractorEmailRequired"),
      );
      return;
    }
    if (!contractorInviteData.firstName || !contractorInviteData.lastName) {
      Alert.alert(
        t("staffModals.addStaff.validation.error"),
        t("staffModals.addStaff.validation.contractorNameRequired"),
      );
      return;
    }

    setIsLoading(true);
    try {
      if (onInviteContractor) {
        const result = await onInviteContractor(
          contractorInviteData.email,
          contractorInviteData.firstName,
          contractorInviteData.lastName,
        );
        Alert.alert(
          t("staffModals.addStaff.success.invitationSent"),
          result.message,
        );
      } else {
        // Fallback si pas de handler
        Alert.alert(
          t("staffModals.addStaff.success.invitationSent"),
          t("staffModals.addStaff.success.invitationSentMessage", {
            email: contractorInviteData.email,
          }),
        );
      }
      handleClose();
    } catch (error) {
      Alert.alert(
        t("staffModals.addStaff.validation.error"),
        t("staffModals.addStaff.validation.error"),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepType = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>
        {t("staffModals.addStaff.typeStep.title")}
      </Text>
      <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
        {t("staffModals.addStaff.typeStep.subtitle")}
      </Text>

      {/* Import from phone contacts — placed BEFORE the type options so users
          can skip straight to picking someone from their address book. */}
      <Pressable
        testID="add-staff-import-contacts-btn"
        onPress={handleOpenContactsImport}
        style={({ pressed }) => [
          styles.importContactsBtn,
          {
            backgroundColor: colors.primary + "10",
            borderColor: colors.primary + "50",
            opacity: pressed ? 0.7 : 1,
            marginBottom: DESIGN_TOKENS.spacing.md,
          },
        ]}
      >
        <Ionicons
          name="people-circle-outline"
          size={22}
          color={colors.primary}
        />
        <View style={{ flex: 1, marginLeft: DESIGN_TOKENS.spacing.sm }}>
          <Text
            style={[styles.importContactsTitle, { color: colors.primary }]}
          >
            {t("staffModals.addStaff.importContacts.title")}
          </Text>
          <Text
            style={[
              styles.importContactsSubtitle,
              { color: colors.textSecondary },
            ]}
          >
            {t("staffModals.addStaff.importContacts.subtitle")}
          </Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={18}
          color={colors.textSecondary}
        />
      </Pressable>

      <View
        style={styles.typeOptions}
        ref={typeChoiceTarget.ref}
        onLayout={typeChoiceTarget.onLayout}
      >
        <Pressable
          testID="add-staff-type-employee-btn"
          style={[
            styles.typeOption,
            { backgroundColor: colors.backgroundSecondary },
          ]}
          onPress={() => handleSelectType("employee")}
        >
          <View
            style={[
              styles.typeIconContainer,
              { backgroundColor: `${colors.success}20` },
            ]}
          >
            <Ionicons name="person" size={32} color={colors.success} />
          </View>
          <Text style={[styles.typeOptionTitle, { color: colors.text }]}>
            {t("staffModals.addStaff.typeStep.employee.title")}
          </Text>
          <Text
            style={[
              styles.typeOptionDescription,
              { color: colors.textSecondary },
            ]}
          >
            {t("staffModals.addStaff.typeStep.employee.description")}
          </Text>
          <View style={styles.typeOptionFeatures}>
            <View style={styles.featureItem}>
              <Ionicons
                name="checkmark-circle"
                size={16}
                color={colors.success}
              />
              <Text
                style={[styles.featureText, { color: colors.textSecondary }]}
              >
                {t("staffModals.addStaff.typeStep.employee.feature1")}
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons
                name="checkmark-circle"
                size={16}
                color={colors.success}
              />
              <Text
                style={[styles.featureText, { color: colors.textSecondary }]}
              >
                {t("staffModals.addStaff.typeStep.employee.feature2")}
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons
                name="checkmark-circle"
                size={16}
                color={colors.success}
              />
              <Text
                style={[styles.featureText, { color: colors.textSecondary }]}
              >
                {t("staffModals.addStaff.typeStep.employee.feature3")}
              </Text>
            </View>
          </View>
        </Pressable>

        <Pressable
          testID="add-staff-type-contractor-btn"
          style={[
            styles.typeOption,
            { backgroundColor: colors.backgroundSecondary },
          ]}
          onPress={() => handleSelectType("contractor")}
        >
          <View
            style={[
              styles.typeIconContainer,
              { backgroundColor: `${colors.info}20` },
            ]}
          >
            <Ionicons name="briefcase" size={32} color={colors.info} />
          </View>
          <Text style={[styles.typeOptionTitle, { color: colors.text }]}>
            {t("staffModals.addStaff.typeStep.contractor.title")}
          </Text>
          <Text
            style={[
              styles.typeOptionDescription,
              { color: colors.textSecondary },
            ]}
          >
            {t("staffModals.addStaff.typeStep.contractor.description")}
          </Text>
          <View style={styles.typeOptionFeatures}>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={16} color={colors.info} />
              <Text
                style={[styles.featureText, { color: colors.textSecondary }]}
              >
                {t("staffModals.addStaff.typeStep.contractor.feature1")}
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={16} color={colors.info} />
              <Text
                style={[styles.featureText, { color: colors.textSecondary }]}
              >
                {t("staffModals.addStaff.typeStep.contractor.feature2")}
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={16} color={colors.info} />
              <Text
                style={[styles.featureText, { color: colors.textSecondary }]}
              >
                {t("staffModals.addStaff.typeStep.contractor.feature3")}
              </Text>
            </View>
          </View>
        </Pressable>
      </View>

      {/* Import from phone contacts — helps detect which contacts are already on Cobbr */}
    </View>
  );

  const renderEmployeeForm = () => (
    <View style={styles.stepContainer}>
      <Pressable style={styles.backButton} onPress={() => setStep("type")}>
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </Pressable>

      <Text style={[styles.stepTitle, { color: colors.text }]}>
        {t("staffModals.addStaff.employeeForm.title")}
      </Text>
      <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
        {t("staffModals.addStaff.typeStep.employee.description")}
      </Text>

      <View style={styles.form}>
        <View style={styles.formRow}>
          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={[styles.label, { color: colors.text }]}>
              {t("staffModals.addStaff.employeeForm.firstName")}
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.backgroundSecondary,
                  color: colors.text,
                },
              ]}
              value={employeeData.firstName}
              onChangeText={(text) =>
                setEmployeeData({ ...employeeData, firstName: text })
              }
              placeholder="John"
              placeholderTextColor={colors.textSecondary}
              testID="add-staff-firstname-input"
            />
          </View>
          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={[styles.label, { color: colors.text }]}>
              {t("staffModals.addStaff.employeeForm.lastName")}
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.backgroundSecondary,
                  color: colors.text,
                },
              ]}
              value={employeeData.lastName}
              onChangeText={(text) =>
                setEmployeeData({ ...employeeData, lastName: text })
              }
              placeholder="Smith"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>
            {t("staffModals.addStaff.employeeForm.email")}
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.backgroundSecondary,
                color: colors.text,
              },
            ]}
            value={employeeData.email}
            onChangeText={(text) =>
              setEmployeeData({ ...employeeData, email: text })
            }
            placeholder="john.smith@example.com"
            placeholderTextColor={colors.textSecondary}
            keyboardType="email-address"
            autoCapitalize="none"
            testID="add-staff-email-input"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>
            {t("staffModals.addStaff.employeeForm.phone")}
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.backgroundSecondary,
                color: colors.text,
              },
            ]}
            value={employeeData.phone}
            onChangeText={(text) =>
              setEmployeeData({ ...employeeData, phone: text })
            }
            placeholder="+61 412 345 678"
            placeholderTextColor={colors.textSecondary}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>
            {t("staffModals.addStaff.employeeForm.position")}
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.backgroundSecondary,
                color: colors.text,
              },
            ]}
            value={employeeData.role}
            onChangeText={(text) =>
              setEmployeeData({ ...employeeData, role: text })
            }
            placeholder="Ex: Moving Supervisor"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>
            {t("staffModals.addStaff.employeeForm.team")}
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.backgroundSecondary,
                color: colors.text,
              },
            ]}
            value={employeeData.team}
            onChangeText={(text) =>
              setEmployeeData({ ...employeeData, team: text })
            }
            placeholder="Ex: Local Moving Team A"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>
            {t("staffModals.addStaff.employeeForm.hourlyRate")}
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.backgroundSecondary,
                color: colors.text,
              },
            ]}
            value={
              employeeData.hourlyRate > 0 ? String(employeeData.hourlyRate) : ""
            }
            onChangeText={(text) =>
              setEmployeeData({
                ...employeeData,
                hourlyRate: parseFloat(text) || 0,
              })
            }
            placeholder="35"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
          />
        </View>
      </View>

      <Pressable
        testID="add-staff-submit-btn"
        style={[
          styles.submitButton,
          { backgroundColor: colors.primary },
          isLoading && styles.submitButtonDisabled,
        ]}
        onPress={handleInviteEmployee}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color={colors.background} />
        ) : (
          <>
            <Ionicons name="mail" size={20} color={colors.background} />
            <Text
              style={[styles.submitButtonText, { color: colors.background }]}
            >
              {t("staffModals.addStaff.employeeForm.submit")}
            </Text>
          </>
        )}
      </Pressable>
    </View>
  );

  const renderContractorSearch = () => (
    <View style={styles.stepContainer}>
      <Pressable style={styles.backButton} onPress={() => setStep("type")}>
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </Pressable>

      <Text style={[styles.stepTitle, { color: colors.text }]}>
        {t("staffModals.addStaff.contractorSearch.title")}
      </Text>
      <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
        {t("staffModals.addStaff.contractorSearch.placeholder")}
      </Text>

      <View style={styles.searchContainer}>
        <TextInput
          style={[
            styles.searchInput,
            { backgroundColor: colors.backgroundSecondary, color: colors.text },
          ]}
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholder={t("staffModals.addStaff.contractorSearch.placeholder")}
          placeholderTextColor={colors.textSecondary}
          onSubmitEditing={handleSearchContractor}
        />
        <Pressable
          style={[styles.searchButton, { backgroundColor: colors.primary }]}
          onPress={handleSearchContractor}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Ionicons name="search" size={24} color={colors.background} />
          )}
        </Pressable>
      </View>

      <View style={styles.divider}>
        <View
          style={[styles.dividerLine, { backgroundColor: colors.border }]}
        />
        <Text style={[styles.dividerText, { color: colors.textSecondary }]}>
          {t("staffModals.addStaff.contractorSearch.or").toUpperCase()}
        </Text>
        <View
          style={[styles.dividerLine, { backgroundColor: colors.border }]}
        />
      </View>

      <Pressable
        style={[
          styles.inviteButton,
          { backgroundColor: colors.backgroundSecondary },
        ]}
        onPress={handleInviteContractor}
      >
        <Ionicons name="person-add" size={24} color={colors.primary} />
        <Text style={[styles.inviteButtonText, { color: colors.text }]}>
          {t("staffModals.addStaff.contractorSearch.inviteNew")}
        </Text>
      </Pressable>
    </View>
  );

  const renderContractorResults = () => (
    <View style={styles.stepContainer}>
      <Pressable
        style={styles.backButton}
        onPress={() => setStep("contractor-search")}
      >
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </Pressable>

      <Text style={[styles.stepTitle, { color: colors.text }]}>
        {t("staffModals.addStaff.contractorResults.title")}
      </Text>
      <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
        {searchResults.length}{" "}
        {searchResults.length > 1 ? "contractors" : "contractor"}
      </Text>

      {searchResults.length === 0 ? (
        <View style={styles.emptyResults}>
          <Ionicons
            name="search-outline"
            size={64}
            color={colors.textSecondary}
          />
          <Text style={[styles.emptyResultsText, { color: colors.text }]}>
            {t("staffModals.addStaff.contractorResults.noResults")}
          </Text>
          <Text
            style={[
              styles.emptyResultsSubtext,
              { color: colors.textSecondary },
            ]}
          >
            {t("staffModals.addStaff.contractorResults.noResultsSubtext")}
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.resultsList}>
          {searchResults.map((contractor) => (
            <Pressable
              key={contractor.id}
              style={[
                styles.resultCard,
                { backgroundColor: colors.backgroundSecondary },
              ]}
              onPress={() => handleAddContractor(contractor)}
            >
              <View style={styles.resultCardHeader}>
                <View
                  style={[
                    styles.contractorIcon,
                    { backgroundColor: `${colors.info}20` },
                  ]}
                >
                  <Ionicons name="briefcase" size={24} color={colors.info} />
                </View>
                <View style={styles.resultCardInfo}>
                  <Text style={[styles.resultCardName, { color: colors.text }]}>
                    {contractor.firstName} {contractor.lastName}
                  </Text>
                  <Text
                    style={[
                      styles.resultCardRole,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {contractor.role}
                  </Text>
                </View>
                {contractor.isVerified && (
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color={colors.success}
                  />
                )}
              </View>
              <View style={styles.resultCardDetails}>
                <View style={styles.detailItem}>
                  <Ionicons
                    name="document-outline"
                    size={16}
                    color={colors.textSecondary}
                  />
                  <Text
                    style={[styles.detailText, { color: colors.textSecondary }]}
                  >
                    {t("staffModals.addStaff.contractorResults.abn")}:{" "}
                    {contractor.abn}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons
                    name="cash-outline"
                    size={16}
                    color={colors.textSecondary}
                  />
                  <Text
                    style={[styles.detailText, { color: colors.textSecondary }]}
                  >
                    ${contractor.rate}/
                    {contractor.rateType === "hourly" ? "h" : "project"}
                  </Text>
                </View>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );

  const renderContractorInvite = () => (
    <View style={styles.stepContainer}>
      <Pressable
        style={styles.backButton}
        onPress={() => setStep("contractor-search")}
      >
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </Pressable>

      <Text style={[styles.stepTitle, { color: colors.text }]}>
        {t("staffModals.addStaff.contractorInvite.title")}
      </Text>
      <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
        {t("staffModals.addStaff.typeStep.contractor.description")}
      </Text>

      <View style={styles.formGroup}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          {t("staffModals.addStaff.contractorInvite.firstName")}
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.backgroundSecondary,
              color: colors.text,
              borderColor: colors.border,
            },
          ]}
          value={contractorInviteData.firstName}
          onChangeText={(text) =>
            setContractorInviteData((prev) => ({ ...prev, firstName: text }))
          }
          placeholder="John"
          placeholderTextColor={colors.textSecondary}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          {t("staffModals.addStaff.contractorInvite.lastName")}
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.backgroundSecondary,
              color: colors.text,
              borderColor: colors.border,
            },
          ]}
          value={contractorInviteData.lastName}
          onChangeText={(text) =>
            setContractorInviteData((prev) => ({ ...prev, lastName: text }))
          }
          placeholder="Smith"
          placeholderTextColor={colors.textSecondary}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          {t("staffModals.addStaff.contractorInvite.email")}
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.backgroundSecondary,
              color: colors.text,
              borderColor: colors.border,
            },
          ]}
          value={contractorInviteData.email}
          onChangeText={(text) =>
            setContractorInviteData((prev) => ({ ...prev, email: text }))
          }
          placeholder="john@example.com"
          placeholderTextColor={colors.textSecondary}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View
        style={[
          styles.infoBox,
          { backgroundColor: colors.backgroundSecondary },
        ]}
      >
        <Ionicons name="information-circle" size={24} color={colors.primary} />
        <Text style={[styles.infoBoxText, { color: colors.textSecondary }]}>
          {t("staffModals.addStaff.contractorInvite.infoText")}
        </Text>
      </View>

      {/* Share invite link section */}
      <View
        style={[
          styles.shareLinkBox,
          {
            backgroundColor: colors.backgroundSecondary,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.shareLinkHeader}>
          <Ionicons name="link" size={20} color={colors.primary} />
          <Text style={[styles.shareLinkTitle, { color: colors.text }]}>
            {t("staffModals.addStaff.contractorInvite.shareLink.title")}
          </Text>
        </View>
        <Text
          style={[
            styles.shareLinkSubtitle,
            { color: colors.textSecondary },
          ]}
        >
          {t("staffModals.addStaff.contractorInvite.shareLink.subtitle")}
        </Text>
        <View
          style={[
            styles.shareLinkPreview,
            {
              backgroundColor: colors.background,
              borderColor: colors.border,
            },
          ]}
        >
          <Text
            style={[styles.shareLinkUrl, { color: colors.textSecondary }]}
            numberOfLines={1}
            ellipsizeMode="middle"
          >
            {inviteLink}
          </Text>
        </View>
        <View style={styles.shareLinkActions}>
          <Pressable
            onPress={handleCopyInviteLink}
            style={[
              styles.shareLinkBtn,
              {
                borderColor: colors.primary + "55",
                backgroundColor: colors.primary + "10",
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={t(
              "staffModals.addStaff.contractorInvite.shareLink.copy",
            )}
          >
            <Ionicons name="copy-outline" size={18} color={colors.primary} />
            <Text
              style={[styles.shareLinkBtnText, { color: colors.primary }]}
            >
              {t("staffModals.addStaff.contractorInvite.shareLink.copy")}
            </Text>
          </Pressable>
          <Pressable
            onPress={handleShareInviteLink}
            style={[
              styles.shareLinkBtn,
              { backgroundColor: colors.primary },
            ]}
            accessibilityRole="button"
            accessibilityLabel={t(
              "staffModals.addStaff.contractorInvite.shareLink.share",
            )}
          >
            <Ionicons
              name="share-social-outline"
              size={18}
              color={colors.background}
            />
            <Text
              style={[
                styles.shareLinkBtnText,
                { color: colors.background },
              ]}
            >
              {t("staffModals.addStaff.contractorInvite.shareLink.share")}
            </Text>
          </Pressable>
        </View>
      </View>

      <Pressable
        style={[
          styles.submitButton,
          { backgroundColor: colors.primary },
          isLoading && styles.submitButtonDisabled,
        ]}
        onPress={handleSendContractorInvite}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color={colors.background} />
        ) : (
          <>
            <Ionicons name="mail" size={20} color={colors.background} />
            <Text
              style={[styles.submitButtonText, { color: colors.background }]}
            >
              {t("staffModals.addStaff.contractorInvite.submit")}
            </Text>
          </>
        )}
      </Pressable>
    </View>
  );

  const renderContactsImport = () => {
    const granted =
      contactsPermission === Contacts.PermissionStatus.GRANTED;
    const denied = contactsPermission === Contacts.PermissionStatus.DENIED;
    return (
      <View style={styles.stepContainer}>
        <Pressable style={styles.backButton} onPress={() => setStep("type")}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
          <Text style={[styles.backButtonText, { color: colors.text }]}>
            {t("staffModals.addStaff.back")}
          </Text>
        </Pressable>

        <Text style={[styles.stepTitle, { color: colors.text }]}>
          {t("staffModals.addStaff.importContacts.title")}
        </Text>
        <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
          {t("staffModals.addStaff.importContacts.subtitle")}
        </Text>

        {!granted && (
          <View
            style={{
              padding: DESIGN_TOKENS.spacing.md,
              borderRadius: DESIGN_TOKENS.radius.md,
              backgroundColor: colors.backgroundSecondary,
              marginTop: DESIGN_TOKENS.spacing.md,
              alignItems: "center",
            }}
          >
            <Ionicons
              name="lock-closed-outline"
              size={32}
              color={colors.textSecondary}
            />
            <Text
              style={{
                color: colors.text,
                marginTop: DESIGN_TOKENS.spacing.sm,
                textAlign: "center",
                fontWeight: "600",
              }}
            >
              {t("staffModals.addStaff.importContacts.permissionTitle" as any)}
            </Text>
            <Text
              style={{
                color: colors.textSecondary,
                marginTop: 4,
                textAlign: "center",
                fontSize: 13,
              }}
            >
              {denied
                ? t(
                    "staffModals.addStaff.importContacts.permissionDenied" as any,
                  )
                : t(
                    "staffModals.addStaff.importContacts.permissionExplain" as any,
                  )}
            </Text>
            <Pressable
              onPress={handleRequestContactsPermission}
              style={({ pressed }) => ({
                marginTop: DESIGN_TOKENS.spacing.md,
                paddingHorizontal: DESIGN_TOKENS.spacing.lg,
                paddingVertical: DESIGN_TOKENS.spacing.sm,
                borderRadius: DESIGN_TOKENS.radius.md,
                backgroundColor: pressed
                  ? colors.primary + "CC"
                  : colors.primary,
              })}
            >
              <Text
                style={{ color: colors.background, fontWeight: "700" }}
              >
                {t("staffModals.addStaff.importContacts.allow" as any)}
              </Text>
            </Pressable>
          </View>
        )}

        {granted && (
          <>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.backgroundSecondary,
                  color: colors.text,
                  borderColor: colors.border,
                  marginTop: DESIGN_TOKENS.spacing.md,
                },
              ]}
              value={contactsSearch}
              onChangeText={setContactsSearch}
              placeholder={t(
                "staffModals.addStaff.importContacts.searchPlaceholder" as any,
              )}
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="none"
            />

            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 12,
                fontWeight: "600",
                marginTop: DESIGN_TOKENS.spacing.md,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              {contactsSearch
                ? t(
                    "staffModals.addStaff.importContacts.searchResultsLabel" as any,
                  )
                : t(
                    "staffModals.addStaff.importContacts.cobbrUsersLabel" as any,
                  )}
            </Text>

            {contactsLoading ? (
              <ActivityIndicator
                style={{ marginTop: DESIGN_TOKENS.spacing.lg }}
                color={colors.primary}
              />
            ) : filteredContacts.length === 0 ? (
              <Text
                style={{
                  color: colors.textSecondary,
                  textAlign: "center",
                  marginTop: DESIGN_TOKENS.spacing.lg,
                }}
              >
                {contactsSearch
                  ? t(
                      "staffModals.addStaff.importContacts.noResults" as any,
                    )
                  : t(
                      "staffModals.addStaff.importContacts.noCobbrUsersHint" as any,
                    )}
              </Text>
            ) : (
              filteredContacts.slice(0, 50).map((c) => (
                <View
                  key={c.id}
                  style={{
                    padding: DESIGN_TOKENS.spacing.md,
                    borderRadius: DESIGN_TOKENS.radius.md,
                    backgroundColor: colors.backgroundSecondary,
                    marginTop: DESIGN_TOKENS.spacing.sm,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: DESIGN_TOKENS.spacing.xs,
                    }}
                  >
                    <Text style={{ color: colors.text, fontWeight: "600" }}>
                      {`${c.firstName} ${c.lastName}`.trim() ||
                        c.email ||
                        c.phone}
                    </Text>
                    {isCobbrUser(c) && (
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                          borderRadius: 999,
                          backgroundColor: colors.success + "22",
                        }}
                      >
                        <Ionicons
                          name="checkmark-circle"
                          size={12}
                          color={colors.success}
                        />
                        <Text
                          style={{
                            color: colors.success,
                            fontSize: 10,
                            fontWeight: "700",
                            marginLeft: 3,
                          }}
                        >
                          {t(
                            "staffModals.addStaff.importContacts.onCobbrBadge" as any,
                          )}
                        </Text>
                      </View>
                    )}
                  </View>
                  {!!c.email && (
                    <Text
                      style={{ color: colors.textSecondary, fontSize: 12 }}
                    >
                      {c.email}
                    </Text>
                  )}
                  {!!c.phone && (
                    <Text
                      style={{ color: colors.textSecondary, fontSize: 12 }}
                    >
                      {c.phone}
                    </Text>
                  )}
                  <View
                    style={{
                      flexDirection: "row",
                      marginTop: DESIGN_TOKENS.spacing.sm,
                      gap: DESIGN_TOKENS.spacing.sm,
                    }}
                  >
                    <Pressable
                      onPress={() => handleContactAddAsEmployee(c)}
                      style={({ pressed }) => ({
                        flex: 1,
                        paddingVertical: DESIGN_TOKENS.spacing.sm,
                        borderRadius: DESIGN_TOKENS.radius.md,
                        backgroundColor: pressed
                          ? colors.success + "CC"
                          : colors.success,
                        alignItems: "center",
                      })}
                    >
                      <Text
                        style={{
                          color: colors.background,
                          fontWeight: "600",
                          fontSize: 12,
                        }}
                      >
                        {t(
                          "staffModals.addStaff.importContacts.addAsEmployee" as any,
                        )}
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleContactInviteAsContractor(c)}
                      style={({ pressed }) => ({
                        flex: 1,
                        paddingVertical: DESIGN_TOKENS.spacing.sm,
                        borderRadius: DESIGN_TOKENS.radius.md,
                        backgroundColor: pressed
                          ? colors.info + "CC"
                          : colors.info,
                        alignItems: "center",
                      })}
                    >
                      <Text
                        style={{
                          color: colors.background,
                          fontWeight: "600",
                          fontSize: 12,
                        }}
                      >
                        {t(
                          "staffModals.addStaff.importContacts.inviteAsContractor" as any,
                        )}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ))
            )}
          </>
        )}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        testID="add-staff-modal"
        style={[styles.modalContainer, { backgroundColor: colors.background }]}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View
          style={[styles.modalHeader, { borderBottomColor: colors.border }]}
        >
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            {t("staffModals.addStaff.title")}
          </Text>
          <Pressable testID="add-staff-close-btn" onPress={handleClose}>
            <Ionicons name="close" size={28} color={colors.text} />
          </Pressable>
        </View>

        <ScrollView style={styles.modalContent}>
          {step === "type" && renderStepType()}
          {step === "contacts-import" && renderContactsImport()}
          {step === "employee-form" && renderEmployeeForm()}
          {step === "contractor-search" && renderContractorSearch()}
          {step === "contractor-results" && renderContractorResults()}
          {step === "contractor-invite" && renderContractorInvite()}
        </ScrollView>
        {/* Onboarding tour overlay — bubbles need to render above this Modal */}
        <OnboardingTourOverlay />
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: DESIGN_TOKENS.spacing.lg,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  modalContent: {
    flex: 1,
  },
  stepContainer: {
    padding: DESIGN_TOKENS.spacing.lg,
  },
  backButton: {
    marginBottom: DESIGN_TOKENS.spacing.md,
    flexDirection: "row",
    alignItems: "center",
  },
  backButtonText: {
    fontSize: 16,
    marginLeft: DESIGN_TOKENS.spacing.xs,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: DESIGN_TOKENS.spacing.xs,
  },
  stepSubtitle: {
    fontSize: 16,
    marginBottom: DESIGN_TOKENS.spacing.lg,
  },
  typeOptions: {
    gap: DESIGN_TOKENS.spacing.md,
  },
  importContactsBtn: {
    flexDirection: "row",
    alignItems: "center",
    padding: DESIGN_TOKENS.spacing.md,
    borderRadius: DESIGN_TOKENS.radius.md,
    borderWidth: 1,
    marginTop: DESIGN_TOKENS.spacing.lg,
  },
  importContactsTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  importContactsSubtitle: {
    fontSize: 12,
  },
  typeOption: {
    padding: DESIGN_TOKENS.spacing.lg,
    borderRadius: DESIGN_TOKENS.radius.md,
  },
  typeIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: DESIGN_TOKENS.spacing.md,
  },
  typeOptionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: DESIGN_TOKENS.spacing.xs,
  },
  typeOptionDescription: {
    fontSize: 14,
    marginBottom: DESIGN_TOKENS.spacing.md,
    lineHeight: 20,
  },
  typeOptionFeatures: {
    gap: DESIGN_TOKENS.spacing.sm,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: DESIGN_TOKENS.spacing.sm,
  },
  featureText: {
    fontSize: 14,
  },
  form: {
    gap: DESIGN_TOKENS.spacing.md,
    marginBottom: DESIGN_TOKENS.spacing.lg,
  },
  formRow: {
    flexDirection: "row",
    gap: DESIGN_TOKENS.spacing.md,
  },
  formGroup: {
    gap: DESIGN_TOKENS.spacing.xs,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
  },
  input: {
    padding: DESIGN_TOKENS.spacing.md,
    borderRadius: DESIGN_TOKENS.radius.md,
    fontSize: 16,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: DESIGN_TOKENS.spacing.md,
    borderRadius: DESIGN_TOKENS.radius.md,
    gap: DESIGN_TOKENS.spacing.sm,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  searchContainer: {
    flexDirection: "row",
    gap: DESIGN_TOKENS.spacing.sm,
    marginBottom: DESIGN_TOKENS.spacing.lg,
  },
  searchInput: {
    flex: 1,
    padding: DESIGN_TOKENS.spacing.md,
    borderRadius: DESIGN_TOKENS.radius.md,
    fontSize: 16,
  },
  searchButton: {
    width: 48,
    height: 48,
    borderRadius: DESIGN_TOKENS.radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: DESIGN_TOKENS.spacing.lg,
    gap: DESIGN_TOKENS.spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 14,
    fontWeight: "600",
  },
  inviteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: DESIGN_TOKENS.spacing.md,
    borderRadius: DESIGN_TOKENS.radius.md,
    gap: DESIGN_TOKENS.spacing.sm,
  },
  inviteButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  emptyResults: {
    alignItems: "center",
    padding: DESIGN_TOKENS.spacing.xl * 2,
  },
  emptyResultsText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: DESIGN_TOKENS.spacing.md,
  },
  emptyResultsSubtext: {
    fontSize: 14,
    marginTop: DESIGN_TOKENS.spacing.xs,
    textAlign: "center",
  },
  resultsList: {
    flex: 1,
  },
  resultCard: {
    padding: DESIGN_TOKENS.spacing.md,
    borderRadius: DESIGN_TOKENS.radius.md,
    marginBottom: DESIGN_TOKENS.spacing.md,
  },
  resultCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: DESIGN_TOKENS.spacing.md,
    gap: DESIGN_TOKENS.spacing.sm,
  },
  contractorIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  resultCardInfo: {
    flex: 1,
  },
  resultCardName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  resultCardRole: {
    fontSize: 14,
    marginTop: 2,
  },
  resultCardDetails: {
    gap: DESIGN_TOKENS.spacing.sm,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: DESIGN_TOKENS.spacing.sm,
  },
  detailText: {
    fontSize: 14,
  },
  infoBox: {
    flexDirection: "row",
    padding: DESIGN_TOKENS.spacing.md,
    borderRadius: DESIGN_TOKENS.radius.md,
    marginVertical: DESIGN_TOKENS.spacing.lg,
    gap: DESIGN_TOKENS.spacing.sm,
    alignItems: "flex-start",
  },
  infoBoxText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  shareLinkBox: {
    padding: DESIGN_TOKENS.spacing.md,
    borderRadius: DESIGN_TOKENS.radius.md,
    borderWidth: 1,
    marginBottom: DESIGN_TOKENS.spacing.lg,
    gap: DESIGN_TOKENS.spacing.sm,
  },
  shareLinkHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: DESIGN_TOKENS.spacing.xs,
  },
  shareLinkTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  shareLinkSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  shareLinkPreview: {
    paddingVertical: DESIGN_TOKENS.spacing.sm,
    paddingHorizontal: DESIGN_TOKENS.spacing.md,
    borderRadius: DESIGN_TOKENS.radius.sm,
    borderWidth: 1,
  },
  shareLinkUrl: {
    fontSize: 12,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  shareLinkActions: {
    flexDirection: "row",
    gap: DESIGN_TOKENS.spacing.sm,
    marginTop: DESIGN_TOKENS.spacing.xs,
  },
  shareLinkBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: DESIGN_TOKENS.spacing.sm,
    paddingHorizontal: DESIGN_TOKENS.spacing.md,
    borderRadius: DESIGN_TOKENS.radius.md,
    borderWidth: 1,
    borderColor: "transparent",
    gap: DESIGN_TOKENS.spacing.xs,
  },
  shareLinkBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
