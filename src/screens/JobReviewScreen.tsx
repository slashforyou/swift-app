import Ionicons from "@react-native-vector-icons/ionicons";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    Text,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ServerData } from "../constants/ServerData";
import { DESIGN_TOKENS } from "../constants/Styles";
import { useTheme } from "../context/ThemeProvider";
import { useLocalization } from "../localization/useLocalization";
import { authenticatedFetch } from "../utils/auth";

const API = ServerData.serverUrl;

interface ReviewRequest {
  id: number;
  status: "pending" | "submitted";
  requested_at: string;
  stars?: number;
  comment?: string;
  submitted_at?: string;
}

interface Props {
  route: any;
  navigation: any;
}

function StarRow({ value }: { value: number }) {
  return (
    <View style={{ flexDirection: "row", gap: 4 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Ionicons key={s} name={s <= value ? "star" : "star-outline"} size={22} color={s <= value ? "#F6AD55" : "#CBD5E0"} />
      ))}
    </View>
  );
}

export default function JobReviewScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t } = useLocalization();
  const jobId: number = route?.params?.jobId;

  const [review, setReview] = useState<ReviewRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      setNotFound(false);
      const res = await authenticatedFetch(`${API}v1/jobs/${jobId}/review-request`);
      if (res.status === 404) {
        setNotFound(true);
        setReview(null);
      } else if (!res.ok) {
        throw new Error("API error");
      } else {
        const json = await res.json();
        setReview(json);
      }
    } catch {
      setError(t("common.loadError") ?? "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => { load(); }, [load]);

  const handleRequest = async () => {
    setSending(true);
    try {
      const res = await authenticatedFetch(`${API}v1/jobs/${jobId}/review-request`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error();
      const json = await res.json();
      setReview(json);
      setNotFound(false);
      Alert.alert(
        t("review.sentTitle") ?? "Demande envoyée",
        t("review.sentMessage") ?? "Le client recevra un lien pour noter le job",
      );
    } catch {
      Alert.alert(t("common.error") ?? "Erreur", t("review.sendError") ?? "Impossible d'envoyer");
    } finally {
      setSending(false);
    }
  };

  const handleResend = async () => {
    setSending(true);
    try {
      const res = await authenticatedFetch(`${API}v1/jobs/${jobId}/review-request/resend`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error();
      Alert.alert(
        t("review.resentTitle") ?? "Lien renvoyé",
        t("review.resentMessage") ?? "Le client a reçu un nouveau lien",
      );
    } catch {
      Alert.alert(t("common.error") ?? "Erreur", t("review.sendError") ?? "Impossible d'envoyer");
    } finally {
      setSending(false);
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
          {t("review.title") ?? "⭐ Avis client"}
        </Text>
      </View>

      <View style={{ flex: 1, padding: DESIGN_TOKENS.spacing.lg, justifyContent: "center", alignItems: "center" }}>
        {loading ? (
          <ActivityIndicator color={colors.primary} size="large" />
        ) : error ? (
          <View style={{ alignItems: "center" }}>
            <Text style={{ color: colors.error, textAlign: "center", marginBottom: 16 }}>{error}</Text>
            <Pressable onPress={load} style={{ backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24 }}>
              <Text style={{ color: "#fff", fontWeight: "600" }}>{t("common.retry") ?? "Réessayer"}</Text>
            </Pressable>
          </View>
        ) : review?.status === "submitted" ? (
          /* Review submitted — show result */
          <View style={{ width: "100%", alignItems: "center" }}>
            <View
              style={{
                backgroundColor: colors.backgroundSecondary,
                borderRadius: DESIGN_TOKENS.radius.xl ?? 20,
                padding: DESIGN_TOKENS.spacing.xl ?? DESIGN_TOKENS.spacing.lg,
                alignItems: "center",
                borderWidth: 1, borderColor: colors.border,
                width: "100%", marginBottom: 24,
              }}
            >
              <View style={{ backgroundColor: "#38A16920", borderRadius: 40, padding: 14, marginBottom: 12 }}>
                <Ionicons name="checkmark-circle" size={40} color="#38A169" />
              </View>
              <Text style={{ fontSize: 17, fontWeight: "700", color: colors.text, marginBottom: 12 }}>
                {t("review.submitted") ?? "Avis reçu !"}
              </Text>
              {review.stars !== undefined && (
                <View style={{ marginBottom: 10 }}>
                  <StarRow value={review.stars} />
                </View>
              )}
              {review.comment && (
                <Text style={{ color: colors.textSecondary, fontSize: 14, textAlign: "center", fontStyle: "italic" }}>
                  "{review.comment}"
                </Text>
              )}
              {review.submitted_at && (
                <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 10 }}>
                  {review.submitted_at.split("T")[0]}
                </Text>
              )}
            </View>
          </View>
        ) : review?.status === "pending" ? (
          /* Review requested but pending */
          <View style={{ width: "100%", alignItems: "center" }}>
            <View
              style={{
                backgroundColor: colors.backgroundSecondary,
                borderRadius: DESIGN_TOKENS.radius.xl ?? 20,
                padding: DESIGN_TOKENS.spacing.xl ?? DESIGN_TOKENS.spacing.lg,
                alignItems: "center",
                borderWidth: 1, borderColor: colors.border,
                width: "100%", marginBottom: 24,
              }}
            >
              <View style={{ backgroundColor: "#D69E2E20", borderRadius: 40, padding: 14, marginBottom: 12 }}>
                <Ionicons name="time-outline" size={40} color="#D69E2E" />
              </View>
              <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: 6 }}>
                {t("review.pendingTitle") ?? "En attente de réponse"}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                {t("review.requestedAt") ?? "Demandé le"} {review.requested_at.split("T")[0]}
              </Text>
            </View>
            <Pressable
              onPress={handleResend}
              disabled={sending}
              style={({ pressed }) => ({
                backgroundColor: pressed ? colors.primary + "cc" : colors.primary,
                borderRadius: 16, paddingVertical: 16, paddingHorizontal: 32,
                flexDirection: "row", alignItems: "center", gap: 10,
                width: "100%", justifyContent: "center",
              })}
            >
              {sending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="send" size={20} color="#fff" />
                  <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
                    {t("review.resend") ?? "Renvoyer le lien"}
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        ) : (
          /* No review yet */
          <View style={{ width: "100%", alignItems: "center" }}>
            <View
              style={{
                backgroundColor: colors.backgroundSecondary,
                borderRadius: DESIGN_TOKENS.radius.xl ?? 20,
                padding: DESIGN_TOKENS.spacing.xl ?? DESIGN_TOKENS.spacing.lg,
                alignItems: "center",
                borderWidth: 1, borderColor: colors.border,
                width: "100%", marginBottom: 32,
              }}
            >
              <Ionicons name="star-outline" size={56} color={colors.textSecondary} style={{ marginBottom: 12 }} />
              <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: 6 }}>
                {t("review.noReviewTitle") ?? "Aucun avis demandé"}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 13, textAlign: "center" }}>
                {t("review.noReviewSubtitle") ?? "Demandez au client de noter ce job"}
              </Text>
            </View>
            <Pressable
              onPress={handleRequest}
              disabled={sending}
              style={({ pressed }) => ({
                backgroundColor: pressed ? colors.primary + "cc" : colors.primary,
                borderRadius: 16, paddingVertical: 18, paddingHorizontal: 32,
                flexDirection: "row", alignItems: "center", gap: 10,
                width: "100%", justifyContent: "center",
                shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
              })}
            >
              {sending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="star" size={22} color="#fff" />
                  <Text style={{ color: "#fff", fontWeight: "700", fontSize: 17 }}>
                    {t("review.requestButton") ?? "Demander un avis"}
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}
