/**
 * VehicleAssignmentModal - Modal pour assigner/dissocier un véhicule à un job
 * Permet de choisir parmi les véhicules de la compagnie ou d'en créer un nouveau
 */
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { DESIGN_TOKENS } from '../../constants/Styles';
import { useTheme } from '../../context/ThemeProvider';
import { useLocalization } from '../../localization/useLocalization';
import { BusinessVehicle, fetchBusinessVehicles } from '../../services/business/vehiclesService';
import { updateJob } from '../../services/jobs';
import { fetchUserProfile } from '../../services/user';
import AddVehicleModal from './AddVehicleModal';

interface VehicleAssignmentModalProps {
    visible: boolean;
    onClose: () => void;
    jobId: string;
    currentVehicle?: {
        name: string;
        licensePlate: string;
    } | null;
    onVehicleAssigned: (vehicle: { name: string; licensePlate: string } | null) => void;
}

export default function VehicleAssignmentModal({
    visible,
    onClose,
    jobId,
    currentVehicle,
    onVehicleAssigned,
}: VehicleAssignmentModalProps) {
    const { colors } = useTheme();
    const { t } = useLocalization();
    
    const [vehicles, setVehicles] = useState<BusinessVehicle[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedVehicle, setSelectedVehicle] = useState<BusinessVehicle | null>(null);
    const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
    const [companyId, setCompanyId] = useState<string | null>(null);

    // Charger les véhicules de la compagnie
    useEffect(() => {
        if (visible) {
            loadCompanyIdAndVehicles();
        }
    }, [visible]);

    const loadCompanyIdAndVehicles = async () => {
        setIsLoading(true);
        try {
            // Obtenir le company ID à partir du profil utilisateur
            const profile = await fetchUserProfile();
            const userId = profile.id.toString();
            
            // Utiliser le même mapping que StripeService pour le company_id
            // TODO: À terme, l'API devrait retourner le company_id dans le profil
            const resolvedCompanyId = userId === '15' ? '1' : userId;
            setCompanyId(resolvedCompanyId);
            
            // Charger les véhicules
            const data = await fetchBusinessVehicles(resolvedCompanyId);
            setVehicles(data);
        } catch (error) {
            console.error('Error loading vehicles:', error);
            Alert.alert(
                t('common.error'),
                t('jobDetails.components.truckDetails.loadError')
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectVehicle = (vehicle: BusinessVehicle) => {
        setSelectedVehicle(vehicle);
    };

    const handleAssignVehicle = async () => {
        if (!selectedVehicle) return;

        setIsSubmitting(true);
        try {
            await updateJob(jobId, {
                truck: {
                    name: selectedVehicle.name,
                    licensePlate: selectedVehicle.registration,
                },
            });

            onVehicleAssigned({
                name: selectedVehicle.name,
                licensePlate: selectedVehicle.registration,
            });

            Alert.alert(
                t('common.success'),
                t('jobDetails.components.truckDetails.assignSuccess')
            );
            onClose();
        } catch (error) {
            console.error('Error assigning vehicle:', error);
            Alert.alert(
                t('common.error'),
                t('jobDetails.components.truckDetails.assignError')
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRemoveVehicle = async () => {
        Alert.alert(
            t('jobDetails.components.truckDetails.removeConfirmTitle'),
            t('jobDetails.components.truckDetails.removeConfirmMessage'),
            [
                {
                    text: t('common.cancel'),
                    style: 'cancel',
                },
                {
                    text: t('common.confirm'),
                    style: 'destructive',
                    onPress: async () => {
                        setIsSubmitting(true);
                        try {
                            await updateJob(jobId, {
                                truck: undefined,
                            });

                            onVehicleAssigned(null);
                            Alert.alert(
                                t('common.success'),
                                t('jobDetails.components.truckDetails.removeSuccess')
                            );
                            onClose();
                        } catch (error) {
                            console.error('Error removing vehicle:', error);
                            Alert.alert(
                                t('common.error'),
                                t('jobDetails.components.truckDetails.removeError')
                            );
                        } finally {
                            setIsSubmitting(false);
                        }
                    },
                },
            ]
        );
    };

    const handleAddVehicle = async (vehicleData: any) => {
        // Le modal AddVehicleModal gère l'ajout via l'API
        // Après l'ajout, on recharge la liste
        await loadCompanyIdAndVehicles();
        setShowAddVehicleModal(false);
    };

    const renderVehicleItem = ({ item }: { item: BusinessVehicle }) => {
        const isSelected = selectedVehicle?.id === item.id;
        const isCurrentVehicle = currentVehicle?.licensePlate === item.registration;

        return (
            <Pressable
                style={[
                    styles.vehicleItem,
                    {
                        backgroundColor: isSelected ? colors.primary + '20' : colors.backgroundSecondary,
                        borderColor: isSelected ? colors.primary : colors.border,
                    },
                ]}
                onPress={() => handleSelectVehicle(item)}
            >
                <View style={styles.vehicleIcon}>
                    <Text style={{ fontSize: 28 }}>
                        {item.type === 'moving-truck' ? '🚛' :
                         item.type === 'van' ? '🚐' :
                         item.type === 'trailer' ? '🚜' :
                         item.type === 'ute' ? '🛻' : '🚚'}
                    </Text>
                </View>
                <View style={styles.vehicleInfo}>
                    <Text style={[styles.vehicleName, { color: colors.text }]}>
                        {item.name}
                    </Text>
                    <Text style={[styles.vehicleDetails, { color: colors.textSecondary }]}>
                        {item.make} {item.model} • {item.registration}
                    </Text>
                    <View style={styles.statusRow}>
                        <View style={[
                            styles.statusBadge,
                            {
                                backgroundColor: item.status === 'available'
                                    ? colors.success + '20'
                                    : item.status === 'in-use'
                                    ? colors.warning + '20'
                                    : colors.error + '20',
                            },
                        ]}>
                            <Text style={[
                                styles.statusText,
                                {
                                    color: item.status === 'available'
                                        ? colors.success
                                        : item.status === 'in-use'
                                        ? colors.warning
                                        : colors.error,
                                },
                            ]}>
                                {t(`vehicles.status.${item.status}`)}
                            </Text>
                        </View>
                        {isCurrentVehicle && (
                            <View style={[styles.currentBadge, { backgroundColor: colors.primary + '20' }]}>
                                <Text style={[styles.currentText, { color: colors.primary }]}>
                                    {t('jobDetails.components.truckDetails.currentVehicle')}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
                {isSelected && (
                    <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                )}
            </Pressable>
        );
    };

    const styles = StyleSheet.create({
        overlay: {
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'flex-end',
        },
        container: {
            backgroundColor: colors.background,
            borderTopLeftRadius: DESIGN_TOKENS.radius.xl,
            borderTopRightRadius: DESIGN_TOKENS.radius.xl,
            maxHeight: '85%',
            paddingBottom: 34,
        },
        header: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: DESIGN_TOKENS.spacing.lg,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
        },
        title: {
            fontSize: 20,
            fontWeight: '700',
            color: colors.text,
        },
        closeButton: {
            padding: DESIGN_TOKENS.spacing.xs,
        },
        content: {
            padding: DESIGN_TOKENS.spacing.lg,
        },
        sectionTitle: {
            fontSize: 16,
            fontWeight: '600',
            color: colors.text,
            marginBottom: DESIGN_TOKENS.spacing.md,
        },
        loadingContainer: {
            padding: DESIGN_TOKENS.spacing.xl,
            alignItems: 'center',
        },
        emptyContainer: {
            padding: DESIGN_TOKENS.spacing.xl,
            alignItems: 'center',
        },
        emptyText: {
            fontSize: 16,
            color: colors.textSecondary,
            textAlign: 'center',
            marginBottom: DESIGN_TOKENS.spacing.lg,
        },
        vehicleItem: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: DESIGN_TOKENS.spacing.md,
            borderRadius: DESIGN_TOKENS.radius.lg,
            borderWidth: 2,
            marginBottom: DESIGN_TOKENS.spacing.sm,
        },
        vehicleIcon: {
            width: 50,
            height: 50,
            borderRadius: 25,
            backgroundColor: colors.backgroundTertiary,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: DESIGN_TOKENS.spacing.md,
        },
        vehicleInfo: {
            flex: 1,
        },
        vehicleName: {
            fontSize: 16,
            fontWeight: '600',
            marginBottom: 2,
        },
        vehicleDetails: {
            fontSize: 14,
            marginBottom: 4,
        },
        statusRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: DESIGN_TOKENS.spacing.xs,
        },
        statusBadge: {
            paddingHorizontal: DESIGN_TOKENS.spacing.sm,
            paddingVertical: 2,
            borderRadius: DESIGN_TOKENS.radius.sm,
        },
        statusText: {
            fontSize: 12,
            fontWeight: '500',
        },
        currentBadge: {
            paddingHorizontal: DESIGN_TOKENS.spacing.sm,
            paddingVertical: 2,
            borderRadius: DESIGN_TOKENS.radius.sm,
        },
        currentText: {
            fontSize: 12,
            fontWeight: '500',
        },
        listContent: {
            paddingBottom: DESIGN_TOKENS.spacing.lg,
        },
        actionsContainer: {
            padding: DESIGN_TOKENS.spacing.lg,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            gap: DESIGN_TOKENS.spacing.sm,
        },
        addButton: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            padding: DESIGN_TOKENS.spacing.md,
            borderRadius: DESIGN_TOKENS.radius.lg,
            borderWidth: 2,
            borderStyle: 'dashed',
            borderColor: colors.primary,
            marginBottom: DESIGN_TOKENS.spacing.md,
        },
        addButtonText: {
            fontSize: 16,
            fontWeight: '600',
            color: colors.primary,
            marginLeft: DESIGN_TOKENS.spacing.sm,
        },
        assignButton: {
            backgroundColor: colors.primary,
            paddingVertical: DESIGN_TOKENS.spacing.md,
            borderRadius: DESIGN_TOKENS.radius.lg,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
        },
        assignButtonDisabled: {
            opacity: 0.5,
        },
        assignButtonText: {
            fontSize: 16,
            fontWeight: '700',
            color: '#FFFFFF',
        },
        removeButton: {
            backgroundColor: colors.error + '15',
            paddingVertical: DESIGN_TOKENS.spacing.md,
            borderRadius: DESIGN_TOKENS.radius.lg,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
        },
        removeButtonText: {
            fontSize: 16,
            fontWeight: '600',
            color: colors.error,
            marginLeft: DESIGN_TOKENS.spacing.xs,
        },
    });

    return (
        <>
            <Modal
                visible={visible}
                transparent
                animationType="slide"
                onRequestClose={onClose}
            >
                <Pressable style={styles.overlay} onPress={onClose}>
                    <Pressable style={styles.container} onPress={e => e.stopPropagation()}>
                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={styles.title}>
                                {t('jobDetails.components.truckDetails.assignVehicle')}
                            </Text>
                            <Pressable style={styles.closeButton} onPress={onClose}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </Pressable>
                        </View>

                        {/* Content */}
                        <View style={styles.content}>
                            <Text style={styles.sectionTitle}>
                                {t('jobDetails.components.truckDetails.selectVehicle')}
                            </Text>

                            {isLoading ? (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator size="large" color={colors.primary} />
                                </View>
                            ) : vehicles.length === 0 ? (
                                <View style={styles.emptyContainer}>
                                    <Text style={{ fontSize: 48, marginBottom: DESIGN_TOKENS.spacing.md }}>
                                        🚛
                                    </Text>
                                    <Text style={styles.emptyText}>
                                        {t('jobDetails.components.truckDetails.noVehiclesAvailable')}
                                    </Text>
                                </View>
                            ) : (
                                <FlatList
                                    data={vehicles}
                                    renderItem={renderVehicleItem}
                                    keyExtractor={(item) => item.id}
                                    contentContainerStyle={styles.listContent}
                                    showsVerticalScrollIndicator={false}
                                    style={{ maxHeight: 300 }}
                                />
                            )}

                            {/* Bouton ajouter un véhicule */}
                            <Pressable
                                style={styles.addButton}
                                onPress={() => setShowAddVehicleModal(true)}
                            >
                                <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
                                <Text style={styles.addButtonText}>
                                    {t('jobDetails.components.truckDetails.addNewVehicle')}
                                </Text>
                            </Pressable>
                        </View>

                        {/* Actions */}
                        <View style={styles.actionsContainer}>
                            <Pressable
                                style={[
                                    styles.assignButton,
                                    (!selectedVehicle || isSubmitting) && styles.assignButtonDisabled,
                                ]}
                                onPress={handleAssignVehicle}
                                disabled={!selectedVehicle || isSubmitting}
                            >
                                {isSubmitting ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.assignButtonText}>
                                        {t('jobDetails.components.truckDetails.assignSelected')}
                                    </Text>
                                )}
                            </Pressable>

                            {currentVehicle && (
                                <Pressable
                                    style={styles.removeButton}
                                    onPress={handleRemoveVehicle}
                                    disabled={isSubmitting}
                                >
                                    <Ionicons name="trash-outline" size={20} color={colors.error} />
                                    <Text style={styles.removeButtonText}>
                                        {t('jobDetails.components.truckDetails.removeVehicle')}
                                    </Text>
                                </Pressable>
                            )}
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>

            {/* Modal pour ajouter un nouveau véhicule */}
            <AddVehicleModal
                visible={showAddVehicleModal}
                onClose={() => setShowAddVehicleModal(false)}
                onAddVehicle={handleAddVehicle}
            />
        </>
    );
}
