import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
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
import {
    SafeAreaView,
    useSafeAreaInsets,
} from "react-native-safe-area-context";

// Utiliser le système unifié au lieu du design system avancé
import LanguageButton from "../components/calendar/LanguageButton";
import { DESIGN_TOKENS } from "../constants/Styles";
import { useTheme } from "../context/ThemeProvider";
import { getUserCompanyData } from "../hooks/useCompanyPermissions";
import { useUserProfile } from "../hooks/useUserProfile";
import { useTranslation } from "../localization/useLocalization";
import type { Company, CompanyRole } from "../services/user";

// Avatar options - fun and professional avatars for moving company employees
const AVATAR_OPTIONS = [
  { id: "truck", icon: "bus", color: "#4A90D9" },
  { id: "mover", icon: "person", color: "#50C878" },
  { id: "box", icon: "cube", color: "#FF8C00" },
  { id: "star", icon: "star", color: "#FFD700" },
  { id: "rocket", icon: "rocket", color: "#9B59B6" },
  { id: "heart", icon: "heart", color: "#E91E63" },
  { id: "flash", icon: "flash", color: "#00BCD4" },
  { id: "shield", icon: "shield-checkmark", color: "#2E7D32" },
  { id: "trophy", icon: "trophy", color: "#FFC107" },
  { id: "compass", icon: "compass", color: "#795548" },
  { id: "briefcase", icon: "briefcase", color: "#607D8B" },
  { id: "home", icon: "home", color: "#3F51B5" },
];

interface ProfileFormFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: "default" | "email-address" | "phone-pad" | "numeric";
  multiline?: boolean;
  placeholder?: string;
  editable?: boolean;
}

const ProfileFormField: React.FC<ProfileFormFieldProps> = ({
  label,
  value,
  onChangeText,
  keyboardType = "default",
  multiline = false,
  placeholder,
  editable = true,
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
  const { profile, isLoading, updateProfile } = useUserProfile();

  const [isEditing, setIsEditing] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0]);

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
        console.warn("[Profile] Failed to load company data:", error);
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
    // TEMP_DISABLED: console.log('🔍 [PROFILE SCREEN] useEffect - Profile changed:', {
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
      // TEMP_DISABLED: console.error('❌ [PROFILE] Error updating profile:', error);
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
    if (passwordData.newPassword.length < 8) {
      Alert.alert(t("common.error"), t("profile.security.passwordTooShort"));
      return;
    }
    // TODO: Implement actual password change API call
    Alert.alert(t("common.success"), t("profile.messages.passwordChanged"));
    setShowPasswordModal(false);
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  // Handle email change
  const handleEmailChange = async () => {
    if (!newEmail || !newEmail.includes("@")) {
      Alert.alert(t("common.error"), t("profile.messages.emailChangeError"));
      return;
    }
    // TODO: Implement actual email change API call
    Alert.alert(t("common.success"), t("profile.messages.emailChanged"));
    setShowEmailModal(false);
    setNewEmail("");
  };

  // Handle avatar selection
  const handleAvatarSelect = (avatar: (typeof AVATAR_OPTIONS)[0]) => {
    setSelectedAvatar(avatar);
    setShowAvatarModal(false);
    Alert.alert(t("common.success"), t("profile.messages.avatarUpdated"));
  };

  // Show loading state
  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text
          style={{
            marginTop: DESIGN_TOKENS.spacing.md,
            color: colors.text,
            fontSize: 16,
          }}
        >
          {t("profile.loading")}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: colors.background,
        paddingTop: insets.top,
      }}
    >
      {/* Header avec bouton retour circulaire et LanguageButton */}
      <View
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
        style={{
          flex: 1,
          backgroundColor: colors.background,
        }}
        contentContainerStyle={{
          padding: DESIGN_TOKENS.spacing.lg,
        }}
      >
        {/* Avatar Section */}
        <Pressable
          onPress={() => setShowAvatarModal(true)}
          style={({ pressed }) => ({
            alignItems: "center",
            marginBottom: DESIGN_TOKENS.spacing.xl,
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <View
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: selectedAvatar.color,
              justifyContent: "center",
              alignItems: "center",
              shadowColor: colors.shadow,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 6,
            }}
          >
            <Ionicons
              name={selectedAvatar.icon as any}
              size={50}
              color="white"
            />
          </View>
          <Text
            style={{
              marginTop: DESIGN_TOKENS.spacing.sm,
              fontSize: 14,
              color: colors.primary,
              fontWeight: "500",
            }}
          >
            {t("profile.actions.chooseAvatar")}
          </Text>
        </Pressable>

        {/* Card contenant tous les champs */}
        <View
          style={{
            backgroundColor: colors.backgroundTertiary,
            borderRadius: 16,
            padding: DESIGN_TOKENS.spacing.lg,
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 4,
            marginBottom: DESIGN_TOKENS.spacing.lg,
          }}
        >
          {/* Section informations personnelles */}
          <Text
            style={{
              fontSize: 18,
              fontWeight: "700",
              color: colors.text,
              marginBottom: DESIGN_TOKENS.spacing.lg,
            }}
          >
            {t("profile.personalInfo")}
          </Text>

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
        </View>

        {/* Company Information Section (API v1.1.0) - Read-only, managed by backend */}
        {companyData && companyData.company && (
          <View
            style={{
              backgroundColor: colors.backgroundTertiary,
              borderRadius: 16,
              padding: DESIGN_TOKENS.spacing.lg,
              shadowColor: colors.shadow,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 4,
              marginBottom: DESIGN_TOKENS.spacing.lg,
            }}
          >
            {/* Section header */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: DESIGN_TOKENS.spacing.lg,
              }}
            >
              <Ionicons name="business" size={20} color={colors.primary} />
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "700",
                  color: colors.text,
                  marginLeft: DESIGN_TOKENS.spacing.sm,
                }}
              >
                {t("profile.companyInfo") || "Company Information"}
              </Text>
            </View>

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
          </View>
        )}

        {/* Boutons d'action */}
        {isEditing ? (
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginTop: DESIGN_TOKENS.spacing.lg,
            }}
          >
            <Pressable
              style={({ pressed }) => ({
                flex: 1,
                marginRight: DESIGN_TOKENS.spacing.sm,
                backgroundColor: colors.buttonDisabled,
                borderRadius: 12,
                paddingVertical: DESIGN_TOKENS.spacing.md,
                justifyContent: "center",
                alignItems: "center",
                transform: [{ scale: pressed ? 0.95 : 1 }],
              })}
              onPress={handleCancel}
            >
              <Text
                style={{
                  color: colors.text,
                  fontSize: 16,
                  fontWeight: "600",
                }}
              >
                {t("profile.actions.cancel")}
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => ({
                flex: 1,
                marginLeft: DESIGN_TOKENS.spacing.sm,
                backgroundColor: colors.primary,
                borderRadius: 12,
                paddingVertical: DESIGN_TOKENS.spacing.md,
                justifyContent: "center",
                alignItems: "center",
                transform: [{ scale: pressed ? 0.95 : 1 }],
              })}
              onPress={handleSave}
            >
              <Text
                style={{
                  color: colors.buttonPrimaryText,
                  fontSize: 16,
                  fontWeight: "600",
                }}
              >
                {t("profile.actions.save")}
              </Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            style={({ pressed }) => ({
              backgroundColor: colors.primary,
              borderRadius: 12,
              paddingVertical: DESIGN_TOKENS.spacing.md,
              justifyContent: "center",
              alignItems: "center",
              marginTop: DESIGN_TOKENS.spacing.lg,
              transform: [{ scale: pressed ? 0.95 : 1 }],
            })}
            onPress={() => setIsEditing(true)}
          >
            <Text
              style={{
                color: colors.buttonPrimaryText,
                fontSize: 16,
                fontWeight: "600",
              }}
            >
              {t("profile.actions.edit")}
            </Text>
          </Pressable>
        )}

        {/* Security Section */}
        <View
          style={{
            backgroundColor: colors.backgroundTertiary,
            borderRadius: 16,
            padding: DESIGN_TOKENS.spacing.lg,
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 4,
            marginTop: DESIGN_TOKENS.spacing.xl,
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: "700",
              color: colors.text,
              marginBottom: DESIGN_TOKENS.spacing.lg,
            }}
          >
            {t("profile.security.title")}
          </Text>

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
        </View>
      </ScrollView>

      {/* Avatar Selection Modal */}
      <Modal
        visible={showAvatarModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAvatarModal(false)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "flex-end",
            backgroundColor: "rgba(0,0,0,0.5)",
          }}
        >
          <View
            style={{
              backgroundColor: colors.background,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: DESIGN_TOKENS.spacing.xl,
              paddingBottom: insets.bottom + DESIGN_TOKENS.spacing.xl,
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: "700",
                color: colors.text,
                textAlign: "center",
                marginBottom: DESIGN_TOKENS.spacing.sm,
              }}
            >
              {t("profile.avatar.title")}
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: colors.textSecondary,
                textAlign: "center",
                marginBottom: DESIGN_TOKENS.spacing.xl,
              }}
            >
              {t("profile.avatar.selectAvatar")}
            </Text>

            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                justifyContent: "center",
                gap: DESIGN_TOKENS.spacing.md,
              }}
            >
              {AVATAR_OPTIONS.map((avatar) => (
                <Pressable
                  key={avatar.id}
                  onPress={() => handleAvatarSelect(avatar)}
                  style={({ pressed }) => ({
                    width: 70,
                    height: 70,
                    borderRadius: 35,
                    backgroundColor: avatar.color,
                    justifyContent: "center",
                    alignItems: "center",
                    opacity: pressed ? 0.7 : 1,
                    borderWidth: selectedAvatar.id === avatar.id ? 3 : 0,
                    borderColor: colors.text,
                  })}
                >
                  <Ionicons name={avatar.icon as any} size={35} color="white" />
                </Pressable>
              ))}
            </View>

            <Pressable
              onPress={() => setShowAvatarModal(false)}
              style={{
                marginTop: DESIGN_TOKENS.spacing.xl,
                padding: DESIGN_TOKENS.spacing.md,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  color: colors.primary,
                  fontWeight: "600",
                }}
              >
                {t("common.cancel")}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

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
    </SafeAreaView>
  );
};

export default ProfileScreen;
