/**
 * MyAssignmentsScreen — Contractor / Employee
 * Liste des jobs confirmés et à venir + navigation GPS (Linking).
 * #52 — MapView ETA MVP : ouverture native maps sans react-native-maps.
 */
import Ionicons from "@react-native-vector-icons/ionicons";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Linking,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DESIGN_TOKENS } from "../../constants/Styles";
import { useTheme } from "../../context/ThemeProvider";
import { useTranslation } from "../../localization";
import { fetchJobs, JobAPI } from "../../services/jobs";

// ─── Helpers ───────────────────────────────────────────────────

function openMaps(address: { street: string; city: string; state: string; zip: string; latitude?: number; longitude?: number }) {
  const query =
    address.latitude && address.longitude
      ? `${address.latitude},${address.longitude}`
      : encodeURIComponent(`${address.street}, ${address.city} ${address.zip}`);
  Linking.openURL(`https://maps.google.com/?q=${query}`);
}

function formatJobDate(iso: string, t: (key: string) => string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

const STATUS_COLORS: Record<string, string> = {
  accepted: "#22C55E",
  "in-progress": "#3B82F6",
  pending: "#F59E0B",
};

// ─── Job Card ───────────────────────────────────────────────────

interface JobCardProps {
  job: JobAPI;
  navigation?: any;
}

const JobCard = React.memo(function JobCard({ job, navigation }: JobCardProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const pickup = job.addresses?.find((a) => a.type?.toLowerCase().includes("pickup") || a.type?.toLowerCase() === "pickup");
  const delivery = job.addresses?.find((a) => a.type?.toLowerCase().includes("delivery") || a.type?.toLowerCase() === "dropoff");
  const statusColor = STATUS_COLORS[job.status] || colors.textSecondary;
  const clientName = job.client
    ? `${job.client.firstName || ""} ${job.client.lastName || ""}`.trim() || job.client.email
    : null;

  return (
    <Pressable
      onPress={() => navigation?.navigate("JobDetails", { jobId: job.code || job.id })}
      style={({ pressed }) => ({
        backgroundColor: pressed ? colors.backgroundSecondary : colors.background,
        marginHorizontal: DESIGN_TOKENS.spacing.lg,
        marginBottom: DESIGN_TOKENS.spacing.md,
        borderRadius: DESIGN_TOKENS.radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: "hidden",
      })}
    >
      {/* Header: date + status */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: DESIGN_TOKENS.spacing.md,
          paddingVertical: DESIGN_TOKENS.spacing.sm,
          backgroundColor: colors.backgroundSecondary,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
          <Text style={{ fontSize: 13, color: colors.textSecondary }}>
            {formatJobDate(job.time?.startWindowStart, t)}
          </Text>
        </View>
        <View
          style={{
            backgroundColor: statusColor + "22",
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: DESIGN_TOKENS.radius.sm,
          }}
        >
          <Text style={{ fontSize: 11, fontWeight: "700", color: statusColor }}>
            {job.status?.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={{ padding: DESIGN_TOKENS.spacing.md, gap: DESIGN_TOKENS.spacing.sm }}>
        {/* Job code + client */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }}>
            {job.code || `#${job.id}`}
          </Text>
          {clientName ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Ionicons name="person-outline" size={13} color={colors.textSecondary} />
              <Text style={{ fontSize: 13, color: colors.textSecondary }} numberOfLines={1}>
                {clientName}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Contractee (who hired us) */}
        {job.contractee?.company_name && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Ionicons name="business-outline" size={13} color={colors.primary} />
            <Text style={{ fontSize: 12, color: colors.primary, fontWeight: "600" }}>
              {job.contractee.company_name}
            </Text>
          </View>
        )}

        {/* Addresses */}
        {pickup && (
          <AddressRow
            icon="location"
            label={t("myAssignments.pickup")}
            address={pickup}
            color={colors.success}
            colors={colors}
          />
        )}
        {delivery && (
          <AddressRow
            icon="flag"
            label={t("myAssignments.delivery")}
            address={delivery}
            color={colors.error}
            colors={colors}
          />
        )}
        {!pickup && !delivery && job.addresses?.[0] && (
          <AddressRow
            icon="location-outline"
            label={t("myAssignments.location")}
            address={job.addresses[0]}
            color={colors.primary}
            colors={colors}
          />
        )}
      </View>
    </Pressable>
  );
});

interface AddressRowProps {
  icon: string;
  label: string;
  address: { street: string; city: string; state: string; zip: string; latitude?: number; longitude?: number };
  color: string;
  colors: any;
}

const AddressRow = ({ icon, label, address, color, colors }: AddressRowProps) => (
  <View
    style={{
      flexDirection: "row",
      alignItems: "center",
      gap: DESIGN_TOKENS.spacing.sm,
      backgroundColor: color + "0F",
      padding: DESIGN_TOKENS.spacing.sm,
      borderRadius: DESIGN_TOKENS.radius.sm,
      borderLeftWidth: 3,
      borderLeftColor: color,
    }}
  >
    <Ionicons name={icon as any} size={16} color={color} />
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 11, color: color, fontWeight: "700", marginBottom: 2 }}>
        {label}
      </Text>
      <Text style={{ fontSize: 13, color: colors.text }} numberOfLines={2}>
        {address.street}
        {address.city ? `, ${address.city}` : ""}
        {address.state ? ` ${address.state}` : ""}
      </Text>
    </View>
    <Pressable
      onPress={() => openMaps(address)}
      style={({ pressed }) => ({
        backgroundColor: pressed ? color + "30" : color + "18",
        borderRadius: DESIGN_TOKENS.radius.sm,
        padding: 8,
      })}
    >
      <Ionicons name="navigate" size={18} color={color} />
    </Pressable>
  </View>
);

// ─── Screen ────────────────────────────────────────────────────

interface Props {
  navigation?: any;
}

export default function MyAssignmentsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t } = useTranslation();

  const [jobs, setJobs] = useState<JobAPI[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setIsLoading(true);
    try {
      const today = new Date();
      const end = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000); // +30 days
      const all = await fetchJobs(today, end);
      const upcoming = all
        .filter((j) => j.status !== "cancelled" && j.status !== "completed" && j.status !== "declined")
        .sort((a, b) => {
          const ta = a.time?.startWindowStart ? new Date(a.time.startWindowStart).getTime() : 0;
          const tb = b.time?.startWindowStart ? new Date(b.time.startWindowStart).getTime() : 0;
          return ta - tb;
        });
      setJobs(upcoming);
    } catch {
      // Non-blocking
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View
        style={{
          paddingHorizontal: DESIGN_TOKENS.spacing.lg,
          paddingVertical: DESIGN_TOKENS.spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <Text style={{ fontSize: 22, fontWeight: "700", color: colors.text }}>
          {t("myAssignments.title")}
        </Text>
        <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>
          {t("myAssignments.subtitle")}
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : jobs.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="checkmark-done-outline" size={48} color={colors.textSecondary} />
          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text, marginTop: 12 }}>
            {t("myAssignments.noJobs")}
          </Text>
          <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4, textAlign: "center" }}>
            {t("myAssignments.noJobsHint")}
          </Text>
        </View>
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <JobCard job={item} navigation={navigation} />}
          contentContainerStyle={{ paddingTop: DESIGN_TOKENS.spacing.lg, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: DESIGN_TOKENS.spacing.xl,
    gap: DESIGN_TOKENS.spacing.sm,
  },
});

