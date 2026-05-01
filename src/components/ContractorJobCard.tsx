import React, { useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

export type ContractorAssignment = {
  id: number;
  jobId: number;
  status: "pending" | "accepted" | "declined" | "completed";
  roleLabel?: string;
  rateType: "hourly" | "flat" | "daily";
  rateAmount: number;
  jobDate?: string;
  jobAddress?: string;
  companyName?: string;
};

interface ContractorJobCardProps {
  assignment: ContractorAssignment;
  onAccept: (id: number) => Promise<void>;
  onDecline: (id: number) => Promise<void>;
  onViewJob?: (jobId: number) => void;
}

function formatRate(rateAmount: number, rateType: "hourly" | "flat" | "daily"): string {
  const suffix: Record<string, string> = {
    hourly: "/hr",
    daily: "/day",
    flat: " flat",
  };
  return `$${rateAmount.toFixed(2)}${suffix[rateType]}`;
}

function formatDate(dateString: string): string {
  try {
    return new Date(dateString).toLocaleDateString("en-AU", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  } catch {
    return dateString;
  }
}

export const ContractorJobCard: React.FC<ContractorJobCardProps> = ({
  assignment,
  onAccept,
  onDecline,
  onViewJob,
}) => {
  const [loadingAccept, setLoadingAccept] = useState(false);
  const [loadingDecline, setLoadingDecline] = useState(false);
  const isActionDisabled = loadingAccept || loadingDecline;

  const handleAccept = async () => {
    if (isActionDisabled) return;
    setLoadingAccept(true);
    try {
      await onAccept(assignment.id);
    } finally {
      setLoadingAccept(false);
    }
  };

  const handleDecline = async () => {
    if (isActionDisabled) return;
    setLoadingDecline(true);
    try {
      await onDecline(assignment.id);
    } finally {
      setLoadingDecline(false);
    }
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.companyName} numberOfLines={1}>
          {assignment.companyName ?? "—"}
        </Text>
        {assignment.jobDate ? (
          <Text style={styles.dateText}>{formatDate(assignment.jobDate)}</Text>
        ) : null}
      </View>

      {/* Body */}
      <View style={styles.body}>
        {assignment.jobAddress ? (
          <Text style={styles.bodyText} numberOfLines={2}>
            📍 {assignment.jobAddress}
          </Text>
        ) : null}
        {assignment.roleLabel ? (
          <Text style={styles.bodyText}>🔧 {assignment.roleLabel}</Text>
        ) : null}
        <Text style={styles.rateText}>
          {formatRate(assignment.rateAmount, assignment.rateType)}
        </Text>
      </View>

      {/* Footer */}
      {assignment.status === "pending" && (
        <View style={styles.footer}>
          <Pressable
            onPress={handleDecline}
            disabled={isActionDisabled}
            style={({ pressed }) => [
              styles.btn,
              styles.btnDecline,
              pressed && styles.btnPressed,
              isActionDisabled && styles.btnDisabled,
            ]}
            accessibilityLabel="Decline job"
          >
            {loadingDecline ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.btnText}>✗ Decline</Text>
            )}
          </Pressable>

          <Pressable
            onPress={handleAccept}
            disabled={isActionDisabled}
            style={({ pressed }) => [
              styles.btn,
              styles.btnAccept,
              pressed && styles.btnPressed,
              isActionDisabled && styles.btnDisabled,
            ]}
            accessibilityLabel="Accept job"
          >
            {loadingAccept ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.btnText}>✓ Accept</Text>
            )}
          </Pressable>
        </View>
      )}

      {assignment.status === "accepted" && (
        <View style={styles.footer}>
          <View style={[styles.statusBadge, styles.statusAccepted]}>
            <Text style={styles.statusText}>Accepted</Text>
          </View>
          {onViewJob ? (
            <Pressable
              onPress={() => onViewJob(assignment.jobId)}
              style={({ pressed }) => [
                styles.btn,
                styles.btnViewJob,
                pressed && styles.btnPressed,
              ]}
              accessibilityLabel="View job details"
            >
              <Text style={styles.btnText}>View Job</Text>
            </Pressable>
          ) : null}
        </View>
      )}

      {assignment.status === "declined" && (
        <View style={styles.footer}>
          <View style={[styles.statusBadge, styles.statusDeclined]}>
            <Text style={styles.statusText}>Declined</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#E8E8E8",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  companyName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    flex: 1,
    marginRight: 8,
  },
  dateText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4B5563",
  },
  body: {
    gap: 4,
    marginBottom: 14,
  },
  bodyText: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
  },
  rateText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginTop: 4,
  },
  footer: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  btn: {
    flex: 1,
    minHeight: 48,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  btnAccept: {
    backgroundColor: "#2D6A4F",
  },
  btnDecline: {
    backgroundColor: "#B5451B",
  },
  btnViewJob: {
    backgroundColor: "#1E3A5F",
  },
  btnPressed: {
    opacity: 0.75,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  statusBadge: {
    borderRadius: 99,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  statusAccepted: {
    backgroundColor: "#2D6A4F",
  },
  statusDeclined: {
    backgroundColor: "#9CA3AF",
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
});
