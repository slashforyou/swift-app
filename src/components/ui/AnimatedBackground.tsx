import React, { useEffect, useRef } from 'react';
import { View, Animated, Dimensions, StyleSheet, Text } from 'react-native';

interface AnimatedBackgroundProps {
  opacity?: number;
}

interface MovingEmoji {
  id: number;
  emoji: string;
  animatedValue: Animated.Value;
  startY: number;
  endY: number;
  startX: number;
  endX: number;
  duration: number;
}

const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({ 
  opacity = 0.15 
}) => {
  const { width, height } = Dimensions.get('window');
  const emojisRef = useRef<MovingEmoji[]>([]);
  
  // Emojis camions et cartons
  const emojiSet = ['🚛', '📦', '🚚', '📦', '🚛', '📦'];
  
  // Créer les emojis animés
  useEffect(() => {
    const createEmojis = () => {
      const emojis: MovingEmoji[] = [];
      
      // Créer 12 emojis répartis
      for (let i = 0; i < 12; i++) {
        const emoji = emojiSet[i % emojiSet.length];
        
        // Position de départ (en haut à droite, légèrement hors écran)
        const startX = width + 50 + (i * 60);
        const startY = -50 - (i * 60);
        
        // Position d'arrivée (en bas à gauche, légèrement hors écran)  
        const endX = -100 - (i * 60);
        const endY = height + 50 + (i * 60);
        
        // Durée variable pour effet naturel (plus rapide pour debug)
        const duration = 8000 + (i * 1000); // 8-20 secondes
        
        emojis.push({
          id: i,
          emoji,
          animatedValue: new Animated.Value(0),
          startX,
          startY,
          endX,
          endY,
          duration
        });
      }
      
      return emojis;
    };
    
    emojisRef.current = createEmojis();
    
    // Démarrer les animations
    const startAnimations = () => {
      emojisRef.current.forEach((emojiObj, index) => {
        const startAnimation = () => {
          emojiObj.animatedValue.setValue(0);
          
          Animated.timing(emojiObj.animatedValue, {
            toValue: 1,
            duration: emojiObj.duration,
            useNativeDriver: true,
          }).start(({ finished }) => {
            if (finished) {
              // Redémarrer l'animation en boucle
              setTimeout(startAnimation, index * 500); // Délai échelonné
            }
          });
        };
        
        // Démarrer avec un délai échelonné (plus court pour debug)
        setTimeout(startAnimation, index * 500);
      });
    };
    
    startAnimations();
    
    return () => {
      // Nettoyer les animations
      emojisRef.current.forEach(emojiObj => {
        emojiObj.animatedValue.removeAllListeners();
      });
    };
  }, [width, height]);
  
  return (
    <View style={[StyleSheet.absoluteFillObject, { zIndex: -1 }]} pointerEvents="none">
      {emojisRef.current.map((emojiObj) => {
        const translateX = emojiObj.animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [emojiObj.startX, emojiObj.endX],
        });
        
        const translateY = emojiObj.animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [emojiObj.startY, emojiObj.endY],
        });
        
        return (
          <Animated.View
            key={emojiObj.id}
            style={[
              styles.emojiContainer,
              {
                opacity,
                transform: [
                  { translateX },
                  { translateY },
                  { rotate: '-15deg' } // Légère rotation pour l'effet diagonal
                ]
              }
            ]}
          >
            <Text style={styles.emoji}>
              {emojiObj.emoji}
            </Text>
          </Animated.View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  emojiContainer: {
    position: 'absolute',
  },
  emoji: {
    fontSize: 40,
    lineHeight: 40,
  },
});

export default AnimatedBackground;