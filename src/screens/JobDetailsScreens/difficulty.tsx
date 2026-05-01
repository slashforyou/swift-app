import Ionicons from "@react-native-vector-icons/ionicons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import HeaderLogo from "../../components/ui/HeaderLogo";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    Text,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ServerData } from "../../constants/ServerData";
import { DESIGN_TOKENS } from "../../constants/Styles";
import { useTheme } from "../../context/ThemeProvider";
import { useLocalization } from "../../localization/useLocalization";
import { authenticatedFetch } from "../../utils/auth";

const API = ServerData.serverUrl;

interface DifficultyOption {
  id: string;
  label: string;
  emoji: string;
  color: string;
}

interface Props {
  route?: any;
  navigation: any;
  jobId?: number;
}

export default function JobDifficultyScreen({ route, navigation, jobId: propJobId }: Props) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t } = useLocalization();
  const jobId: number = route?.params?.jobId ?? propJobId;

  const DIFFICULTIES = useMemo<DifficultyOption[]>(() => [
    { id: "easy", label: t("difficulty.easy") || "Easy", emoji: "😊", color: "#38A169" },
    { id: "medium", label: t("difficulty.medium") || "Medium", emoji: "💪", color: "#D69E2E" },
    { id: "hard", label: t("difficulty.hard") || "Hard", emoji: "🔥", color: "#E53E3E" },
    { id: "expert", label: t("difficulty.expert") || "Expert", emoji: "⚡", color: "#805AD5" },
  ], [t]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("medium");
  const [truckCount, setTruckCount] = useState(1);

  const load = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const res = await authenticatedFetch(`${API}v1/jobs/${jobId}`);
      if (res.ok) {
        const data = await res.json();
        const job = data.job ?? data;
        if (job.difficulty) setSelectedDifficulty(job.difficulty);
        if (job.truck_count) setTruckCount(job.truck_count);
      }
    } catch {
      // Non-blocking: show defaults
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await authenticatedFetch(`${API}v1/jobs/${jobId}`, {
        method: "PATCH",
        body: JSON.stringify({ difficulty: selectedDifficulty, truck_count: truckCount }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      Alert.alert(
        t("common.saved") ?? "Enregistré",
        t("difficulty.saveSuccess") ?? "Difficulté mise à jour",
        [{ text: "OK", onPress: () => navigation.goBack() }],
      );
    } catch {
      Alert.alert(t("common.error") ?? "Erreur", t("difficulty.saveError") ?? "Impossible d'enregistrer");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Logo */}
      <View style={{ alignItems: "center", paddingTop: insets.top }}>
        <HeaderLogo preset="sm" variant="rectangle" marginVertical={0} />
      </View>
      {/* Header */}
      <View
        style={{
          paddingTop: DESIGN_TOKENS.spacing.sm,
          paddingHorizontal: DESIGN_TOKENS.spacing.lg,
          paddingBottom: DESIGN_TOKENS.spacing.md,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={{ flex: 1, fontSize: 18, fontWeight: "700", color: colors.text }}>
          {t("difficulty.title") ?? "📋 Difficulté / Camions"}
        </Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{
            padding: DESIGN_TOKENS.spacing.lg,
            paddingBottom: insets.bottom + 100,
          }}
        >
          {/* Difficulté */}
          <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: 16 }}>
            {t("difficulty.sectionLabel") ?? "Niveau de difficulté"}
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 32 }}>
            {DIFFICULTIES.map((d) => {
              const isSelected = selectedDifficulty === d.id;
              return (
                <Pressable
                  key={d.id}
                  onPress={() => setSelectedDifficulty(d.id)}
                  style={({ pressed }) => ({
                    flex: 1,
                    minWidth: "44%",
                    backgroundColor: isSelected ? d.color + "20" : colors.backgroundSecondary,
                    borderRadius: DESIGN_TOKENS.radius.lg,
                    padding: 16,
                    alignItems: "center",
                    borderWidth: 2,
                    borderColor: isSelected ? d.color : colors.border,
                    opacity: pressed ? 0.8 : 1,
                  })}
                >
                  <Text style={{ fontSize: 28, marginBottom: 6 }}>{d.emoji}</Text>
                  <Text style={{ fontWeight: "700", fontSize: 15, color: isSelected ? d.color : colors.text }}>
                    {d.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Nombre de camions */}
          <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: 16 }}>
            {t("difficulty.truckCountLabel") ?? "Nombre de camions"}
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 24,
              backgroundColor: colors.backgroundSecondary,
              borderRadius: DESIGN_TOKENS.radius.lg,
              padding: 20,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Pressable
              onPress={() => setTruckCount((v) => Math.max(1, v - 1))}
              style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                backgroundColor: colors.primary + "20",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Ionicons name="remove" size={26} color={colors.primary} />
            </Pressable>
            <View style={{ alignItems: "center" }}>
              <Text style={{ fontSize: 40, fontWeight: "800", color: colors.text }}>{truckCount}</Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                {truckCount === 1
                  ? (t("difficulty.truck") ?? "camion")
                  : (t("difficulty.trucks") ?? "camions")}
              </Text>
            </View>
            <Pressable
              onPress={() => setTruckCount((v) => Math.min(5, v + 1))}
              style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                backgroundColor: colors.primary + "20",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Ionicons name="add" size={26} color={colors.primary} />
            </Pressable>
          </View>
        </ScrollView>
      )}

      {/* Bouton Enregistrer */}
      <View
        style={{
          position: "absolute",
          bottom: insets.bottom + DESIGN_TOKENS.spacing.lg,
          left: DESIGN_TOKENS.spacing.lg,
          right: DESIGN_TOKENS.spacing.lg,
        }}
      >
        <Pressable
          onPress={handleSave}
          disabled={saving}
          style={({ pressed }) => ({
            backgroundColor: pressed ? colors.primary + "cc" : colors.primary,
            borderRadius: 14,
            paddingVertical: 16,
            alignItems: "center",
          })}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 17 }}>
              {t("common.save") ?? "Enregistrer"}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}
