import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Dimensions, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Signature, { SignatureViewRef } from 'react-native-signature-canvas';
import { useThemeColors } from '../../hooks/useThemeColor';
import { DESIGN_TOKENS } from '../constants/Styles';
import { useLocalization } from '../localization/useLocalization';

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
  const colors = useThemeColors();
  const { t } = useLocalization();
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
      backgroundColor: colors.background,
      borderTopLeftRadius: DESIGN_TOKENS.radius.lg,
      borderTopRightRadius: DESIGN_TOKENS.radius.lg,
      paddingTop: DESIGN_TOKENS.spacing.md,
      paddingBottom: insets.bottom || DESIGN_TOKENS.spacing.lg,
      maxHeight: '95%',
      minHeight: '75%', // Plus haut maintenant
      height: '85%', // Hauteur fixe pour une belle proportion
      shadowColor: 'colors.text',
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
      backgroundColor: colors.primary,
      opacity: 0.6,
    },
    
    // Header styles
    dragHandle: {
      width: 40,
      height: 4,
      backgroundColor: colors.border,
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
      color: colors.text,
      fontSize: DESIGN_TOKENS.typography.title.fontSize,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    subtitle: {
      color: colors.textSecondary,
      fontSize: DESIGN_TOKENS.typography.caption.fontSize,
      marginTop: 2,
    },
    closeBtn: {
      backgroundColor: colors.backgroundTertiary,
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: colors.shadow,
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
      backgroundColor: colors.backgroundSecondary,
      padding: DESIGN_TOKENS.spacing.lg,
      borderRadius: DESIGN_TOKENS.radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    contractHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: DESIGN_TOKENS.spacing.sm,
      marginBottom: DESIGN_TOKENS.spacing.md,
    },
    contractTitle: {
      color: colors.text,
      fontSize: DESIGN_TOKENS.typography.subtitle.fontSize,
      fontWeight: DESIGN_TOKENS.typography.subtitle.fontWeight,
    },
    contractBlocContent: {
      color: colors.text,
      fontSize: DESIGN_TOKENS.typography.body.fontSize,
      lineHeight: DESIGN_TOKENS.typography.body.lineHeight,
      marginBottom: DESIGN_TOKENS.spacing.md,
      textAlign: 'justify',
    },
    lastLine: {
      color: colors.textSecondary,
      fontSize: DESIGN_TOKENS.typography.caption.fontSize,
      textAlign: 'center',
      fontStyle: 'italic',
    },
    
    // Signature section styles - MODERNE MAIS CANVAS PRÉSERVÉ
    signingBloc: { 
      backgroundColor: colors.background,
      borderRadius: DESIGN_TOKENS.radius.lg,
      marginHorizontal: DESIGN_TOKENS.spacing.lg,
      marginBottom: DESIGN_TOKENS.spacing.lg,
      shadowColor: colors.shadow,
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
      color: colors.text,
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
      backgroundColor: colors.background,
    },
    // CANVAS STYLES - PRÉSERVÉS EXACTEMENT
    signingCanvas: { flex: 1, backgroundColor: colors.background, height: 150 },
    signingCanvasContainer: { height: 170, overflow: 'hidden', marginBottom: 20, padding: 10 },
    
    // Button styles - MODERNES
    buttonRow: { 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      gap: DESIGN_TOKENS.spacing.sm,
      padding: DESIGN_TOKENS.spacing.lg,
      paddingBottom: DESIGN_TOKENS.spacing.lg,
      backgroundColor: colors.backgroundSecondary,
    },
    btn: {
      paddingVertical: DESIGN_TOKENS.spacing.sm + 2,
      paddingHorizontal: DESIGN_TOKENS.spacing.lg,
      borderRadius: DESIGN_TOKENS.radius.lg,
      minHeight: DESIGN_TOKENS.touch.minSize,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    btnSecondary: {
      backgroundColor: colors.background,
      borderWidth: 1.5,
      borderColor: colors.border,
    },
    btnPrimary: {
      backgroundColor: colors.primary,
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
      color: colors.text,
    },
    btnTextPrimary: {
      color: colors.background,
    },
    
    // Status styles
    hint: {
      color: colors.textSecondary,
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
  });// Convertit le data URL en fichier PNG dans le sandbox Expo
  const dataUrlToPngFile = async (dataUrl: string) => {
    const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '');
    // ✅ SESSION 9 FIX: Force type pour éviter erreur TypeScript
    const dir = (FileSystem as any).documentDirectory || (FileSystem as any).cacheDirectory || '';
    const uri = `${dir}signature_${Date.now()}.png`;
    
    // ✅ SESSION 9 FIX: Utiliser l'API legacy officielle d'Expo
    await FileSystem.writeAsStringAsync(uri, base64, { 
      encoding: FileSystem.EncodingType.Base64
    });
    return uri;
  };

  // Appelé par readSignature() -> la lib retourne 'sig' (data URL)
  const handleSignatureOK = async (sig: string) => {
    try {
      setIsSaving(true);
      
      // ✅ ÉTAPE 1: Sauvegarder le fichier localement
      const fileUri = await dataUrlToPngFile(sig);

      // ⚡ VÉRIFICATION SERVEUR: Vérifier si une signature existe déjà sur le backend
      const { checkJobSignatureExists, saveJobSignature } = await import('../services/jobDetails');
      
      // TEMP_DISABLED: console.log('🔍 [SigningBloc] Checking if signature already exists on server for job:', job.id);
      const existingSignature = await checkJobSignatureExists(job.id, 'client');
      
      if (existingSignature.exists) {
        // TEMP_DISABLED: console.log('⚠️ [SigningBloc] Signature already exists on server (id:', existingSignature.signatureId, ')');
        
        // Mettre à jour le state local SANS appeler le backend (car signature existe)
        setJob(prev => ({
          ...prev,
          signatureDataUrl: sig,
          signatureFileUri: fileUri,
          signature_blob: existingSignature.signatureData || sig,
          signature_date: new Date().toISOString(),
        }));
        
        onSave(sig);
        setIsSigning(false);
        
        setTimeout(() => {
          handleClose();
        }, 500);
        
        Alert.alert(
          "✅ Signature Confirmée",
          "Une signature existe déjà pour ce contrat. La signature a été mise à jour localement.",
          [{ text: "OK" }]
        );
        return; // ✅ Ne pas appeler le backend si signature existe
      }

      // ✅ ÉTAPE 2: Envoyer la signature au backend (seulement si nouvelle)
      // TEMP_DISABLED: console.log('📤 [SigningBloc] Uploading NEW signature to server for job:', job.id);
      
      const uploadResult = await saveJobSignature(
        job.id,
        sig, // Data URL complète
        'client' // Type de signature
      );

      if (!uploadResult.success) {
        // TEMP_DISABLED: console.error('❌ [SigningBloc] Server upload failed:', uploadResult.message);
        
        // ⚡ GESTION SPÉCIFIQUE: Signature existe déjà (code 400)
        if (uploadResult.message?.includes('existe déjà')) {
          // TEMP_DISABLED: console.log('⚠️ [SigningBloc] Signature already exists, treating as update');
          
          // Mettre à jour le state local même si backend refuse (signature existe = OK)
          setJob(prev => ({
            ...prev,
            signatureDataUrl: sig,
            signatureFileUri: fileUri,
            signature_blob: sig,
            signature_date: new Date().toISOString(),
          }));
          
          onSave(sig);
          setIsSigning(false);
          
          setTimeout(() => {
            handleClose();
          }, 500);
          
          Alert.alert(
            t('jobDetails.components.signature.signatureUpdated'),
            t('jobDetails.components.signature.signatureUpdatedMessage'),
            [{ text: t('jobDetails.components.signature.ok') }]
          );
          return; // ✅ Continuer malgré erreur backend (signature existe = pas grave)
        }
        
        // Autres erreurs (réseau, etc.)
        Alert.alert(
          t('jobDetails.components.signature.serverError'),
          t('jobDetails.components.signature.serverErrorMessage', { message: uploadResult.message || 'Unknown error' }),
          [{ text: t('jobDetails.components.signature.ok') }]
        );
        return;
      }

      // TEMP_DISABLED: console.log('✅ [SigningBloc] Signature uploaded successfully:', {
      //   signatureId: uploadResult.signatureId,
      //   signatureUrl: uploadResult.signatureUrl
      // });

      // ✅ ÉTAPE 3: Mettre à jour le state local avec la signature ET l'URL serveur
      setJob(prev => ({
        ...prev,
        signatureDataUrl: sig,
        signatureFileUri: fileUri,
        signature_blob: sig, // ⚡ IMPORTANT: Pour la validation
        signature_date: new Date().toISOString(),
        signatureId: uploadResult.signatureId,
        signatureUrl: uploadResult.signatureUrl,
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
        t('jobDetails.components.signature.signatureSaved'),
        t('jobDetails.components.signature.signatureSavedMessage'),
        [{ text: t('jobDetails.components.signature.perfect') }]
      );
    } catch (error) {

      // TEMP_DISABLED: console.error('❌ [SigningBloc] Signature save error:', error);
      Alert.alert(
        t('jobDetails.components.signature.saveError'),
        t('jobDetails.components.signature.saveErrorMessage'),
        [{ text: t('jobDetails.components.signature.ok') }]
      );
    } finally {
      setIsSaving(false)
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
            colors={[colors.background, colors.backgroundSecondary + '40']}
            style={styles.headerGradient}
          >
            <View style={styles.headerContent}>
              <View style={styles.headerTitle}>
                <View style={{
                  backgroundColor: colors.primary + '20',
                  padding: 8,
                  borderRadius: 12,
                }}>
                  <Ionicons name="document-text" size={24} color={colors.primary} />
                </View>
                <View>
                  <Text style={styles.title}>{t('jobDetails.components.signature.title')}</Text>
                  <Text style={styles.subtitle}>{t('jobDetails.components.signature.subtitle', { id: job.id })}</Text>
                </View>
              </View>
              
              <Pressable
                onPress={handleClose}
                disabled={isSaving}
                style={[styles.closeBtn, isSaving && styles.btnDisabled]}
              >
                <Ionicons name="close" size={20} color={colors.textSecondary} />
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
                <Ionicons name="shield-checkmark" size={20} color={colors.success} />
                <Text style={styles.contractTitle}>{t('jobDetails.components.signature.contractTitle')}</Text>
              </View>
              <Text style={styles.contractBlocContent}>
                {t('jobDetails.components.signature.contractContent')}
              </Text>
              <Text style={styles.lastLine}>
                {t('jobDetails.components.signature.contractAcknowledge')}
              </Text>
            </View>

            {/* Signature Section avec animations */}
            <View style={styles.signingBloc}>
              <View style={styles.signingHeader}>
                <Ionicons name="create" size={22} color={colors.primary} />
                <Text style={styles.signingTitle}>{t('jobDetails.components.signature.digitalSignature')}</Text>
                {ready && (
                  <View style={{
                    backgroundColor: colors.success + '20',
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 12,
                  }}>
                    <Text style={{
                      color: colors.success,
                      fontSize: 12,
                      fontWeight: '600',
                    }}>{t('jobDetails.components.signature.ready')}</Text>
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
                      outputRange: [colors.border, colors.primary]
                    }),
                    shadowColor: colors.primary,
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
                      onEmpty={() => Alert.alert(t('jobDetails.components.signature.emptySignature'), t('jobDetails.components.signature.emptySignatureMessage'))}
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
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={styles.hint}>{t('jobDetails.components.signature.initializing')}</Text>
                  </View>
                )}
                
                {isSigning && (
                  <View style={[styles.savingBar, { backgroundColor: colors.primary + '10' }]}>
                    <Ionicons name="create" size={16} color={colors.primary} />
                    <Text style={[styles.hint, { color: colors.primary, fontWeight: '600' }]}>
                      {t('jobDetails.components.signature.signingInProgress')}
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
              <Ionicons name="refresh" size={16} color={colors.text} style={{ marginRight: 6 }} />
              <Text style={[styles.btnText, styles.btnTextSecondary]}>{t('jobDetails.components.signature.clear')}</Text>
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
                {isSaving ? t('jobDetails.components.signature.saving') : t('jobDetails.components.signature.save')}
              </Text>
            </Pressable>

            <Pressable 
              onPress={handleClose} 
              style={[styles.btn, styles.btnSecondary, isSaving && styles.btnDisabled]} 
              disabled={isSaving}
            >
              <Text style={[styles.btnText, styles.btnTextSecondary]}>{t('jobDetails.components.signature.cancel')}</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default SigningBloc;
