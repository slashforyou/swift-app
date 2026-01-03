/**
 * VehiclePhotoModal - Modal de sélection de photo pour véhicule
 * VEH-03: Interface pour prendre une photo du véhicule
 */
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { DESIGN_TOKENS } from '../../constants/Styles';
import { useTheme } from '../../context/ThemeProvider';
import { useLocalization } from '../../localization/useLocalization';

interface VehiclePhotoModalProps {
    visible: boolean;
    vehicleId: string;
    vehicleName: string;
    onPhotoSelected: (photoUri: string) => Promise<void>;
    onClose: () => void;
}

const VehiclePhotoModal: React.FC<VehiclePhotoModalProps> = ({
    visible,
    vehicleId,
    vehicleName,
    onPhotoSelected,
    onClose,
}) => {
    const { colors } = useTheme();
    const { t } = useLocalization();
    const [isUploading, setIsUploading] = useState(false);

    // Request permissions
    const requestPermissions = async () => {
        const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
        const { status: mediaLibraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        
        return {
            camera: cameraStatus === 'granted',
            mediaLibrary: mediaLibraryStatus === 'granted'
        };
    };

    // Take photo with camera
    const handleTakePhoto = async () => {
        try {
            const permissions = await requestPermissions();
            
            if (!permissions.camera) {
                Alert.alert(
                    t('vehicles.photo.permissionRequired') || 'Permission Required',
                    t('vehicles.photo.cameraPermissionMessage') || 'Camera access is required to take photos.',
                    [{ text: 'OK' }]
                );
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [16, 9],
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const photoUri = result.assets[0].uri;
                setIsUploading(true);
                
                try {
                    await onPhotoSelected(photoUri);
                    onClose();
                } catch (error) {
                    console.error('Error uploading photo:', error);
                    Alert.alert(
                        t('vehicles.photo.error') || 'Error',
                        t('vehicles.photo.uploadError') || 'Failed to upload photo. Please try again.'
                    );
                } finally {
                    setIsUploading(false);
                }
            }
        } catch (error) {
            console.error('Error taking photo:', error);
            Alert.alert(
                t('vehicles.photo.error') || 'Error',
                t('vehicles.photo.takePhotoError') || 'Failed to take photo.'
            );
        }
    };

    // Select from gallery
    const handleSelectFromGallery = async () => {
        try {
            const permissions = await requestPermissions();
            
            if (!permissions.mediaLibrary) {
                Alert.alert(
                    t('vehicles.photo.permissionRequired') || 'Permission Required',
                    t('vehicles.photo.galleryPermissionMessage') || 'Gallery access is required to select photos.',
                    [{ text: 'OK' }]
                );
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [16, 9],
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const photoUri = result.assets[0].uri;
                setIsUploading(true);
                
                try {
                    await onPhotoSelected(photoUri);
                    onClose();
                } catch (error) {
                    console.error('Error uploading photo:', error);
                    Alert.alert(
                        t('vehicles.photo.error') || 'Error',
                        t('vehicles.photo.uploadError') || 'Failed to upload photo. Please try again.'
                    );
                } finally {
                    setIsUploading(false);
                }
            }
        } catch (error) {
            console.error('Error selecting photo:', error);
            Alert.alert(
                t('vehicles.photo.error') || 'Error',
                t('vehicles.photo.selectPhotoError') || 'Failed to select photo.'
            );
        }
    };

    const styles = StyleSheet.create({
        overlay: {
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: DESIGN_TOKENS.spacing.lg,
        },
        container: {
            backgroundColor: colors.backgroundSecondary,
            borderRadius: DESIGN_TOKENS.radius.lg,
            padding: DESIGN_TOKENS.spacing.xl,
            width: '100%',
            maxWidth: 400,
        },
        header: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: DESIGN_TOKENS.spacing.lg,
        },
        title: {
            fontSize: 18,
            fontWeight: '700',
            color: colors.text,
        },
        subtitle: {
            fontSize: 14,
            color: colors.textSecondary,
            marginTop: 4,
        },
        closeButton: {
            padding: DESIGN_TOKENS.spacing.xs,
        },
        optionsContainer: {
            gap: DESIGN_TOKENS.spacing.md,
        },
        optionButton: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.background,
            padding: DESIGN_TOKENS.spacing.lg,
            borderRadius: DESIGN_TOKENS.radius.md,
            borderWidth: 1,
            borderColor: colors.border,
            gap: DESIGN_TOKENS.spacing.md,
        },
        optionButtonDisabled: {
            opacity: 0.5,
        },
        iconContainer: {
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: colors.primary + '20',
            justifyContent: 'center',
            alignItems: 'center',
        },
        optionContent: {
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
            marginTop: DESIGN_TOKENS.spacing.lg,
            padding: DESIGN_TOKENS.spacing.md,
            alignItems: 'center',
        },
        cancelText: {
            fontSize: 16,
            color: colors.textSecondary,
            fontWeight: '500',
        },
        loadingContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: DESIGN_TOKENS.spacing.sm,
            padding: DESIGN_TOKENS.spacing.lg,
        },
        loadingText: {
            fontSize: 14,
            color: colors.textSecondary,
        },
    });

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <Pressable style={styles.overlay} onPress={onClose}>
                <Pressable style={styles.container} onPress={(e) => e.stopPropagation()}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.title}>
                                {t('vehicles.photo.title') || 'Vehicle Photo'}
                            </Text>
                            <Text style={styles.subtitle}>{vehicleName}</Text>
                        </View>
                        <Pressable style={styles.closeButton} onPress={onClose}>
                            <Ionicons name="close" size={24} color={colors.textSecondary} />
                        </Pressable>
                    </View>

                    {isUploading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="small" color={colors.primary} />
                            <Text style={styles.loadingText}>
                                {t('vehicles.photo.uploading') || 'Uploading photo...'}
                            </Text>
                        </View>
                    ) : (
                        <>
                            {/* Options */}
                            <View style={styles.optionsContainer}>
                                {/* Take Photo */}
                                <Pressable
                                    style={styles.optionButton}
                                    onPress={handleTakePhoto}
                                >
                                    <View style={styles.iconContainer}>
                                        <Ionicons name="camera" size={24} color={colors.primary} />
                                    </View>
                                    <View style={styles.optionContent}>
                                        <Text style={styles.optionTitle}>
                                            {t('vehicles.photo.takePhoto') || 'Take Photo'}
                                        </Text>
                                        <Text style={styles.optionDescription}>
                                            {t('vehicles.photo.takePhotoDesc') || 'Use camera to take a new photo'}
                                        </Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                                </Pressable>

                                {/* Select from Gallery */}
                                <Pressable
                                    style={styles.optionButton}
                                    onPress={handleSelectFromGallery}
                                >
                                    <View style={styles.iconContainer}>
                                        <Ionicons name="images" size={24} color={colors.primary} />
                                    </View>
                                    <View style={styles.optionContent}>
                                        <Text style={styles.optionTitle}>
                                            {t('vehicles.photo.selectFromGallery') || 'Select from Gallery'}
                                        </Text>
                                        <Text style={styles.optionDescription}>
                                            {t('vehicles.photo.selectFromGalleryDesc') || 'Choose an existing photo'}
                                        </Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                                </Pressable>
                            </View>

                            {/* Cancel */}
                            <Pressable style={styles.cancelButton} onPress={onClose}>
                                <Text style={styles.cancelText}>
                                    {t('common.cancel') || 'Cancel'}
                                </Text>
                            </Pressable>
                        </>
                    )}
                </Pressable>
            </Pressable>
        </Modal>
    );
};

export default VehiclePhotoModal;
