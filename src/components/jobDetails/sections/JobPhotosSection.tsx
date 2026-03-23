/**
 * JobPhotosSection - Section photos pour les détails de job
 * Permet l'upload, affichage, édition de description et suppression des photos
 *
 * TODO: Ajouter un système de slide/carousel pour naviguer entre les photos
 * en mode plein écran (swipe gauche/droite pour passer d'une photo à l'autre).
 * Voir: react-native-image-gallery ou react-native-reanimated-carousel
 */
import Ionicons from "@react-native-vector-icons/ionicons";
import { Image as ExpoImage } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { DESIGN_TOKENS } from "../../../constants/Styles";
import { useCommonThemedStyles } from "../../../hooks/useCommonStyles";
import { useJobPhotos } from "../../../hooks/useJobPhotos";
import { useLocalization } from "../../../localization/useLocalization";
import { JobPhotoAPI } from "../../../services/jobPhotos";
import { HStack, VStack } from "../../primitives/Stack";
import { Card } from "../../ui/Card";
import PhotoSelectionModal from "../modals/PhotoSelectionModal";

// Créer une version animée d'ExpoImage
const AnimatedExpoImage = Animated.createAnimatedComponent(ExpoImage);

interface JobPhotosSectionProps {
  jobId: string;
  isVisible?: boolean; // ✅ Session 10: Pour refetch quand l'onglet devient visible
}

// Helper pour formater la date en français
const formatPhotoDate = (dateString?: string): string => {
  if (!dateString) return "";

  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    // Si moins d'1 heure : "Il y a X min"
    if (diffMins < 60) {
      return `Il y a ${diffMins} min`;
    }

    // Si moins de 24h : "Il y a X h"
    if (diffHours < 24) {
      return `Il y a ${diffHours}h`;
    }

    // Si moins de 7 jours : "Il y a X jours"
    if (diffDays < 7) {
      return `Il y a ${diffDays}j`;
    }

    // Sinon format complet : "30/10/2025 14:30"
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");

    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch (e) {
    return "";
  }
};

// Helper pour formater le stage en français
const formatStage = (stage?: string): string => {
  if (!stage) return "";

  const stageLabels: Record<string, string> = {
    pickup: "📍 Ramassage",
    delivery: "🚚 Livraison",
    other: "📸 Autre",
    before: "⏪ Avant",
    after: "⏩ Après",
  };

  return stageLabels[stage.toLowerCase()] || stage;
};

interface PhotoViewModalProps {
  visible: boolean;
  photos: JobPhotoAPI[];
  initialIndex: number;
  onClose: () => void;
  onEdit: (photoId: string, description: string) => void;
  onDelete: (photoId: string) => void;
}

interface PhotoItemProps {
  photo: JobPhotoAPI;
  onPress: () => void;
  onEdit: (photoId: string, description: string) => void;
  onDelete: (photoId: string) => void;
}

const SectionHeader: React.FC<{
  icon: string;
  title: string;
  badge?: string;
}> = ({ icon, title, badge }) => {
  const { colors } = useCommonThemedStyles();
  return (
    <HStack
      gap="sm"
      align="center"
      style={{ marginBottom: DESIGN_TOKENS.spacing.md }}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: colors.primary + "20",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Ionicons name={icon as any} size={18} color={colors.primary} />
      </View>
      <Text
        style={{
          fontSize: DESIGN_TOKENS.typography.subtitle.fontSize,
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
            backgroundColor: colors.primary,
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 12,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: "600",
              color: "white",
            }}
          >
            {badge}
          </Text>
        </View>
      )}
    </HStack>
  );
};

const PhotoViewModal: React.FC<PhotoViewModalProps> = ({
  visible,
  photos,
  initialIndex,
  onClose,
  onEdit,
  onDelete,
}) => {
  const { colors } = useCommonThemedStyles();
  const { t } = useLocalization();
  const screenWidth = Dimensions.get("window").width;
  const scrollRef = React.useRef<ScrollView>(null);

  const [currentIndex, setCurrentIndex] = React.useState(initialIndex);
  const [editMode, setEditMode] = React.useState(false);
  const [description, setDescription] = React.useState("");
  const [isZoomed, setIsZoomed] = React.useState(false);
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const photo = photos[currentIndex];

  // Scroll to initial index and reset state when modal opens
  React.useEffect(() => {
    if (visible) {
      setCurrentIndex(initialIndex);
      setEditMode(false);
      setIsZoomed(false);
      scaleAnim.setValue(1);
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({
          x: initialIndex * screenWidth,
          animated: false,
        });
      });
    }
  }, [visible, initialIndex, scaleAnim, screenWidth]);

  // Sync description + reset zoom when page changes
  React.useEffect(() => {
    if (photo) {
      setDescription(photo.description || "");
      setEditMode(false);
      setIsZoomed(false);
      scaleAnim.setValue(1);
    }
  }, [currentIndex, photo, scaleAnim]);

  const handleMomentumScrollEnd = (e: any) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
    if (idx !== currentIndex && idx >= 0 && idx < photos.length) {
      setCurrentIndex(idx);
    }
  };

  const goTo = (idx: number) => {
    if (idx < 0 || idx >= photos.length) return;
    scrollRef.current?.scrollTo({ x: idx * screenWidth, animated: true });
    setCurrentIndex(idx);
  };

  const handleSaveDescription = () => {
    if (photo) {
      onEdit(String(photo.id), description);
      setEditMode(false);
    }
  };

  const handleDoubleTap = () => {
    const toValue = isZoomed ? 1 : 2.5;
    setIsZoomed(!isZoomed);
    Animated.spring(scaleAnim, {
      toValue,
      useNativeDriver: true,
      friction: 7,
    }).start();
  };

  let lastTap = 0;
  const handleImagePress = () => {
    const now = Date.now();
    if (now - lastTap < 300) handleDoubleTap();
    lastTap = now;
  };

  const handleDelete = () => {
    if (photo) {
      Alert.alert(
        t("jobDetails.components.photos.deleteTitle"),
        t("jobDetails.components.photos.deleteConfirm"),
        [
          { text: t("jobDetails.components.photos.cancel"), style: "cancel" },
          {
            text: t("jobDetails.components.photos.delete"),
            style: "destructive",
            onPress: () => {
              onDelete(String(photo.id));
              // Navigate to adjacent photo or close if last
              if (photos.length <= 1) {
                onClose();
              } else if (currentIndex >= photos.length - 1) {
                goTo(currentIndex - 1);
              }
            },
          },
        ],
      );
    }
  };

  if (!photos.length) return null;

  const buildImageUri = (p: JobPhotoAPI): string => {
    if (p.url) return p.url.replace(/\/\/uploads\//g, "/uploads/");
    if (String(p.id).startsWith("local-")) return p.filename || "";
    const path = (p.filename || p.filePath || p.file_path || "").replace(
      /^\/+/,
      "",
    );
    return `https://storage.googleapis.com/swift-images/${path}`;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.95)" }}>
        {/* ── Header ─────────────────────────────────────────────── */}
        <View
          style={{
            position: "absolute",
            top: 50,
            left: 0,
            right: 0,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingHorizontal: DESIGN_TOKENS.spacing.lg,
            zIndex: 10,
          }}
        >
          <Pressable
            onPress={onClose}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: "rgba(0,0,0,0.5)",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons name="close" size={24} color="white" />
          </Pressable>

          {/* Counter */}
          {photos.length > 1 && (
            <View
              style={{
                backgroundColor: "rgba(0,0,0,0.5)",
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 16,
              }}
            >
              <Text style={{ color: "white", fontSize: 14, fontWeight: "600" }}>
                {currentIndex + 1} / {photos.length}
              </Text>
            </View>
          )}

          <HStack gap="sm">
            <Pressable
              onPress={() => setEditMode(!editMode)}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: editMode ? colors.primary : "rgba(0,0,0,0.5)",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Ionicons name="create-outline" size={20} color="white" />
            </Pressable>

            <Pressable
              onPress={handleDelete}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: "rgba(220,20,60,0.8)",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Ionicons name="trash-outline" size={20} color="white" />
            </Pressable>
          </HStack>
        </View>

        {/* ── Carousel ───────────────────────────────────────────── */}
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEnabled={!isZoomed}
          onMomentumScrollEnd={handleMomentumScrollEnd}
          style={{ flex: 1 }}
        >
          {photos.map((p, idx) => (
            <Pressable
              key={String(p.id)}
              onPress={handleImagePress}
              style={{
                width: screenWidth,
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <AnimatedExpoImage
                source={{ uri: buildImageUri(p) }}
                style={{
                  width: screenWidth,
                  height: "100%",
                  transform: idx === currentIndex ? [{ scale: scaleAnim }] : [],
                }}
                contentFit="contain"
                transition={200}
                onError={(err) =>
                  console.error("❌ [PhotoViewModal] Image load error:", err)
                }
              />
            </Pressable>
          ))}
        </ScrollView>

        {/* ── Nav arrows ─────────────────────────────────────────── */}
        {photos.length > 1 && !isZoomed && (
          <>
            {currentIndex > 0 && (
              <Pressable
                onPress={() => goTo(currentIndex - 1)}
                style={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  marginTop: -22,
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: "rgba(0,0,0,0.5)",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Ionicons name="chevron-back" size={24} color="white" />
              </Pressable>
            )}
            {currentIndex < photos.length - 1 && (
              <Pressable
                onPress={() => goTo(currentIndex + 1)}
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  marginTop: -22,
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: "rgba(0,0,0,0.5)",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Ionicons name="chevron-forward" size={24} color="white" />
              </Pressable>
            )}
          </>
        )}

        {/* ── Bottom gradient ────────────────────────────────────── */}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.85)"]}
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 180,
            pointerEvents: "none",
          }}
        />

        {/* ── Zoom hint ──────────────────────────────────────────── */}
        {isZoomed && (
          <View
            style={{
              position: "absolute",
              top: 110,
              alignSelf: "center",
              backgroundColor: "rgba(0,0,0,0.7)",
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 16,
            }}
          >
            <Text style={{ color: "white", fontSize: 12 }}>
              Double-tap pour dézoomer
            </Text>
          </View>
        )}

        {/* ── Description overlay ────────────────────────────────── */}
        {photo && (
          <View
            style={{
              position: "absolute",
              bottom: 40,
              left: 20,
              right: 20,
              padding: DESIGN_TOKENS.spacing.md,
            }}
          >
            {editMode ? (
              <VStack gap="sm">
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Ajouter une description..."
                  placeholderTextColor="rgba(255,255,255,0.6)"
                  multiline
                  style={{
                    color: "white",
                    fontSize: 16,
                    minHeight: 60,
                    textAlignVertical: "top",
                    paddingVertical: DESIGN_TOKENS.spacing.sm,
                  }}
                />
                <HStack gap="sm" justify="flex-end">
                  <Pressable
                    onPress={() => setEditMode(false)}
                    style={{
                      paddingHorizontal: DESIGN_TOKENS.spacing.md,
                      paddingVertical: DESIGN_TOKENS.spacing.sm,
                      borderRadius: DESIGN_TOKENS.radius.sm,
                      backgroundColor: "rgba(255,255,255,0.2)",
                    }}
                  >
                    <Text style={{ color: "white", fontWeight: "600" }}>
                      {t("jobDetails.components.photos.cancel")}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={handleSaveDescription}
                    style={{
                      paddingHorizontal: DESIGN_TOKENS.spacing.md,
                      paddingVertical: DESIGN_TOKENS.spacing.sm,
                      borderRadius: DESIGN_TOKENS.radius.sm,
                      backgroundColor: colors.primary,
                    }}
                  >
                    <Text style={{ color: "white", fontWeight: "600" }}>
                      {t("jobDetails.components.photos.save")}
                    </Text>
                  </Pressable>
                </HStack>
              </VStack>
            ) : (
              <VStack gap="sm">
                <HStack gap="md" align="center" style={{ marginBottom: 4 }}>
                  {formatPhotoDate(
                    photo.capturedAt || photo.createdAt || photo.created_at,
                  ) ? (
                    <Text
                      style={{ color: "rgba(255,255,255,0.8)", fontSize: 14 }}
                    >
                      📅{" "}
                      {formatPhotoDate(
                        photo.capturedAt || photo.createdAt || photo.created_at,
                      )}
                    </Text>
                  ) : null}
                  {formatStage(photo.stage) ? (
                    <Text
                      style={{
                        color: "rgba(255,255,255,0.9)",
                        fontSize: 14,
                        fontWeight: "500",
                      }}
                    >
                      {formatStage(photo.stage)}
                    </Text>
                  ) : null}
                </HStack>
                <Text style={{ color: "white", fontSize: 16, lineHeight: 24 }}>
                  {photo.description ||
                    t("jobDetails.components.photos.noDescription")}
                </Text>
              </VStack>
            )}
          </View>
        )}
      </View>
    </Modal>
  );
};

const PhotoItem: React.FC<PhotoItemProps> = ({
  photo,
  onPress,
  onEdit,
  onDelete,
}) => {
  const { colors } = useCommonThemedStyles();
  const { t } = useLocalization();
  const [imageError, setImageError] = React.useState(false);
  const [showEditModal, setShowEditModal] = React.useState(false);
  const [editDescription, setEditDescription] = React.useState(
    photo.description || "",
  );
  // Convertir l'ID en string pour vérifier si c'est une photo locale
  const photoId = String(photo.id);
  const isLocalPhoto = photoId.startsWith("local-");

  // Vérifier si le fichier est une image valide
  const isValidImageFile = React.useMemo(() => {
    const filename = (photo.filename || "").toLowerCase();
    const validExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"];
    return validExtensions.some((ext) => filename.endsWith(ext));
  }, [photo.filename]);

  // Construire l'URL de la photo
  const photoUrl = React.useMemo(() => {
    // ✅ PRIORITÉ 1: Si le backend a renvoyé une signed URL, l'utiliser
    if (photo.url) {
      // 🔧 WORKAROUND: Le backend génère parfois des URLs avec double slash (//uploads/)
      // On corrige ici en attendant le fix backend
      return photo.url.replace(/\/\/uploads\//g, "/uploads/");
    }

    // ✅ PRIORITÉ 2: Photo locale (non uploadée)
    if (isLocalPhoto) {
      return photo.filename;
    }

    // ⚠️ FALLBACK: URL publique GCS (ne marchera que si bucket public)
    // Note: Nettoyer le path pour éviter les doubles slashes
    const path = (
      photo.filename ||
      photo.filePath ||
      photo.file_path ||
      ""
    ).replace(/^\/+/, ""); // Enlever les / au début
    const gcsUrl = `https://storage.googleapis.com/swift-images/${path}`;
    return gcsUrl;
  }, [
    photo.url,
    isLocalPhoto,
    photo.filename,
    photo.filePath,
    photo.file_path,
    photo.id,
  ]);

  const handleImageError = React.useCallback(
    (error: any) => {
      if (!imageError) {
        setImageError(true);
        // Log silencieux pour ne pas polluer la console avec des erreurs connues
        const errorMsg = error?.nativeEvent?.error || "Unknown error";
        if (
          errorMsg !== "Problem decoding into existing bitmap" &&
          errorMsg !== "unknown image format"
        ) {
          console.error(
            "❌ [PhotoItem] Image load error:",
            JSON.stringify(
              {
                id: photo.id,
                url: photoUrl,
                errorMessage: errorMsg,
                filename: photo.filename,
              },
              null,
              2,
            ),
          );
        }
      }
    },
    [imageError, photo.id, photoUrl, photo.filename],
  );

  const handleSaveDescription = () => {
    onEdit(photoId, editDescription);
    setShowEditModal(false);
  };

  const photoDate = formatPhotoDate(
    photo.capturedAt || photo.createdAt || photo.created_at,
  );
  const stageLabel = formatStage(photo.stage);

  return (
    <>
      <Pressable
        onPress={onPress}
        style={{
          width: "48%",
          borderRadius: DESIGN_TOKENS.radius.md,
          overflow: "hidden",
          backgroundColor: colors.background,
          elevation: 2,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.22,
          shadowRadius: 2.22,
          marginBottom: DESIGN_TOKENS.spacing.sm,
        }}
      >
        {/* Image avec fallback */}
        {!isValidImageFile || imageError ? (
          <View
            style={{
              width: "100%",
              height: 140,
              backgroundColor: colors.border,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons
              name={!isValidImageFile ? "document-outline" : "image-outline"}
              size={48}
              color={colors.textSecondary}
            />
            <Text
              style={{
                fontSize: 11,
                color: colors.textSecondary,
                marginTop: 8,
                textAlign: "center",
                paddingHorizontal: 8,
              }}
            >
              {!isValidImageFile
                ? t("jobDetails.components.photos.nonImageFile")
                : t("jobDetails.components.photos.loadError")}
            </Text>
          </View>
        ) : (
          <View
            style={{
              width: "100%",
              aspectRatio: 1,
              backgroundColor: colors.border,
              overflow: "hidden",
              position: "relative",
            }}
          >
            <ExpoImage
              source={{ uri: photoUrl }}
              style={{ width: "100%", height: "100%" }}
              contentFit="contain"
              transition={200}
              onError={handleImageError}
            />

            {/* Dégradé en bas pour lisibilité du texte */}
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.7)"]}
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: 60,
              }}
            />

            {/* Date et Stage sur l'image */}
            <View
              style={{
                position: "absolute",
                bottom: 8,
                left: 8,
                right: 8,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              {photoDate ? (
                <Text
                  style={{
                    fontSize: 11,
                    color: "white",
                    fontWeight: "500",
                    textShadowColor: "rgba(0,0,0,0.5)",
                    textShadowOffset: { width: 0, height: 1 },
                    textShadowRadius: 2,
                  }}
                >
                  {photoDate}
                </Text>
              ) : null}
              {stageLabel ? (
                <Text
                  style={{
                    fontSize: 11,
                    color: "white",
                    fontWeight: "600",
                    textShadowColor: "rgba(0,0,0,0.5)",
                    textShadowOffset: { width: 0, height: 1 },
                    textShadowRadius: 2,
                  }}
                >
                  {stageLabel}
                </Text>
              ) : null}
            </View>
          </View>
        )}

        {/* Description section (sans date/stage car maintenant sur l'image) */}
        <View
          style={{
            padding: DESIGN_TOKENS.spacing.xs,
            backgroundColor: colors.background,
          }}
        >
          {/* Description avec bouton edit */}
          <View
            style={{ flexDirection: "row", alignItems: "flex-start", gap: 4 }}
          >
            <Text
              numberOfLines={2}
              style={{
                flex: 1,
                fontSize: 11,
                color: colors.text,
                lineHeight: 14,
              }}
            >
              {photo.description ||
                t("jobDetails.components.photos.withoutDescription")}
            </Text>
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                setEditDescription(photo.description || "");
                setShowEditModal(true);
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name="create-outline"
                size={14}
                color={colors.primary}
              />
            </Pressable>
          </View>
        </View>
      </Pressable>

      {/* Modal d'édition de description */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditModal(false)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            alignItems: "center",
          }}
          onPress={() => setShowEditModal(false)}
        >
          <Pressable
            style={{
              width: "85%",
              backgroundColor: colors.background,
              borderRadius: DESIGN_TOKENS.radius.lg,
              padding: DESIGN_TOKENS.spacing.lg,
              elevation: 5,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
            }}
            onPress={(e) => e.stopPropagation()}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
                color: colors.text,
                marginBottom: DESIGN_TOKENS.spacing.md,
              }}
            >
              Modifier la description
            </Text>

            <TextInput
              value={editDescription}
              onChangeText={setEditDescription}
              placeholder="Ajoutez une description..."
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={4}
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: DESIGN_TOKENS.radius.md,
                padding: DESIGN_TOKENS.spacing.sm,
                fontSize: 14,
                color: colors.text,
                minHeight: 80,
                textAlignVertical: "top",
                backgroundColor: colors.backgroundSecondary,
                marginBottom: DESIGN_TOKENS.spacing.md,
              }}
            />

            <View
              style={{ flexDirection: "row", gap: DESIGN_TOKENS.spacing.sm }}
            >
              <Pressable
                onPress={() => setShowEditModal(false)}
                style={{
                  flex: 1,
                  padding: DESIGN_TOKENS.spacing.sm,
                  borderRadius: DESIGN_TOKENS.radius.md,
                  backgroundColor: colors.backgroundSecondary,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 14,
                    fontWeight: "500",
                  }}
                >
                  {t("jobDetails.components.photos.cancel")}
                </Text>
              </Pressable>

              <Pressable
                onPress={handleSaveDescription}
                style={{
                  flex: 1,
                  padding: DESIGN_TOKENS.spacing.sm,
                  borderRadius: DESIGN_TOKENS.radius.md,
                  backgroundColor: colors.primary,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{ color: "white", fontSize: 14, fontWeight: "600" }}
                >
                  {t("jobDetails.components.photos.save")}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

export const JobPhotosSection: React.FC<JobPhotosSectionProps> = ({
  jobId,
  isVisible = true,
}) => {
  const { colors } = useCommonThemedStyles();
  const { t } = useLocalization();
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [showViewModal, setShowViewModal] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false); // ✅ Collapsible state
  const prevIsVisibleRef = React.useRef(isVisible);

  const {
    photos,
    isLoading,
    error,
    uploadPhoto,
    updatePhotoDescription,
    deletePhoto,
    totalPhotos,
    refetch,
    // ✅ Pagination
    hasMore,
    loadMore,
    isLoadingMore,
  } = useJobPhotos(jobId);

  // ✅ Session 10: Refetch quand l'onglet devient visible (false -> true)
  React.useEffect(() => {
    if (isVisible && !prevIsVisibleRef.current) {
      console.log(
        "📸 [JobPhotosSection] Tab became visible, refetching photos...",
      );
      refetch();
    }
    prevIsVisibleRef.current = isVisible;
  }, [isVisible, refetch]);

  const handlePhotoSelection = async (photoUri: string) => {
    // TEMP_DISABLED: console.log('🎯 [DEBUG] handlePhotoSelection - REÇU du modal');
    // TEMP_DISABLED: console.log('🎯 [DEBUG] photoUri reçu:', photoUri);

    setShowPhotoModal(false);
    // TEMP_DISABLED: console.log('✅ [DEBUG] Modal fermé');

    try {
      const result = await uploadPhoto(photoUri, "");

      // TEMP_DISABLED: console.log('✅ [DEBUG] uploadPhoto terminé:', result);

      if (result) {
        await refetch();
        // TEMP_DISABLED: console.log('✅ [DEBUG] Photos rechargées');

        Alert.alert(
          t("jobDetails.components.photos.success"),
          t("jobDetails.components.photos.addedSuccess"),
        );
      }
    } catch (err) {
      console.error("❌ [DEBUG] Erreur dans uploadPhoto:", err);
      console.error(
        "❌ [DEBUG] Stack trace:",
        err instanceof Error ? err.stack : "N/A",
      );
      Alert.alert(
        t("jobDetails.components.photos.error"),
        t("jobDetails.components.photos.updateError"),
      );
    }
  };

  const handlePhotoPress = (photo: JobPhotoAPI) => {
    const idx = photos.findIndex((p) => p.id === photo.id);
    setSelectedPhotoIndex(idx >= 0 ? idx : 0);
    setShowViewModal(true);
  };

  const handleEditDescription = async (
    photoId: string,
    description: string,
  ) => {
    try {
      await updatePhotoDescription(photoId, description);

      // ✅ Recharger toutes les photos depuis le serveur
      await refetch();

      Alert.alert(
        t("jobDetails.components.photos.success"),
        t("jobDetails.components.photos.descriptionUpdated"),
      );
    } catch (err) {
      Alert.alert(
        t("jobDetails.components.photos.error"),
        t("jobDetails.components.photos.updateError"),
      );
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    try {
      await deletePhoto(photoId);

      // ✅ Recharger toutes les photos depuis le serveur
      await refetch();

      Alert.alert(
        t("jobDetails.components.photos.success"),
        t("jobDetails.components.photos.deleted"),
      );
    } catch (err) {
      Alert.alert(
        t("jobDetails.components.photos.error"),
        t("jobDetails.components.photos.updateError"),
      );
    }
  };

  if (error && (!Array.isArray(photos) || photos.length === 0)) {
    return null; // Ne pas afficher la section s'il y a une erreur et aucune photo
  }

  // ✅ Render d'un item de la FlatList (2 colonnes)
  const renderPhotoItem = ({
    item,
    index,
  }: {
    item: JobPhotoAPI;
    index: number;
  }) => {
    // Prendre 2 photos à la fois pour layout 2 colonnes
    if (index % 2 !== 0) return null;

    const photo1 = item;
    const photo2 = photos[index + 1];

    return (
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: DESIGN_TOKENS.spacing.sm,
        }}
      >
        <PhotoItem
          photo={photo1}
          onPress={() => handlePhotoPress(photo1)}
          onEdit={handleEditDescription}
          onDelete={handleDeletePhoto}
        />

        {photo2 && (
          <PhotoItem
            photo={photo2}
            onPress={() => handlePhotoPress(photo2)}
            onEdit={handleEditDescription}
            onDelete={handleDeletePhoto}
          />
        )}
        {!photo2 && <View style={{ width: "48%" }} />}
      </View>
    );
  };

  // ✅ Footer pour infinite scroll
  const renderFooter = () => {
    if (!isLoadingMore) return null;

    return (
      <View style={{ padding: DESIGN_TOKENS.spacing.md, alignItems: "center" }}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text
          style={{ marginTop: 8, color: colors.textSecondary, fontSize: 12 }}
        >
          {t("jobDetails.components.photos.loading")}
        </Text>
      </View>
    );
  };

  return (
    <>
      <Card style={{ padding: DESIGN_TOKENS.spacing.lg }}>
        <VStack gap="md">
          {/* Header avec toggle pour expand/collapse */}
          <Pressable
            onPress={() => setIsExpanded(!isExpanded)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <SectionHeader
              icon="camera-outline"
              title="Photos"
              badge={totalPhotos > 0 ? totalPhotos.toString() : undefined}
            />
            <Ionicons
              name={isExpanded ? "chevron-up-outline" : "chevron-down-outline"}
              size={24}
              color={colors.textSecondary}
            />
          </Pressable>

          {/* Contenu conditionnel (sans Collapsible complex) */}
          {isExpanded && (
            <>
              {isLoading && (!Array.isArray(photos) || photos.length === 0) ? (
                <View
                  style={{
                    padding: DESIGN_TOKENS.spacing.lg,
                    alignItems: "center",
                  }}
                >
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text
                    style={{
                      marginTop: DESIGN_TOKENS.spacing.sm,
                      color: colors.textSecondary,
                      fontSize: 14,
                    }}
                  >
                    {t("jobDetails.components.photos.loadingPhotos")}
                  </Text>
                </View>
              ) : Array.isArray(photos) && photos.length > 0 ? (
                <FlatList
                  data={photos}
                  renderItem={renderPhotoItem}
                  keyExtractor={(item) => String(item.id)}
                  numColumns={1}
                  scrollEnabled={false} // Désactiver scroll interne (on scroll la page parente)
                  onEndReached={() => {
                    // TEMP_DISABLED: console.log('📸 [FlatList] onEndReached - hasMore:', hasMore, 'isLoadingMore:', isLoadingMore);
                    if (hasMore && !isLoadingMore) {
                      loadMore();
                    }
                  }}
                  onEndReachedThreshold={0.5} // Charger quand on atteint 50% de la fin
                  ListFooterComponent={renderFooter}
                  contentContainerStyle={{
                    paddingBottom: DESIGN_TOKENS.spacing.sm,
                  }}
                />
              ) : (
                <Text
                  style={{
                    fontSize: 14,
                    color: colors.textSecondary,
                    fontStyle: "italic",
                    textAlign: "center",
                    paddingVertical: DESIGN_TOKENS.spacing.lg,
                  }}
                >
                  Aucune photo pour le moment
                </Text>
              )}
            </>
          )}

          {/* Bouton Ajouter une photo */}
          <Pressable
            testID="job-photos-add-btn"
            onPress={() => setShowPhotoModal(true)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              padding: DESIGN_TOKENS.spacing.md,
              borderWidth: 2,
              borderColor: colors.primary,
              borderStyle: "dashed",
              borderRadius: DESIGN_TOKENS.radius.md,
              backgroundColor: colors.primary + "10",
              marginTop: DESIGN_TOKENS.spacing.sm,
            }}
          >
            <Ionicons name="camera-outline" size={20} color={colors.primary} />
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: colors.primary,
                marginLeft: DESIGN_TOKENS.spacing.xs,
              }}
            >
              Ajouter une photo
            </Text>
          </Pressable>
        </VStack>
      </Card>

      {/* Modal de sélection de photo */}
      <PhotoSelectionModal
        isVisible={showPhotoModal}
        onClose={() => setShowPhotoModal(false)}
        onPhotoSelected={handlePhotoSelection}
        jobId={jobId}
      />

      {/* Modal de visualisation/édition — carousel */}
      <PhotoViewModal
        visible={showViewModal}
        photos={photos}
        initialIndex={selectedPhotoIndex}
        onClose={() => setShowViewModal(false)}
        onEdit={handleEditDescription}
        onDelete={handleDeletePhoto}
      />
    </>
  );
};
