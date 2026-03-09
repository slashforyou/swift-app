/**
 * ResourceSelector
 *
 * Section 5 du TransferJobModal.
 * Permet à la compagnie A de :
 *   - choisir un camion préféré dans le catalogue public du partenaire B
 *   - spécifier le nombre de chauffeurs et d'offsiders requis
 *   - ajouter une note optionnelle sur les ressources
 */
import Ionicons from "@react-native-vector-icons/ionicons";
import React from "react";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { DESIGN_TOKENS } from "../../../constants/Styles";
import type { PublicTruck } from "../../../types/jobTransfer";

// ─────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────

interface ResourceSelectorProps {
  trucks: PublicTruck[];
  trucksLoading: boolean;
  preferredTruckId: number | null;
  onTruckSelect: (id: number | null) => void;
  requestedDrivers: number;
  onDriversChange: (n: number) => void;
  requestedOffsiders: number;
  onOffsidersChange: (n: number) => void;
  resourceNote: string;
  onNoteChange: (s: string) => void;
  colors: any;
}

// ─────────────────────────────────────────────────────────────
// Composant stepper inline
// ─────────────────────────────────────────────────────────────

const Stepper: React.FC<{
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (n: number) => void;
  colors: any;
}> = ({ label, value, min = 0, max = 10, onChange, colors }) => (
  <View style={{ flex: 1, alignItems: "center", gap: 4 }}>
    <Text
      style={{
        color: colors.textSecondary,
        fontSize: 11,
        fontWeight: "600",
        letterSpacing: 0.5,
      }}
    >
      {label}
    </Text>
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: DESIGN_TOKENS.radius.md,
        overflow: "hidden",
      }}
    >
      <Pressable
        onPress={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        style={({ pressed }) => ({
          width: 40,
          height: 40,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: pressed ? colors.border : "transparent",
          opacity: value <= min ? 0.3 : 1,
        })}
      >
        <Ionicons name="remove" size={18} color={colors.text} />
      </Pressable>
      <View
        style={{
          width: 36,
          height: 40,
          alignItems: "center",
          justifyContent: "center",
          borderLeftWidth: 1,
          borderRightWidth: 1,
          borderColor: colors.border,
        }}
      >
        <Text style={{ color: colors.text, fontSize: 16, fontWeight: "700" }}>
          {value}
        </Text>
      </View>
      <Pressable
        onPress={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        style={({ pressed }) => ({
          width: 40,
          height: 40,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: pressed ? colors.border : "transparent",
          opacity: value >= max ? 0.3 : 1,
        })}
      >
        <Ionicons name="add" size={18} color={colors.text} />
      </Pressable>
    </View>
  </View>
);

// ─────────────────────────────────────────────────────────────
// ResourceSelector
// ─────────────────────────────────────────────────────────────

const ResourceSelector: React.FC<ResourceSelectorProps> = ({
  trucks,
  trucksLoading,
  preferredTruckId,
  onTruckSelect,
  requestedDrivers,
  onDriversChange,
  requestedOffsiders,
  onOffsidersChange,
  resourceNote,
  onNoteChange,
  colors,
}) => {
  const styles = StyleSheet.create({
    truckChip: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: DESIGN_TOKENS.radius.md,
      borderWidth: 1.5,
      marginRight: DESIGN_TOKENS.spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    truckName: {
      fontSize: 13,
      fontWeight: "600",
    },
    truckPlate: {
      fontSize: 11,
      fontWeight: "500",
    },
    noteInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: DESIGN_TOKENS.radius.md,
      padding: DESIGN_TOKENS.spacing.md,
      color: colors.text,
      backgroundColor: colors.backgroundSecondary,
      minHeight: 56,
      textAlignVertical: "top",
      fontSize: 13,
      marginTop: DESIGN_TOKENS.spacing.sm,
    },
  });

  return (
    <View>
      {/* ── Camion préféré ── */}
      <Text
        style={{
          color: colors.textSecondary,
          fontSize: 12,
          fontWeight: "600",
          marginBottom: DESIGN_TOKENS.spacing.sm,
        }}
      >
        Camion préféré
      </Text>

      {trucksLoading ? (
        <ActivityIndicator
          size="small"
          color={colors.primary}
          style={{
            alignSelf: "flex-start",
            marginBottom: DESIGN_TOKENS.spacing.sm,
          }}
        />
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: DESIGN_TOKENS.spacing.md }}
          contentContainerStyle={{ paddingBottom: 2 }}
        >
          {/* Option "Au choix du partenaire" */}
          <Pressable
            onPress={() => onTruckSelect(null)}
            style={({ pressed }) => [
              styles.truckChip,
              {
                borderColor:
                  preferredTruckId === null ? colors.primary : colors.border,
                backgroundColor:
                  preferredTruckId === null
                    ? colors.primary + "18"
                    : colors.backgroundSecondary,
                opacity: pressed ? 0.75 : 1,
              },
            ]}
          >
            <Ionicons
              name="shuffle-outline"
              size={14}
              color={
                preferredTruckId === null
                  ? colors.primary
                  : colors.textSecondary
              }
            />
            <Text
              style={[
                styles.truckName,
                {
                  color:
                    preferredTruckId === null
                      ? colors.primary
                      : colors.textSecondary,
                },
              ]}
            >
              Au choix du partenaire
            </Text>
          </Pressable>

          {/* Camions publics */}
          {trucks.map((truck) => {
            const active = preferredTruckId === truck.id;
            return (
              <Pressable
                key={truck.id}
                onPress={() => onTruckSelect(active ? null : truck.id)}
                style={({ pressed }) => [
                  styles.truckChip,
                  {
                    borderColor: active ? colors.primary : colors.border,
                    backgroundColor: active
                      ? colors.primary + "18"
                      : colors.backgroundSecondary,
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}
              >
                <Ionicons
                  name="car-sport-outline"
                  size={14}
                  color={active ? colors.primary : colors.textSecondary}
                />
                <View>
                  <Text
                    style={[
                      styles.truckName,
                      { color: active ? colors.primary : colors.text },
                    ]}
                  >
                    {truck.name}
                  </Text>
                  {truck.license_plate ? (
                    <Text
                      style={[
                        styles.truckPlate,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {truck.license_plate}
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {/* ── Équipe ── */}
      <Text
        style={{
          color: colors.textSecondary,
          fontSize: 12,
          fontWeight: "600",
          marginBottom: DESIGN_TOKENS.spacing.sm,
        }}
      >
        Équipe requise
      </Text>
      <View
        style={{
          flexDirection: "row",
          gap: DESIGN_TOKENS.spacing.md,
          marginBottom: DESIGN_TOKENS.spacing.md,
        }}
      >
        <Stepper
          label="Chauffeurs"
          value={requestedDrivers}
          min={0}
          max={5}
          onChange={onDriversChange}
          colors={colors}
        />
        <Stepper
          label="Offsiders"
          value={requestedOffsiders}
          min={0}
          max={5}
          onChange={onOffsidersChange}
          colors={colors}
        />
      </View>

      {/* ── Note ressources ── */}
      <Pressable onPress={() => {}} accessible={false}>
        <TextInput
          style={styles.noteInput}
          value={resourceNote}
          onChangeText={onNoteChange}
          placeholder="Note sur les ressources (optionnel)..."
          placeholderTextColor={colors.textSecondary}
          multiline
          maxLength={300}
        />
      </Pressable>
    </View>
  );
};

export default ResourceSelector;
