import Ionicons from "@react-native-vector-icons/ionicons";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
  convertQuoteToJob,
  createQuote,
  getQuoteById,
  Quote,
  QuoteItem,
  updateQuote,
} from "../services/quotesService";

const TAX_RATE = 0.1; // 10% GST

interface Props {
  route?: any;
  navigation: any;
}

function calcLine(item: QuoteItem): number {
  return (item.quantity || 0) * (item.unit_price || 0);
}

export default function QuoteEditorScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t } = useLocalization();
  const quoteId: number | undefined = route?.params?.quoteId;
  const isEdit = !!quoteId;

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [converting, setConverting] = useState(false);

  const [title, setTitle] = useState("");
  const [clientName, setClientName] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("");
  const [status, setStatus] = useState("draft");
  const [items, setItems] = useState<QuoteItem[]>([
    { description: "", quantity: 1, unit_price: 0 },
  ]);

  const load = useCallback(async () => {
    if (!quoteId) return;
    try {
      setLoading(true);
      const q = await getQuoteById(quoteId);
      setTitle(q.title ?? "");
      setClientName(q.client_name ?? "");
      setValidUntil(q.valid_until ?? "");
      setNotes(q.notes ?? "");
      setTerms(q.terms ?? "");
      setStatus(q.status ?? "draft");
      setItems(q.items?.length ? q.items : [{ description: "", quantity: 1, unit_price: 0 }]);
    } catch {
      Alert.alert(t("common.error") ?? "Erreur", t("quotes.loadError") ?? "Impossible de charger le devis");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [quoteId]);

  useEffect(() => { load(); }, [load]);

  const subtotal = items.reduce((s, i) => s + calcLine(i), 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  const addLine = () => setItems((prev) => [...prev, { description: "", quantity: 1, unit_price: 0 }]);
  const removeLine = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));
  const updateLine = (idx: number, patch: Partial<QuoteItem>) =>
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, ...patch } : item)));

  const buildPayload = (s: string) => ({
    title,
    client_name: clientName,
    valid_until: validUntil || undefined,
    notes: notes || undefined,
    terms: terms || undefined,
    status: s,
    total,
    subtotal,
    tax,
    items: items.filter((i) => i.description.trim()),
  });

  const handleSave = async (sendStatus: string) => {
    if (!title.trim()) {
      Alert.alert(t("common.error") ?? "Erreur", t("quotes.titleRequired") ?? "Le titre est requis");
      return;
    }
    setSaving(true);
    try {
      if (isEdit) {
        await updateQuote(quoteId!, buildPayload(sendStatus));
      } else {
        await createQuote(buildPayload(sendStatus) as any);
      }
      navigation.goBack();
    } catch {
      Alert.alert(t("common.error") ?? "Erreur", t("quotes.saveError") ?? "Impossible d'enregistrer");
    } finally {
      setSaving(false);
    }
  };

  const handleConvert = async () => {
    if (!quoteId) return;
    setConverting(true);
    try {
      const result = await convertQuoteToJob(quoteId);
      const jobId = result.job_id;
      Alert.alert(
        t("quotes.convertedTitle") ?? "Job créé !",
        t("quotes.convertedMessage") ?? "Le devis a été converti en job",
        [
          {
            text: t("quotes.goToJob") ?? "Voir le job",
            onPress: () => navigation.navigate("JobDetails", { jobId: String(jobId) }),
          },
          { text: "OK", onPress: () => navigation.goBack() },
        ],
      );
    } catch {
      Alert.alert(t("common.error") ?? "Erreur", t("quotes.convertError") ?? "Impossible de convertir");
    } finally {
      setConverting(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

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
          {isEdit ? (t("quotes.editTitle") ?? "Modifier le devis") : (t("quotes.createTitle") ?? "Nouveau devis")}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: DESIGN_TOKENS.spacing.lg, paddingBottom: insets.bottom + 120 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Basic info */}
        {[
          { label: t("quotes.titleLabel") ?? "Titre *", value: title, set: setTitle },
          { label: t("quotes.clientLabel") ?? "Client", value: clientName, set: setClientName },
          { label: t("quotes.validUntilLabel") ?? "Valide jusqu'au (AAAA-MM-JJ)", value: validUntil, set: setValidUntil },
        ].map((f) => (
          <View key={f.label} style={{ marginBottom: 14 }}>
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 4 }}>{f.label}</Text>
            <TextInput
              value={f.value}
              onChangeText={f.set}
              placeholderTextColor={colors.textSecondary}
              style={{ backgroundColor: colors.backgroundSecondary, borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 12, color: colors.text, fontSize: 14 }}
            />
          </View>
        ))}

        {/* Items */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text }}>
            {t("quotes.itemsLabel") ?? "Lignes"}
          </Text>
          <Pressable
            onPress={addLine}
            style={{ backgroundColor: colors.primary + "20", borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 4 }}
          >
            <Ionicons name="add" size={16} color={colors.primary} />
            <Text style={{ color: colors.primary, fontWeight: "600", fontSize: 13 }}>
              {t("quotes.addLine") ?? "Ajouter ligne"}
            </Text>
          </Pressable>
        </View>

        {items.map((item, idx) => (
          <View
            key={idx}
            style={{
              backgroundColor: colors.backgroundSecondary, borderRadius: DESIGN_TOKENS.radius.lg,
              padding: DESIGN_TOKENS.spacing.md, marginBottom: DESIGN_TOKENS.spacing.sm,
              borderWidth: 1, borderColor: colors.border,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
              <Text style={{ flex: 1, fontWeight: "600", color: colors.textSecondary, fontSize: 12 }}>
                {t("quotes.lineLabel") ?? "Ligne"} {idx + 1}
              </Text>
              {items.length > 1 && (
                <Pressable onPress={() => removeLine(idx)} hitSlop={8}>
                  <Ionicons name="close-circle" size={18} color={colors.error} />
                </Pressable>
              )}
            </View>
            <TextInput
              value={item.description}
              onChangeText={(v) => updateLine(idx, { description: v })}
              placeholder={t("quotes.descriptionPlaceholder") ?? "Description du service..."}
              placeholderTextColor={colors.textSecondary}
              style={{ backgroundColor: colors.background, borderRadius: 8, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 10, color: colors.text, fontSize: 14, marginBottom: 8 }}
            />
            <View style={{ flexDirection: "row", gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.textSecondary, fontSize: 11, marginBottom: 3 }}>
                  {t("quotes.qtyLabel") ?? "Qté"}
                </Text>
                <TextInput
                  value={String(item.quantity)}
                  onChangeText={(v) => updateLine(idx, { quantity: parseFloat(v) || 0 })}
                  keyboardType="numeric"
                  style={{ backgroundColor: colors.background, borderRadius: 8, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 10, paddingVertical: 8, color: colors.text, fontSize: 14, textAlign: "center" }}
                />
              </View>
              <View style={{ flex: 2 }}>
                <Text style={{ color: colors.textSecondary, fontSize: 11, marginBottom: 3 }}>
                  {t("quotes.unitPriceLabel") ?? "Prix unitaire ($)"}
                </Text>
                <TextInput
                  value={String(item.unit_price)}
                  onChangeText={(v) => updateLine(idx, { unit_price: parseFloat(v) || 0 })}
                  keyboardType="decimal-pad"
                  style={{ backgroundColor: colors.background, borderRadius: 8, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 10, paddingVertical: 8, color: colors.text, fontSize: 14, textAlign: "right" }}
                />
              </View>
              <View style={{ flex: 1, justifyContent: "flex-end" }}>
                <Text style={{ color: colors.textSecondary, fontSize: 11, marginBottom: 3 }}>
                  {t("quotes.totalLabel") ?? "Total"}
                </Text>
                <View style={{ backgroundColor: colors.primary + "15", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 9 }}>
                  <Text style={{ color: colors.primary, fontSize: 14, fontWeight: "700", textAlign: "right" }}>
                    ${calcLine(item).toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        ))}

        {/* Totals */}
        <View
          style={{
            backgroundColor: colors.backgroundSecondary, borderRadius: DESIGN_TOKENS.radius.lg,
            padding: DESIGN_TOKENS.spacing.md, borderWidth: 1, borderColor: colors.border,
            marginTop: 8, gap: 6,
          }}
        >
          {[
            { label: t("quotes.subtotal") ?? "Sous-total HT", value: `$${subtotal.toFixed(2)}`, bold: false },
            { label: t("quotes.tax") ?? "TVA (10%)", value: `$${tax.toFixed(2)}`, bold: false },
            { label: t("quotes.total") ?? "TOTAL TTC", value: `$${total.toFixed(2)}`, bold: true },
          ].map((row) => (
            <View key={row.label} style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ color: row.bold ? colors.text : colors.textSecondary, fontWeight: row.bold ? "700" : "400", fontSize: row.bold ? 16 : 14 }}>
                {row.label}
              </Text>
              <Text style={{ color: row.bold ? colors.primary : colors.text, fontWeight: row.bold ? "800" : "600", fontSize: row.bold ? 18 : 14 }}>
                {row.value}
              </Text>
            </View>
          ))}
        </View>

        {/* Notes & Terms */}
        {[
          { label: t("quotes.notesLabel") ?? "Notes", value: notes, set: setNotes },
          { label: t("quotes.termsLabel") ?? "Conditions", value: terms, set: setTerms },
        ].map((f) => (
          <View key={f.label} style={{ marginTop: 14 }}>
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 4 }}>{f.label}</Text>
            <TextInput
              value={f.value}
              onChangeText={f.set}
              multiline
              numberOfLines={3}
              placeholderTextColor={colors.textSecondary}
              style={{ backgroundColor: colors.backgroundSecondary, borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 12, color: colors.text, fontSize: 14, minHeight: 70 }}
            />
          </View>
        ))}

        {/* Convert button (only for accepted quotes) */}
        {isEdit && status === "accepted" && (
          <Pressable
            onPress={handleConvert}
            disabled={converting}
            style={({ pressed }) => ({
              backgroundColor: pressed ? "#38A169cc" : "#38A169",
              borderRadius: 14, paddingVertical: 14, alignItems: "center", marginTop: 20,
              flexDirection: "row", justifyContent: "center", gap: 8,
            })}
          >
            {converting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="arrow-forward-circle" size={20} color="#fff" />
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
                  {t("quotes.convertToJob") ?? "Convertir en Job"}
                </Text>
              </>
            )}
          </Pressable>
        )}
      </ScrollView>

      {/* Bottom actions */}
      <View
        style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          backgroundColor: colors.background,
          borderTopWidth: 1, borderTopColor: colors.border,
          padding: DESIGN_TOKENS.spacing.lg,
          paddingBottom: insets.bottom + DESIGN_TOKENS.spacing.md,
          flexDirection: "row", gap: 10,
        }}
      >
        <Pressable
          onPress={() => handleSave("draft")}
          disabled={saving}
          style={({ pressed }) => ({
            flex: 1, backgroundColor: pressed ? colors.backgroundTertiary : colors.backgroundSecondary,
            borderRadius: 14, paddingVertical: 14, alignItems: "center",
            borderWidth: 1, borderColor: colors.border,
          })}
        >
          {saving ? (
            <ActivityIndicator color={colors.text} />
          ) : (
            <Text style={{ color: colors.text, fontWeight: "700", fontSize: 15 }}>
              {t("quotes.saveDraft") ?? "Brouillon"}
            </Text>
          )}
        </Pressable>
        <Pressable
          onPress={() => handleSave("sent")}
          disabled={saving}
          style={({ pressed }) => ({
            flex: 1, backgroundColor: pressed ? colors.primary + "cc" : colors.primary,
            borderRadius: 14, paddingVertical: 14, alignItems: "center",
          })}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>
              {t("quotes.send") ?? "Envoyer"}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}
