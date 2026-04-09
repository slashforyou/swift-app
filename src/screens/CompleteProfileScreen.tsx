import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { ServerData } from "../constants/ServerData";
import { DESIGN_TOKENS } from "../constants/Styles";
import { useTheme } from "../context/ThemeProvider";
import { useTranslation } from "../localization";
import { lookupAbn } from "../services/abnLookupService";
import { fetchWithAuth } from "../utils/session";

const BRAND_COLORS = [
  null,       // default (Cobbr orange)
  "#3B82F6", // blue
  "#8B5CF6", // purple
  "#EC4899", // pink
  "#EF4444", // red
  "#F59E0B", // amber
  "#22C55E", // green
  "#14B8A6", // teal
  "#06B6D4", // cyan
  "#6366F1", // indigo
  "#A855F7", // violet
  "#F97316", // orange
];

interface CompanyProfile {
  id: number;
  name: string;
  trading_name: string;
  legal_name: string;
  abn: string;
  acn: string;
  email: string;
  phone: string;
  website: string;
  street_address: string;
  suburb: string;
  state: string;
  postcode: string;
  business_type: string;
  industry_type: string;
  has_insurance: boolean;
  insurance_provider: string;
  policy_number: string;
  insurance_expiry_date: string;
  bsb: string;
  bank_account_number: string;
  bank_account_name: string;
  primary_color: string;
}

const AUSTRALIAN_STATES = ["ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"];

const EMPTY_PROFILE: CompanyProfile = {
  id: 0,
  name: "",
  trading_name: "",
  legal_name: "",
  abn: "",
  acn: "",
  email: "",
  phone: "",
  website: "",
  street_address: "",
  suburb: "",
  state: "",
  postcode: "",
  business_type: "",
  industry_type: "",
  has_insurance: false,
  insurance_provider: "",
  policy_number: "",
  insurance_expiry_date: "",
  bsb: "",
  bank_account_number: "",
  bank_account_name: "",
  primary_color: "",
};

export default function CompleteProfileScreen() {
  const { colors, companyColor, setCompanyColor } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();

  const [profile, setProfile] = useState<CompanyProfile>(EMPTY_PROFILE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>("business");
  const [draftStatus, setDraftStatus] = useState<"idle" | "saving" | "saved">("idle");

  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialLoadDone = useRef(false);
  const profileRef = useRef(profile);
  profileRef.current = profile;

  // Load company data
  useEffect(() => {
    loadCompanyData();
  }, []);

  const loadCompanyData = async () => {
    try {
      setLoading(true);
      // Get company_id from user profile stored in SecureStore
      const SecureStore = await import("expo-secure-store");
      const userData = await SecureStore.getItemAsync("user_data");
      if (!userData) return;

      const user = JSON.parse(userData);
      const companyId = user.company_id;
      if (!companyId) return;

      const response = await fetchWithAuth(
        `${ServerData.serverUrl}v1/company/${companyId}`,
        { method: "GET" },
      );

      if (!response.ok) return;
      const json = await response.json();
      if (!json.success || !json.data) return;

      const d = json.data;
      setProfile({
        id: d.id,
        name: d.name || "",
        trading_name: d.trading_name || "",
        legal_name: d.legal_name || "",
        abn: d.abn || "",
        acn: d.acn || "",
        email: d.email || "",
        phone: d.phone || "",
        website: d.website || "",
        street_address: d.street_address || "",
        suburb: d.suburb || "",
        state: d.state || "",
        postcode: d.postcode || "",
        business_type: d.business_type || "",
        industry_type: d.industry_type || "",
        has_insurance: !!d.has_insurance,
        insurance_provider: d.insurance_provider || "",
        policy_number: d.policy_number || "",
        insurance_expiry_date: d.insurance_expiry_date || "",
        bsb: d.bsb || "",
        bank_account_number: d.bank_account_number || "",
        bank_account_name: d.bank_account_name || "",
        primary_color: d.primary_color || "",
      });
      // Sync company color to theme
      if (d.primary_color) setCompanyColor(d.primary_color);
      initialLoadDone.current = true;
    } catch (err) {
      console.error("[CompleteProfile] Load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = useCallback(async () => {
    if (!profile.id) {
      Alert.alert(
        t("common.error") || "Error",
        t("completeProfile.noCompany") || "No company found. Please log out and log back in.",
      );
      return;
    }

    // Cancel pending draft save
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current);

    setSaving(true);
    try {
      const { id, ...updates } = profile;

      // Convert has_insurance to number for DB, empty strings to null
      const cleaned: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(updates)) {
        if (typeof value === "string" && value.trim() === "") {
          cleaned[key] = null;
        } else if (typeof value === "boolean") {
          cleaned[key] = value ? 1 : 0;
        } else {
          cleaned[key] = value;
        }
      }
      const payload = {
        ...cleaned,
        profile_completed: 1,
      };

      const response = await fetchWithAuth(
        `${ServerData.serverUrl}v1/company/${id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      const json = await response.json();
      if (!json.success) {
        Alert.alert(
          t("common.error") || "Error",
          json.error || t("completeProfile.saveError") || "Failed to save profile",
        );
        return;
      }

      Alert.alert(
        t("completeProfile.savedTitle") || "Profile Saved",
        t("completeProfile.savedMessage") || "Your business profile has been updated.",
        [{ text: "OK", onPress: () => navigation.goBack() }],
      );
    } catch (err) {
      console.error("[CompleteProfile] Save error:", err);
      Alert.alert(
        t("common.error") || "Error",
        t("completeProfile.saveError") || "Failed to save profile",
      );
    } finally {
      setSaving(false);
    }
  }, [profile, navigation, t]);

  // Auto-save draft (debounced 2s after last change)
  const saveDraft = useCallback(async () => {
    const p = profileRef.current;
    if (!p.id) return;
    try {
      setDraftStatus("saving");
      const { id, ...updates } = p;
      const cleaned: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(updates)) {
        if (typeof value === "string" && value.trim() === "") {
          cleaned[key] = null;
        } else if (typeof value === "boolean") {
          cleaned[key] = value ? 1 : 0;
        } else {
          cleaned[key] = value;
        }
      }
      // No profile_completed flag — draft only
      await fetchWithAuth(
        `${ServerData.serverUrl}v1/company/${id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cleaned),
        },
      );
      setDraftStatus("saved");
    } catch {
      setDraftStatus("idle");
    }
  }, []);

  const scheduleDraftSave = useCallback(() => {
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    draftTimerRef.current = setTimeout(() => {
      saveDraft();
    }, 2000);
  }, [saveDraft]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    };
  }, []);

  const updateField = (field: keyof CompanyProfile, value: string | boolean) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
    if (initialLoadDone.current) {
      setDraftStatus("idle");
      scheduleDraftSave();
    }
  };

  // ABN Lookup — auto-fill from ABR (triggered automatically)
  const [abnStatus, setAbnStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const lastLookedUpAbn = useRef<string>("");
  const abnLookupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const cleaned = profile.abn.replace(/\s/g, "");
    // Reset status if ABN changed away from a successful lookup
    if (cleaned !== lastLookedUpAbn.current && abnStatus === "success") {
      setAbnStatus("idle");
    }
    // Only trigger when exactly 11 digits and not already looked up
    if (!/^\d{11}$/.test(cleaned) || cleaned === lastLookedUpAbn.current) return;

    if (abnLookupTimer.current) clearTimeout(abnLookupTimer.current);
    abnLookupTimer.current = setTimeout(async () => {
      setAbnStatus("loading");
      try {
        const result = await lookupAbn(cleaned);
        lastLookedUpAbn.current = cleaned;
        if (result.abn_status !== "Active") {
          Alert.alert(
            t("completeProfile.abnInactive") || "ABN Inactive",
            `${t("completeProfile.abnStatusIs") || "This ABN status is"}: ${result.abn_status}`,
          );
        }
        // Build update batch
        const updates: Partial<CompanyProfile> = {};
        if (result.entity_name) updates.legal_name = result.entity_name;
        if (result.business_names?.length > 0) updates.trading_name = result.business_names[0];
        if (result.acn) updates.acn = result.acn;
        if (result.entity_type_name) updates.business_type = result.entity_type_name;
        if (result.address_state) updates.state = result.address_state;
        if (result.address_postcode) updates.postcode = result.address_postcode;
        // Only fill empty fields (don't overwrite user edits)
        setProfile((prev) => {
          const merged = { ...prev };
          for (const [key, value] of Object.entries(updates)) {
            const k = key as keyof CompanyProfile;
            if (!prev[k] || String(prev[k]).trim() === "") {
              (merged as Record<string, unknown>)[k] = value;
            }
          }
          return merged;
        });
        scheduleDraftSave();
        setAbnStatus("success");
      } catch {
        setAbnStatus("error");
      }
    }, 500);

    return () => {
      if (abnLookupTimer.current) clearTimeout(abnLookupTimer.current);
    };
  }, [profile.abn]);

  const toggleSection = (section: string) => {
    setExpandedSection((prev) => (prev === section ? null : section));
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const renderInput = (
    label: string,
    field: keyof CompanyProfile,
    options?: {
      placeholder?: string;
      keyboardType?: "default" | "email-address" | "phone-pad" | "numeric";
      autoCapitalize?: "none" | "sentences" | "words";
      multiline?: boolean;
    },
  ) => (
    <View style={styles.inputGroup}>
      <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
        {label}
      </Text>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.backgroundSecondary,
            color: colors.text,
            borderColor: colors.border,
          },
          options?.multiline && styles.inputMultiline,
        ]}
        value={String(profile[field] || "")}
        onChangeText={(text) => updateField(field, text)}
        placeholder={options?.placeholder || label}
        placeholderTextColor={colors.textSecondary + "80"}
        keyboardType={options?.keyboardType || "default"}
        autoCapitalize={options?.autoCapitalize || "sentences"}
        multiline={options?.multiline}
      />
    </View>
  );

  const renderStatePicker = () => (
    <View style={styles.inputGroup}>
      <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
        {t("completeProfile.state") || "State"}
      </Text>
      <View style={styles.stateRow}>
        {AUSTRALIAN_STATES.map((s) => (
          <Pressable
            key={s}
            onPress={() => updateField("state", s)}
            style={[
              styles.stateChip,
              {
                backgroundColor:
                  profile.state === s ? colors.primary : colors.backgroundSecondary,
                borderColor: profile.state === s ? colors.primary : colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.stateChipText,
                { color: profile.state === s ? "#fff" : colors.text },
              ]}
            >
              {s}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  // Section field definitions for progress calculation
  const SECTION_FIELDS: Record<string, (keyof CompanyProfile)[]> = {
    business: ["name", "trading_name", "legal_name", "abn", "business_type"],
    contact: ["email", "phone", "website"],
    address: ["street_address", "suburb", "state", "postcode"],
    banking: ["bank_account_name", "bsb", "bank_account_number"],
    insurance: ["has_insurance"],
  };

  const getSectionProgress = (sectionId: string): { filled: number; total: number } => {
    const fields = SECTION_FIELDS[sectionId] || [];
    const total = fields.length;
    const filled = fields.filter((f) => {
      const v = profile[f];
      if (typeof v === "boolean") return v;
      return v !== undefined && v !== null && String(v).trim() !== "";
    }).length;
    return { filled, total };
  };

  const renderSection = (
    id: string,
    icon: string,
    title: string,
    content: React.ReactNode,
  ) => {
    const isExpanded = expandedSection === id;
    const { filled, total } = getSectionProgress(id);
    const pct = total > 0 ? filled / total : 0;
    const isComplete = filled === total;
    return (
      <View style={[styles.section, { borderColor: colors.border }]}>
        <Pressable
          onPress={() => toggleSection(id)}
          style={styles.sectionHeader}
        >
          <Text style={styles.sectionIcon}>{icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {title}
            </Text>
            {/* Progress bar */}
            <View style={{
              height: 4,
              backgroundColor: colors.border,
              borderRadius: 2,
              marginTop: 6,
              overflow: "hidden",
            }}>
              <View style={{
                height: "100%",
                width: `${pct * 100}%`,
                backgroundColor: isComplete ? (colors.success || "#22c55e") : colors.primary,
                borderRadius: 2,
              }} />
            </View>
            <Text style={{
              fontSize: 11,
              color: isComplete ? (colors.success || "#22c55e") : colors.textSecondary,
              marginTop: 2,
            }}>
              {filled}/{total}
            </Text>
          </View>
          <Ionicons
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={20}
            color={colors.textSecondary}
          />
        </Pressable>
        {isExpanded && (
          <View style={styles.sectionContent}>{content}</View>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: colors.background, borderBottomColor: colors.border },
        ]}
      >
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {t("completeProfile.title") || "Complete Profile"}
        </Text>
        <View style={{ width: 40, alignItems: "center", justifyContent: "center" }}>
          {draftStatus === "saving" && (
            <ActivityIndicator size="small" color={colors.textSecondary} />
          )}
          {draftStatus === "saved" && (
            <Ionicons name="cloud-done-outline" size={18} color={colors.success || "#22c55e"} />
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="always"
      >
        {/* Progress hint */}
        <View
          style={[
            styles.hintCard,
            { backgroundColor: colors.primary + "15", borderColor: colors.primary + "30" },
          ]}
        >
          <Text style={{ fontSize: 16 }}>💡</Text>
          <Text style={[styles.hintText, { color: colors.text }]}>
            {t("completeProfile.hint") ||
              "Fill in your business details. You can save anytime and come back later."}
          </Text>
        </View>

        {/* Business Details */}
        {renderSection(
          "business",
          "🏢",
          t("completeProfile.businessDetails") || "Business Details",
          <>
            {renderInput(t("completeProfile.companyName") || "Company Name", "name")}
            {renderInput(t("completeProfile.tradingName") || "Trading Name", "trading_name")}
            {renderInput(t("completeProfile.legalName") || "Legal Name", "legal_name")}
            {/* ABN with auto-lookup */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                {t("completeProfile.abn") || "ABN"}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <TextInput
                  style={[
                    styles.input,
                    {
                      flex: 1,
                      backgroundColor: colors.backgroundSecondary,
                      color: colors.text,
                      borderColor: abnStatus === "success" ? "#22C55E" : abnStatus === "error" ? "#EF4444" : colors.border,
                    },
                  ]}
                  value={String(profile.abn || "")}
                  onChangeText={(text) => updateField("abn", text)}
                  placeholder="e.g. 51 824 753 556"
                  placeholderTextColor={colors.textSecondary + "80"}
                  keyboardType="numeric"
                  maxLength={14}
                />
                {abnStatus === "loading" && (
                  <ActivityIndicator size="small" color={colors.primary} style={{ position: "absolute", right: 12 }} />
                )}
                {abnStatus === "success" && (
                  <Ionicons name="checkmark-circle" size={20} color="#22C55E" style={{ position: "absolute", right: 12 }} />
                )}
                {abnStatus === "error" && (
                  <Ionicons name="alert-circle" size={20} color="#EF4444" style={{ position: "absolute", right: 12 }} />
                )}
              </View>
              <Text style={{ fontSize: 11, color: abnStatus === "success" ? "#22C55E" : colors.textSecondary, marginTop: 4 }}>
                {abnStatus === "success"
                  ? t("completeProfile.abnFound") || "Business details auto-filled from ABN."
                  : abnStatus === "error"
                    ? t("completeProfile.abnNotFound") || "ABN not found. Please check and try again."
                    : t("completeProfile.abnHintAuto") || "Enter your 11-digit ABN to auto-fill business details."}
              </Text>
            </View>
            {renderInput(t("completeProfile.acn") || "ACN", "acn", {
              keyboardType: "numeric",
            })}
            {renderInput(t("completeProfile.businessType") || "Business Type", "business_type", {
              placeholder: "e.g. Sole Trader, Pty Ltd",
            })}
            {renderInput(t("completeProfile.industryType") || "Industry Type", "industry_type", {
              placeholder: "e.g. Removals, Logistics",
            })}
          </>,
        )}

        {/* Contact Details */}
        {renderSection(
          "contact",
          "📞",
          t("completeProfile.contactDetails") || "Contact Details",
          <>
            {renderInput(t("completeProfile.email") || "Email", "email", {
              keyboardType: "email-address",
              autoCapitalize: "none",
            })}
            {renderInput(t("completeProfile.phone") || "Phone", "phone", {
              keyboardType: "phone-pad",
            })}
            {renderInput(t("completeProfile.website") || "Website", "website", {
              autoCapitalize: "none",
              placeholder: "https://",
            })}
          </>,
        )}

        {/* Address */}
        {renderSection(
          "address",
          "📍",
          t("completeProfile.address") || "Business Address",
          <>
            {renderInput(
              t("completeProfile.streetAddress") || "Street Address",
              "street_address",
            )}
            {renderInput(t("completeProfile.suburb") || "Suburb", "suburb")}
            {renderStatePicker()}
            {renderInput(t("completeProfile.postcode") || "Postcode", "postcode", {
              keyboardType: "numeric",
            })}
          </>,
        )}

        {/* Banking */}
        {renderSection(
          "banking",
          "🏦",
          t("completeProfile.banking") || "Banking Details",
          <>
            {renderInput(t("completeProfile.bankAccountName") || "Account Name", "bank_account_name")}
            {renderInput(t("completeProfile.bsb") || "BSB", "bsb", {
              keyboardType: "numeric",
              placeholder: "000-000",
            })}
            {renderInput(
              t("completeProfile.bankAccountNumber") || "Account Number",
              "bank_account_number",
              { keyboardType: "numeric" },
            )}
          </>,
        )}

        {/* Insurance */}
        {renderSection(
          "insurance",
          "🛡️",
          t("completeProfile.insurance") || "Insurance",
          <>
            <Pressable
              onPress={() => updateField("has_insurance", !profile.has_insurance)}
              style={[
                styles.toggleRow,
                { borderColor: colors.border },
              ]}
            >
              <Text style={[styles.toggleLabel, { color: colors.text }]}>
                {t("completeProfile.hasInsurance") || "Business has insurance"}
              </Text>
              <View
                style={[
                  styles.toggle,
                  {
                    backgroundColor: profile.has_insurance
                      ? colors.primary
                      : colors.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.toggleThumb,
                    profile.has_insurance && styles.toggleThumbActive,
                  ]}
                />
              </View>
            </Pressable>
            {profile.has_insurance && (
              <>
                {renderInput(
                  t("completeProfile.insuranceProvider") || "Insurance Provider",
                  "insurance_provider",
                )}
                {renderInput(
                  t("completeProfile.policyNumber") || "Policy Number",
                  "policy_number",
                )}
                {renderInput(
                  t("completeProfile.insuranceExpiry") || "Expiry Date",
                  "insurance_expiry_date",
                  { placeholder: "YYYY-MM-DD" },
                )}
              </>
            )}
          </>,
        )}

        {/* Branding */}
        {renderSection(
          "branding",
          "🎨",
          t("completeProfile.branding") || "Branding",
          <>
            <Text style={[styles.inputLabel, { color: colors.textSecondary, marginBottom: 8 }]}>
              {t("completeProfile.brandColor") || "Brand Color"}
            </Text>
            <Text style={{ fontSize: DESIGN_TOKENS.typography.caption.fontSize, color: colors.textSecondary, marginBottom: 12 }}>
              {t("completeProfile.brandColorHint") || "Choose a color that represents your brand. It will be applied across the app."}
            </Text>
            <View style={styles.colorGrid}>
              {BRAND_COLORS.map((c, i) => {
                const isDefault = c === null;
                const colorVal = isDefault ? "#FF6A4A" : c;
                const isSelected = isDefault
                  ? !profile.primary_color || profile.primary_color === ""
                  : profile.primary_color === c;
                return (
                  <Pressable
                    key={i}
                    onPress={() => {
                      const newColor = isDefault ? "" : c;
                      updateField("primary_color", newColor);
                      setCompanyColor(newColor || null);
                    }}
                    style={[
                      styles.colorSwatch,
                      { backgroundColor: colorVal },
                      isSelected && { borderWidth: 3, borderColor: colors.text },
                    ]}
                  >
                    {isSelected && <Ionicons name="checkmark" size={18} color="#fff" />}
                    {isDefault && !isSelected && (
                      <Text style={{ color: "#fff", fontSize: 9, fontWeight: "600" }}>DEF</Text>
                    )}
                  </Pressable>
                );
              })}
            </View>
            {/* Preview */}
            <View style={[
              styles.colorPreview,
              { backgroundColor: colors.primary + "15", borderColor: colors.primary + "30" },
            ]}>
              <View style={[styles.previewBtn, { backgroundColor: colors.primary }]}>
                <Text style={{ color: "#fff", fontWeight: "600", fontSize: 13 }}>
                  {t("completeProfile.previewButton") || "Preview Button"}
                </Text>
              </View>
              <View style={[styles.previewBadge, { backgroundColor: colors.primary + "20" }]}>
                <Text style={{ color: colors.primary, fontWeight: "600", fontSize: 12 }}>
                  {t("completeProfile.previewBadge") || "Status Badge"}
                </Text>
              </View>
            </View>
          </>,
        )}

        {/* Save button */}
        <Pressable
          onPress={handleSave}
          disabled={saving}
          style={[
            styles.saveBtn,
            { backgroundColor: saving ? colors.primary + "80" : colors.primary },
          ]}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.saveBtnText}>
                {t("completeProfile.save") || "Save Profile"}
              </Text>
            </>
          )}
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: DESIGN_TOKENS.spacing.lg,
    paddingTop: Platform.OS === "ios" ? 56 : 16,
    paddingBottom: DESIGN_TOKENS.spacing.md,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: DESIGN_TOKENS.typography.title.fontSize,
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: DESIGN_TOKENS.spacing.lg,
  },
  hintCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: DESIGN_TOKENS.spacing.md,
    borderRadius: DESIGN_TOKENS.radius.lg,
    borderWidth: 1,
    marginBottom: DESIGN_TOKENS.spacing.lg,
    gap: DESIGN_TOKENS.spacing.sm,
  },
  hintText: {
    flex: 1,
    fontSize: DESIGN_TOKENS.typography.caption.fontSize,
    lineHeight: 18,
  },
  section: {
    borderWidth: 1,
    borderRadius: DESIGN_TOKENS.radius.lg,
    marginBottom: DESIGN_TOKENS.spacing.md,
    overflow: "hidden",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: DESIGN_TOKENS.spacing.md,
    gap: DESIGN_TOKENS.spacing.sm,
  },
  sectionIcon: {
    fontSize: 20,
  },
  sectionTitle: {
    flex: 1,
    fontSize: DESIGN_TOKENS.typography.subtitle.fontSize,
    fontWeight: "600",
  },
  sectionContent: {
    paddingHorizontal: DESIGN_TOKENS.spacing.md,
    paddingBottom: DESIGN_TOKENS.spacing.md,
  },
  inputGroup: {
    marginBottom: DESIGN_TOKENS.spacing.md,
  },
  inputLabel: {
    fontSize: DESIGN_TOKENS.typography.caption.fontSize,
    fontWeight: "500",
    marginBottom: DESIGN_TOKENS.spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderRadius: DESIGN_TOKENS.radius.md,
    paddingHorizontal: DESIGN_TOKENS.spacing.md,
    paddingVertical: DESIGN_TOKENS.spacing.sm + 2,
    fontSize: DESIGN_TOKENS.typography.body.fontSize,
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  stateRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: DESIGN_TOKENS.spacing.xs,
  },
  stateChip: {
    paddingHorizontal: DESIGN_TOKENS.spacing.md,
    paddingVertical: DESIGN_TOKENS.spacing.sm,
    borderRadius: DESIGN_TOKENS.radius.full,
    borderWidth: 1,
  },
  stateChipText: {
    fontSize: DESIGN_TOKENS.typography.caption.fontSize,
    fontWeight: "500",
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: DESIGN_TOKENS.spacing.md,
    borderBottomWidth: 1,
    marginBottom: DESIGN_TOKENS.spacing.md,
  },
  toggleLabel: {
    fontSize: DESIGN_TOKENS.typography.body.fontSize,
    fontWeight: "500",
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#fff",
  },
  toggleThumbActive: {
    alignSelf: "flex-end",
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: DESIGN_TOKENS.spacing.md + 2,
    borderRadius: DESIGN_TOKENS.radius.lg,
    marginTop: DESIGN_TOKENS.spacing.lg,
    gap: DESIGN_TOKENS.spacing.sm,
  },
  saveBtnText: {
    color: "#fff",
    fontSize: DESIGN_TOKENS.typography.subtitle.fontSize,
    fontWeight: "600",
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: DESIGN_TOKENS.spacing.md,
  },
  colorSwatch: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  colorPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: DESIGN_TOKENS.spacing.md,
    borderRadius: DESIGN_TOKENS.radius.lg,
    borderWidth: 1,
    marginTop: 4,
  },
  previewBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: DESIGN_TOKENS.radius.md,
  },
  previewBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: DESIGN_TOKENS.radius.full,
  },
});
