/**
 * Job Page - Affichage des détails du travail, items à checker, contacts
 * Conforme aux normes mobiles iOS/Android - Touch targets ≥44pt, 8pt grid
 */
import React, { useState } from 'react';
import { View, Text, Switch, Pressable, TextInput, Alert } from 'react-native';
import { VStack, HStack } from '../../components/primitives/Stack';
import { Card } from '../../components/ui/Card';
import { DESIGN_TOKENS } from '../../constants/Styles';
import { useCommonThemedStyles } from '../../hooks/useCommonStyles';
import contactLink from '../../services/contactLink';
import { addJobItem } from '../../services/jobs';
import Ionicons from '@react-native-vector-icons/ionicons';


interface JobPageProps {
    job: any;
    setJob: React.Dispatch<React.SetStateAction<any>>;
}

interface InfoRowProps {
    label: string;
    value: string;
    badge?: boolean;
}

interface ContactRowProps {
    label: string;
    value: string;
    contactType: 'tel' | 'mailto';
    icon: string;
    buttonLabel: string;
    description?: string;
}

interface ItemRowProps {
    item: any;
    index: number;
    onToggle: (index: number, checked: boolean) => void;
}

interface SectionHeaderProps {
    icon: string;
    title: string;
    badge?: string;
}

// Composant pour les headers de section avec icônes
const SectionHeader: React.FC<SectionHeaderProps> = ({ icon, title, badge }) => {
    const { colors } = useCommonThemedStyles();
    return (
        <HStack gap="sm" align="center" style={{ marginBottom: DESIGN_TOKENS.spacing.md }}>
            <View style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: colors.primary + '20',
                justifyContent: 'center',
                alignItems: 'center'
            }}>
                <Ionicons name={icon as any} size={18} color={colors.primary} />
            </View>
            <Text style={{
                fontSize: DESIGN_TOKENS.typography.subtitle.fontSize,
                fontWeight: '600',
                color: colors.text,
                flex: 1
            }}>
                {title}
            </Text>
            {badge && (
                <View style={{
                    backgroundColor: colors.primary,
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 12,
                }}>
                    <Text style={{
                        fontSize: 12,
                        fontWeight: '600',
                        color: colors.background,
                    }}>
                        {badge}
                    </Text>
                </View>
            )}
        </HStack>
    );
};

// Modal pour ajouter un item
const AddItemModal: React.FC<{
    visible: boolean;
    onClose: () => void;
    onAdd: (name: string, quantity: number) => void;
}> = ({ visible, onClose, onAdd }) => {
    const { colors } = useCommonThemedStyles();
    const [name, setName] = useState('');
    const [quantity, setQuantity] = useState('1');
    const [isLoading, setIsLoading] = useState(false);

    const handleAdd = async () => {
        if (!name.trim()) {
            Alert.alert('Erreur', 'Veuillez saisir un nom pour l\'item');
            return;
        }

        const qty = parseInt(quantity);
        if (isNaN(qty) || qty < 1) {
            Alert.alert('Erreur', 'Veuillez saisir une quantité valide');
            return;
        }

        setIsLoading(true);
        try {
            await onAdd(name.trim(), qty);
            setName('');
            setQuantity('1');
            onClose();
        } catch (error) {
            Alert.alert('Erreur', 'Impossible d\'ajouter l\'item. Veuillez réessayer.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!visible) return null;

    return (
        <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
        }}>
            <View style={{
                backgroundColor: colors.background,
                margin: 20,
                borderRadius: DESIGN_TOKENS.radius.lg,
                padding: DESIGN_TOKENS.spacing.lg,
                minWidth: 300,
                shadowColor: colors.shadow,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 12,
                elevation: 8
            }}>
                <HStack align="center" justify="space-between" style={{ marginBottom: DESIGN_TOKENS.spacing.lg }}>
                    <Text style={{
                        fontSize: 18,
                        fontWeight: '600',
                        color: colors.text
                    }}>
                        Ajouter un item
                    </Text>
                    <Pressable onPress={onClose} hitSlop={8}>
                        <Ionicons name="close" size={24} color={colors.textSecondary} />
                    </Pressable>
                </HStack>

                <VStack gap="md">
                    <VStack gap="xs">
                        <Text style={{
                            fontSize: 14,
                            fontWeight: '500',
                            color: colors.text
                        }}>
                            Nom de l'item *
                        </Text>
                        <TextInput
                            value={name}
                            onChangeText={setName}
                            placeholder="Ex: Canapé 3 places"
                            placeholderTextColor={colors.textSecondary}
                            style={{
                                borderWidth: 1,
                                borderColor: colors.border,
                                borderRadius: DESIGN_TOKENS.radius.md,
                                padding: DESIGN_TOKENS.spacing.md,
                                fontSize: 16,
                                color: colors.text,
                                backgroundColor: colors.backgroundSecondary
                            }}
                        />
                    </VStack>

                    <VStack gap="xs">
                        <Text style={{
                            fontSize: 14,
                            fontWeight: '500',
                            color: colors.text
                        }}>
                            Quantité *
                        </Text>
                        <TextInput
                            value={quantity}
                            onChangeText={setQuantity}
                            placeholder="1"
                            keyboardType="numeric"
                            placeholderTextColor={colors.textSecondary}
                            style={{
                                borderWidth: 1,
                                borderColor: colors.border,
                                borderRadius: DESIGN_TOKENS.radius.md,
                                padding: DESIGN_TOKENS.spacing.md,
                                fontSize: 16,
                                color: colors.text,
                                backgroundColor: colors.backgroundSecondary
                            }}
                        />
                    </VStack>

                    <HStack gap="md" style={{ marginTop: DESIGN_TOKENS.spacing.md }}>
                        <Pressable
                            onPress={onClose}
                            style={{
                                flex: 1,
                                padding: DESIGN_TOKENS.spacing.md,
                                borderRadius: DESIGN_TOKENS.radius.md,
                                borderWidth: 1,
                                borderColor: colors.border,
                                alignItems: 'center'
                            }}
                        >
                            <Text style={{
                                fontSize: 16,
                                fontWeight: '500',
                                color: colors.textSecondary
                            }}>
                                Annuler
                            </Text>
                        </Pressable>

                        <Pressable
                            onPress={handleAdd}
                            disabled={isLoading}
                            style={{
                                flex: 1,
                                padding: DESIGN_TOKENS.spacing.md,
                                borderRadius: DESIGN_TOKENS.radius.md,
                                backgroundColor: isLoading ? colors.backgroundSecondary : colors.primary,
                                alignItems: 'center'
                            }}
                        >
                            <Text style={{
                                fontSize: 16,
                                fontWeight: '600',
                                color: colors.background
                            }}>
                                {isLoading ? 'Ajout...' : 'Ajouter'}
                            </Text>
                        </Pressable>
                    </HStack>
                </VStack>
            </View>
        </View>
    );
};

// Composant pour afficher une information simple
const InfoRow: React.FC<InfoRowProps> = ({ label, value, badge }) => {
    const { colors } = useCommonThemedStyles();
    return (
    <VStack gap="xs" style={{ paddingVertical: DESIGN_TOKENS.spacing.sm }}>
        <Text 
            style={{
                fontSize: DESIGN_TOKENS.typography.caption.fontSize,
                lineHeight: DESIGN_TOKENS.typography.caption.lineHeight,
                fontWeight: DESIGN_TOKENS.typography.caption.fontWeight,
                color: colors.textSecondary,
            }}
        >
            {label}
        </Text>
        {badge ? (
            <View 
                style={{
                    backgroundColor: colors.backgroundTertiary,
                    paddingHorizontal: DESIGN_TOKENS.spacing.md,
                    paddingVertical: DESIGN_TOKENS.spacing.xs,
                    borderRadius: DESIGN_TOKENS.radius.lg,
                    alignSelf: 'flex-start',
                }}
            >
                <Text 
                    style={{
                        fontSize: DESIGN_TOKENS.typography.caption.fontSize,
                        fontWeight: '500',
                        color: colors.tint,
                    }}
                >
                    {value}
                </Text>
            </View>
        ) : (
            <Text 
                style={{
                    fontSize: DESIGN_TOKENS.typography.body.fontSize,
                    lineHeight: DESIGN_TOKENS.typography.body.lineHeight,
                    fontWeight: DESIGN_TOKENS.typography.body.fontWeight,
                    color: colors.text,
                }}
            >
                {value}
            </Text>
        )}
    </VStack>
    );
};

// Composant pour afficher une ligne de contact avec bouton d'action
const ContactRow: React.FC<ContactRowProps> = ({ label, value, contactType, icon, buttonLabel, description }) => {
    const { colors } = useCommonThemedStyles();
    return (
    <VStack gap="xs" style={{ paddingVertical: DESIGN_TOKENS.spacing.sm }}>
        <Text 
            style={{
                fontSize: DESIGN_TOKENS.typography.caption.fontSize,
                lineHeight: DESIGN_TOKENS.typography.caption.lineHeight,
                fontWeight: DESIGN_TOKENS.typography.caption.fontWeight,
                color: colors.textSecondary,
            }}
        >
            {label}
        </Text>
        <HStack gap="md" align="center" justify="space-between">
            <VStack gap="xs" style={{ flex: 1 }}>
                <Text 
                    style={{
                        fontSize: DESIGN_TOKENS.typography.body.fontSize,
                        lineHeight: DESIGN_TOKENS.typography.body.lineHeight,
                        fontWeight: DESIGN_TOKENS.typography.body.fontWeight,
                        color: colors.text,
                    }}
                >
                    {value}
                </Text>
                {description && (
                    <Text 
                        style={{
                            fontSize: DESIGN_TOKENS.typography.caption.fontSize,
                            color: colors.textSecondary,
                        }}
                    >
                        {description}
                    </Text>
                )}
            </VStack>
            <Pressable
                onPress={() => contactLink(value, contactType)}
                hitSlop={DESIGN_TOKENS.touch.hitSlop}
                style={({ pressed }) => ([
                    {
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: DESIGN_TOKENS.spacing.sm,
                        paddingHorizontal: DESIGN_TOKENS.spacing.md,
                        backgroundColor: pressed 
                            ? colors.backgroundSecondary
                            : colors.tint,
                        borderRadius: DESIGN_TOKENS.radius.md,
                        minHeight: DESIGN_TOKENS.touch.minSize,
                        minWidth: DESIGN_TOKENS.touch.minSize,
                    }
                ])}
                accessibilityRole="button"
                accessibilityLabel={`${buttonLabel} ${value}`}
            >
                <Ionicons 
                    name={icon as any} 
                    size={16} 
                    color={colors.background} 
                />
                <Text 
                    style={{
                        fontSize: DESIGN_TOKENS.typography.body.fontSize,
                        fontWeight: '500',
                        color: colors.background,
                        marginLeft: DESIGN_TOKENS.spacing.xs,
                    }}
                >
                    {buttonLabel}
                </Text>
            </Pressable>
        </HStack>
    </VStack>
    );
};

// Composant pour un item avec toggle
const ItemRow: React.FC<ItemRowProps> = ({ item, index, onToggle }) => {
    const { colors } = useCommonThemedStyles();
    return (
    <HStack 
        gap="md" 
        align="center" 
        style={{ 
            paddingVertical: DESIGN_TOKENS.spacing.md,
            minHeight: DESIGN_TOKENS.touch.minSize,
        }}
    >
        <VStack gap="xs" style={{ flex: 1 }}>
            <Text 
                style={{
                    fontSize: DESIGN_TOKENS.typography.body.fontSize,
                    lineHeight: DESIGN_TOKENS.typography.body.lineHeight,
                    fontWeight: '500',
                    color: colors.text,
                }}
            >
                {item.name}
            </Text>
            {item.number && (
                <Text 
                    style={{
                        fontSize: DESIGN_TOKENS.typography.caption.fontSize,
                        color: colors.textSecondary,
                    }}
                >
                    Quantity: {item.number}
                </Text>
            )}
        </VStack>
        <Pressable
            onPress={() => onToggle(index, !item.checked)}
            hitSlop={DESIGN_TOKENS.touch.hitSlop}
            style={{
                padding: DESIGN_TOKENS.spacing.xs,
            }}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: item.checked || false }}
            accessibilityLabel={`${item.checked ? 'Uncheck' : 'Check'} ${item.name}`}
        >
            <Switch
                value={item.checked || false}
                onValueChange={(v) => onToggle(index, v)}
                thumbColor={item.checked ? colors.tint : colors.backgroundTertiary}
                trackColor={{ 
                    false: colors.backgroundTertiary, 
                    true: colors.tint + '50' // 50% opacity
                }}
                ios_backgroundColor={colors.backgroundTertiary}
            />
        </Pressable>
    </HStack>
    );
};

const JobPage: React.FC<JobPageProps> = ({ job, setJob }) => {
    const { colors } = useCommonThemedStyles();
    const [showAddItemModal, setShowAddItemModal] = useState(false);
    
    const handleItemToggle = (itemIndex: number, checked: boolean) => {
        const updatedJob = { ...job };
        if (updatedJob.items && updatedJob.items[itemIndex]) {
            updatedJob.items[itemIndex].checked = checked;
            setJob(updatedJob);
        }
    };

    const handleAddItem = async (name: string, quantity: number) => {
        try {
            await addJobItem(job.id, { name, quantity });
            
            // Mettre à jour la liste des items localement
            const updatedJob = { ...job };
            if (!updatedJob.items) {
                updatedJob.items = [];
            }
            updatedJob.items.push({
                name,
                number: quantity,
                checked: false
            });
            setJob(updatedJob);
            
            Alert.alert('Succès', 'Item ajouté avec succès');
        } catch (error) {
            console.error('Erreur lors de l\'ajout de l\'item:', error);
            throw error;
        }
    };

    const itemsCount = job.items?.length || 0;
    const checkedItems = job.items?.filter((item: any) => item.checked).length || 0;

    return (
        <>
            <VStack gap="lg">
                {/* Job Items Checklist */}
                <Card style={{ padding: DESIGN_TOKENS.spacing.lg }}>
                    <VStack gap="sm">
                        <SectionHeader 
                            icon="list-outline" 
                            title="Job Items" 
                            badge={itemsCount > 0 ? `${checkedItems}/${itemsCount}` : undefined}
                        />
                        
                        {job.items && job.items.length > 0 ? (
                            job.items.map((item: any, index: number) => (
                                <ItemRow
                                    key={index}
                                    item={item}
                                    index={index}
                                    onToggle={handleItemToggle}
                                />
                            ))
                        ) : (
                            <Text style={{
                                fontSize: 14,
                                color: colors.textSecondary,
                                fontStyle: 'italic',
                                textAlign: 'center',
                                paddingVertical: DESIGN_TOKENS.spacing.lg
                            }}>
                                Aucun item pour le moment
                            </Text>
                        )}
                        
                        {/* Bouton Ajouter un item */}
                        <Pressable
                            onPress={() => setShowAddItemModal(true)}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: DESIGN_TOKENS.spacing.md,
                                borderWidth: 2,
                                borderColor: colors.primary,
                                borderStyle: 'dashed',
                                borderRadius: DESIGN_TOKENS.radius.md,
                                backgroundColor: colors.primary + '10',
                                marginTop: DESIGN_TOKENS.spacing.sm
                            }}
                        >
                            <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                            <Text style={{
                                fontSize: 16,
                                fontWeight: '600',
                                color: colors.primary,
                                marginLeft: DESIGN_TOKENS.spacing.xs
                            }}>
                                Ajouter un item
                            </Text>
                        </Pressable>
                    </VStack>
                </Card>

                {/* Job Information */}
                <Card style={{ padding: DESIGN_TOKENS.spacing.lg }}>
                    <VStack gap="sm">
                        <SectionHeader 
                            icon="information-circle-outline" 
                            title="Job Information" 
                        />
                        
                        {job.type && (
                            <InfoRow label="Job Type" value={job.type} />
                        )}
                        
                        <InfoRow 
                            label="Number of Items" 
                            value={String(job.itemsCount || job.items?.length || 0)} 
                        />
                        
                        {job.status && (
                            <InfoRow label="Status" value={job.status} badge />
                        )}
                    </VStack>
                </Card>

                {/* Contractor Details */}
                {job.contractor && (
                    <Card style={{ padding: DESIGN_TOKENS.spacing.lg }}>
                        <VStack gap="sm">
                            <SectionHeader 
                                icon="business-outline" 
                                title="Contractor" 
                            />
                            
                            {job.contractor.Name && (
                                <InfoRow label="Company Name" value={job.contractor.Name} />
                            )}
                            
                            {job.contractor.ContactName && (
                                <InfoRow label="Contact Person" value={job.contractor.ContactName} />
                            )}
                            
                            {job.contractor.Phone && (
                                <ContactRow
                                    label="Phone"
                                    value={job.contractor.Phone}
                                    contactType="tel"
                                    icon="call"
                                    buttonLabel="Call"
                                />
                            )}
                            
                            {job.contractor.Email && (
                                <ContactRow
                                    label="Email"
                                    value={job.contractor.Email}
                                    contactType="mailto"
                                    icon="mail"
                                    buttonLabel="Email"
                                />
                            )}
                        </VStack>
                    </Card>
                )}

                {/* Contractee Details */}
                {job.contractee && (
                    <Card style={{ padding: DESIGN_TOKENS.spacing.lg }}>
                        <VStack gap="sm">
                            <SectionHeader 
                                icon="people-outline" 
                                title="Contractee" 
                            />
                            
                            {job.contractee.Name && (
                                <InfoRow label="Company Name" value={job.contractee.Name} />
                            )}
                            
                            {job.contractee.ContactName && (
                                <InfoRow label="Contact Person" value={job.contractee.ContactName} />
                            )}
                            
                            {job.contractee.Phone && (
                                <ContactRow
                                    label="Phone"
                                    value={job.contractee.Phone}
                                    contactType="tel"
                                    icon="call"
                                    buttonLabel="Call"
                                />
                            )}
                            
                            {job.contractee.Email && (
                                <ContactRow
                                    label="Email"
                                    value={job.contractee.Email}
                                    contactType="mailto"
                                    icon="mail"
                                    buttonLabel="Email"
                                />
                            )}
                        </VStack>
                    </Card>
                )}
            </VStack>

            {/* Modal d'ajout d'item */}
            <AddItemModal
                visible={showAddItemModal}
                onClose={() => setShowAddItemModal(false)}
                onAdd={handleAddItem}
            />
        </>
    );
};

export default JobPage;
