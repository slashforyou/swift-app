/**
 * ClientsScreen — CRM basique : liste des clients (patron only)
 * #45 Page clients — liste des clients
 */
import Ionicons from "@react-native-vector-icons/ionicons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    Pressable,
    RefreshControl,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { DESIGN_TOKENS } from "../../constants/Styles";
import { useTheme } from "../../context/ThemeProvider";
import { useLocalization } from "../../localization/useLocalization";
import { analytics } from "../../services/analytics";
import {
    ClientAPI,
    createClient,
    deleteClient as deleteClientService,
    fetchClients,
    updateClient,
} from "../../services/clients";

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function formatDate(iso?: string): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return "";
  }
}

function getInitials(c: ClientAPI): string {
  const f = (c.firstName || "").charAt(0).toUpperCase();
  const l = (c.lastName || "").charAt(0).toUpperCase();
  return (f + l) || (c.email || "?").charAt(0).toUpperCase();
}

const AVATAR_COLORS = [
  "#4F46E5", "#0EA5E9", "#10B981", "#F59E0B",
  "#EF4444", "#8B5CF6", "#EC4899", "#14B8A6",
];

function avatarColor(id: string): string {
  const sum = String(id).split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

// ─────────────────────────────────────────────────────────────
// ClientFormModal
// ─────────────────────────────────────────────────────────────

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  notes: string;
}

const EMPTY_FORM: FormData = {
  firstName: "", lastName: "", email: "", phone: "", company: "", notes: "",
};

interface ClientFormModalProps {
  visible: boolean;
  client: ClientAPI | null;
  onClose: () => void;
  onSaved: () => void;
}

const ClientFormModal: React.FC<ClientFormModalProps> = ({ visible, client, onClose, onSaved }) => {
  const { colors } = useTheme();
  const { t } = useLocalization();
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setForm(
        client
          ? {
              firstName: client.firstName || "",
              lastName: client.lastName || "",
              email: client.email || "",
              phone: client.phone || "",
              company: client.company || "",
              notes: client.notes || "",
            }
          : EMPTY_FORM,
      );
    }
  }, [visible, client]);

  const set = (key: keyof FormData) => (val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  const handleSave = async () => {
    if (!form.firstName.trim() && !form.lastName.trim() && !form.email.trim()) {
      Alert.alert("", t("businessHub.clients.addError"));
      return;
    }
    setSaving(true);
    try {
      const payload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        company: form.company.trim(),
        notes: form.notes.trim(),
      };
      if (client) {
        await updateClient(client.id, payload);
        Alert.alert(t("businessHub.clients.success"), t("businessHub.clients.updated"));
      } else {
        await createClient(payload);
        Alert.alert(t("businessHub.clients.success"), t("businessHub.clients.added"));
      }
      onSaved();
      onClose();
    } catch {
      Alert.alert("", client ? t("businessHub.clients.updateError") : t("businessHub.clients.addError"));
    } finally {
      setSaving(false);
    }
  };

  const Field: React.FC<{
    label: string;
    value: string;
    onChange: (v: string) => void;
    keyboardType?: any;
    multiline?: boolean;
  }> = ({ label, value, onChange, keyboardType, multiline }) => (
    <View style={{ marginBottom: DESIGN_TOKENS.spacing.md }}>
      <Text style={{ fontSize: 12, fontWeight: "600", color: colors.textSecondary, marginBottom: 4 }}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType}
        multiline={multiline}
        style={{
          backgroundColor: colors.backgroundSecondary,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: DESIGN_TOKENS.radius.md,
          paddingHorizontal: DESIGN_TOKENS.spacing.md,
          paddingVertical: DESIGN_TOKENS.spacing.sm,
          fontSize: 15,
          color: colors.text,
          ...(multiline ? { minHeight: 70, textAlignVertical: "top" } : {}),
        }}
      />
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingHorizontal: DESIGN_TOKENS.spacing.lg,
            paddingVertical: DESIGN_TOKENS.spacing.md,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <Pressable onPress={onClose}>
            <Text style={{ fontSize: 16, color: colors.textSecondary }}>{t("businessHub.clients.cancel")}</Text>
          </Pressable>
          <Text style={{ fontSize: 17, fontWeight: "600", color: colors.text }}>
            {client ? t("businessHub.clients.editTitle") : t("businessHub.clients.addTitle")}
          </Text>
          <Pressable onPress={handleSave} disabled={saving}>
            {saving ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={{ fontSize: 16, fontWeight: "600", color: colors.primary }}>{t("businessHub.clients.save")}</Text>
            )}
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ padding: DESIGN_TOKENS.spacing.lg }}>
          <Field label={t("businessHub.clients.firstName")} value={form.firstName} onChange={set("firstName")} />
          <Field label={t("businessHub.clients.lastName")} value={form.lastName} onChange={set("lastName")} />
          <Field label={t("businessHub.clients.email")} value={form.email} onChange={set("email")} keyboardType="email-address" />
          <Field label={t("businessHub.clients.phone")} value={form.phone} onChange={set("phone")} keyboardType="phone-pad" />
          <Field label={t("businessHub.clients.company")} value={form.company} onChange={set("company")} />
          <Field label={t("businessHub.clients.notes")} value={form.notes} onChange={set("notes")} multiline />
        </ScrollView>
      </View>
    </Modal>
  );
};

// ─────────────────────────────────────────────────────────────
// ClientCard
// ─────────────────────────────────────────────────────────────

interface ClientCardProps {
  client: ClientAPI & { job_count?: number; last_job_at?: string };
  onEdit: (c: ClientAPI) => void;
  onDelete: (c: ClientAPI) => void;
}

const ClientCard: React.FC<ClientCardProps> = ({ client, onEdit, onDelete }) => {
  const { colors } = useTheme();
  const { t } = useLocalization();
  const initials = getInitials(client);
  const bg = avatarColor(client.id);
  const fullName = [client.firstName, client.lastName].filter(Boolean).join(" ") || client.email || "—";
  const jobCount = (client as any).job_count ?? 0;
  const lastJobAt = (client as any).last_job_at;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.backgroundSecondary,
        borderRadius: DESIGN_TOKENS.radius.md,
        padding: DESIGN_TOKENS.spacing.md,
        marginBottom: DESIGN_TOKENS.spacing.sm,
        gap: DESIGN_TOKENS.spacing.md,
      }}
    >
      {/* Avatar */}
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: bg,
          justifyContent: "center",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        <Text style={{ color: "white", fontSize: 16, fontWeight: "700" }}>{initials}</Text>
      </View>

      {/* Info */}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text }} numberOfLines={1}>
          {fullName}
        </Text>
        {client.company ? (
          <Text style={{ fontSize: 12, color: colors.textSecondary }} numberOfLines={1}>{client.company}</Text>
        ) : null}
        {client.email ? (
          <Text style={{ fontSize: 12, color: colors.textSecondary }} numberOfLines={1}>{client.email}</Text>
        ) : client.phone ? (
          <Text style={{ fontSize: 12, color: colors.textSecondary }}>{client.phone}</Text>
        ) : null}
        {/* Job count + last job */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: DESIGN_TOKENS.spacing.sm, marginTop: 4 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: colors.primary + "15",
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 10,
              gap: 4,
            }}
          >
            <Ionicons name="briefcase-outline" size={11} color={colors.primary} />
            <Text style={{ fontSize: 11, fontWeight: "600", color: colors.primary }}>
              {jobCount} {t("businessHub.clients.jobs")}
            </Text>
          </View>
          {lastJobAt ? (
            <Text style={{ fontSize: 11, color: colors.textMuted }}>
              {t("businessHub.clients.lastJob")}: {formatDate(lastJobAt)}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Actions */}
      <View style={{ flexDirection: "row", gap: DESIGN_TOKENS.spacing.sm }}>
        <Pressable
          onPress={() => onEdit(client)}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: colors.primary + "15",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Ionicons name="pencil-outline" size={16} color={colors.primary} />
        </Pressable>
        <Pressable
          onPress={() => onDelete(client)}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: "#EF444415",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Ionicons name="trash-outline" size={16} color="#EF4444" />
        </Pressable>
      </View>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────
// ClientsScreen (main)
// ─────────────────────────────────────────────────────────────

export default function ClientsScreen() {
  const { colors } = useTheme();
  const { t } = useLocalization();
  const [clients, setClients] = useState<(ClientAPI & { job_count?: number; last_job_at?: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState<"active" | "inactive">("active");
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientAPI | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchClients();
      setClients(data as any);
    } catch {
      Alert.alert("", t("businessHub.clients.loadError"));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [t]);

  useEffect(() => { load(); }, [load]);

  const isClientActive = useCallback((client: ClientAPI & Record<string, any>) => {
    if (typeof client.isActive === "boolean") return client.isActive;
    if (typeof client.active === "boolean") return client.active;
    return !client.isArchived;
  }, []);

  const activeCount = useMemo(
    () => clients.filter((c) => isClientActive(c as ClientAPI & Record<string, any>)).length,
    [clients, isClientActive],
  );
  const inactiveCount = useMemo(() => clients.length - activeCount, [clients.length, activeCount]);

  const filtered = useMemo(() => {
    const byStatus = clients.filter((c) => {
      const active = isClientActive(c as ClientAPI & Record<string, any>);
      return statusTab === "active" ? active : !active;
    });

    if (!search.trim()) return byStatus;

    const q = search.toLowerCase();
    return byStatus.filter(
      (c) =>
        (c.firstName || "").toLowerCase().includes(q) ||
        (c.lastName || "").toLowerCase().includes(q) ||
        (c.email || "").toLowerCase().includes(q) ||
        (c.phone || "").includes(q) ||
        (c.company || "").toLowerCase().includes(q),
    );
  }, [clients, search, statusTab, isClientActive]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    load();
  };

  const handleEdit = (c: ClientAPI) => {
    analytics.trackButtonPress('client_edit_open', 'Clients', { client_id: c.id });
    setEditingClient(c);
    setShowModal(true);
  };

  const handleDelete = (c: ClientAPI) => {
    analytics.trackButtonPress('client_delete_confirm', 'Clients', { client_id: c.id });
    Alert.alert(
      t("businessHub.clients.deleteTitle"),
      t("businessHub.clients.deleteConfirm"),
      [
        { text: t("businessHub.clients.cancel"), style: "cancel" },
        {
          text: t("businessHub.clients.delete"),
          style: "destructive",
          onPress: async () => {
            try {
              await deleteClientService(c.id);
              analytics.trackCustomEvent('client_deleted', 'business', { client_id: c.id });
              await load();
              Alert.alert(t("businessHub.clients.success"), t("businessHub.clients.deleted"));
            } catch {
              Alert.alert("", t("businessHub.clients.deleteError"));
            }
          },
        },
      ],
    );
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Search bar */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: colors.backgroundSecondary,
          borderRadius: DESIGN_TOKENS.radius.md,
          marginHorizontal: DESIGN_TOKENS.spacing.md,
          marginTop: DESIGN_TOKENS.spacing.md,
          marginBottom: DESIGN_TOKENS.spacing.sm,
          paddingHorizontal: DESIGN_TOKENS.spacing.md,
          gap: DESIGN_TOKENS.spacing.sm,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder={t("businessHub.clients.search")}
          placeholderTextColor={colors.textSecondary}
          style={{ flex: 1, fontSize: 15, color: colors.text, paddingVertical: DESIGN_TOKENS.spacing.sm }}
        />
        {search ? (
          <Pressable onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
          </Pressable>
        ) : null}
      </View>

      {/* Status tabs */}
      <View
        style={{
          flexDirection: "row",
          marginHorizontal: DESIGN_TOKENS.spacing.md,
          marginBottom: DESIGN_TOKENS.spacing.sm,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: DESIGN_TOKENS.radius.md,
          overflow: "hidden",
        }}
      >
        <Pressable
          onPress={() => setStatusTab("active")}
          style={{
            flex: 1,
            paddingVertical: DESIGN_TOKENS.spacing.sm,
            alignItems: "center",
            backgroundColor: statusTab === "active" ? colors.primary : "transparent",
          }}
        >
          <Text
            style={{
              fontSize: 13,
              fontWeight: "700",
              color: statusTab === "active" ? "#FFFFFF" : colors.text,
            }}
          >
            {t("businessHub.clients.tabActive")} ({activeCount})
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setStatusTab("inactive")}
          style={{
            flex: 1,
            paddingVertical: DESIGN_TOKENS.spacing.sm,
            alignItems: "center",
            backgroundColor: statusTab === "inactive" ? colors.primary : "transparent",
          }}
        >
          <Text
            style={{
              fontSize: 13,
              fontWeight: "700",
              color: statusTab === "inactive" ? "#FFFFFF" : colors.text,
            }}
          >
            {t("businessHub.clients.tabInactive")} ({inactiveCount})
          </Text>
        </Pressable>
      </View>

      {/* List */}
      {isLoading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <ClientCard client={item} onEdit={handleEdit} onDelete={handleDelete} />
          )}
          contentContainerStyle={{
            paddingHorizontal: DESIGN_TOKENS.spacing.md,
            paddingBottom: DESIGN_TOKENS.spacing.xl + 80,
          }}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingTop: 60, gap: DESIGN_TOKENS.spacing.sm }}>
              <Ionicons name="people-outline" size={52} color={colors.textSecondary} />
              <Text style={{ fontSize: 16, fontWeight: "600", color: colors.textSecondary, marginTop: DESIGN_TOKENS.spacing.md }}>
                {search
                  ? t("businessHub.clients.noSearchResults")
                  : statusTab === "active"
                    ? t("businessHub.clients.noActiveClients")
                    : t("businessHub.clients.noInactiveClients")}
              </Text>
              {!search && statusTab === "active" && (
                <Text style={{ fontSize: 13, color: colors.textMuted, textAlign: "center" }}>
                  {t("businessHub.clients.noClientsSubtitle")}
                </Text>
              )}
            </View>
          }
        />
      )}

      {/* FAB */}
      <Pressable
        onPress={() => { analytics.trackButtonPress('client_add_open', 'Clients'); setEditingClient(null); setShowModal(true); }}
        style={{
          position: "absolute",
          bottom: DESIGN_TOKENS.spacing.xl,
          right: DESIGN_TOKENS.spacing.lg,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: colors.primary,
          justifyContent: "center",
          alignItems: "center",
          elevation: 6,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.2,
          shadowRadius: 6,
        }}
      >
        <Ionicons name="person-add-outline" size={24} color="white" />
      </Pressable>

      {/* Form Modal */}
      <ClientFormModal
        visible={showModal}
        client={editingClient}
        onClose={() => setShowModal(false)}
        onSaved={load}
      />
    </View>
  );
}
