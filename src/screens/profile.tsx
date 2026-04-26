import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
    Alert,
    Image,
    LayoutAnimation,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    UIManager,
    View,
} from "react-native";
import {
    SafeAreaView,
    useSafeAreaInsets,
} from "react-native-safe-area-context";
import { validatePassword } from "../utils/validators/passwordValidator";

// Utiliser le système unifié au lieu du design system avancé
import LanguageButton from "../components/calendar/LanguageButton";
import AvatarPickerModal, {
    getAvatarSource,
} from "../components/ui/AvatarPickerModal";
import MascotLoading from "../components/ui/MascotLoading";
import { DESIGN_TOKENS } from "../constants/Styles";
import { useTheme } from "../context/ThemeProvider";
import { getUserCompanyData } from "../hooks/useCompanyPermissions";
import { useUserProfile } from "../hooks/useUserProfile";
import { useTranslation } from "../localization/useLocalization";
import type { Company, CompanyRole } from "../services/user";
import { changePassword, requestEmailChange } from "../services/user";

// Enable LayoutAnimation on Android
try {
  if (
    Platform.OS === "android" &&
    UIManager.setLayoutAnimationEnabledExperimental &&
    !(global as any).nativeFabricUIManager
  ) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
} catch (e) {
  // Platform-specific: LayoutAnimation not supported on all Android versions
}

// CollapsibleSection component
interface CollapsibleSectionProps {
  title: string;
  emoji: string;
  children: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  colors: any;
  // Edit functionality (optional)
  onEdit?: () => void;
  isEditing?: boolean;
  onCancel?: () => void;
  onSave?: () => void;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  emoji,
  children,
  isExpanded,
  onToggle,
  colors,
  onEdit,
  isEditing,
  onCancel,
  onSave,
}) => {
  const handleToggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onToggle();
  };

  return (
    <View
      style={{
        backgroundColor: colors.backgroundTertiary,
        borderRadius: 16,
        marginBottom: DESIGN_TOKENS.spacing.md,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        overflow: "hidden",
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingRight: DESIGN_TOKENS.spacing.md,
        }}
      >
        <Pressable
          onPress={handleToggle}
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            flex: 1,
            padding: DESIGN_TOKENS.spacing.lg,
            backgroundColor: pressed
              ? colors.backgroundSecondary
              : "transparent",
          })}
        >
          <Text style={{ fontSize: 20, marginRight: DESIGN_TOKENS.spacing.sm }}>
            {emoji}
          </Text>
          <Text
            style={{
              fontSize: 17,
              fontWeight: "700",
              color: colors.text,
              flex: 1,
            }}
          >
            {title}
          </Text>
          <Ionicons
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={22}
            color={colors.textSecondary}
          />
        </Pressable>
        {/* Edit/Save/Cancel buttons in header */}
        {onEdit && !isEditing && (
          <Pressable
            testID="profile-edit-btn"
            onPress={onEdit}
            style={({ pressed }) => ({
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: pressed
                ? colors.backgroundSecondary
                : colors.primary + "15",
              justifyContent: "center",
              alignItems: "center",
              marginLeft: DESIGN_TOKENS.spacing.sm,
            })}
          >
            <Ionicons name="pencil" size={18} color={colors.primary} />
          </Pressable>
        )}
        {isEditing && onCancel && onSave && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Pressable
              testID="profile-cancel-btn"
              onPress={onCancel}
              style={({ pressed }) => ({
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 8,
                backgroundColor: pressed
                  ? colors.backgroundSecondary
                  : colors.buttonDisabled,
              })}
            >
              <Text
                style={{ color: colors.text, fontSize: 14, fontWeight: "600" }}
              >
                ✕
              </Text>
            </Pressable>
            <Pressable
              testID="profile-save-btn"
              onPress={onSave}
              style={({ pressed }) => ({
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 8,
                backgroundColor: pressed ? colors.primaryDark : colors.primary,
              })}
            >
              <Text
                style={{
                  color: colors.buttonPrimaryText,
                  fontSize: 14,
                  fontWeight: "600",
                }}
              >
                ✓
              </Text>
            </Pressable>
          </View>
        )}
      </View>
      {isExpanded && (
        <View
          style={{
            paddingHorizontal: DESIGN_TOKENS.spacing.lg,
            paddingBottom: DESIGN_TOKENS.spacing.lg,
          }}
        >
          {children}
        </View>
      )}
    </View>
  );
};

interface ProfileFormFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: "default" | "email-address" | "phone-pad" | "numeric";
  multiline?: boolean;
  placeholder?: string;
  editable?: boolean;
  testID?: string;
}

const ProfileFormField: React.FC<ProfileFormFieldProps> = ({
  label,
  value,
  onChangeText,
  keyboardType = "default",
  multiline = false,
  placeholder,
  editable = true,
  testID,
}) => {
  const { colors } = useTheme();

  return (
    <View style={{ marginBottom: DESIGN_TOKENS.spacing.lg }}>
      <Text
        style={{
          fontSize: 16,
          fontWeight: "600",
          color: colors.text,
          marginBottom: DESIGN_TOKENS.spacing.xs,
        }}
      >
        {label}
      </Text>
      <TextInput
        style={{
          backgroundColor: colors.inputBackground,
          borderRadius: 12,
          padding: DESIGN_TOKENS.spacing.md,
          fontSize: 16,
          color: colors.inputText,
          borderWidth: 1,
          borderColor: colors.inputBorder,
          minHeight: multiline ? 100 : 50,
          opacity: editable ? 1 : 0.7,
        }}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        multiline={multiline}
        placeholder={placeholder}
        placeholderTextColor={colors.inputPlaceholder}
        editable={editable}
        testID={testID}
        textAlignVertical={multiline ? "top" : "center"}
      />
    </View>
  );
};

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { profile, isLoading, updateProfile, refreshProfile } = useUserProfile();

  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);


  // Collapsible sections state - all collapsed by default
  const [expandedSections, setExpandedSections] = useState<{
    personalInfo: boolean;
    companyInfo: boolean;
    security: boolean;
  }>({
    personalInfo: false,
    companyInfo: false,
    security: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Email change state
  const [newEmail, setNewEmail] = useState("");

  // Company data state (from SecureStore via API v1.1.0)
  const [companyData, setCompanyData] = useState<{
    company_id?: number;
    company_role?: CompanyRole;
    company?: Company | null;
  } | null>(null);

  // Load company data on mount
  useEffect(() => {
    getUserCompanyData()
      .then((data) => {
        setCompanyData(data);
      })
      .catch((error) => {
        // Non-critical: company data is optional on profile
      });
  }, []);

  // Form data state - uniquement les champs utilisateur
  const [formData, setFormData] = useState({
    firstName: profile?.firstName || "",
    lastName: profile?.lastName || "",
    email: profile?.email || "",
    phone: profile?.phone || "",
    address: profile?.address || "",
    city: profile?.city || "",
    postalCode: profile?.postalCode || "",
    country: profile?.country || "",
  });

  // Update form data when profile loads
  React.useEffect(() => {
    //   hasProfile: !!profile,
    //   profileData: profile ? {
    //     id: profile.id,
    //     firstName: profile.firstName,
    //     email: profile.email,
    //     phone: profile.phone,
    //   } : null
    // });

    if (profile) {
      setFormData({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        email: profile.email || "",
        phone: profile.phone || "",
        address: profile.address || "",
        city: profile.city || "",
        postalCode: profile.postalCode || "",
        country: profile.country || "",
      });
    }
  }, [profile]);

  // Handle form submission
  const handleSave = async () => {
    try {
      const result = await updateProfile(formData);
      if (result) {
        setIsEditing(false);
        Alert.alert(t("common.success"), t("profile.messages.updateSuccess"));
      } else {
        Alert.alert(t("common.error"), t("profile.messages.updateError"));
      }
    } catch (error) {
      Alert.alert(t("common.error"), t("profile.messages.updateError"));
    }
  };

  // Handle cancel editing
  const handleCancel = () => {
    if (profile) {
      setFormData({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        email: profile.email || "",
        phone: profile.phone || "",
        address: profile.address || "",
        city: profile.city || "",
        postalCode: profile.postalCode || "",
        country: profile.country || "",
      });
    }
    setIsEditing(false);
  };

  // Handle password change
  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert(t("common.error"), t("profile.security.passwordMismatch"));
      return;
    }
    const pwResult = validatePassword(passwordData.newPassword);
    if (!pwResult.valid) {
      Alert.alert(t("common.error"), t(pwResult.errorKey!) || t("profile.security.passwordTooShort"));
      return;
    }
    try {
      await changePassword(
        passwordData.currentPassword,
        passwordData.newPassword,
      );
      Alert.alert(t("common.success"), t("profile.messages.passwordChanged"));
      setShowPasswordModal(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      Alert.alert(
        t("common.error"),
        error.message || t("profile.messages.updateError"),
      );
    }
  };

  // Handle email change
  const handleEmailChange = async () => {
    if (!newEmail || !newEmail.includes("@")) {
      Alert.alert(t("common.error"), t("profile.messages.emailChangeError"));
      return;
    }
    try {
      await requestEmailChange(newEmail);
      Alert.alert(t("common.success"), t("profile.messages.emailChanged"));
      setShowEmailModal(false);
      setNewEmail("");
    } catch (error: any) {
      Alert.alert(
        t("common.error"),
        error.message || t("profile.messages.emailChangeError"),
      );
    }
  };

  // Show loading state
  if (isLoading) {
    return <MascotLoading text={t("profile.loading")} />;
  }

  return (
    <SafeAreaView
      testID="profile-screen"
      style={{
        flex: 1,
        backgroundColor: colors.background,
        paddingTop: insets.top,
      }}
    >
      {/* Header avec bouton retour circulaire et LanguageButton */}
      <View
        testID="profile-header"
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: DESIGN_TOKENS.spacing.lg,
          paddingVertical: DESIGN_TOKENS.spacing.md,
          backgroundColor: colors.backgroundTertiary,
          borderBottomWidth: 1,
          borderBottomColor: colors.inputBorder,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}
      >
        <Pressable
          testID="profile-back-btn"
          style={({ pressed }) => ({
            width: 40,
            height: 40,
            borderRadius: 20, // Bouton circulaire
            backgroundColor: colors.backgroundSecondary,
            justifyContent: "center",
            alignItems: "center",
            transform: [{ scale: pressed ? 0.95 : 1 }], // Micro-interaction
          })}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </Pressable>

        <Text
          testID="profile-title-text"
          style={{
            fontSize: 20,
            fontWeight: "700",
            color: colors.text,
            textAlign: "center",
            flex: 1,
            marginHorizontal: DESIGN_TOKENS.spacing.md,
          }}
        >
          {t("profile.title")}
        </Text>

        <LanguageButton />
      </View>

      <ScrollView
        testID="profile-scroll"
        style={{
          flex: 1,
          backgroundColor: colors.background,
        }}
        contentContainerStyle={{
          padding: DESIGN_TOKENS.spacing.lg,
        }}
      >
        {/* Avatar Section */}
        <View
          testID="profile-avatar-section"
          style={{
            alignItems: "center",
            marginBottom: DESIGN_TOKENS.spacing.xl,
          }}
        >
          <Pressable
            onPress={() => setShowAvatarPicker(true)}
            style={({ pressed }) => ({
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <View
              style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                overflow: "hidden",
                shadowColor: colors.shadow,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: 6,
                borderWidth: 3,
                borderColor: "#FF8C00",
              }}
            >
              <Image
                source={getAvatarSource(profile?.avatarId)}
                style={{
                  width: "125%",
                  height: "125%",
                  marginLeft: "-12.5%",
                  marginTop: "-12.5%",
                }}
                resizeMode="cover"
              />
            </View>
            {/* Edit badge */}
            <View
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                backgroundColor: "#FF8C00",
                borderRadius: 12,
                width: 24,
                height: 24,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 2,
                borderColor: colors.background,
              }}
            >
              <Text style={{ color: "white", fontSize: 12 }}>✎</Text>
            </View>
          </Pressable>
        </View>

        {/* Personal Information Section */}
        <CollapsibleSection
          title={t("profile.personalInfo")}
          emoji="👤"
          isExpanded={expandedSections.personalInfo}
          onToggle={() => toggleSection("personalInfo")}
          colors={colors}
          onEdit={() => {
            if (!expandedSections.personalInfo) toggleSection("personalInfo");
            setIsEditing(true);
          }}
          isEditing={isEditing}
          onCancel={handleCancel}
          onSave={handleSave}
        >
          <ProfileFormField
            label={t("profile.fields.firstName")}
            value={formData.firstName}
            onChangeText={(text) =>
              setFormData((prev) => ({ ...prev, firstName: text }))
            }
            editable={isEditing}
          />

          <ProfileFormField
            label={t("profile.fields.lastName")}
            value={formData.lastName}
            onChangeText={(text) =>
              setFormData((prev) => ({ ...prev, lastName: text }))
            }
            editable={isEditing}
          />

          <ProfileFormField
            label={t("profile.fields.email")}
            value={formData.email}
            onChangeText={(text) =>
              setFormData((prev) => ({ ...prev, email: text }))
            }
            keyboardType="email-address"
            editable={isEditing}
          />

          <ProfileFormField
            label={t("profile.fields.phone")}
            value={formData.phone}
            onChangeText={(text) =>
              setFormData((prev) => ({ ...prev, phone: text }))
            }
            keyboardType="phone-pad"
            editable={isEditing}
            testID="profile-phone-input"
          />

          <ProfileFormField
            label={t("profile.fields.address")}
            value={formData.address}
            onChangeText={(text) =>
              setFormData((prev) => ({ ...prev, address: text }))
            }
            editable={isEditing}
          />

          <ProfileFormField
            label={t("profile.fields.city")}
            value={formData.city}
            onChangeText={(text) =>
              setFormData((prev) => ({ ...prev, city: text }))
            }
            editable={isEditing}
          />

          <ProfileFormField
            label={t("profile.fields.postalCode")}
            value={formData.postalCode}
            onChangeText={(text) =>
              setFormData((prev) => ({ ...prev, postalCode: text }))
            }
            keyboardType="numeric"
            editable={isEditing}
          />

          <ProfileFormField
            label={t("profile.fields.country")}
            value={formData.country}
            onChangeText={(text) =>
              setFormData((prev) => ({ ...prev, country: text }))
            }
            editable={isEditing}
          />
        </CollapsibleSection>

        {/* Company Information Section (API v1.1.0) - Read-only, managed by backend */}
        {companyData && companyData.company && (
          <CollapsibleSection
            title={t("profile.companyInfo") || "Company Information"}
            emoji="🏢"
            isExpanded={expandedSections.companyInfo}
            onToggle={() => toggleSection("companyInfo")}
            colors={colors}
          >
            {/* Company Name */}
            <View style={{ marginBottom: DESIGN_TOKENS.spacing.md }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: colors.text,
                  marginBottom: DESIGN_TOKENS.spacing.xs,
                }}
              >
                {t("profile.fields.companyName") || "Company"}
              </Text>
              <View
                style={{
                  backgroundColor: colors.inputBackground,
                  borderRadius: 12,
                  padding: DESIGN_TOKENS.spacing.md,
                  borderWidth: 1,
                  borderColor: colors.inputBorder,
                  opacity: 0.7,
                }}
              >
                <Text style={{ fontSize: 16, color: colors.text }}>
                  {companyData.company.name}
                </Text>
              </View>
            </View>

            {/* Company Role Badge */}
            <View style={{ marginBottom: DESIGN_TOKENS.spacing.md }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: colors.text,
                  marginBottom: DESIGN_TOKENS.spacing.xs,
                }}
              >
                {t("profile.fields.role") || "Role"}
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                {companyData.company_role === "patron" && (
                  <View
                    style={{
                      backgroundColor: "#FFD700" + "20",
                      paddingHorizontal: DESIGN_TOKENS.spacing.md,
                      paddingVertical: DESIGN_TOKENS.spacing.sm,
                      borderRadius: 20,
                      flexDirection: "row",
                      alignItems: "center",
                      borderWidth: 1,
                      borderColor: "#FFD700",
                    }}
                  >
                    <Text style={{ fontSize: 18, marginRight: 6 }}>👑</Text>
                    <Text
                      style={{
                        color: "#FFD700",
                        fontWeight: "700",
                        fontSize: 14,
                      }}
                    >
                      {t("profile.roles.patron") || "Owner (Patron)"}
                    </Text>
                  </View>
                )}
                {companyData.company_role === "cadre" && (
                  <View
                    style={{
                      backgroundColor: colors.primary + "20",
                      paddingHorizontal: DESIGN_TOKENS.spacing.md,
                      paddingVertical: DESIGN_TOKENS.spacing.sm,
                      borderRadius: 20,
                      flexDirection: "row",
                      alignItems: "center",
                      borderWidth: 1,
                      borderColor: colors.primary,
                    }}
                  >
                    <Text style={{ fontSize: 18, marginRight: 6 }}>👔</Text>
                    <Text
                      style={{
                        color: colors.primary,
                        fontWeight: "700",
                        fontSize: 14,
                      }}
                    >
                      {t("profile.roles.cadre") || "Manager (Cadre)"}
                    </Text>
                  </View>
                )}
                {companyData.company_role === "employee" && (
                  <View
                    style={{
                      backgroundColor: colors.textSecondary + "20",
                      paddingHorizontal: DESIGN_TOKENS.spacing.md,
                      paddingVertical: DESIGN_TOKENS.spacing.sm,
                      borderRadius: 20,
                      flexDirection: "row",
                      alignItems: "center",
                      borderWidth: 1,
                      borderColor: colors.textSecondary,
                    }}
                  >
                    <Text style={{ fontSize: 18, marginRight: 6 }}>👷</Text>
                    <Text
                      style={{
                        color: colors.textSecondary,
                        fontWeight: "700",
                        fontSize: 14,
                      }}
                    >
                      {t("profile.roles.employee") || "Employee"}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Info note */}
            <View
              style={{
                backgroundColor: colors.info + "10",
                padding: DESIGN_TOKENS.spacing.md,
                borderRadius: 12,
                borderLeftWidth: 4,
                borderLeftColor: colors.info,
              }}
            >
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: 13,
                  lineHeight: 18,
                }}
              >
                {t("profile.companyNote") ||
                  "Company information is managed by your organization administrator."}
              </Text>
            </View>

            {/* Employee dashboard CTA */}
            {companyData.company_role === "employee" && (
              <Pressable
                onPress={() => (navigation as any).navigate("EmployeeDashboard")}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  padding: DESIGN_TOKENS.spacing.md,
                  backgroundColor: pressed
                    ? colors.primary + "30"
                    : colors.primary + "15",
                  borderRadius: 12,
                  marginTop: DESIGN_TOKENS.spacing.md,
                  borderWidth: 1,
                  borderColor: colors.primary + "40",
                })}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: colors.primary + "20",
                    justifyContent: "center",
                    alignItems: "center",
                    marginRight: DESIGN_TOKENS.spacing.md,
                  }}
                >
                  <Ionicons name="stats-chart" size={18} color={colors.primary} />
                </View>
                <Text
                  style={{
                    flex: 1,
                    fontSize: 15,
                    fontWeight: "600",
                    color: colors.primary,
                  }}
                >
                  {t("employeeDashboard.title") || "My Dashboard"}
                </Text>
                <Ionicons name="chevron-forward" size={18} color={colors.primary} />
              </Pressable>
            )}

            {/* Referral CTA */}
            {(companyData.company_role === "patron" ||
              companyData.company_role === "cadre") && (
              <Pressable
                onPress={() => (navigation as any).navigate("Referral")}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  padding: DESIGN_TOKENS.spacing.md,
                  backgroundColor: pressed
                    ? "#8B5CF6" + "30"
                    : "#8B5CF6" + "15",
                  borderRadius: 12,
                  marginTop: DESIGN_TOKENS.spacing.md,
                  borderWidth: 1,
                  borderColor: "#8B5CF6" + "40",
                })}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: "#8B5CF6" + "20",
                    justifyContent: "center",
                    alignItems: "center",
                    marginRight: DESIGN_TOKENS.spacing.md,
                  }}
                >
                  <Ionicons name="people-outline" size={18} color="#8B5CF6" />
                </View>
                <Text
                  style={{
                    flex: 1,
                    fontSize: 15,
                    fontWeight: "600",
                    color: "#8B5CF6",
                  }}
                >
                  {t("referral.title" as any) ?? "Parrainage"}
                </Text>
                <Ionicons name="chevron-forward" size={18} color="#8B5CF6" />
              </Pressable>
            )}
          </CollapsibleSection>
        )}

        {/* Security Section */}
        <CollapsibleSection
          title={t("profile.security.title")}
          emoji="🔒"
          isExpanded={expandedSections.security}
          onToggle={() => toggleSection("security")}
          colors={colors}
        >
          {/* Change Password Button */}
          <Pressable
            onPress={() => setShowPasswordModal(true)}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              padding: DESIGN_TOKENS.spacing.md,
              backgroundColor: pressed
                ? colors.backgroundSecondary
                : "transparent",
              borderRadius: 12,
              marginBottom: DESIGN_TOKENS.spacing.sm,
            })}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: `${colors.warning}20`,
                justifyContent: "center",
                alignItems: "center",
                marginRight: DESIGN_TOKENS.spacing.md,
              }}
            >
              <Ionicons name="lock-closed" size={20} color={colors.warning} />
            </View>
            <Text
              style={{
                flex: 1,
                fontSize: 16,
                color: colors.text,
                fontWeight: "500",
              }}
            >
              {t("profile.actions.changePassword")}
            </Text>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textSecondary}
            />
          </Pressable>

          {/* Change Email Button */}
          <Pressable
            onPress={() => setShowEmailModal(true)}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              padding: DESIGN_TOKENS.spacing.md,
              backgroundColor: pressed
                ? colors.backgroundSecondary
                : "transparent",
              borderRadius: 12,
            })}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: `${colors.info}20`,
                justifyContent: "center",
                alignItems: "center",
                marginRight: DESIGN_TOKENS.spacing.md,
              }}
            >
              <Ionicons name="mail" size={20} color={colors.info} />
            </View>
            <Text
              style={{
                flex: 1,
                fontSize: 16,
                color: colors.text,
                fontWeight: "500",
              }}
            >
              {t("profile.actions.changeEmail")}
            </Text>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textSecondary}
            />
          </Pressable>
        </CollapsibleSection>
      </ScrollView>

      {/* Password Change Modal */}
      <Modal
        visible={showPasswordModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            backgroundColor: "rgba(0,0,0,0.5)",
            padding: DESIGN_TOKENS.spacing.lg,
          }}
        >
          <View
            style={{
              backgroundColor: colors.background,
              borderRadius: 16,
              padding: DESIGN_TOKENS.spacing.xl,
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: "700",
                color: colors.text,
                marginBottom: DESIGN_TOKENS.spacing.lg,
              }}
            >
              {t("profile.actions.changePassword")}
            </Text>

            <TextInput
              style={{
                backgroundColor: colors.inputBackground,
                borderRadius: 12,
                padding: DESIGN_TOKENS.spacing.md,
                fontSize: 16,
                color: colors.inputText,
                borderWidth: 1,
                borderColor: colors.inputBorder,
                marginBottom: DESIGN_TOKENS.spacing.md,
              }}
              placeholder={t("profile.security.currentPassword")}
              placeholderTextColor={colors.inputPlaceholder}
              secureTextEntry
              value={passwordData.currentPassword}
              onChangeText={(text) =>
                setPasswordData((prev) => ({ ...prev, currentPassword: text }))
              }
            />

            <TextInput
              style={{
                backgroundColor: colors.inputBackground,
                borderRadius: 12,
                padding: DESIGN_TOKENS.spacing.md,
                fontSize: 16,
                color: colors.inputText,
                borderWidth: 1,
                borderColor: colors.inputBorder,
                marginBottom: DESIGN_TOKENS.spacing.md,
              }}
              placeholder={t("profile.security.newPassword")}
              placeholderTextColor={colors.inputPlaceholder}
              secureTextEntry
              value={passwordData.newPassword}
              onChangeText={(text) =>
                setPasswordData((prev) => ({ ...prev, newPassword: text }))
              }
            />

            <TextInput
              style={{
                backgroundColor: colors.inputBackground,
                borderRadius: 12,
                padding: DESIGN_TOKENS.spacing.md,
                fontSize: 16,
                color: colors.inputText,
                borderWidth: 1,
                borderColor: colors.inputBorder,
                marginBottom: DESIGN_TOKENS.spacing.lg,
              }}
              placeholder={t("profile.security.confirmPassword")}
              placeholderTextColor={colors.inputPlaceholder}
              secureTextEntry
              value={passwordData.confirmPassword}
              onChangeText={(text) =>
                setPasswordData((prev) => ({ ...prev, confirmPassword: text }))
              }
            />

            <View
              style={{ flexDirection: "row", gap: DESIGN_TOKENS.spacing.md }}
            >
              <Pressable
                onPress={() => {
                  setShowPasswordModal(false);
                  setPasswordData({
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                  });
                }}
                style={{
                  flex: 1,
                  padding: DESIGN_TOKENS.spacing.md,
                  backgroundColor: colors.buttonDisabled,
                  borderRadius: 12,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    color: colors.text,
                    fontWeight: "600",
                  }}
                >
                  {t("common.cancel")}
                </Text>
              </Pressable>
              <Pressable
                onPress={handlePasswordChange}
                style={{
                  flex: 1,
                  padding: DESIGN_TOKENS.spacing.md,
                  backgroundColor: colors.primary,
                  borderRadius: 12,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    color: colors.buttonPrimaryText,
                    fontWeight: "600",
                  }}
                >
                  {t("common.save")}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Email Change Modal */}
      <Modal
        visible={showEmailModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEmailModal(false)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            backgroundColor: "rgba(0,0,0,0.5)",
            padding: DESIGN_TOKENS.spacing.lg,
          }}
        >
          <View
            style={{
              backgroundColor: colors.background,
              borderRadius: 16,
              padding: DESIGN_TOKENS.spacing.xl,
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: "700",
                color: colors.text,
                marginBottom: DESIGN_TOKENS.spacing.lg,
              }}
            >
              {t("profile.actions.changeEmail")}
            </Text>

            <TextInput
              style={{
                backgroundColor: colors.inputBackground,
                borderRadius: 12,
                padding: DESIGN_TOKENS.spacing.md,
                fontSize: 16,
                color: colors.inputText,
                borderWidth: 1,
                borderColor: colors.inputBorder,
                marginBottom: DESIGN_TOKENS.spacing.lg,
              }}
              placeholder={t("profile.fields.email")}
              placeholderTextColor={colors.inputPlaceholder}
              keyboardType="email-address"
              autoCapitalize="none"
              value={newEmail}
              onChangeText={setNewEmail}
            />

            <View
              style={{ flexDirection: "row", gap: DESIGN_TOKENS.spacing.md }}
            >
              <Pressable
                onPress={() => {
                  setShowEmailModal(false);
                  setNewEmail("");
                }}
                style={{
                  flex: 1,
                  padding: DESIGN_TOKENS.spacing.md,
                  backgroundColor: colors.buttonDisabled,
                  borderRadius: 12,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    color: colors.text,
                    fontWeight: "600",
                  }}
                >
                  {t("common.cancel")}
                </Text>
              </Pressable>
              <Pressable
                onPress={handleEmailChange}
                style={{
                  flex: 1,
                  padding: DESIGN_TOKENS.spacing.md,
                  backgroundColor: colors.primary,
                  borderRadius: 12,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    color: colors.buttonPrimaryText,
                    fontWeight: "600",
                  }}
                >
                  {t("common.save")}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Avatar Picker Modal */}
      <AvatarPickerModal
        visible={showAvatarPicker}
        currentAvatarId={profile?.avatarId}
        onSelect={async (avatarId) => {
          setShowAvatarPicker(false);
          await updateProfile({ avatarId });
        }}
        onClose={() => setShowAvatarPicker(false)}
      />
    </SafeAreaView>
  );
};

export default ProfileScreen;
