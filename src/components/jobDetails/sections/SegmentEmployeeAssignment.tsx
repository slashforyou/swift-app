/**
 * SegmentEmployeeAssignment — Assignation des employés par segment
 *
 * Permet au patron d'assigner/désassigner des employés à chaque segment
 * du job modulaire. Chaque segment affiche les employés disponibles
 * (assignés au job) avec des chips toggle.
 */

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
import { DESIGN_TOKENS } from "../../../constants/Styles";
import { useTheme } from "../../../context/ThemeProvider";
import {
    assignEmployeesToSegment,
    getJobSegments,
} from "../../../services/jobSegmentApiService";
import { getSegmentColor, getSegmentIcon } from "../../../services/jobSegmentService";
import type { JobSegmentInstance } from "../../../types/jobSegment";

// ============================================================================
// TYPES
// ============================================================================

interface Employee {
  id: string;
  name: string;
  role: string;
  hourlyRate?: number;
}

interface SegmentEmployeeAssignmentProps {
  jobId: string | number;
  /** Employés assignés au job (depuis StaffingSection) */
  jobEmployees: Employee[];
  /** Segments déjà initialisés— si non fournis, fetch depuis l'API */
  initialSegments?: JobSegmentInstance[];
  onDone?: () => void;
}

// ============================================================================
// COMPOSANT
// ============================================================================

const SegmentEmployeeAssignmentScreen: React.FC<SegmentEmployeeAssignmentProps> = ({
  jobId,
  jobEmployees,
  initialSegments,
  onDone,
}) => {
  const { colors } = useTheme();

  const [segments, setSegments] = useState<JobSegmentInstance[]>(initialSegments ?? []);
  const [loading, setLoading] = useState(!initialSegments);
  const [saving, setSaving] = useState(false);

  // Track which employees are assigned to each segment
  // segmentId → Set of employeeIds
  const [assignments, setAssignments] = useState<Record<string, Set<string>>>({});

  // Fetch segments if not provided
  useEffect(() => {
    if (initialSegments) {
      initAssignments(initialSegments);
      return;
    }
    setLoading(true);
    getJobSegments(jobId)
      .then((segs) => {
        setSegments(segs);
        initAssignments(segs);
      })
      .catch((err) => {
        console.error('Failed to load segments:', err);
        Alert.alert('Erreur', 'Impossible de charger les segments.');
      })
      .finally(() => setLoading(false));
  }, [jobId, initialSegments]);

  const initAssignments = (segs: JobSegmentInstance[]) => {
    const map: Record<string, Set<string>> = {};
    for (const seg of segs) {
      map[seg.id] = new Set(
        (seg.assignedEmployees || []).map((e) => e.employeeId),
      );
    }
    setAssignments(map);
  };

  const toggleEmployee = useCallback((segmentId: string, employeeId: string) => {
    setAssignments((prev) => {
      const current = new Set(prev[segmentId] ?? []);
      if (current.has(employeeId)) {
        current.delete(employeeId);
      } else {
        current.add(employeeId);
      }
      return { ...prev, [segmentId]: current };
    });
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      for (const seg of segments) {
        const empIds = assignments[seg.id];
        if (!empIds) continue;

        const employees = Array.from(empIds).map((empId) => {
          const emp = jobEmployees.find((e) => e.id === empId);
          return {
            employeeId: empId,
            role: emp?.role ?? 'mover',
            hourlyRate: emp?.hourlyRate,
          };
        });

        await assignEmployeesToSegment(jobId, seg.id, employees);
      }
      Alert.alert('Succès', 'Les assignations ont été enregistrées.');
      onDone?.();
    } catch (err: any) {
      Alert.alert('Erreur', err.message || 'Échec de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  }, [segments, assignments, jobEmployees, jobId, onDone]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: DESIGN_TOKENS.spacing.lg,
          paddingVertical: DESIGN_TOKENS.spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <Ionicons name="people-outline" size={22} color={colors.primary} />
        <Text
          style={{
            fontSize: 18,
            fontWeight: '700',
            color: colors.text,
            marginLeft: DESIGN_TOKENS.spacing.sm,
            flex: 1,
          }}
        >
          Assignation par segment
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: DESIGN_TOKENS.spacing.lg }}
        showsVerticalScrollIndicator={false}
      >
        {segments.map((seg) => {
          const segColor = getSegmentColor(seg.type);
          const segIcon = getSegmentIcon(seg.type);
          const assignedSet = assignments[seg.id] ?? new Set();

          return (
            <View
              key={seg.id}
              style={{
                marginBottom: DESIGN_TOKENS.spacing.lg,
                backgroundColor: colors.backgroundSecondary,
                borderRadius: DESIGN_TOKENS.radius.lg,
                padding: DESIGN_TOKENS.spacing.md,
                borderLeftWidth: 4,
                borderLeftColor: segColor,
              }}
            >
              {/* Segment header */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: DESIGN_TOKENS.spacing.sm }}>
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: segColor + '20',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: DESIGN_TOKENS.spacing.sm,
                  }}
                >
                  <Ionicons name={segIcon as any} size={18} color={segColor} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text }}>
                    {seg.label}
                  </Text>
                  {seg.locationType && (
                    <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                      {seg.locationType}
                    </Text>
                  )}
                </View>
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                  {assignedSet.size}/{jobEmployees.length}
                </Text>
              </View>

              {/* Employee chips */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {jobEmployees.map((emp) => {
                  const isAssigned = assignedSet.has(emp.id);
                  return (
                    <Pressable
                      key={emp.id}
                      onPress={() => toggleEmployee(seg.id, emp.id)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: 6,
                        paddingHorizontal: 12,
                        borderRadius: 20,
                        backgroundColor: isAssigned ? colors.primary + '15' : colors.background,
                        borderWidth: 1.5,
                        borderColor: isAssigned ? colors.primary : colors.border,
                      }}
                    >
                      <Ionicons
                        name={isAssigned ? 'checkmark-circle' : 'ellipse-outline'}
                        size={18}
                        color={isAssigned ? colors.primary : colors.textSecondary}
                      />
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: isAssigned ? '600' : '400',
                          color: isAssigned ? colors.primary : colors.text,
                          marginLeft: 6,
                        }}
                      >
                        {emp.name}
                      </Text>
                      <Text
                        style={{
                          fontSize: 11,
                          color: colors.textSecondary,
                          marginLeft: 4,
                        }}
                      >
                        {emp.role}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Save button */}
      <View style={{ padding: DESIGN_TOKENS.spacing.lg, borderTopWidth: 1, borderTopColor: colors.border }}>
        <Pressable
          onPress={handleSave}
          disabled={saving}
          style={{
            backgroundColor: colors.primary,
            paddingVertical: 14,
            borderRadius: DESIGN_TOKENS.radius.md,
            alignItems: 'center',
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>
              Confirmer les assignations
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
};

export default SegmentEmployeeAssignmentScreen;
