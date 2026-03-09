/**
 * Job Page - Affichage des dÃ©tails du travail, items Ã  checker, contacts
 * Conforme aux normes mobiles iOS/Android - Touch targets â‰¥44pt, 8pt grid
 */
import Ionicons from "@react-native-vector-icons/ionicons";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    Pressable,
    Text,
    TextInput,
    View,
} from "react-native";
import CompanyDetailsSection from "../../components/jobDetails/sections/CompanyDetailsSection";
import JobActionsSection from "../../components/jobDetails/sections/JobActionsSection";
import { JobPhotosSection } from "../../components/jobDetails/sections/JobPhotosSection";
import JobTimeSection from "../../components/jobDetails/sections/JobTimeSection";
import StaffingSection from "../../components/jobDetails/sections/StaffingSection";
import { HStack, VStack } from "../../components/primitives/Stack";
import { DESIGN_TOKENS } from "../../constants/Styles";
import { useTheme } from "../../context/ThemeProvider";
import { useLocalization } from "../../localization/useLocalization";
import { addJobItem, updateJobItem } from "../../services/jobs";

// Fonction pour extraire l'ID numérique depuis un ID job de format JOB-NERD-URGENT-006
const extractNumericJobId = (jobId: string): string => {
  if (!jobId) {
    return "";
  }

  // Si c'est déjà numérique, retourner tel quel
  if (/^\d+$/.test(jobId)) {
    return jobId;
  }

  // Extraire les chiffres à la fin (ex: JOB-NERD-URGENT-006 -> 006 -> 6)
  const match = jobId.match(/(\d+)$/);
  if (match) {
    return parseInt(match[1], 10).toString(); // Convertir 006 -> 6
  }

  return jobId; // Fallback
};

interface JobPageProps {
  job: any;
  setJob: React.Dispatch<React.SetStateAction<any>>;
  isVisible?: boolean;
}

interface ItemRowProps {
  item: any;
  index: number;
  onToggle: (index: number, checked: boolean) => void;
  onQuantityChange: (index: number, completedQuantity: number) => void;
  onQuantityBlur: (index: number, completedQuantity: number) => void;
  isSyncing?: boolean;
  colors: any;
  t: (key: string) => string;
}

// Header collapsible réutilisable
const CollapsibleHeader: React.FC<{
  icon: string;
  title: string;
  badge?: string;
  isExpanded: boolean;
  onToggle: () => void;
  colors: any;
  rightContent?: React.ReactNode;
}> = ({ icon, title, badge, isExpanded, onToggle, colors, rightContent }) => (
  <Pressable
    onPress={onToggle}
    style={({ pressed }) => ({
      flexDirection: "row",
      alignItems: "center",
      padding: DESIGN_TOKENS.spacing.lg,
      backgroundColor: pressed ? colors.backgroundTertiary : "transparent",
    })}
  >
    <View
      style={{
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.primary + "15",
        justifyContent: "center",
        alignItems: "center",
        marginRight: DESIGN_TOKENS.spacing.sm,
      }}
    >
      <Ionicons name={icon as any} size={20} color={colors.primary} />
    </View>
    <Text
      style={{
        fontSize: 16,
        fontWeight: "600",
        color: colors.text,
        flex: 1,
      }}
    >
      {title}
    </Text>
    {badge && (
      <View
        style={{
          backgroundColor: colors.primary + "18",
          paddingHorizontal: 10,
          paddingVertical: 3,
          borderRadius: DESIGN_TOKENS.radius.full,
          marginRight: DESIGN_TOKENS.spacing.sm,
        }}
      >
        <Text
          style={{ fontSize: 12, fontWeight: "700", color: colors.primary }}
        >
          {badge}
        </Text>
      </View>
    )}
    {rightContent}
    <Ionicons
      name={isExpanded ? "chevron-up" : "chevron-down"}
      size={20}
      color={colors.textSecondary}
    />
  </Pressable>
);

// Modal pour ajouter un item
const AddItemModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  onAdd: (name: string, quantity: number) => void;
}> = ({ visible, onClose, onAdd }) => {
  const { colors } = useTheme();
  const { t } = useLocalization();
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [isLoading, setIsLoading] = useState(false);

  const handleAdd = async () => {
    if (!name.trim()) {
      Alert.alert(t("jobDetails.job.error"), t("jobDetails.job.errorItemName"));
      return;
    }

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty < 1) {
      Alert.alert(t("jobDetails.job.error"), t("jobDetails.job.errorQuantity"));
      return;
    }

    setIsLoading(true);
    try {
      // Petit délai minimum pour voir le chargement
      await Promise.all([
        onAdd(name.trim(), qty),
        new Promise((resolve) => setTimeout(resolve, 800)), // 800ms minimum
      ]);

      setName("");
      setQuantity("1");
      onClose();
    } catch {
      Alert.alert(t("jobDetails.job.error"), t("jobDetails.job.errorItemName"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.5)",
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}
      >
        <View
          style={{
            backgroundColor: colors.background,
            borderRadius: DESIGN_TOKENS.radius.lg,
            padding: DESIGN_TOKENS.spacing.lg,
            width: "100%",
            maxWidth: 400,
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 12,
            elevation: 8,
          }}
        >
          <HStack
            align="center"
            justify="space-between"
            style={{ marginBottom: DESIGN_TOKENS.spacing.lg }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
                color: colors.text,
              }}
            >
              {t("jobDetails.job.addItemTitle")}
            </Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </Pressable>
          </HStack>

          <VStack gap="md">
            <VStack gap="xs">
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "500",
                  color: colors.text,
                }}
              >
                {t("jobDetails.job.itemName")} *
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder={t("jobDetails.job.itemNamePlaceholder")}
                placeholderTextColor={colors.textSecondary}
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: DESIGN_TOKENS.radius.md,
                  padding: DESIGN_TOKENS.spacing.md,
                  fontSize: 16,
                  color: colors.text,
                  backgroundColor: colors.backgroundSecondary,
                }}
              />
            </VStack>

            <VStack gap="xs">
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "500",
                  color: colors.text,
                }}
              >
                {t("jobDetails.job.quantity")} *
              </Text>
              <TextInput
                value={quantity}
                onChangeText={setQuantity}
                placeholder={t("jobDetails.job.quantityPlaceholder")}
                keyboardType="numeric"
                placeholderTextColor={colors.textSecondary}
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: DESIGN_TOKENS.radius.md,
                  padding: DESIGN_TOKENS.spacing.md,
                  fontSize: 16,
                  color: colors.text,
                  backgroundColor: colors.backgroundSecondary,
                }}
              />
            </VStack>

            <HStack gap="md" style={{ marginTop: DESIGN_TOKENS.spacing.md }}>
              <Pressable
                onPress={onClose}
                style={{
                  flex: 1,
                  padding: DESIGN_TOKENS.spacing.md,
                  borderRadius: DESIGN_TOKENS.radius.md,
                  borderWidth: 1,
                  borderColor: colors.border,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "500",
                    color: colors.textSecondary,
                  }}
                >
                  {t("jobDetails.job.cancel")}
                </Text>
              </Pressable>

              <Pressable
                onPress={handleAdd}
                disabled={isLoading}
                style={{
                  flex: 1,
                  padding: DESIGN_TOKENS.spacing.md,
                  borderRadius: DESIGN_TOKENS.radius.md,
                  backgroundColor: isLoading
                    ? colors.backgroundSecondary
                    : colors.primary,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                }}
              >
                {isLoading && (
                  <ActivityIndicator
                    size="small"
                    color={colors.background}
                    style={{ marginRight: 8 }}
                  />
                )}
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: colors.background,
                  }}
                >
                  {isLoading
                    ? t("jobDetails.job.adding")
                    : t("jobDetails.job.addItem")}
                </Text>
              </Pressable>
            </HStack>
          </VStack>
        </View>
      </View>
    </Modal>
  );
};

// Composant item moderne avec checkbox ronde + quantités inline
const ItemRow: React.FC<ItemRowProps> = ({
  item,
  index,
  onToggle,
  onQuantityChange,
  onQuantityBlur,
  isSyncing,
  colors,
  t,
}) => {
  const isChecked = item.item_checked || item.checked || false;
  const [completedQuantity, setCompletedQuantity] = useState(
    item.completedQuantity?.toString() || "0",
  );

  const handleQuantityChangeText = (text: string) => {
    setCompletedQuantity(text);
    const qty = parseInt(text) || 0;
    onQuantityChange(index, qty);
  };

  const handleQuantityBlur = () => {
    const qty = parseInt(completedQuantity) || 0;
    onQuantityBlur(index, qty);
  };

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: DESIGN_TOKENS.spacing.md,
        paddingHorizontal: DESIGN_TOKENS.spacing.sm,
      }}
    >
      {/* Checkbox ronde */}
      <Pressable
        onPress={() => onToggle(index, !isChecked)}
        hitSlop={DESIGN_TOKENS.touch.hitSlop}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isChecked }}
        accessibilityLabel={`${isChecked ? "Uncheck" : "Check"} ${item.name}`}
        style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          borderWidth: 2,
          borderColor: isChecked ? colors.success : colors.border,
          backgroundColor: isChecked ? colors.success : "transparent",
          justifyContent: "center",
          alignItems: "center",
          marginRight: DESIGN_TOKENS.spacing.md,
        }}
      >
        {isChecked && (
          <Ionicons name="checkmark" size={16} color={colors.background} />
        )}
      </Pressable>

      {/* Nom + quantité */}
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text
            style={{
              fontSize: 15,
              fontWeight: "500",
              color: isChecked ? colors.textSecondary : colors.text,
              textDecorationLine: isChecked ? "line-through" : "none",
              flex: 1,
            }}
          >
            {item.name}
          </Text>
          {item.isTemp && (
            <View
              style={{
                backgroundColor: colors.textSecondary + "15",
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: 4,
              }}
            >
              <Text
                style={{
                  fontSize: 9,
                  fontWeight: "700",
                  color: colors.textSecondary,
                }}
              >
                {t("jobDetails.job.local") || "LOCAL"}
              </Text>
            </View>
          )}
          {isSyncing && (
            <ActivityIndicator size="small" color={colors.primary} />
          )}
        </View>
        {item.number > 1 && (
          <Text
            style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}
          >
            {t("jobDetails.job.expected") || "Expected"}: {item.number}
          </Text>
        )}
      </View>

      {/* Champ quantité complétée (compact) */}
      {item.number > 1 && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colors.background,
            borderRadius: DESIGN_TOKENS.radius.sm,
            borderWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: 8,
            marginLeft: DESIGN_TOKENS.spacing.sm,
          }}
        >
          <TextInput
            value={completedQuantity}
            onChangeText={handleQuantityChangeText}
            onBlur={handleQuantityBlur}
            keyboardType="numeric"
            placeholder={t("jobDetails.job.completedQuantityPlaceholder")}
            placeholderTextColor={colors.textSecondary}
            style={{
              width: 32,
              textAlign: "center",
              fontSize: 14,
              fontWeight: "600",
              color: colors.text,
              paddingVertical: 6,
            }}
          />
          <Text style={{ fontSize: 12, color: colors.textSecondary }}>
            /{item.number}
          </Text>
        </View>
      )}
    </View>
  );
};

const JobPage: React.FC<JobPageProps> = ({ job, setJob, isVisible = true }) => {
  const { colors } = useTheme();
  const { t } = useLocalization();
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [syncingItems, setSyncingItems] = useState<Set<string>>(new Set());

  // Sections collapsibles — items ouvert par défaut
  const [expandedSections, setExpandedSections] = useState({
    items: true,
    photos: true,
    company: false,
  });

  const toggleSection = (key: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Mémoïser l'extraction de l'ID numérique pour éviter les appels répétés
  const numericJobId = React.useMemo(
    () => extractNumericJobId(job.id),
    [job.id],
  );

  const handleItemToggle = async (itemIndex: number, checked: boolean) => {
    const updatedJob = { ...job };
    if (!updatedJob.items || !updatedJob.items[itemIndex]) {
      return;
    }

    const item = updatedJob.items[itemIndex];

    // Mettre à jour localement d'abord pour un feedback immédiat
    updatedJob.items[itemIndex].item_checked = checked;
    updatedJob.items[itemIndex].checked = checked;
    setJob(updatedJob);

    // Synchroniser avec l'API si l'item a un ID et n'est pas temporaire
    if (item.id && !item.isTemp) {
      // TEMP_DISABLED: console.log(`[handleItemToggle] DEBUG - Item structure:`, JSON.stringify(item, null, 2));
      // TEMP_DISABLED: console.log(`[handleItemToggle] DEBUG - itemIndex: ${itemIndex}, item.id: "${item.id}" (type: ${typeof item.id})`);
      // TEMP_DISABLED: console.log(`[handleItemToggle] Job ID: ${numericJobId}, Item ID: ${item.id}`);

      const itemKey = `${itemIndex}-${item.id}`;
      setSyncingItems((prev) => new Set(prev).add(itemKey));

      try {
        await updateJobItem(numericJobId, item.id, {
          is_checked: checked,
          completedQuantity: item.completedQuantity || 0,
        });
        // TEMP_DISABLED: console.log(`[handleItemToggle] Successfully updated item ${item.id} in API`);
      } catch (error) {
        console.error(
          `[handleItemToggle] Failed to update item ${item.id} in API:`,
          error,
        );
      } finally {
        setSyncingItems((prev) => {
          const newSet = new Set(prev);
          newSet.delete(itemKey);
          return newSet;
        });
      }
    } else {
      // TEMP_DISABLED: console.log(`[handleItemToggle] Item has no ID or is temporary, skipping API sync`);
    }
  };

  // Fonction pour synchroniser la quantité avec l'API (appelée sur onBlur)
  const handleQuantitySync = async (
    itemIndex: number,
    completedQuantity: number,
  ) => {
    const item = job.items?.[itemIndex];
    if (!item) return;

    // Synchroniser avec l'API si l'item a un ID et n'est pas temporaire
    if (item.id && !item.isTemp) {
      // TEMP_DISABLED: console.log(`[handleQuantitySync] DEBUG - Item structure:`, JSON.stringify(item, null, 2));
      // TEMP_DISABLED: console.log(`[handleQuantitySync] DEBUG - itemIndex: ${itemIndex}, item.id: "${item.id}" (type: ${typeof item.id})`);
      // TEMP_DISABLED: console.log(`[handleQuantitySync] Job ID: ${numericJobId}, Item ID: ${item.id}, Quantity: ${completedQuantity}`);

      const itemKey = `${itemIndex}-${item.id}`;
      setSyncingItems((prev) => new Set(prev).add(itemKey));

      try {
        await updateJobItem(numericJobId, item.id, {
          completedQuantity,
          is_checked: item.item_checked || item.checked || false,
        });
        // TEMP_DISABLED: console.log(`[handleQuantitySync] Successfully updated quantity for item ${item.id} in API`);
      } catch (error) {
        console.error(
          `[handleQuantitySync] Failed to update quantity for item ${item.id} in API:`,
          error,
        );
      } finally {
        setSyncingItems((prev) => {
          const newSet = new Set(prev);
          newSet.delete(itemKey);
          return newSet;
        });
      }
    } else {
      // TEMP_DISABLED: console.log(`[handleQuantitySync] Item has no ID or is temporary, skipping API sync`);
    }
  };

  // Fonction pour mettre à jour localement la quantité (changement immédiat)
  const handleQuantityChange = (
    itemIndex: number,
    completedQuantity: number,
  ) => {
    const updatedJob = { ...job };
    if (!updatedJob.items || !updatedJob.items[itemIndex]) {
      return;
    }

    // Mettre à jour localement seulement
    updatedJob.items[itemIndex].completedQuantity = completedQuantity;
    setJob(updatedJob);
  };

  const handleAddItem = async (name: string, quantity: number) => {
    try {
      // TEMP_DISABLED: console.log(`[handleAddItem] Using numeric job ID: ${numericJobId} (from ${job.id})`);

      await addJobItem(numericJobId, { name, quantity });

      // Mettre Ã  jour la liste des items localement
      const updatedJob = { ...job };
      if (!updatedJob.items) {
        updatedJob.items = [];
      }
      updatedJob.items.push({
        name,
        number: quantity,
        checked: false,
        item_checked: false,
        completedQuantity: 0,
      });
      setJob(updatedJob);

      Alert.alert(
        t("jobDetails.job.success") || "Success",
        t("jobDetails.job.itemAddedSuccess") || "Item added successfully",
      );
    } catch (error) {
      console.error("Error adding item via API:", error);

      // Fallback: ajouter localement même si l'API échoue
      // TEMP_DISABLED: console.log('Falling back to local addition');
      const updatedJob = { ...job };
      if (!updatedJob.items) {
        updatedJob.items = [];
      }

      // Générer un ID temporaire
      const tempId = `temp_${Date.now()}`;
      updatedJob.items.push({
        id: tempId,
        name,
        number: quantity,
        checked: false,
        item_checked: false,
        completedQuantity: 0,
        isTemp: true, // Marquer comme temporaire
      });
      setJob(updatedJob);

      Alert.alert(
        t("jobDetails.job.addedLocally") || "Item Added Locally",
        t("jobDetails.job.addedLocallyMessage") ||
          "Item added to local list. It will be synced when the API connection is available.",
        [{ text: "OK", style: "default" }],
      );
    }
  };

  const itemsCount = job.items?.length || 0;
  const checkedItems =
    job.items?.filter((item: any) => item.item_checked || item.checked)
      .length || 0;

  return (
    <>
      <VStack gap="md">
        {/* Section Time Tracking (collapsible intégré) */}
        <JobTimeSection job={job} />

        {/* ═══ Job Items ═══ */}
        <View
          style={{
            backgroundColor: colors.backgroundSecondary,
            borderRadius: DESIGN_TOKENS.radius.lg,
            overflow: "hidden",
          }}
        >
          <CollapsibleHeader
            icon="cube-outline"
            title={t("jobDetails.job.jobItems")}
            badge={itemsCount > 0 ? `${checkedItems}/${itemsCount}` : undefined}
            isExpanded={expandedSections.items}
            onToggle={() => toggleSection("items")}
            colors={colors}
          />

          {expandedSections.items && (
            <View
              style={{
                paddingHorizontal: DESIGN_TOKENS.spacing.md,
                paddingBottom: DESIGN_TOKENS.spacing.lg,
              }}
            >
              {/* Barre de progression */}
              {itemsCount > 0 && (
                <View
                  style={{
                    height: 4,
                    backgroundColor: colors.border,
                    borderRadius: 2,
                    marginBottom: DESIGN_TOKENS.spacing.md,
                    overflow: "hidden",
                  }}
                >
                  <View
                    style={{
                      height: "100%",
                      width: `${(checkedItems / itemsCount) * 100}%`,
                      backgroundColor:
                        checkedItems === itemsCount
                          ? colors.success
                          : colors.primary,
                      borderRadius: 2,
                    }}
                  />
                </View>
              )}

              {job.items && job.items.length > 0 ? (
                job.items.map((item: any, index: number) => {
                  const itemKey = `${index}-${item.id || item.name}`;
                  const isSyncing = syncingItems.has(itemKey);
                  return (
                    <React.Fragment key={itemKey}>
                      <ItemRow
                        item={item}
                        index={index}
                        onToggle={handleItemToggle}
                        onQuantityChange={handleQuantityChange}
                        onQuantityBlur={handleQuantitySync}
                        isSyncing={isSyncing}
                        colors={colors}
                        t={t}
                      />
                      {index < job.items.length - 1 && (
                        <View
                          style={{
                            height: 1,
                            backgroundColor: colors.border + "30",
                            marginHorizontal: DESIGN_TOKENS.spacing.sm,
                          }}
                        />
                      )}
                    </React.Fragment>
                  );
                })
              ) : (
                <View
                  style={{
                    paddingVertical: DESIGN_TOKENS.spacing.xl,
                    alignItems: "center",
                  }}
                >
                  <Ionicons
                    name="cube-outline"
                    size={32}
                    color={colors.textSecondary + "60"}
                  />
                  <Text
                    style={{
                      fontSize: 14,
                      color: colors.textSecondary,
                      marginTop: DESIGN_TOKENS.spacing.sm,
                    }}
                  >
                    {t("jobDetails.job.noItems")}
                  </Text>
                </View>
              )}

              {/* Bouton Ajouter */}
              <Pressable
                onPress={() => setShowAddItemModal(true)}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: DESIGN_TOKENS.spacing.md,
                  borderWidth: 1.5,
                  borderColor: colors.primary + "50",
                  borderStyle: "dashed",
                  borderRadius: DESIGN_TOKENS.radius.md,
                  backgroundColor: pressed
                    ? colors.primary + "15"
                    : colors.primary + "08",
                  marginTop: DESIGN_TOKENS.spacing.md,
                })}
              >
                <Ionicons
                  name="add-circle-outline"
                  size={18}
                  color={colors.primary}
                />
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: colors.primary,
                    marginLeft: 6,
                  }}
                >
                  {t("jobDetails.job.addItem")}
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* ═══ Photos ═══ */}
        <JobPhotosSection jobId={numericJobId} isVisible={isVisible} />

        {/* ═══ Ressources ═══ */}
        <StaffingSection job={job} />

        {/* ═══ Company Details ═══ */}
        <CompanyDetailsSection job={job} />

        {/* ═══ Historique des actions ═══ */}
        <JobActionsSection jobId={numericJobId} />
      </VStack>

      {/* Modal d'ajout d'item */}
      <AddItemModal
        visible={showAddItemModal}
        onClose={() => setShowAddItemModal(false)}
        onAdd={handleAddItem}
      />
    </>
  );
};

export default JobPage;
