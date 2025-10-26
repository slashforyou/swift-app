/**
 * PhotoSelectionModal - Modal de sélection de photo avec caméra et galerie
 */
import React from 'react';
import { 
    View, 
    Text, 
    Modal, 
    Pressable, 
    Alert,
    StyleSheet 
} from 'react-native';
import { useTheme } from '../../../context/ThemeProvider';
import { DESIGN_TOKENS } from '../../../constants/Styles';
import Ionicons from '@react-native-vector-icons/ionicons';
import * as ImagePicker from 'expo-image-picker';
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
        const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
        const { status: mediaLibraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        
        return {
            camera: cameraStatus === 'granted',
            mediaLibrary: mediaLibraryStatus === 'granted'
        };
    };

    // Prendre une photo avec la caméra
    const handleTakePhoto = async () => {
        try {
            const permissions = await requestPermissions();
            
            if (!permissions.camera) {
                Alert.alert(
                    'Permission requise',
                    'L\'accès à la caméra est nécessaire pour prendre des photos.',
                    [{ text: 'OK' }]
                );
                return;
            }

            // Lancer la caméra SANS crop (allowsEditing: false)
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: false, // ✅ DÉSACTIVÉ - Pas de crop forcé
                quality: 0.6, // ✅ Qualité optimale (~400KB)
            });

            if (!result.canceled && result.assets[0]) {
                // Compresser l'image avant de la passer au parent
                const compressed = await compressImage(result.assets[0].uri, {
                    maxWidth: 1920,
                    maxHeight: 1080,
                    quality: 0.6,
                });
                
                onPhotoSelected(compressed.uri);
                onClose();
            }
        } catch (error) {
            console.error('Error taking photo:', error);
            Alert.alert('Erreur', 'Impossible de prendre la photo.');
        }
    };

    // Sélectionner une photo dans la galerie
    const handleSelectFromGallery = async () => {
        try {
            const permissions = await requestPermissions();
            
            if (!permissions.mediaLibrary) {
                Alert.alert(
                    'Permission requise',
                    'L\'accès à la galerie est nécessaire pour sélectionner des photos.',
                    [{ text: 'OK' }]
                );
                return;
            }

            // Lancer la galerie SANS crop (allowsEditing: false)
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: false, // ✅ DÉSACTIVÉ - Pas de crop forcé
                quality: 0.6, // ✅ Qualité optimale (~400KB)
            });

            if (!result.canceled && result.assets[0]) {
                // Compresser l'image avant de la passer au parent
                const compressed = await compressImage(result.assets[0].uri, {
                    maxWidth: 1920,
                    maxHeight: 1080,
                    quality: 0.6,
                });
                
                onPhotoSelected(compressed.uri);
                onClose();
            }
        } catch (error) {
            console.error('Error selecting photo:', error);
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