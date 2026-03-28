import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';

interface SimpleAnimatedBackgroundProps {
  opacity?: number;
}

const SimpleAnimatedBackground: React.FC<SimpleAnimatedBackgroundProps> = ({ 
  opacity = 0.3 
}) => {
  const [visible, setVisible] = useState(true);
  const { width, height } = Dimensions.get('window');


  // Test simple clignotement pour vérifier la visibilité
  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(prev => !prev);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={[
      StyleSheet.absoluteFillObject,
      {
        backgroundColor: visible ? 'rgba(255,0,0,0.3)' : 'rgba(0,255,0,0.3)',
        zIndex: 1000, // Au dessus de tout pour test
        pointerEvents: 'none'
      }
    ]}>
      {/* Emojis fixes aux 4 coins pour test visibilité */}
      <Text style={[styles.testEmoji, { top: 50, left: 50 }]}>🚛</Text>
      <Text style={[styles.testEmoji, { top: 50, right: 50 }]}>📦</Text>
      <Text style={[styles.testEmoji, { bottom: 100, left: 50 }]}>🚚</Text>
      <Text style={[styles.testEmoji, { bottom: 100, right: 50 }]}>📦</Text>
      
      {/* Texte central de test */}
      <View style={styles.centerTest}>
        <Text style={styles.testText}>
          BACKGROUND TEST {visible ? '🔴' : '🟢'}
        </Text>
        <Text style={styles.testSubtext}>
          {width}x{height} - Opacity: {opacity}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  testEmoji: {
    fontSize: 50,
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 25,
    width: 50,
    height: 50,
    textAlign: 'center',
    lineHeight: 50,
  },
  centerTest: {
    position: 'absolute',
    top: '40%',
    left: '50%',
    transform: [{ translateX: -100 }, { translateY: -50 }],
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 20,
    borderRadius: 10,
  },
  testText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  testSubtext: {
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 5,
  },
});

export default SimpleAnimatedBackground;
