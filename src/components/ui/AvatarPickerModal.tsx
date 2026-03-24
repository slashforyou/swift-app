import React from "react";
import {
  Dimensions,
  Image,
  ImageSourcePropType,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useTheme } from "../../context/ThemeProvider";

// Avatar map — require() must be static, so we list them explicitly.
// To add more avatars, just add entries here.
const AVATARS: { id: string; source: ImageSourcePropType }[] = [
  { id: "0", source: require("../../../assets/images/mascot/mascotte_profil/0.png") },
  { id: "1", source: require("../../../assets/images/mascot/mascotte_profil/1.png") },
  { id: "2", source: require("../../../assets/images/mascot/mascotte_profil/2.png") },
  { id: "3", source: require("../../../assets/images/mascot/mascotte_profil/3.png") },
  { id: "4", source: require("../../../assets/images/mascot/mascotte_profil/4.png") },
  { id: "5", source: require("../../../assets/images/mascot/mascotte_profil/5.png") },
  { id: "6", source: require("../../../assets/images/mascot/mascotte_profil/6.png") },
  { id: "7", source: require("../../../assets/images/mascot/mascotte_profil/7.png") },
];

/** Default avatar (mascotte de base = id 0) */
const DEFAULT_AVATAR = require("../../../assets/images/mascot/mascotte_profil/0.png");

/**
 * Returns the image source for a given avatarId.
 * Exported so ProfileHeader and other components can reuse it.
 */
export function getAvatarSource(avatarId?: string | null): ImageSourcePropType {
  if (!avatarId) return DEFAULT_AVATAR;
  const match = AVATARS.find((a) => a.id === avatarId);
  return match ? match.source : DEFAULT_AVATAR;
}

/** Get the full list of available avatars */
export function getAvatarList() {
  return AVATARS;
}

interface AvatarPickerModalProps {
  visible: boolean;
  currentAvatarId?: string | null;
  onSelect: (avatarId: string) => void;
  onClose: () => void;
}

const SCREEN_WIDTH = Dimensions.get("window").width;
const COLUMNS = 3;
const AVATAR_GAP = 12;
const MODAL_PADDING = 24;
const AVATAR_SIZE = Math.floor(
  (SCREEN_WIDTH - MODAL_PADDING * 2 - AVATAR_GAP * (COLUMNS - 1)) / COLUMNS
);

export default function AvatarPickerModal({
  visible,
  currentAvatarId,
  onSelect,
  onClose,
}: AvatarPickerModalProps) {
  const { colors } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.5)",
          justifyContent: "flex-end",
        }}
        onPress={onClose}
      >
        <Pressable
          style={{
            backgroundColor: colors.backgroundSecondary,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: MODAL_PADDING,
            maxHeight: "70%",
          }}
          onPress={() => {}}
        >
          {/* Title */}
          <Text
            style={{
              fontSize: 18,
              fontWeight: "700",
              color: colors.text,
              textAlign: "center",
              marginBottom: 20,
            }}
          >
            Choisis ton avatar
          </Text>

          {/* Grid */}
          <ScrollView showsVerticalScrollIndicator={false}>
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: AVATAR_GAP,
              }}
            >
              {AVATARS.map((avatar) => {
                const isSelected = avatar.id === currentAvatarId;
                return (
                  <Pressable
                    key={avatar.id}
                    onPress={() => onSelect(avatar.id)}
                    style={({ pressed }) => ({
                      width: AVATAR_SIZE,
                      height: AVATAR_SIZE,
                      borderRadius: AVATAR_SIZE / 2,
                      overflow: "hidden",
                      borderWidth: isSelected ? 3 : 2,
                      borderColor: isSelected ? "#FF8C00" : colors.border,
                      opacity: pressed ? 0.7 : 1,
                      transform: [{ scale: isSelected ? 1.05 : 1 }],
                    })}
                  >
                    <Image
                      source={avatar.source}
                      style={{ width: "125%", height: "125%", marginLeft: "-12.5%", marginTop: "-12.5%" }}
                      resizeMode="cover"
                    />
                    {isSelected && (
                      <View
                        style={{
                          position: "absolute",
                          bottom: 2,
                          right: 2,
                          backgroundColor: "#FF8C00",
                          borderRadius: 10,
                          width: 20,
                          height: 20,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Text style={{ color: "white", fontSize: 12, fontWeight: "800" }}>✓</Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          {/* Close button */}
          <Pressable
            onPress={onClose}
            style={{
              marginTop: 16,
              paddingVertical: 12,
              borderRadius: 12,
              backgroundColor: colors.border,
              alignItems: "center",
            }}
          >
            <Text style={{ color: colors.text, fontWeight: "600" }}>Fermer</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
