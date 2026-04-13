/**
 * DraggableJobCard — A job card that can be dragged to another day in the week view.
 * Uses react-native-gesture-handler PanGestureHandler + react-native-reanimated.
 * 
 * The parent (weekScreen) provides:
 *  - onDragStart / onDragEnd callbacks
 *  - dayColumnWidth to calculate which day column the user drops into
 */

import React from "react";
import { Text } from "react-native";
import {
    Gesture,
    GestureDetector,
} from "react-native-gesture-handler";
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from "react-native-reanimated";

interface DraggableJobCardProps {
  job: any;
  color: string;
  dayIndex: number; // 0-6 (Mon-Sun)
  dayColumnWidth: number;
  timeLabel: string;
  clientName: string;
  onPress: () => void;
  onDrop: (job: any, fromDayIndex: number, toDayIndex: number) => void;
}

const DraggableJobCard: React.FC<DraggableJobCardProps> = ({
  job,
  color,
  dayIndex,
  dayColumnWidth,
  timeLabel,
  clientName,
  onPress,
  onDrop,
}) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const zIndex = useSharedValue(0);
  const opacity = useSharedValue(1);
  const isDragging = useSharedValue(false);

  const handleDrop = (totalX: number) => {
    // Calculate how many columns we moved
    const columnsMoved = Math.round(totalX / dayColumnWidth);
    const toDayIndex = Math.max(0, Math.min(6, dayIndex + columnsMoved));

    if (toDayIndex !== dayIndex) {
      onDrop(job, dayIndex, toDayIndex);
    }
  };

  const longPress = Gesture.LongPress()
    .minDuration(400)
    .onStart(() => {
      isDragging.value = true;
      scale.value = withSpring(1.1);
      zIndex.value = 100;
      opacity.value = 0.85;
    });

  const pan = Gesture.Pan()
    .manualActivation(true)
    .onTouchesMove((_e, state) => {
      if (isDragging.value) {
        state.activate();
      } else {
        state.fail();
      }
    })
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY;
    })
    .onEnd((e) => {
      if (isDragging.value) {
        runOnJS(handleDrop)(e.translationX);
      }
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
      scale.value = withSpring(1);
      zIndex.value = 0;
      opacity.value = withTiming(1);
      isDragging.value = false;
    });

  const tap = Gesture.Tap().onEnd(() => {
    if (!isDragging.value) {
      runOnJS(onPress)();
    }
  });

  const gesture = Gesture.Simultaneous(
    longPress,
    Gesture.Simultaneous(pan, tap),
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    zIndex: zIndex.value,
    opacity: opacity.value,
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[
          {
            backgroundColor: color + "18",
            borderLeftWidth: 3,
            borderLeftColor: color,
            borderRadius: 4,
            padding: 4,
            marginBottom: 3,
          },
          animatedStyle,
        ]}
      >
        {timeLabel ? (
          <Text
            style={{ fontSize: 9, fontWeight: "700", color }}
            numberOfLines={1}
          >
            {timeLabel}
          </Text>
        ) : null}
        {clientName ? (
          <Text
            style={{ fontSize: 8, color: "#374151", marginTop: 1 }}
            numberOfLines={1}
          >
            {clientName}
          </Text>
        ) : null}
      </Animated.View>
    </GestureDetector>
  );
};

export default React.memo(DraggableJobCard);
