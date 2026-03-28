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
import { useLocalization } from '../../../localization/useLocalization';

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
    const { t } = useLocalization();

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
                    t('jobDetails.components.photos.permissionRequired'),
                    t('jobDetails.components.photos.cameraPermissionMessage'),
                    [{ text: 'OK' }]
                );
                return;
            }

            
            // Lancer la caméra pour prendre une photo
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ['images'],
                allowsEditing: false, // Désactivé - pas de crop pour les photos de job
                quality: 0.8, // Compression pour réduire la taille
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const photoUri = result.assets[0].uri;
                onPhotoSelected(photoUri);
            }
            
            
            onClose();
            
        } catch (error) {

            console.error('❌ [DEBUG] ERREUR dans handleTakePhoto:', error);
            console.error('❌ [DEBUG] Stack trace:', error instanceof Error ? error.stack : 'N/A');
            Alert.alert(t('jobDetails.components.photos.error'), t('jobDetails.components.photos.takePhotoError'));
        }
    };

    // Sélectionner une photo dans la galerie
    const handleSelectFromGallery = async () => {
        
        try {
            const permissions = await requestPermissions();
            
            
            if (!permissions.mediaLibrary) {
                Alert.alert(
                    t('jobDetails.components.photos.permissionRequired'),
                    t('jobDetails.components.photos.permissionRequiredMessage'),
                    [{ text: t('common.ok') }]
                );
                return;
            }

            
            // Ouvrir la galerie pour sélectionner une photo
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: false, // Désactivé - pas de crop pour les photos de job
                quality: 0.8, // Compression pour réduire la taille
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const photoUri = result.assets[0].uri;
                onPhotoSelected(photoUri);
            }
            
            
            onClose();
            
        } catch (error) {

            console.error('❌ [DEBUG] ERREUR dans handleSelectFromGallery:', error);
            console.error('❌ [DEBUG] Stack trace:', error instanceof Error ? error.stack : 'N/A');
            Alert.alert(t('jobDetails.components.photos.error'), t('jobDetails.components.photos.selectPhotoError'));
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
                            <Text style={styles.title}>{t('jobDetails.components.photos.selectionModal.title')}</Text>
                            <Text style={styles.subtitle}>
                                {t('jobDetails.components.photos.selectionModal.subtitle')}
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
                                    <Text style={styles.optionTitle}>{t('jobDetails.components.photos.selectionModal.takePhoto')}</Text>
                                    <Text style={styles.optionDescription}>
                                        {t('jobDetails.components.photos.selectionModal.takePhotoDescription')}
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
                                    <Text style={styles.optionTitle}>{t('jobDetails.components.photos.selectionModal.selectFromGallery')}</Text>
                                    <Text style={styles.optionDescription}>
                                        {t('jobDetails.components.photos.selectionModal.selectFromGalleryDescription')}
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
                            <Text style={styles.cancelText}>{t('jobDetails.components.photos.cancel')}</Text>
                        </Pressable>
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
};

export default PhotoSelectionModal;
