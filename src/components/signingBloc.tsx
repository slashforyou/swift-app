import React, { useRef, useState, useEffect } from 'react';
import { View, Text, Pressable, Modal, Alert, StyleSheet, Platform, ScrollView, ActivityIndicator, Animated, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Signature, { SignatureViewRef } from 'react-native-signature-canvas';
import * as FileSystem from 'expo-file-system';
import { DESIGN_TOKENS } from '../constants/Styles';
import { Colors } from '../constants/Colors';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Types
interface Job {
  id: string;
  signatureDataUrl?: string;
  signatureFileUri?: string;
  client?: {
    name: string;
  };
}

interface SigningBlocProps {
  onSave: (signature: string) => void;
  isVisible: boolean;
  setIsVisible: React.Dispatch<React.SetStateAction<boolean>>;
  job: Job;
  setJob: React.Dispatch<React.SetStateAction<Job>>;
}

const SigningBloc: React.FC<SigningBlocProps> = ({
  onSave,
  isVisible,
  setIsVisible,
  job,
  setJob
}) => {
  const insets = useSafeAreaInsets();
  const signatureRef = useRef<SignatureViewRef>(null);
  const [ready, setReady] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Animations
  const slideAnimation = useRef(new Animated.Value(screenHeight)).current;
  const backdropAnimation = useRef(new Animated.Value(0)).current;
  const scaleAnimation = useRef(new Animated.Value(0.9)).current;
  const canvasGlowAnimation = useRef(new Animated.Value(0)).current;

  // Animation effects - Agrandissement vers le haut + fermeture animée
  useEffect(() => {
    if (isVisible) {
      // Reset initial values
      slideAnimation.setValue(screenHeight * 0.3); // Commence plus bas pour effet d'agrandissement
      scaleAnimation.setValue(0.7);
      backdropAnimation.setValue(0);

      // Modal apparition - agrandissement vers le haut
      Animated.parallel([
        Animated.timing(backdropAnimation, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnimation, {
          toValue: 0,
          tension: 80,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnimation, {
          toValue: 1,
          tension: 100,
          friction: 6,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Modal disparition - animation fluide vers le bas avec scale
      Animated.parallel([
        Animated.timing(backdropAnimation, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnimation, {
          toValue: screenHeight * 0.8,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnimation, {
          toValue: 0.8,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible]);

  // Canvas glow effect when signing
  useEffect(() => {
    if (isSigning) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(canvasGlowAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: false,
          }),
          Animated.timing(canvasGlowAnimation, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: false,
          }),
        ])
      ).start();
    } else {
      canvasGlowAnimation.stopAnimation();
      canvasGlowAnimation.setValue(0);
    }
  }, [isSigning]);

  const styles = StyleSheet.create({
    // Modal styles
    mask: { 
      flex: 1,
      justifyContent: 'flex-end',
    },
    backdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    card: { 
      backgroundColor: Colors.light.background,
      borderTopLeftRadius: DESIGN_TOKENS.radius.lg,
      borderTopRightRadius: DESIGN_TOKENS.radius.lg,
      paddingTop: DESIGN_TOKENS.spacing.md,
      paddingBottom: insets.bottom || DESIGN_TOKENS.spacing.lg,
      maxHeight: '95%',
      minHeight: '75%', // Plus haut maintenant
      height: '85%', // Hauteur fixe pour une belle proportion
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -12 },
      shadowOpacity: 0.3,
      shadowRadius: 24,
      elevation: 16,
      overflow: 'hidden',
    },
    glassEffect: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 1,
      backgroundColor: Colors.light.primary,
      opacity: 0.6,
    },
    
    // Header styles
    dragHandle: {
      width: 40,
      height: 4,
      backgroundColor: Colors.light.border,
      borderRadius: 2,
      alignSelf: 'center',
      marginVertical: DESIGN_TOKENS.spacing.sm,
    },
    headerGradient: {
      paddingHorizontal: DESIGN_TOKENS.spacing.lg,
      paddingVertical: DESIGN_TOKENS.spacing.lg,
    },
    headerContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    headerTitle: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: DESIGN_TOKENS.spacing.sm,
    },
    title: {
      color: Colors.light.text,
      fontSize: DESIGN_TOKENS.typography.title.fontSize,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    subtitle: {
      color: Colors.light.textSecondary,
      fontSize: DESIGN_TOKENS.typography.caption.fontSize,
      marginTop: 2,
    },
    closeBtn: {
      backgroundColor: Colors.light.backgroundTertiary,
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: Colors.light.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    
    // Content styles
    scrollContent: {
      padding: DESIGN_TOKENS.spacing.lg,
      gap: DESIGN_TOKENS.spacing.lg,
    },
    contractBloc: {
      backgroundColor: Colors.light.backgroundSecondary,
      padding: DESIGN_TOKENS.spacing.lg,
      borderRadius: DESIGN_TOKENS.radius.lg,
      borderWidth: 1,
      borderColor: Colors.light.border,
    },
    contractHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: DESIGN_TOKENS.spacing.sm,
      marginBottom: DESIGN_TOKENS.spacing.md,
    },
    contractTitle: {
      color: Colors.light.text,
      fontSize: DESIGN_TOKENS.typography.subtitle.fontSize,
      fontWeight: DESIGN_TOKENS.typography.subtitle.fontWeight,
    },
    contractBlocContent: {
      color: Colors.light.text,
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      lineHeight: DESIGN_TOKENS.typography.body.lineHeight,
      marginBottom: DESIGN_TOKENS.spacing.md,
      textAlign: 'justify',
    },
    lastLine: {
      color: Colors.light.textSecondary,
      fontSize: DESIGN_TOKENS.typography.caption.fontSize,
      textAlign: 'center',
      fontStyle: 'italic',
    },
    
    // Signature section styles - MODERNE MAIS CANVAS PRÉSERVÉ
    signingBloc: { 
      backgroundColor: 'white',
      borderRadius: DESIGN_TOKENS.radius.lg,
      marginHorizontal: DESIGN_TOKENS.spacing.lg,
      marginBottom: DESIGN_TOKENS.spacing.lg,
      shadowColor: Colors.light.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
      overflow: 'hidden',
    },
    signingHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: DESIGN_TOKENS.spacing.sm,
      padding: DESIGN_TOKENS.spacing.lg,
      paddingBottom: DESIGN_TOKENS.spacing.md,
    },
    signingTitle: {
      color: Colors.light.text,
      fontSize: DESIGN_TOKENS.typography.subtitle.fontSize,
      fontWeight: '600',
      flex: 1,
    },
    canvasWrapper: {
      paddingHorizontal: DESIGN_TOKENS.spacing.lg,
      paddingBottom: DESIGN_TOKENS.spacing.md,
    },
    canvasContainer: {
      borderRadius: DESIGN_TOKENS.radius.md,
      borderWidth: 2,
      overflow: 'hidden',
      backgroundColor: 'white',
    },
    // CANVAS STYLES - PRÉSERVÉS EXACTEMENT
    signingCanvas: { flex: 1, backgroundColor: '#fff', height: 150 },
    signingCanvasContainer: { height: 170, overflow: 'hidden', marginBottom: 20, padding: 10 },
    
    // Button styles - MODERNES
    buttonRow: { 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      gap: DESIGN_TOKENS.spacing.sm,
      padding: DESIGN_TOKENS.spacing.lg,
      paddingBottom: DESIGN_TOKENS.spacing.lg,
      backgroundColor: Colors.light.backgroundSecondary,
    },
    btn: {
      paddingVertical: DESIGN_TOKENS.spacing.sm + 2,
      paddingHorizontal: DESIGN_TOKENS.spacing.lg,
      borderRadius: DESIGN_TOKENS.radius.lg,
      minHeight: DESIGN_TOKENS.touch.minSize,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: Colors.light.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    btnSecondary: {
      backgroundColor: 'white',
      borderWidth: 1.5,
      borderColor: Colors.light.border,
    },
    btnPrimary: {
      backgroundColor: Colors.light.primary,
      flex: 1.5,
    },
    btnDisabled: { 
      opacity: 0.6,
      transform: [{ scale: 0.95 }],
    },
    btnText: {
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      fontWeight: '600',
      letterSpacing: 0.3,
    },
    btnTextSecondary: {
      color: Colors.light.text,
    },
    btnTextPrimary: {
      color: 'white',
    },
    
    // Status styles
    hint: {
      color: Colors.light.textSecondary,
      fontSize: DESIGN_TOKENS.typography.caption.fontSize,
      textAlign: 'center',
      marginTop: DESIGN_TOKENS.spacing.sm,
    },
    savingBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: DESIGN_TOKENS.spacing.xs,
      padding: DESIGN_TOKENS.spacing.sm,
    },
  });

  // Convertit le data URL en fichier PNG dans le sandbox Expo
  const dataUrlToPngFile = async (dataUrl: string) => {
    const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '');
    const uri = `${FileSystem.documentDirectory}signature_${Date.now()}.png`;
    await FileSystem.writeAsStringAsync(uri, base64, { encoding: FileSystem.EncodingType.Base64 });
    return uri;
  };

  // Appelé par readSignature() -> la lib retourne 'sig' (data URL)
  const handleSignatureOK = async (sig: string) => {
    try {
      setIsSaving(true);
      const fileUri = await dataUrlToPngFile(sig);

      // Stocke à la fois la data URL et le chemin fichier dans le job
      setJob(prev => ({
        ...prev,
        signatureDataUrl: sig,
        signatureFileUri: fileUri,
      }));

      // Callback externe
      onSave(sig);
      setIsSigning(false);
      
      // Animation de succès puis fermeture
      setTimeout(() => {
        handleClose();
      }, 500);
      
      // Confirmation moderne
      Alert.alert(
        "✅ Signature Saved",
        "Your signature has been successfully saved.",
        [{ text: "Perfect!" }]
      );
    } catch (error) {
      console.error('Signature save error:', error);
      Alert.alert(
        'Save Error',
        "Unable to save signature. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Déclenche la lecture du canvas -> handleSignatureOK reçoit la dataURL
  const handleSave = () => {
    if (isSaving) return;
    signatureRef.current?.readSignature();
  };

  const handleClose = () => {
    if (isSaving) return; // évite de fermer pendant l'écriture fichier
    setIsSigning(false);
    
    // Animation de fermeture puis fermeture réelle
    Animated.parallel([
      Animated.timing(backdropAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnimation, {
        toValue: screenHeight * 0.8,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnimation, {
        toValue: 0.8,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Fermeture réelle après l'animation
      setIsVisible(false);
    });
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      hardwareAccelerated
      statusBarTranslucent={Platform.OS === 'android'}
      presentationStyle="overFullScreen"
    >
      <View style={styles.mask}>
        {/* Backdrop animé */}
        <Animated.View 
          style={[
            styles.backdrop,
            { opacity: backdropAnimation }
          ]} 
        />
        
        {/* Modal content avec animations */}
        <Animated.View
          style={[
            styles.card,
            {
              transform: [
                { translateY: slideAnimation },
                { scale: scaleAnimation }
              ]
            }
          ]}
        >
          {/* Drag handle */}
          <View style={styles.dragHandle} />
          
          {/* Glass effect line */}
          <View style={styles.glassEffect} />
          
          {/* Header moderne avec gradient */}
          <LinearGradient
            colors={[Colors.light.background, Colors.light.backgroundSecondary + '40']}
            style={styles.headerGradient}
          >
            <View style={styles.headerContent}>
              <View style={styles.headerTitle}>
                <View style={{
                  backgroundColor: Colors.light.primary + '20',
                  padding: 8,
                  borderRadius: 12,
                }}>
                  <Ionicons name="document-text" size={24} color={Colors.light.primary} />
                </View>
                <View>
                  <Text style={styles.title}>Contract Signature</Text>
                  <Text style={styles.subtitle}>Job #{job.id}</Text>
                </View>
              </View>
              
              <Pressable
                onPress={handleClose}
                disabled={isSaving}
                style={[styles.closeBtn, isSaving && styles.btnDisabled]}
              >
                <Ionicons name="close" size={20} color={Colors.light.textSecondary} />
              </Pressable>
            </View>
          </LinearGradient>

          {/* Content scrollable */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ flexGrow: 1 }}
            scrollEnabled={!isSigning}
            showsVerticalScrollIndicator={false}
          >
            {/* Contract Section moderne */}
            <View style={styles.contractBloc}>
              <View style={styles.contractHeader}>
                <Ionicons name="shield-checkmark" size={20} color={Colors.light.success} />
                <Text style={styles.contractTitle}>Service Agreement</Text>
              </View>
              <Text style={styles.contractBlocContent}>
                This service agreement outlines the terms and conditions for the moving and transportation services provided by Swift Moving Services. 
                The contractor agrees to handle all items with professional care and follow industry safety standards.
              </Text>
              <Text style={styles.lastLine}>
                By signing below, you acknowledge receipt of services and agree to the terms of this contract.
              </Text>
            </View>

            {/* Signature Section avec animations */}
            <View style={styles.signingBloc}>
              <View style={styles.signingHeader}>
                <Ionicons name="create" size={22} color={Colors.light.primary} />
                <Text style={styles.signingTitle}>Digital Signature</Text>
                {ready && (
                  <View style={{
                    backgroundColor: Colors.light.success + '20',
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 12,
                  }}>
                    <Text style={{
                      color: Colors.light.success,
                      fontSize: 12,
                      fontWeight: '600',
                    }}>Ready</Text>
                  </View>
                )}
              </View>

              {/* Canvas avec effet de glow animé */}
              <View style={styles.canvasWrapper}>
                <Animated.View style={[
                  styles.canvasContainer,
                  {
                    borderColor: canvasGlowAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [Colors.light.border, Colors.light.primary]
                    }),
                    shadowColor: Colors.light.primary,
                    shadowOpacity: canvasGlowAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 0.4]
                    }),
                    shadowRadius: 12,
                    elevation: isSigning ? 12 : 2,
                    transform: [{
                      scale: canvasGlowAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.02]
                      })
                    }]
                  }
                ]}>
                  {/* CANVAS CONTAINER - STRUCTURE EXACTE PRÉSERVÉE */}
                  <View style={styles.signingCanvasContainer}>
                    <Signature
                      key={isVisible ? 'open' : 'closed'}
                      ref={signatureRef}
                      onOK={handleSignatureOK}
                      onEmpty={() => Alert.alert('Empty Signature', 'Please provide a signature before saving.')}
                      onBegin={() => setIsSigning(true)}
                      onEnd={() => setIsSigning(false)}
                      autoClear={false}
                      onLoadEnd={() => setReady(true)}
                      style={styles.signingCanvas}
                      webStyle={`
                        html, body { height:150px; margin:0; }
                        .m-signature-pad { box-shadow:none; border:0; height:150px; }
                        .m-signature-pad--body { height:150px; border:1px solid #e5e7eb; }
                        .m-signature-pad--footer { display:none; }
                        canvas { width:100% !important; height:150px !important; touch-action: none; overscroll-behavior: contain; }
                      `}
                    />
                  </View>
                </Animated.View>
                
                {/* Indicateurs d'état */}
                {!ready && (
                  <View style={styles.savingBar}>
                    <ActivityIndicator size="small" color={Colors.light.primary} />
                    <Text style={styles.hint}>Initializing signature pad...</Text>
                  </View>
                )}
                
                {isSigning && (
                  <View style={[styles.savingBar, { backgroundColor: Colors.light.primary + '10' }]}>
                    <Ionicons name="create" size={16} color={Colors.light.primary} />
                    <Text style={[styles.hint, { color: Colors.light.primary, fontWeight: '600' }]}>
                      ✨ Signing in progress...
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons modernes */}
          <View style={styles.buttonRow}>
            <Pressable
              onPress={() => signatureRef.current?.clearSignature()}
              style={[styles.btn, styles.btnSecondary, isSaving && styles.btnDisabled]}
              disabled={isSaving}
            >
              <Ionicons name="refresh" size={16} color={Colors.light.text} style={{ marginRight: 6 }} />
              <Text style={[styles.btnText, styles.btnTextSecondary]}>Clear</Text>
            </Pressable>

            <Pressable 
              onPress={handleSave} 
              style={[styles.btn, styles.btnPrimary, isSaving && styles.btnDisabled]} 
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="white" style={{ marginRight: 8 }} />
              ) : (
                <Ionicons name="checkmark" size={16} color="white" style={{ marginRight: 6 }} />
              )}
              <Text style={[styles.btnText, styles.btnTextPrimary]}>
                {isSaving ? 'Saving...' : 'Save Signature'}
              </Text>
            </Pressable>

            <Pressable 
              onPress={handleClose} 
              style={[styles.btn, styles.btnSecondary, isSaving && styles.btnDisabled]} 
              disabled={isSaving}
            >
              <Text style={[styles.btnText, styles.btnTextSecondary]}>Cancel</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default SigningBloc;
