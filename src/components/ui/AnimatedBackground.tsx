import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, Text, View } from 'react-native';

interface AnimatedBackgroundProps {
  opacity?: number;
}

interface FallingEmoji {
  id: number;
  emoji: string;
  animatedValue: Animated.Value;
  x: number;
  startY: number;
  duration: number;
  rotation: string;
  size: number;
}

const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({ 
  opacity = 0.15 
}) => {
  const { width, height } = Dimensions.get('window');
  const emojisRef = useRef<FallingEmoji[]>([]);
  
  const emojiSet = ['🚛', '📦', '🚚', '📦', '🚛', '📦', '🚚', '📦'];
  
  useEffect(() => {
    const COUNT = 18;
    const emojis: FallingEmoji[] = [];
    
    for (let i = 0; i < COUNT; i++) {
      emojis.push({
        id: i,
        emoji: emojiSet[i % emojiSet.length],
        animatedValue: new Animated.Value(0),
        x: (width / COUNT) * i + Math.random() * (width / COUNT),
        startY: -(60 + Math.random() * 200),
        duration: 6000 + Math.random() * 6000,
        rotation: `${-20 + Math.random() * 40}deg`,
        size: 28 + Math.random() * 20,
      });
    }
    
    emojisRef.current = emojis;
    
    emojis.forEach((emojiObj, index) => {
      const loop = () => {
        emojiObj.animatedValue.setValue(0);
        Animated.timing(emojiObj.animatedValue, {
          toValue: 1,
          duration: emojiObj.duration,
          useNativeDriver: true,
        }).start(({ finished }) => {
          if (finished) loop();
        });
      };
      setTimeout(loop, index * 400 + Math.random() * 800);
    });
    
    return () => {
      emojisRef.current.forEach(e => e.animatedValue.stopAnimation());
    };
  }, [width, height]);
  
  return (
    <View style={[StyleSheet.absoluteFillObject, { zIndex: -1 }]} pointerEvents="none">
      {emojisRef.current.map((emojiObj) => {
        const translateY = emojiObj.animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [emojiObj.startY, height + 60],
        });
        
        const swayX = emojiObj.animatedValue.interpolate({
          inputRange: [0, 0.25, 0.5, 0.75, 1],
          outputRange: [0, 15, -10, 12, 0],
        });
        
        return (
          <Animated.View
            key={emojiObj.id}
            style={{
              position: 'absolute',
              left: emojiObj.x,
              opacity: opacity,
              transform: [
                { translateY },
                { translateX: swayX },
                { rotate: emojiObj.rotation },
              ],
            }}
          >
            <Text style={{ fontSize: emojiObj.size, lineHeight: emojiObj.size }}>
              {emojiObj.emoji}
            </Text>
          </Animated.View>
        );
      })}
    </View>
  );
};

export default AnimatedBackground;