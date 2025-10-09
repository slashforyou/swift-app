import React, { useEffect, useRef } from 'react';
import { View, Animated, Dimensions, StyleSheet } from 'react-native';
import { ThemedText } from '../ThemedText';

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
        
        // Position de départ (en haut à droite, hors écran)
        const startX = width + (i * 100);
        const startY = -100 - (i * 80);
        
        // Position d'arrivée (en bas à gauche, hors écran)  
        const endX = -200 - (i * 100);
        const endY = height + 100 + (i * 80);
        
        // Durée variable pour effet naturel
        const duration = 15000 + (i * 2000); // 15-35 secondes
        
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
        
        // Démarrer avec un délai échelonné
        setTimeout(startAnimation, index * 1000);
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
    <View style={[StyleSheet.absoluteFillObject, { zIndex: 0 }]}>
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
            <ThemedText style={styles.emoji}>
              {emojiObj.emoji}
            </ThemedText>
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