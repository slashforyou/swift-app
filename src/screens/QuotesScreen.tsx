import Ionicons from "@react-native-vector-icons/ionicons";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DESIGN_TOKENS } from "../constants/Styles";
import { useTheme } from "../context/ThemeProvider";
import { useLocalization } from "../localization/useLocalization";
import {
  getQuotes,
  Quote,
} from "../services/quotesService";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft: { label: "Brouillon", color: "#718096" },
  sent: { label: "Envoyé", color: "#3182CE" },
  accepted: { label: "Accepté", color: "#38A169" },
  rejected: { label: "Refusé", color: "#E53E3E" },
  expired: { label: "Expiré", color: "#D69E2E" },
};

type FilterTab = "all" | "active" | "accepted" | "archived";

interface Props {
  route?: any;
  navigation: any;
}

export default function QuotesScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t } = useLocalization();

  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<FilterTab>("all");

  const load = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const data = await getQuotes();
      setQuotes(data);
    } catch {
      setError(t("common.loadError") ?? "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = quotes.filter((q) => {
    switch (filterTab) {
      case "active": return q.status === "draft" || q.status === "sent";
      case "accepted": return q.status === "accepted";
      case "archived": return q.status === "rejected" || q.status === "expired";
      default: return true;
    }
  });

  const stats = {
    active: quotes.filter((q) => q.status === "draft" || q.status === "sent").length,
    totalActive: quotes.filter((q) => q.status === "draft" || q.status === "sent").reduce((s, q) => s + q.total, 0),
    acceptanceRate: quotes.length > 0 ? Math.round((quotes.filter((q) => q.status === "accepted").length / quotes.length) * 100) : 0,
  };

  const formatAmount = (n: number) => `$${n.toLocaleString("fr-FR", { minimumFractionDigits: 0 })}`;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + DESIGN_TOKENS.spacing.sm,
          paddingHorizontal: DESIGN_TOKENS.spacing.lg,
          paddingBottom: DESIGN_TOKENS.spacing.md,
          flexDirection: "row", alignItems: "center", gap: 12,
          borderBottomWidth: 1, borderBottomColor: colors.border,
        }}
      >
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={{ flex: 1, fontSize: 18, fontWeight: "700", color: colors.text }}>
          {t("quotes.title") ?? "📄 Devis"}
        </Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : error ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 24 }}>
          <Text style={{ color: colors.error, textAlign: "center", marginBottom: 16 }}>{error}</Text>
          <Pressable onPress={load} style={{ backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24 }}>
            <Text style={{ color: "#fff", fontWeight: "600" }}>{t("common.retry") ?? "Réessayer"}</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}>
          {/* Stats */}
          <View style={{ flexDirection: "row", gap: 10, padding: DESIGN_TOKENS.spacing.lg, paddingBottom: DESIGN_TOKENS.spacing.sm }}>
            {[
              { label: t("quotes.statsActive") ?? "En cours", value: String(stats.active), accent: colors.primary },
              { label: t("quotes.statsTotal") ?? "Montant total", value: formatAmount(stats.totalActive), accent: "#38A169" },
              { label: t("quotes.statsAcceptance") ?? "Taux acceptation", value: `${stats.acceptanceRate}%`, accent: "#D69E2E" },
            ].map((s) => (
              <View
                key={s.label}
                style={{
                  flex: 1, backgroundColor: colors.backgroundSecondary, borderRadius: DESIGN_TOKENS.radius.lg,
                  padding: DESIGN_TOKENS.spacing.md, alignItems: "center", borderWidth: 1, borderColor: colors.border,
                }}
              >
                <Text style={{ fontSize: 20, fontWeight: "800", color: s.accent }}>{s.value}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 3, textAlign: "center" }}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* Filter tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: DESIGN_TOKENS.spacing.lg, gap: 8, paddingBottom: DESIGN_TOKENS.spacing.sm }}
          >
            {(["all", "active", "accepted", "archived"] as FilterTab[]).map((tab) => {
              const labels: Record<FilterTab, string> = {
                all: t("quotes.filterAll") ?? "Tous",
                active: t("quotes.filterActive") ?? "En cours",
                accepted: t("quotes.filterAccepted") ?? "Acceptés",
                archived: t("quotes.filterArchived") ?? "Archivés",
              };
              return (
                <Pressable
                  key={tab}
                  onPress={() => setFilterTab(tab)}
                  style={{
                    paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20,
                    backgroundColor: filterTab === tab ? colors.primary : colors.backgroundSecondary,
                    borderWidth: 1, borderColor: filterTab === tab ? colors.primary : colors.border,
                  }}
                >
                  <Text style={{ color: filterTab === tab ? "#fff" : colors.text, fontWeight: "600", fontSize: 13 }}>
                    {labels[tab]}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Quotes list */}
          <View style={{ paddingHorizontal: DESIGN_TOKENS.spacing.lg }}>
            {filtered.length === 0 ? (
              <View style={{ alignItems: "center", paddingTop: 40 }}>
                <Ionicons name="document-outline" size={40} color={colors.textSecondary} />
                <Text style={{ color: colors.textSecondary, marginTop: 10, fontSize: 14 }}>
                  {t("quotes.empty") ?? "Aucun devis"}
                </Text>
              </View>
            ) : (
              filtered.map((quote) => {
                const sc = STATUS_CONFIG[quote.status] ?? { label: quote.status, color: "#718096" };
                return (
                  <Pressable
                    key={quote.id}
                    onPress={() => navigation.navigate("QuoteEditor", { quoteId: quote.id })}
                    style={({ pressed }) => ({
                      backgroundColor: pressed ? colors.backgroundTertiary : colors.backgroundSecondary,
                      borderRadius: DESIGN_TOKENS.radius.lg,
                      padding: DESIGN_TOKENS.spacing.md,
                      marginBottom: DESIGN_TOKENS.spacing.sm,
                      borderWidth: 1, borderColor: colors.border,
                    })}
                  >
                    <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontWeight: "700", color: colors.text, fontSize: 15 }} numberOfLines={1}>
                          {quote.title}
                        </Text>
                        <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
                          {quote.quote_number}
                          {quote.client_name ? ` · ${quote.client_name}` : ""}
                        </Text>
                        {quote.valid_until && (
                          <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 2 }}>
                            {t("quotes.validUntil") ?? "Valide jusqu'au"} {quote.valid_until}
                          </Text>
                        )}
                      </View>
                      <View style={{ alignItems: "flex-end", gap: 4 }}>
                        <Text style={{ fontWeight: "800", color: colors.text, fontSize: 16 }}>
                          {formatAmount(quote.total)}
                        </Text>
                        <View style={{ backgroundColor: sc.color + "20", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                          <Text style={{ color: sc.color, fontSize: 11, fontWeight: "700" }}>{sc.label}</Text>
                        </View>
                      </View>
                    </View>
                  </Pressable>
                );
              })
            )}
          </View>
        </ScrollView>
      )}

      {/* FAB */}
      <View style={{ position: "absolute", bottom: insets.bottom + DESIGN_TOKENS.spacing.lg, right: DESIGN_TOKENS.spacing.lg }}>
        <Pressable
          onPress={() => navigation.navigate("QuoteEditor")}
          style={({ pressed }) => ({
            backgroundColor: pressed ? colors.primary + "cc" : colors.primary,
            width: 56, height: 56, borderRadius: 28,
            justifyContent: "center", alignItems: "center",
            shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 8,
          })}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}
