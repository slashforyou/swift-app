/**
 * StripeSettingsScreen - Configuration Stripe Connect
 * Gestion des paramètres du compte Stripe, webhooks, et configuration
 */
import Ionicons from "@react-native-vector-icons/ionicons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MascotLoading from "../../components/ui/MascotLoading";

// Context
import { DESIGN_TOKENS } from "../../constants/Styles";
import { useTheme } from "../../context/ThemeProvider";
import { useStripeAccount, useStripeSettings } from "../../hooks/useStripe";
import { useTranslation } from "../../localization/useLocalization";
import { ENV } from "../../config/environment";

// Types
interface StripeConfig {
  accountId: string;
  displayName: string;
  country: string;
  currency: string;
  isLive: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  webhooksEnabled: boolean;
  instantPayouts: boolean;
  emailReceipts: boolean;
  smsNotifications: boolean;
}

interface StripeSettingsScreenProps {
  navigation?: any;
}

export default function StripeSettingsScreen({
  navigation,
}: StripeSettingsScreenProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const [isProcessing, setIsProcessing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Utilisation du hook Stripe pour récupérer les vraies données
  const {
    account,
    balance,
    loading: isLoading,
    error,
    refresh,
  } = useStripeAccount();

  // Hook pour les paramètres avancés
  const {
    settings,
    updateSettings: updateStripeSettings,
    refresh: refreshStripeSettings,
    loading: settingsLoading,
    saving,
    error: settingsError,
  } = useStripeSettings();

  // ✅ Log pour debug: vérifier quel compte Stripe est chargé
  React.useEffect(() => {
    if (account) {
    } else if (!isLoading) {
    }
  }, [account, isLoading]);

  // Draft (editable) fields driven by Stripe Account Settings API
  const [draftDisplayName, setDraftDisplayName] = useState("");
  const [draftSupportEmail, setDraftSupportEmail] = useState("");
  const [draftSupportPhone, setDraftSupportPhone] = useState("");
  const [draftSupportUrl, setDraftSupportUrl] = useState("");
  const [draftStatementDescriptor, setDraftStatementDescriptor] = useState("");
  const [draftPayoutInterval, setDraftPayoutInterval] = useState<
    "manual" | "daily" | "weekly" | "monthly"
  >("daily");
  const [draftDebitNegativeBalances, setDraftDebitNegativeBalances] =
    useState(false);

  React.useEffect(() => {
    if (!settings) return;
    const nextDisplayName = settings.dashboard?.display_name ?? "";
    const nextSupportEmail = settings.dashboard?.support_email ?? "";
    const nextSupportPhone = settings.dashboard?.support_phone ?? "";
    const nextSupportUrl = settings.dashboard?.support_url ?? "";
    const nextStatementDescriptor =
      settings.payments?.statement_descriptor ?? "";
    const nextInterval = settings.payouts?.schedule?.interval ?? "daily";
    const nextDebit = Boolean(settings.payouts?.debit_negative_balances);

    setDraftDisplayName(nextDisplayName);
    setDraftSupportEmail(nextSupportEmail);
    setDraftSupportPhone(nextSupportPhone);
    setDraftSupportUrl(nextSupportUrl);
    setDraftStatementDescriptor(nextStatementDescriptor);
    setDraftPayoutInterval(nextInterval);
    setDraftDebitNegativeBalances(nextDebit);
    setHasChanges(false);
  }, [settings]);

  const markChanged = () => setHasChanges(true);

  const buildSettingsPatch = (): Partial<
    Omit<
      import("../../services/StripeService").StripeAccountSettings,
      "account_status"
    >
  > => {
    const patch: any = {};
    const currentDisplayName = settings?.dashboard?.display_name ?? "";
    const currentSupportEmail = settings?.dashboard?.support_email ?? "";
    const currentSupportPhone = settings?.dashboard?.support_phone ?? "";
    const currentSupportUrl = settings?.dashboard?.support_url ?? "";
    const currentStatementDescriptor =
      settings?.payments?.statement_descriptor ?? "";
    const currentInterval = settings?.payouts?.schedule?.interval ?? "daily";
    const currentDebit = Boolean(settings?.payouts?.debit_negative_balances);

    const clean = (value: string) => value.trim();

    const nextDashboard: any = {};
    if (clean(draftDisplayName) !== clean(currentDisplayName)) {
      nextDashboard.display_name = clean(draftDisplayName) || null;
    }
    if (clean(draftSupportEmail) !== clean(currentSupportEmail)) {
      nextDashboard.support_email = clean(draftSupportEmail) || null;
    }
    if (clean(draftSupportPhone) !== clean(currentSupportPhone)) {
      nextDashboard.support_phone = clean(draftSupportPhone) || null;
    }
    if (clean(draftSupportUrl) !== clean(currentSupportUrl)) {
      nextDashboard.support_url = clean(draftSupportUrl) || null;
    }
    if (Object.keys(nextDashboard).length > 0) {
      patch.dashboard = nextDashboard;
    }

    if (clean(draftStatementDescriptor) !== clean(currentStatementDescriptor)) {
      patch.payments = {
        statement_descriptor: clean(draftStatementDescriptor) || null,
      };
    }

    if (
      draftPayoutInterval !== currentInterval ||
      draftDebitNegativeBalances !== currentDebit
    ) {
      patch.payouts = {
        schedule: {
          interval: draftPayoutInterval,
        },
        debit_negative_balances: draftDebitNegativeBalances,
      };
    }

    return patch;
  };

  const handleSave = async () => {
    if (!settings) return;
    const patch = buildSettingsPatch();
    if (Object.keys(patch).length === 0) {
      setHasChanges(false);
      return;
    }

    try {
      setIsProcessing(true);
      await updateStripeSettings(patch);
      await refresh();
      await refreshStripeSettings();
      setHasChanges(false);
      Alert.alert(
        t("common.success", { defaultValue: "Succès" }),
        t("stripe.settings.alerts.successUpdate", {
          defaultValue: "Paramètres mis à jour.",
        }),
      );
    } catch (err) {
      Alert.alert(
        t("common.error"),
        err instanceof Error
          ? err.message
          : t("stripe.settings.alerts.errorUpdate"),
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const Section = ({ title, children }: { title: string; children: any }) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );

  const FieldRow = ({
    label,
    value,
    onChangeText,
    placeholder,
    keyboardType,
  }: {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    keyboardType?: "default" | "email-address" | "phone-pad" | "url";
  }) => (
    <View style={styles.fieldRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.fieldInput}
        value={value}
        onChangeText={(text) => {
          onChangeText(text);
          markChanged();
        }}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        keyboardType={keyboardType || "default"}
        autoCapitalize="none"
        editable={!hubBusy}
      />
    </View>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      padding: DESIGN_TOKENS.spacing.lg,
      backgroundColor: colors.backgroundSecondary,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      marginRight: DESIGN_TOKENS.spacing.md,
    },
    title: {
      fontSize: DESIGN_TOKENS.typography.title.fontSize,
      fontWeight: DESIGN_TOKENS.typography.title.fontWeight,
      color: colors.text,
      flex: 1,
    },
    content: {
      flex: 1,
    },
    section: {
      backgroundColor: colors.backgroundSecondary,
      marginTop: DESIGN_TOKENS.spacing.lg,
      borderRadius: DESIGN_TOKENS.radius.md,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.border,
    },
    sectionHeader: {
      padding: DESIGN_TOKENS.spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    sectionTitle: {
      fontSize: DESIGN_TOKENS.typography.subtitle.fontSize,
      fontWeight: DESIGN_TOKENS.typography.subtitle.fontWeight,
      color: colors.text,
    },
    accountCard: {
      backgroundColor: colors.backgroundSecondary,
      margin: DESIGN_TOKENS.spacing.lg,
      padding: DESIGN_TOKENS.spacing.lg,
      borderRadius: DESIGN_TOKENS.radius.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    accountHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: DESIGN_TOKENS.spacing.md,
    },
    accountIcon: {
      width: 48,
      height: 48,
      backgroundColor: colors.primary + "20",
      borderRadius: 24,
      alignItems: "center",
      justifyContent: "center",
      marginRight: DESIGN_TOKENS.spacing.md,
    },
    accountInfo: {
      flex: 1,
    },
    accountName: {
      fontSize: DESIGN_TOKENS.typography.subtitle.fontSize,
      fontWeight: DESIGN_TOKENS.typography.subtitle.fontWeight,
      color: colors.text,
      marginBottom: DESIGN_TOKENS.spacing.xs,
    },
    accountId: {
      fontSize: DESIGN_TOKENS.typography.caption.fontSize,
      color: colors.textSecondary,
    },
    statusBadge: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: DESIGN_TOKENS.spacing.sm,
      paddingVertical: DESIGN_TOKENS.spacing.xs,
      borderRadius: DESIGN_TOKENS.radius.sm,
      gap: DESIGN_TOKENS.spacing.xs,
    },
    statusText: {
      fontSize: DESIGN_TOKENS.typography.caption.fontSize,
      fontWeight: "600",
    },
    accountDetails: {
      flexDirection: "row",
      gap: DESIGN_TOKENS.spacing.md,
    },
    detailItem: {
      flex: 1,
    },
    detailLabel: {
      fontSize: DESIGN_TOKENS.typography.caption.fontSize,
      color: colors.textSecondary,
      marginBottom: DESIGN_TOKENS.spacing.xs,
    },
    detailValue: {
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      color: colors.text,
      fontWeight: "500",
    },
    settingTitle: {
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      fontWeight: "500",
      marginBottom: 2,
    },
    settingSubtitle: {
      fontSize: DESIGN_TOKENS.typography.caption.fontSize,
    },
    fieldRow: {
      paddingHorizontal: DESIGN_TOKENS.spacing.lg,
      paddingVertical: DESIGN_TOKENS.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    fieldLabel: {
      fontSize: DESIGN_TOKENS.typography.caption.fontSize,
      color: colors.textSecondary,
      marginBottom: DESIGN_TOKENS.spacing.xs,
      fontWeight: "600",
    },
    fieldInput: {
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      color: colors.text,
      paddingVertical: DESIGN_TOKENS.spacing.sm,
      paddingHorizontal: DESIGN_TOKENS.spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: DESIGN_TOKENS.radius.sm,
      backgroundColor: colors.background,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: DESIGN_TOKENS.spacing.lg,
      paddingVertical: DESIGN_TOKENS.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    rowTitle: {
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      color: colors.text,
      fontWeight: "600",
    },
    rowValue: {
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      color: colors.textSecondary,
      fontWeight: "500",
    },
    segmented: {
      flexDirection: "row",
      gap: DESIGN_TOKENS.spacing.xs,
      paddingHorizontal: DESIGN_TOKENS.spacing.lg,
      paddingVertical: DESIGN_TOKENS.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    segmentButton: {
      flex: 1,
      paddingVertical: DESIGN_TOKENS.spacing.sm,
      borderRadius: DESIGN_TOKENS.radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.background,
    },
    segmentButtonActive: {
      backgroundColor: colors.primary + "20",
      borderColor: colors.primary,
    },
    segmentText: {
      fontSize: DESIGN_TOKENS.typography.caption.fontSize,
      fontWeight: "700",
      color: colors.textSecondary,
    },
    segmentTextActive: {
      color: colors.primary,
    },
    saveBar: {
      padding: DESIGN_TOKENS.spacing.lg,
    },
    saveButton: {
      backgroundColor: colors.primary,
      borderRadius: DESIGN_TOKENS.radius.md,
      paddingVertical: DESIGN_TOKENS.spacing.md,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: DESIGN_TOKENS.spacing.sm,
    },
    saveButtonDisabled: {
      backgroundColor: colors.border,
    },
    saveButtonText: {
      color: colors.background,
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      fontWeight: "700",
    },
  });

  const hubBusy = isProcessing || saving || isLoading || settingsLoading;
  const isTestMode = ENV.name !== "production";

  // Loading state
  if (isLoading || settingsLoading) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <MascotLoading
          text={t("stripe.settings.loading", { defaultValue: "Chargement" })}
        />
      </View>
    );
  }

  // Error or no account — show error with retry
  if (error || !account) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation?.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>
            {t("stripe.settings.title", { defaultValue: "Paramètres Stripe" })}
          </Text>
        </View>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: DESIGN_TOKENS.spacing.xl }}>
          <View style={{
            backgroundColor: colors.warning + "15",
            width: 64, height: 64, borderRadius: 32,
            alignItems: "center", justifyContent: "center",
            marginBottom: DESIGN_TOKENS.spacing.lg,
          }}>
            <Ionicons name="alert-circle-outline" size={32} color={colors.warning} />
          </View>
          <Text style={{
            fontSize: DESIGN_TOKENS.typography.subtitle.fontSize,
            fontWeight: DESIGN_TOKENS.typography.subtitle.fontWeight,
            color: colors.text,
            textAlign: "center",
            marginBottom: DESIGN_TOKENS.spacing.sm,
          }}>
            {t("stripe.settings.loadError", { defaultValue: "Impossible de charger les paramètres" })}
          </Text>
          <Text style={{
            fontSize: DESIGN_TOKENS.typography.body.fontSize,
            color: colors.textSecondary,
            textAlign: "center",
            lineHeight: 22,
            marginBottom: DESIGN_TOKENS.spacing.xl,
          }}>
            {error || t("stripe.settings.noAccount", { defaultValue: "Aucun compte Stripe connecté." })}
          </Text>
          <View style={{ flexDirection: "row", gap: DESIGN_TOKENS.spacing.md }}>
            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: DESIGN_TOKENS.spacing.sm,
                backgroundColor: colors.primary,
                paddingHorizontal: DESIGN_TOKENS.spacing.xl,
                paddingVertical: DESIGN_TOKENS.spacing.md,
                borderRadius: DESIGN_TOKENS.radius.md,
              }}
              onPress={() => { refresh(); refreshStripeSettings(); }}
            >
              <Ionicons name="refresh" size={18} color={colors.background} />
              <Text style={{ color: colors.background, fontWeight: "700", fontSize: DESIGN_TOKENS.typography.body.fontSize }}>
                {t("common.retry", { defaultValue: "Réessayer" })}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: DESIGN_TOKENS.spacing.sm,
                borderWidth: 1,
                borderColor: colors.border,
                paddingHorizontal: DESIGN_TOKENS.spacing.xl,
                paddingVertical: DESIGN_TOKENS.spacing.md,
                borderRadius: DESIGN_TOKENS.radius.md,
              }}
              onPress={() => navigation?.goBack()}
            >
              <Ionicons name="arrow-back" size={18} color={colors.text} />
              <Text style={{ color: colors.text, fontWeight: "700", fontSize: DESIGN_TOKENS.typography.body.fontSize }}>
                {t("common.goBack")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView testID="stripe-settings-screen" style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation?.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>
          {t("stripe.settings.title", { defaultValue: "Paramètres Stripe" })}
        </Text>
      </View>

      {isTestMode && (
        <View style={{
          backgroundColor: "#FFF3CD",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: DESIGN_TOKENS.spacing.sm,
          paddingHorizontal: DESIGN_TOKENS.spacing.lg,
          gap: DESIGN_TOKENS.spacing.sm,
        }}>
          <Ionicons name="flask" size={16} color="#856404" />
          <Text style={{ color: "#856404", fontWeight: "700", fontSize: DESIGN_TOKENS.typography.caption.fontSize }}>
            {t("businessHub.stripeSettings.testMode")}
          </Text>
        </View>
      )}

      <ScrollView style={styles.content}>
        {/* Account Overview */}
        <View style={styles.accountCard}>
          <View style={styles.accountHeader}>
            <View style={styles.accountIcon}>
              <Ionicons name="business" size={24} color={colors.primary} />
            </View>
            <View style={styles.accountInfo}>
              <Text style={styles.accountName}>{account.business_name}</Text>
              <Text style={styles.accountId}>
                {account.stripe_account_id.slice(0, 20)}...
              </Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: account.charges_enabled
                    ? colors.success + "20"
                    : colors.warning + "20",
                },
              ]}
            >
              <Ionicons
                name={account.charges_enabled ? "checkmark-circle" : "warning"}
                size={14}
                color={
                  account.charges_enabled ? colors.success : colors.warning
                }
              />
              <Text
                style={[
                  styles.statusText,
                  {
                    color: account.charges_enabled
                      ? colors.success
                      : colors.warning,
                  },
                ]}
              >
                {account.charges_enabled
                  ? t("stripe.hub.paymentsEnabled", {
                      defaultValue: "Paiements activés",
                    })
                  : t("stripe.hub.actionRequired", {
                      defaultValue: "Action requise",
                    })}
              </Text>
            </View>
          </View>

          <View style={styles.accountDetails}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>
                {t("stripe.settings.country")}
              </Text>
              <Text style={styles.detailValue}>{account.country}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>
                {t("stripe.settings.currency")}
              </Text>
              <Text style={styles.detailValue}>{account.default_currency}</Text>
            </View>
          </View>

          <View
            style={{
              flexDirection: "row",
              gap: DESIGN_TOKENS.spacing.md,
              marginTop: DESIGN_TOKENS.spacing.md,
            }}
          >
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>
                {t("stripe.hub.availableBalance", {
                  defaultValue: "Disponible",
                })}
              </Text>
              <Text style={styles.detailValue}>
                {balance.available.toFixed(2)}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>
                {t("stripe.hub.pendingBalance", {
                  defaultValue: "En attente",
                })}
              </Text>
              <Text style={styles.detailValue}>
                {balance.pending.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        <Section title={t("stripe.settings.sections.accountSetup")}>
          <FieldRow
            label={t("stripe.settings.displayName")}
            value={draftDisplayName}
            onChangeText={setDraftDisplayName}
            placeholder={account.business_name}
          />
          <FieldRow
            label={t("stripe.settings.supportEmail")}
            value={draftSupportEmail}
            onChangeText={setDraftSupportEmail}
            placeholder={t("stripe.settings.placeholders.supportEmail")}
            keyboardType="email-address"
          />
          <FieldRow
            label={t("stripe.settings.supportPhone")}
            value={draftSupportPhone}
            onChangeText={setDraftSupportPhone}
            placeholder={t("stripe.settings.placeholders.supportPhone")}
            keyboardType="phone-pad"
          />
          <FieldRow
            label={t("stripe.settings.supportUrl")}
            value={draftSupportUrl}
            onChangeText={setDraftSupportUrl}
            placeholder={t("stripe.settings.placeholders.supportUrl")}
            keyboardType="url"
          />
        </Section>

        <Section title={t("stripe.settings.sections.paymentSettings")}>
          <FieldRow
            label={t("stripe.settings.statementDescriptor")}
            value={draftStatementDescriptor}
            onChangeText={setDraftStatementDescriptor}
            placeholder={t("stripe.settings.statementDescriptorPlaceholder")}
          />
        </Section>

        <Section
          title={t("stripe.settings.sections.payoutSettings", {
            defaultValue: "Virements",
          })}
        >
          <View style={styles.row}>
            <Text style={styles.rowTitle}>
              {t("stripe.settings.payoutInterval", {
                defaultValue: "Fréquence des virements",
              })}
            </Text>
            <Text style={styles.rowValue}>{draftPayoutInterval}</Text>
          </View>
          <View style={styles.segmented}>
            {(
              [
                { key: "manual", labelKey: "businessHub.stripeSettings.payoutManual" },
                { key: "daily", labelKey: "businessHub.stripeSettings.payoutDaily" },
                { key: "weekly", labelKey: "businessHub.stripeSettings.payoutWeekly" },
                { key: "monthly", labelKey: "businessHub.stripeSettings.payoutMonthly" },
              ] as const
            ).map((option) => {
              const isActive = draftPayoutInterval === option.key;
              return (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.segmentButton,
                    isActive && styles.segmentButtonActive,
                  ]}
                  onPress={() => {
                    if (hubBusy) return;
                    setDraftPayoutInterval(option.key);
                    markChanged();
                  }}
                  disabled={hubBusy}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      isActive && styles.segmentTextActive,
                    ]}
                  >
                    {t(option.labelKey)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={styles.row}
            onPress={() => {
              if (hubBusy) return;
              setDraftDebitNegativeBalances((v) => !v);
              markChanged();
            }}
            disabled={hubBusy}
          >
            <Text style={styles.rowTitle}>
              {t("stripe.settings.debitNegativeBalances", {
                defaultValue: "Déduire les soldes négatifs",
              })}
            </Text>
            <Ionicons
              name={draftDebitNegativeBalances ? "checkbox" : "square-outline"}
              size={22}
              color={
                draftDebitNegativeBalances
                  ? colors.primary
                  : colors.textSecondary
              }
            />
          </TouchableOpacity>
        </Section>

        <View style={styles.saveBar}>
          <TouchableOpacity
            style={[
              styles.saveButton,
              (!hasChanges || hubBusy) && styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={!hasChanges || hubBusy}
          >
            {hubBusy ? (
              <ActivityIndicator size="small" color={colors.background} />
            ) : (
              <Ionicons
                name="save-outline"
                size={20}
                color={colors.background}
              />
            )}
            <Text style={styles.saveButtonText}>
              {t("common.save", { defaultValue: "Enregistrer" })}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
