/**
 * PhotoSelectionModal - Modal de sélection de photo avec caméra et galerie
 */
import Ionicons from '@react-native-vector-icons/ionicons';
import * as ImagePicker from 'expo-image-picker';
import React from 'react';
import {
    Alert,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { DESIGN_TOKENS } from '../../../constants/Styles';
import { useTheme } from '../../../context/ThemeProvider';
import { compressImage } from '../../../utils/imageCompression';

interface PhotoSelectionModalProps {
    isVisible: boolean;
    onClose: () => void;
    onPhotoSelected: (photoUri: string) => void;
    jobId: string;
}

const PhotoSelectionModal: React.FC<PhotoSelectionModalProps> = ({
    isVisible,
    onClose,
    onPhotoSelected,
    jobId
}) => {
    const { colors } = useTheme();

    // Vérifier et demander les permissions
    const requestPermissions = async () => {
        console.log('🔐 [DEBUG] Demande des permissions...');
        
        const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
        console.log('📷 [DEBUG] Permission caméra:', cameraStatus);
        
        const { status: mediaLibraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        console.log('🖼️ [DEBUG] Permission galerie:', mediaLibraryStatus);
        
        return {
            camera: cameraStatus === 'granted',
            mediaLibrary: mediaLibraryStatus === 'granted'
        };
    };

    // Prendre une photo avec la caméra
    const handleTakePhoto = async () => {
        console.log('📸 [DEBUG] handleTakePhoto - DÉBUT');
        
        try {
            console.log('🔐 [DEBUG] Vérification des permissions...');
            const permissions = await requestPermissions();
            
            console.log('🔐 [DEBUG] Permissions reçues:', permissions);
            
            if (!permissions.camera) {
                console.log('❌ [DEBUG] Permission caméra refusée');
                Alert.alert(
                    'Permission requise',
                    'L\'accès à la caméra est nécessaire pour prendre des photos.',
                    [{ text: 'OK' }]
                );
                return;
            }

            console.log('✅ [DEBUG] Permission caméra OK, lancement...');
            
            // Lancer la caméra SANS crop (allowsEditing: false)
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: 'images',
                allowsEditing: false, // ✅ DÉSACTIVÉ - Pas de crop forcé
                quality: 0.6, // ✅ Qualité optimale (~400KB)
            });

            console.log('📸 [DEBUG] Résultat caméra:', result);

            if (!result.canceled && result.assets[0]) {
                const originalUri = result.assets[0].uri;
                console.log('✅ [DEBUG] Photo prise, URI:', originalUri);
                
                console.log('🗜️ [DEBUG] Début compression...');
                
                // Compresser l'image avant de la passer au parent
                const compressed = await compressImage(result.assets[0].uri, {
                    maxWidth: 1920,
                    maxHeight: 1080,
                    quality: 0.6,
                });
                
                console.log('✅ [DEBUG] Image compressée:', compressed);
                
                console.log('📤 [DEBUG] Envoi au parent via onPhotoSelected...');
                
                onPhotoSelected(compressed.uri);
                
                console.log('✅ [DEBUG] Photo envoyée, fermeture modal...');
                
                onClose();
                
                console.log('✅ [DEBUG] handleTakePhoto - FIN SUCCÈS');
            } else {
                console.log('❌ [DEBUG] Prise de photo annulée par l\'utilisateur');
            }
        } catch (error) {
            console.error('❌ [DEBUG] ERREUR dans handleTakePhoto:', error);
            console.error('❌ [DEBUG] Stack trace:', error instanceof Error ? error.stack : 'N/A');
            Alert.alert('Erreur', 'Impossible de prendre la photo.');
        }
    };

    // Sélectionner une photo dans la galerie
    const handleSelectFromGallery = async () => {
        console.log('🖼️ [DEBUG] handleSelectFromGallery - DÉBUT');
        
        try {
            console.log('🔐 [DEBUG] Vérification des permissions...');
            const permissions = await requestPermissions();
            
            console.log('🔐 [DEBUG] Permissions reçues:', permissions);
            
            if (!permissions.mediaLibrary) {
                console.log('❌ [DEBUG] Permission galerie refusée');
                Alert.alert(
                    'Permission requise',
                    'L\'accès à la galerie est nécessaire pour sélectionner des photos.',
                    [{ text: 'OK' }]
                );
                return;
            }

            console.log('✅ [DEBUG] Permission galerie OK, lancement...');
            
            // Lancer la galerie SANS crop (allowsEditing: false)
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: 'images',
                allowsEditing: false, // ✅ DÉSACTIVÉ - Pas de crop forcé
                quality: 0.6, // ✅ Qualité optimale (~400KB)
            });

            console.log('🖼️ [DEBUG] Résultat galerie:', result);

            if (!result.canceled && result.assets[0]) {
                const originalUri = result.assets[0].uri;
                console.log('✅ [DEBUG] Photo sélectionnée, URI:', originalUri);
                
                console.log('🗜️ [DEBUG] Début compression...');
                
                // Compresser l'image avant de la passer au parent
                const compressed = await compressImage(result.assets[0].uri, {
                    maxWidth: 1920,
                    maxHeight: 1080,
                    quality: 0.6,
                });
                
                console.log('✅ [DEBUG] Image compressée:', compressed);
                
                console.log('📤 [DEBUG] Envoi au parent via onPhotoSelected...');
                
                onPhotoSelected(compressed.uri);
                
                console.log('✅ [DEBUG] Photo envoyée, fermeture modal...');
                
                onClose();
                
                console.log('✅ [DEBUG] handleSelectFromGallery - FIN SUCCÈS');
            } else {
                console.log('❌ [DEBUG] Sélection annulée par l\'utilisateur');
            }
        } catch (error) {
            console.error('❌ [DEBUG] ERREUR dans handleSelectFromGallery:', error);
            console.error('❌ [DEBUG] Stack trace:', error instanceof Error ? error.stack : 'N/A');
            Alert.alert('Erreur', 'Impossible de sélectionner la photo.');
        }
    };

    const styles = StyleSheet.create({
        overlay: {
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
        },
        container: {
            backgroundColor: colors.background,
            borderRadius: DESIGN_TOKENS.radius.lg,
            padding: DESIGN_TOKENS.spacing.lg,
            margin: DESIGN_TOKENS.spacing.lg,
            minWidth: 300,
            maxWidth: 400,
        },
        header: {
            alignItems: 'center',
            marginBottom: DESIGN_TOKENS.spacing.lg,
        },
        title: {
            fontSize: 20,
            fontWeight: '700',
            color: colors.text,
            marginTop: DESIGN_TOKENS.spacing.sm,
        },
        subtitle: {
            fontSize: 14,
            color: colors.textSecondary,
            textAlign: 'center',
            marginTop: DESIGN_TOKENS.spacing.xs,
        },
        optionsContainer: {
            gap: DESIGN_TOKENS.spacing.md,
            marginBottom: DESIGN_TOKENS.spacing.lg,
        },
        optionButton: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: DESIGN_TOKENS.spacing.lg,
            borderRadius: DESIGN_TOKENS.radius.lg,
            borderWidth: 2,
            borderColor: colors.border,
        },
        optionButtonPressed: {
            backgroundColor: colors.backgroundSecondary,
            borderColor: colors.primary,
        },
        optionIcon: {
            width: 48,
            height: 48,
            borderRadius: 24,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: DESIGN_TOKENS.spacing.md,
        },
        cameraIcon: {
            backgroundColor: colors.primary + '20',
        },
        galleryIcon: {
            backgroundColor: colors.success + '20',
        },
        optionTextContainer: {
            flex: 1,
        },
        optionTitle: {
            fontSize: 16,
            fontWeight: '600',
            color: colors.text,
        },
        optionDescription: {
            fontSize: 13,
            color: colors.textSecondary,
            marginTop: 2,
        },
        cancelButton: {
            alignItems: 'center',
            padding: DESIGN_TOKENS.spacing.md,
            borderRadius: DESIGN_TOKENS.radius.lg,
            borderWidth: 1,
            borderColor: colors.border,
        },
        cancelButtonPressed: {
            backgroundColor: colors.backgroundSecondary,
        },
        cancelText: {
            fontSize: 16,
            fontWeight: '600',
            color: colors.textSecondary,
        },
    });

    return (
        <Modal
            visible={isVisible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <Pressable style={styles.overlay} onPress={onClose}>
                <Pressable onPress={e => e.stopPropagation()}>
                    <View style={styles.container}>
                        {/* Header */}
                        <View style={styles.header}>
                            <View style={[styles.optionIcon, { backgroundColor: colors.tint + '20' }]}>
                                <Ionicons name="camera" size={24} color={colors.tint} />
                            </View>
                            <Text style={styles.title}>Ajouter une Photo</Text>
                            <Text style={styles.subtitle}>
                                Choisissez comment ajouter une photo à ce job
                            </Text>
                        </View>

                        {/* Options */}
                        <View style={styles.optionsContainer}>
                            <Pressable
                                onPress={handleTakePhoto}
                                style={({ pressed }) => [
                                    styles.optionButton,
                                    pressed && styles.optionButtonPressed,
                                ]}
                            >
                                <View style={[styles.optionIcon, styles.cameraIcon]}>
                                    <Ionicons name="camera" size={24} color={colors.primary} />
                                </View>
                                <View style={styles.optionTextContainer}>
                                    <Text style={styles.optionTitle}>Prendre une photo</Text>
                                    <Text style={styles.optionDescription}>
                                        Utiliser l'appareil photo pour capturer une nouvelle image
                                    </Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                            </Pressable>

                            <Pressable
                                onPress={handleSelectFromGallery}
                                style={({ pressed }) => [
                                    styles.optionButton,
                                    pressed && styles.optionButtonPressed,
                                ]}
                            >
                                <View style={[styles.optionIcon, styles.galleryIcon]}>
                                    <Ionicons name="images" size={24} color={colors.success} />
                                </View>
                                <View style={styles.optionTextContainer}>
                                    <Text style={styles.optionTitle}>Choisir dans la galerie</Text>
                                    <Text style={styles.optionDescription}>
                                        Sélectionner une image existante de votre galerie
                                    </Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                            </Pressable>
                        </View>

                        {/* Cancel Button */}
                        <Pressable
                            onPress={onClose}
                            style={({ pressed }) => [
                                styles.cancelButton,
                                pressed && styles.cancelButtonPressed,
                            ]}
                        >
                            <Text style={styles.cancelText}>Annuler</Text>
                        </Pressable>
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
};

export default PhotoSelectionModal;