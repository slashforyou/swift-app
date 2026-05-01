import React from "react";
import { Text, View } from "react-native";
import { ENABLE_ARCADE_PROFILE } from "../../constants/arcadeConfig";
import PixelArtAvatar from "./PixelArtAvatar";

interface ArcadeProfileSectionProps {
  reputationScore?: number;
}

const ArcadeProfileSection: React.FC<ArcadeProfileSectionProps> = ({
  reputationScore,
}) => {
  if (!ENABLE_ARCADE_PROFILE) return null;

  return (
    <View
      style={{
        backgroundColor: "#0D1117",
        borderWidth: 2,
        borderColor: "#FF8C00",
        borderRadius: 8,
        padding: 20,
        alignItems: "center",
        marginVertical: 16,
        position: "relative",
      }}
    >
      <View
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          backgroundColor: "#FF8C00",
          paddingHorizontal: 6,
          paddingVertical: 2,
          borderRadius: 3,
        }}
      >
        <Text style={{ color: "#FFFFFF", fontSize: 10, fontWeight: "700" }}>
          DEV
        </Text>
      </View>

      <Text
        style={{
          color: "#FF8C00",
          fontSize: 16,
          fontWeight: "700",
          letterSpacing: 2,
          marginBottom: 16,
          fontFamily: "monospace",
        }}
      >
        🕹️ Arcade Identity
      </Text>

      <PixelArtAvatar size={160} reputationScore={reputationScore} />

      {reputationScore !== undefined && (
        <Text
          style={{
            color: "#FF8C00",
            fontSize: 13,
            fontWeight: "600",
            letterSpacing: 1,
            marginTop: 12,
            fontFamily: "monospace",
          }}
        >
          REP {reputationScore}
        </Text>
      )}
    </View>
  );
};

export default ArcadeProfileSection;
