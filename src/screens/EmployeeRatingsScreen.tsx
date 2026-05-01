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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DESIGN_TOKENS } from "../constants/Styles";
import { useTheme } from "../context/ThemeProvider";
import { useLocalization } from "../localization/useLocalization";
import {
    createEmployeeRating,
    EmployeeRating,
    getEmployeeRatings,
    getRatingsSummary,
    RatingsSummary,
} from "../services/employeeRatingsService";

interface Props {
  route: any;
  navigation: any;
}

function StarRow({ value, size = 20, onSelect }: { value: number; size?: number; onSelect?: (v: number) => void }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: "row", gap: 4 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Pressable key={s} onPress={() => onSelect?.(s)} hitSlop={4} disabled={!onSelect}>
          <Ionicons name={s <= value ? "star" : "star-outline"} size={size} color={s <= value ? "#F6AD55" : colors.border} />
        </Pressable>
      ))}
    </View>
  );
}

export default function EmployeeRatingsScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t } = useLocalization();
  const userId: number = route?.params?.userId;

  const [ratings, setRatings] = useState<EmployeeRating[]>([]);
  const [summary, setSummary] = useState<RatingsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add modal
  const [showAdd, setShowAdd] = useState(false);
  const [newStars, setNewStars] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [newJobId, setNewJobId] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const [r, s] = await Promise.all([
        getEmployeeRatings(userId),
        getRatingsSummary(userId),
      ]);
      setRatings(r);
      setSummary(s);
    } catch {
      setError(t("common.loadError") ?? "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    setSaving(true);
    try {
      const created = await createEmployeeRating(userId, {
        stars: newStars,
        comment: newComment.trim() || undefined,
        job_id: newJobId.trim() ? parseInt(newJobId, 10) : undefined,
      });
      setRatings((prev) => [created, ...prev]);
      setSummary((prev) => prev ? {
        ...prev,
        total_ratings: prev.total_ratings + 1,
        average_stars: ((prev.average_stars * prev.total_ratings) + newStars) / (prev.total_ratings + 1),
      } : prev);
      setShowAdd(false);
      setNewStars(5);
      setNewComment("");
      setNewJobId("");
    } catch {
      Alert.alert(t("common.error") ?? "Erreur", t("ratings.saveError") ?? "Impossible d'enregistrer");
    } finally {
      setSaving(false);
    }
  };

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
          {t("ratings.title") ?? "⭐ Évaluations"}
        </Text>
        <Pressable
          onPress={() => setShowAdd(true)}
          style={{ backgroundColor: colors.primary, borderRadius: 10, padding: 8 }}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </Pressable>
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
        <ScrollView contentContainerStyle={{ padding: DESIGN_TOKENS.spacing.lg, paddingBottom: insets.bottom + 24 }}>
          {/* Summary */}
          <View
            style={{
              backgroundColor: colors.backgroundSecondary,
              borderRadius: DESIGN_TOKENS.radius.xl ?? 20,
              padding: DESIGN_TOKENS.spacing.xl ?? DESIGN_TOKENS.spacing.lg,
              alignItems: "center",
              borderWidth: 1, borderColor: colors.border,
              marginBottom: 20,
            }}
          >
            <Text style={{ fontSize: 64, fontWeight: "900", color: "#F6AD55" }}>
              {summary ? summary.average_stars.toFixed(1) : "—"}
            </Text>
            <StarRow value={summary ? Math.round(summary.average_stars) : 0} size={28} />
            <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 8 }}>
              {summary?.total_ratings ?? 0} {t("ratings.totalRatings") ?? "évaluations"}
            </Text>

            {/* Distribution */}
            {summary?.distribution && (
              <View style={{ width: "100%", marginTop: 16, gap: 6 }}>
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = summary.distribution.find(d => d.stars === star)?.count ?? 0;
                  const pct = summary.total_ratings > 0 ? count / summary.total_ratings : 0;
                  return (
                    <View key={star} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Text style={{ color: colors.textSecondary, fontSize: 12, width: 10 }}>{star}</Text>
                      <Ionicons name="star" size={12} color="#F6AD55" />
                      <View style={{ flex: 1, height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: "hidden" }}>
                        <View style={{ height: "100%", width: `${Math.round(pct * 100)}%`, backgroundColor: "#F6AD55", borderRadius: 3 }} />
                      </View>
                      <Text style={{ color: colors.textSecondary, fontSize: 11, width: 24, textAlign: "right" }}>{count}</Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {/* Ratings list */}
          {ratings.length === 0 ? (
            <View style={{ alignItems: "center", paddingTop: 20 }}>
              <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
                {t("ratings.empty") ?? "Aucune évaluation"}
              </Text>
            </View>
          ) : (
            ratings.map((r) => (
              <View
                key={r.id}
                style={{
                  backgroundColor: colors.backgroundSecondary,
                  borderRadius: DESIGN_TOKENS.radius.lg,
                  padding: DESIGN_TOKENS.spacing.md,
                  marginBottom: DESIGN_TOKENS.spacing.sm,
                  borderWidth: 1, borderColor: colors.border,
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <StarRow value={r.stars} size={16} />
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                    {r.created_at ? r.created_at.split("T")[0] : ""}
                  </Text>
                </View>
                {r.comment && (
                  <Text style={{ color: colors.text, fontSize: 14, marginBottom: 4 }}>{r.comment}</Text>
                )}
                {r.job_id && (
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                    Job #{r.job_id}
                  </Text>
                )}
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* Add Modal */}
      <Modal visible={showAdd} transparent animationType="slide" onRequestClose={() => setShowAdd(false)}>
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <Pressable style={{ flex: 1 }} onPress={() => setShowAdd(false)} />
          <ScrollView
            style={{ backgroundColor: colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "70%" }}
            contentContainerStyle={{ padding: DESIGN_TOKENS.spacing.lg, paddingBottom: insets.bottom + DESIGN_TOKENS.spacing.lg }}
            keyboardShouldPersistTaps="handled"
          >
            <View style={{ width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: "center", marginBottom: 16 }} />
            <Text style={{ fontSize: 17, fontWeight: "700", color: colors.text, marginBottom: 20 }}>
              {t("ratings.addTitle") ?? "Ajouter une évaluation"}
            </Text>

            <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 8 }}>
              {t("ratings.starsLabel") ?? "Note"}
            </Text>
            <View style={{ marginBottom: 16 }}>
              <StarRow value={newStars} size={36} onSelect={setNewStars} />
            </View>

            <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 4 }}>
              {t("ratings.commentLabel") ?? "Commentaire"}
            </Text>
            <TextInput
              value={newComment}
              onChangeText={setNewComment}
              multiline
              numberOfLines={3}
              placeholderTextColor={colors.textSecondary}
              style={{ backgroundColor: colors.backgroundSecondary, borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 12, color: colors.text, fontSize: 14, marginBottom: 14, minHeight: 70 }}
            />

            <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 4 }}>
              {t("ratings.jobIdLabel") ?? "Job ID (optionnel)"}
            </Text>
            <TextInput
              value={newJobId}
              onChangeText={setNewJobId}
              keyboardType="numeric"
              placeholderTextColor={colors.textSecondary}
              style={{ backgroundColor: colors.backgroundSecondary, borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 12, color: colors.text, fontSize: 14, marginBottom: 20 }}
            />

            <Pressable
              onPress={handleAdd}
              disabled={saving}
              style={{ backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 14, alignItems: "center" }}
            >
              {saving ? <ActivityIndicator color="#fff" /> : (
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
                  {t("common.save") ?? "Enregistrer"}
                </Text>
              )}
            </Pressable>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
