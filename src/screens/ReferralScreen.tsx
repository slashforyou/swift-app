/**
 * ReferralScreen — Parrainage / Referral
 * #46 Écran de parrainage pour les patrons et cadres
 */
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useCallback, useEffect, useState } from "react";
import {
    Clipboard,
    Pressable,
    RefreshControl,
    ScrollView,
    Share,
    Text,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MascotLoading from "../components/ui/MascotLoading";
import { DESIGN_TOKENS } from "../constants/Styles";
import { useTheme } from "../context/ThemeProvider";
import { useAuth } from "../hooks/useAuth";
import { useTranslation } from "../localization/useLocalization";
import {
    getReferralCode,
    listReferrals,
    type ReferredCompany,
} from "../services/referral";

// ─── helpers ────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

// ─── Sub-components ──────────────────────────────────────────────────────────

interface ReferralRowProps {
  item: ReferredCompany;
  colors: ReturnType<typeof useTheme>["colors"];
  t: (key: string) => string | undefined;
}

const ReferralRow: React.FC<ReferralRowProps> = ({ item, colors, t }) => (
  <View
    style={{
      backgroundColor: colors.backgroundSecondary,
      borderRadius: DESIGN_TOKENS.radius.md,
      padding: DESIGN_TOKENS.spacing.md,
      marginBottom: DESIGN_TOKENS.spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    }}
  >
    <View style={{ flex: 1 }}>
      <Text
        style={{
          fontSize: 15,
          fontWeight: "600",
          color: colors.text,
          marginBottom: 2,
        }}
      >
        {item.company_name}
      </Text>
      <Text style={{ fontSize: 12, color: colors.textSecondary }}>
        {t("referral.joined") ?? "Joined"} {formatDate(item.joined_at)}
      </Text>
    </View>
    <Text
      style={{
        fontSize: 12,
        color: item.reward_granted ? "#22C55E" : colors.textSecondary,
        fontWeight: item.reward_granted ? "600" : "400",
        marginLeft: DESIGN_TOKENS.spacing.sm,
      }}
    >
      {item.reward_granted
        ? (t("referral.rewardGranted") ?? "✅ Récompense accordée")
        : (t("referral.rewardPending") ?? "⏳ En attente")}
    </Text>
  </View>
);

// ─── Main screen ─────────────────────────────────────────────────────────────

const ReferralScreen: React.FC = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [shareText, setShareText] = useState<string>("");
  const [referrals, setReferrals] = useState<ReferredCompany[]>([]);
  const [totalReferrals, setTotalReferrals] = useState(0);
  const [totalRewards, setTotalRewards] = useState(0);
  const [copied, setCopied] = useState(false);

  const companyId = user?.company_id;

  const loadData = useCallback(
    async (silent = false) => {
      if (!companyId) return;
      if (!silent) setLoading(true);
      setError(null);
      try {
        const [codeRes, listRes] = await Promise.all([
          getReferralCode(companyId),
          listReferrals(companyId),
        ]);
        setReferralCode(codeRes.referral_code);
        setShareText(codeRes.share_text);
        setReferrals(listRes.referrals ?? []);
        setTotalReferrals(listRes.total_referrals ?? 0);
        setTotalRewards(listRes.total_rewards ?? 0);
      } catch {
        setError(t("referral.loadError") ?? "Unable to load referral data");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [companyId, t],
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCopy = useCallback(() => {
    if (!referralCode) return;
    Clipboard.setString(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [referralCode]);

  const handleShare = useCallback(async () => {
    if (!shareText && !referralCode) return;
    try {
      await Share.share({ message: shareText || referralCode! });
    } catch {
      // user cancelled or error — ignore
    }
  }, [shareText, referralCode]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData(true);
  }, [loadData]);

  // ─── loading ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <MascotLoading text={t("common.loading" as any) ?? "Loading..."} />
      </View>
    );
  }

  // ─── render ───────────────────────────────────────────────────────────────

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingBottom: insets.bottom + DESIGN_TOKENS.spacing.xl,
      }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }
    >
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + DESIGN_TOKENS.spacing.md,
          paddingHorizontal: DESIGN_TOKENS.spacing.lg,
          paddingBottom: DESIGN_TOKENS.spacing.md,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={12}
          style={{ marginRight: DESIGN_TOKENS.spacing.sm }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={{ fontSize: 20, fontWeight: "700", color: colors.text }}>
          {t("referral.title") ?? "Parrainage"}
        </Text>
      </View>

      <View style={{ paddingHorizontal: DESIGN_TOKENS.spacing.lg }}>
        {/* Error */}
        {error && (
          <View
            style={{
              backgroundColor: "#FEE2E2",
              borderRadius: DESIGN_TOKENS.radius.md,
              padding: DESIGN_TOKENS.spacing.md,
              marginBottom: DESIGN_TOKENS.spacing.md,
            }}
          >
            <Text style={{ color: "#DC2626", fontSize: 14 }}>{error}</Text>
          </View>
        )}

        {/* Referral code card */}
        <View
          style={{
            backgroundColor: colors.backgroundSecondary,
            borderRadius: DESIGN_TOKENS.radius.lg,
            padding: DESIGN_TOKENS.spacing.lg,
            marginBottom: DESIGN_TOKENS.spacing.lg,
            alignItems: "center",
          }}
        >
          <Ionicons
            name="people-outline"
            size={40}
            color={colors.primary}
            style={{ marginBottom: DESIGN_TOKENS.spacing.sm }}
          />
          <Text
            style={{
              fontSize: 13,
              color: colors.textSecondary,
              marginBottom: DESIGN_TOKENS.spacing.xs,
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            {t("referral.yourCode") ?? "Votre code de parrainage"}
          </Text>
          <Text
            style={{
              fontSize: 32,
              fontWeight: "800",
              color: colors.primary,
              letterSpacing: 4,
              marginBottom: DESIGN_TOKENS.spacing.md,
            }}
          >
            {referralCode ?? "—"}
          </Text>

          {/* Copy + Share buttons */}
          <View style={{ flexDirection: "row", gap: DESIGN_TOKENS.spacing.sm }}>
            <Pressable
              onPress={handleCopy}
              style={{
                flex: 1,
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: copied ? "#22C55E" : colors.primary,
                borderRadius: DESIGN_TOKENS.radius.md,
                padding: DESIGN_TOKENS.spacing.sm,
                gap: 6,
              }}
            >
              <Ionicons
                name={copied ? "checkmark" : "copy-outline"}
                size={16}
                color="#fff"
              />
              <Text style={{ color: "#fff", fontWeight: "600", fontSize: 14 }}>
                {copied
                  ? (t("referral.copied") ?? "Copié !")
                  : (t("referral.copy") ?? "Copier")}
              </Text>
            </Pressable>

            <Pressable
              onPress={handleShare}
              style={{
                flex: 1,
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: colors.backgroundTertiary ?? colors.backgroundSecondary,
                borderRadius: DESIGN_TOKENS.radius.md,
                padding: DESIGN_TOKENS.spacing.sm,
                gap: 6,
                borderWidth: 1,
                borderColor: colors.border ?? colors.backgroundSecondary,
              }}
            >
              <Ionicons name="share-outline" size={16} color={colors.primary} />
              <Text
                style={{ color: colors.primary, fontWeight: "600", fontSize: 14 }}
              >
                {t("referral.shareText") ?? "Partager"}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Stats row */}
        {totalReferrals > 0 && (
          <View
            style={{
              flexDirection: "row",
              gap: DESIGN_TOKENS.spacing.sm,
              marginBottom: DESIGN_TOKENS.spacing.lg,
            }}
          >
            <View
              style={{
                flex: 1,
                backgroundColor: colors.backgroundSecondary,
                borderRadius: DESIGN_TOKENS.radius.md,
                padding: DESIGN_TOKENS.spacing.md,
                alignItems: "center",
              }}
            >
              <Text
                style={{ fontSize: 24, fontWeight: "800", color: colors.primary }}
              >
                {totalReferrals}
              </Text>
              <Text
                style={{ fontSize: 12, color: colors.textSecondary, textAlign: "center" }}
              >
                {t("referral.referrals") ?? "Filleuls"}
              </Text>
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor: colors.backgroundSecondary,
                borderRadius: DESIGN_TOKENS.radius.md,
                padding: DESIGN_TOKENS.spacing.md,
                alignItems: "center",
              }}
            >
              <Text
                style={{ fontSize: 24, fontWeight: "800", color: "#22C55E" }}
              >
                {totalRewards}
              </Text>
              <Text
                style={{ fontSize: 12, color: colors.textSecondary, textAlign: "center" }}
              >
                {t("referral.rewardsGranted") ?? "Récompenses"}
              </Text>
            </View>
          </View>
        )}

        {/* Referrals list */}
        <Text
          style={{
            fontSize: 16,
            fontWeight: "700",
            color: colors.text,
            marginBottom: DESIGN_TOKENS.spacing.sm,
          }}
        >
          {t("referral.referrals") ?? "Filleuls"}
        </Text>

        {referrals.length === 0 ? (
          <View
            style={{
              backgroundColor: colors.backgroundSecondary,
              borderRadius: DESIGN_TOKENS.radius.lg,
              padding: DESIGN_TOKENS.spacing.xl,
              alignItems: "center",
            }}
          >
            <Ionicons
              name="people-circle-outline"
              size={48}
              color={colors.textSecondary}
              style={{ marginBottom: DESIGN_TOKENS.spacing.sm }}
            />
            <Text
              style={{
                fontSize: 15,
                fontWeight: "600",
                color: colors.text,
                marginBottom: 4,
                textAlign: "center",
              }}
            >
              {t("referral.noReferrals") ?? "Aucun filleul pour l'instant"}
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: colors.textSecondary,
                textAlign: "center",
              }}
            >
              {t("referral.noReferralsSubtitle") ??
                "Partagez votre code pour inviter d'autres entreprises"}
            </Text>
          </View>
        ) : (
          referrals.map((item, index) => (
            <ReferralRow
              key={`${item.company_name}-${index}`}
              item={item}
              colors={colors}
              t={t as (key: string) => string | undefined}
            />
          ))
        )}
      </View>
    </ScrollView>
  );
};

export default ReferralScreen;
