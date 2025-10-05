import React, { useRef, useState } from 'react';
import { View, Text, Pressable, Modal, Alert, Platform, ScrollView, ActivityIndicator } from 'react-native';
import Signature, { SignatureViewRef } from 'react-native-signature-canvas';
import * as FileSystem from 'expo-file-system';
import { useCommonThemedStyles } from '../hooks/useCommonStyles';

const SigningBloc = ({
  onSave,
  isVisible,
  setIsVisible,
  job,
  setJob
}: {
  onSave: (signature: string) => void;
  isVisible: boolean;
  setIsVisible: React.Dispatch<React.SetStateAction<boolean>>;
  job: any;
  setJob: React.Dispatch<React.SetStateAction<any>>;
}) => {
  const signatureRef = useRef<SignatureViewRef>(null);
  const [ready, setReady] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { colors, styles } = useCommonThemedStyles();

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
      setJob((prev: any) => ({
        ...prev,
        signatureDataUrl: sig,
        signatureFileUri: fileUri,
      }));

      // Callback externe si besoin
      onSave(sig);
      setIsSigning(false);
      setIsVisible(false);
    } catch (e) {
      console.error(e);
      Alert.alert('Erreur', "Impossible d'enregistrer la signature.");
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
    setIsVisible(false);
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      hardwareAccelerated
      statusBarTranslucent
      presentationStyle={Platform.OS === 'ios' ? 'overFullScreen' : undefined}
    >
      <View style={styles.mask}>
        <ScrollView
          style={styles.card}
          contentContainerStyle={styles.cardScrollView}
          scrollEnabled={!isSigning}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled={false}
          bounces={false}
        >
          <View style={styles.contractBloc}>
            <Text style={styles.title}>Contract</Text>
            <Text style={styles.contractBlocContent}>
              This is a sample contract for the removalist service. Please read carefully before signing.
              This contract outlines the terms and conditions of the removalist service provided by Swift.
              By signing this contract, you agree to the terms and conditions outlined herein. The removalist service
              includes the transportation of goods from one location to another, as agreed upon in the service order.
              The removalist will take all necessary precautions to ensure the safety and security of your goods during transportation.
              The removalist is not liable for any damage or loss of goods that occurs during transportation, unless such damage or loss is caused by
              the removalist's negligence or willful misconduct. The removalist will provide you with a receipt for the service rendered,
              which will include the service details, date/time, and total cost.
            </Text>
            <Text style={styles.lastLine}>
              By signing, you agree to the terms and conditions of the contract.
            </Text>
          </View>

          <View style={styles.signingBloc}>
            <Text style={styles.title}>Sign here</Text>

            <View style={styles.signingCanvasContainer}>
              <Signature
                key={isVisible ? 'open' : 'closed'}
                ref={signatureRef}
                onOK={handleSignatureOK}                     // <-- sauvegarde job + fichier ici
                onEmpty={() => Alert.alert('Signature vide')}
                onBegin={() => setIsSigning(true)}            // désactive le scroll
                onEnd={() => setIsSigning(false)}             // réactive le scroll
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

            <View style={[{ flexDirection: 'row', justifyContent: 'space-between', gap: 10, padding: 20, width: '100%' }]}>
              <Pressable
                onPress={() => signatureRef.current?.clearSignature()}
                style={[styles.btn, isSaving && styles.btnDisabled]}
                disabled={isSaving}
              >
                <Text>Clear</Text>
              </Pressable>

              <Pressable onPress={handleSave} style={[styles.btn, isSaving && styles.btnDisabled]} disabled={isSaving}>
                <Text>{isSaving ? 'Saving…' : 'Save'}</Text>
              </Pressable>

              <Pressable onPress={handleClose} style={[styles.btn, isSaving && styles.btnDisabled]} disabled={isSaving}>
                <Text>Cancel</Text>
              </Pressable>
            </View>

            {!ready && <Text style={styles.hint}>Chargement du canvas…</Text>}
            {isSaving && (
              <View style={styles.savingBar}>
                <ActivityIndicator />
                <Text style={styles.hint}>Enregistrement de la signature…</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

export default SigningBloc;
