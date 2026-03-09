/**
 * CompanyCodeInput
 *
 * Champ de saisie du code entreprise (8 chars A-Z0-9).
 * Déclenche un lookup automatique dès que 8 caractères sont saisis.
 * Réutilisable dans TransferJobModal et RelationsScreen.
 */
import Ionicons from "@react-native-vector-icons/ionicons";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { DESIGN_TOKENS } from "../../../constants/Styles";
import { useTheme } from "../../../context/ThemeProvider";
import { lookupCompanyByCode } from "../../../services/companyRelations";
import type { CompanyLookupResult } from "../../../types/jobTransfer";

interface CompanyCodeInputProps {
  /** Appelé quand une entreprise a été trouvée et sélectionnée */
  onSelect: (result: CompanyLookupResult) => void;
  /** Réinitialise la sélection */
  onClear?: () => void;
  /** Valeur initiale (ex: pour pré-remplir depuis un lien) */
  initialCode?: string;
}

const CODE_LENGTH = 8;

const CompanyCodeInput: React.FC<CompanyCodeInputProps> = ({
  onSelect,
  onClear,
  initialCode = "",
}) => {
  const { colors } = useTheme();
  const [code, setCode] = useState(initialCode.toUpperCase());
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<CompanyLookupResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doLookup = useCallback(
    async (value: string) => {
      if (value.length !== CODE_LENGTH) return;

      setIsLoading(true);
      setError(null);
      setResult(null);

      try {
        const found = await lookupCompanyByCode(value);
        setResult(found);
        onSelect(found);
      } catch (e: any) {
        setError(e?.message ?? "Aucune entreprise trouvée pour ce code");
      } finally {
        setIsLoading(false);
      }
    },
    [onSelect],
  );

  const handleChange = (raw: string) => {
    const upper = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (upper.length > CODE_LENGTH) return;
    setCode(upper);
    setError(null);
    setResult(null);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (upper.length === CODE_LENGTH) {
      debounceRef.current = setTimeout(() => doLookup(upper), 300);
    }
  };

  const handleClear = () => {
    setCode("");
    setResult(null);
    setError(null);
    onClear?.();
  };

  // Lookup initial si code pré-rempli
  useEffect(() => {
    if (initialCode.length === CODE_LENGTH) {
      doLookup(initialCode.toUpperCase());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const styles = StyleSheet.create({
    container: { gap: DESIGN_TOKENS.spacing.sm },
    inputRow: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: result
        ? (colors.success ?? "#22C55E")
        : error
          ? (colors.error ?? "#EF4444")
          : colors.border,
      borderRadius: DESIGN_TOKENS.radius.md,
      paddingHorizontal: DESIGN_TOKENS.spacing.md,
      height: 48,
      backgroundColor: colors.backgroundSecondary,
      gap: DESIGN_TOKENS.spacing.sm,
    },
    icon: { opacity: 0.5 },
    input: {
      flex: 1,
      color: colors.text,
      fontSize: 18,
      fontWeight: "700",
      letterSpacing: 3,
      fontFamily: "monospace",
    },
    resultCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: DESIGN_TOKENS.spacing.sm,
      backgroundColor: (colors.success ?? "#22C55E") + "18",
      borderRadius: DESIGN_TOKENS.radius.md,
      padding: DESIGN_TOKENS.spacing.md,
    },
    resultName: {
      flex: 1,
      color: colors.text,
      fontWeight: "600",
      fontSize: 15,
    },
    resultCode: {
      color: colors.textSecondary,
      fontSize: 12,
      marginTop: 2,
    },
    errorText: {
      color: colors.error ?? "#EF4444",
      fontSize: 13,
      marginTop: 2,
    },
    alreadySavedBadge: {
      backgroundColor: colors.primary + "22",
      borderRadius: 99,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    alreadySavedText: {
      color: colors.primary,
      fontSize: 11,
      fontWeight: "600",
    },
  });

  return (
    <View style={styles.container}>
      {/* Champ */}
      <View style={styles.inputRow}>
        <Ionicons
          name="key-outline"
          size={18}
          color={colors.textSecondary}
          style={styles.icon}
        />
        <TextInput
          style={styles.input}
          value={code}
          onChangeText={handleChange}
          placeholder="A3FX7KQ2"
          placeholderTextColor={colors.textSecondary}
          maxLength={CODE_LENGTH}
          autoCapitalize="characters"
          autoCorrect={false}
          keyboardType="default"
          returnKeyType="search"
        />
        {isLoading && <ActivityIndicator size="small" color={colors.primary} />}
        {(code.length > 0 || result) && !isLoading && (
          <Pressable onPress={handleClear} hitSlop={8}>
            <Ionicons
              name="close-circle"
              size={18}
              color={colors.textSecondary}
            />
          </Pressable>
        )}
      </View>

      {/* Résultat */}
      {result && (
        <View style={styles.resultCard}>
          <Ionicons
            name="checkmark-circle"
            size={22}
            color={colors.success ?? "#22C55E"}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.resultName}>{result.name}</Text>
            <Text style={styles.resultCode}>{result.company_code}</Text>
          </View>
          {result.is_already_saved && (
            <View style={styles.alreadySavedBadge}>
              <Text style={styles.alreadySavedText}>Carnet ✓</Text>
            </View>
          )}
        </View>
      )}

      {/* Erreur */}
      {error && (
        <Text style={styles.errorText}>
          <Ionicons name="alert-circle-outline" size={13} /> {error}
        </Text>
      )}
    </View>
  );
};

export default CompanyCodeInput;
