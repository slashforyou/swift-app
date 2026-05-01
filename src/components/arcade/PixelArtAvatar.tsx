import React, { memo, useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { IDLE_FRAMES, PALETTE } from "../../constants/arcadeAssets";

interface PixelArtAvatarProps {
  size?: number;
  reputationScore?: number;
}

interface RowProps {
  rowData: string;
  pixelSize: number;
}

const Row = memo(({ rowData, pixelSize }: RowProps) => (
  <View style={{ flexDirection: "row" }}>
    {rowData.split("").map((char, i) => (
      <View
        key={i}
        style={{
          width: pixelSize,
          height: pixelSize,
          backgroundColor: PALETTE[char] ?? "transparent",
        }}
      />
    ))}
  </View>
));

Row.displayName = "PixelRow";

const PixelArtAvatar: React.FC<PixelArtAvatarProps> = ({
  size = 128,
}) => {
  const [frameIndex, setFrameIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % IDLE_FRAMES.length);
    }, 150);
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const pixelSize = size / 32;
  const frame = IDLE_FRAMES[frameIndex];

  return (
    <View style={{ width: size, height: size }}>
      {frame.map((row, rowIndex) => (
        <Row key={rowIndex} rowData={row} pixelSize={pixelSize} />
      ))}
    </View>
  );
};

export default memo(PixelArtAvatar);
