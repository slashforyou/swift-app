/**
 * Job Page - Affichage des dÃ©tails du travail, items Ã  checker, contacts
 * Conforme aux normes mobiles iOS/Android - Touch targets â‰¥44pt, 8pt grid
 */
import React, { useState, useEffect } from 'react';
import { View, Text, Switch, Pressable, TextInput, Alert, Modal, ActivityIndicator } from 'react-native';
import { VStack, HStack } from '../../components/primitives/Stack';
import { Card } from '../../components/ui/Card';
import { DESIGN_TOKENS } from '../../constants/Styles';
import { useCommonThemedStyles } from '../../hooks/useCommonStyles';
import contactLink from '../../services/contactLink';
import { addJobItem, updateJobItem, getJobWithItems } from '../../services/jobs';
import JobTimeSection from '../../components/jobDetails/sections/JobTimeSection';

// Fonction pour extraire l'ID numérique depuis un ID job de format JOB-NERD-URGENT-006
const extractNumericJobId = (jobId: string): string => {
    if (!jobId) return '';
    
    // Si c'est déjà numérique, retourner tel quel
    if (/^\d+$/.test(jobId)) {
        return jobId;
    }
    
    // Extraire les chiffres à la fin (ex: JOB-NERD-URGENT-006 -> 006 -> 6)
    const match = jobId.match(/(\d+)$/);
    if (match) {
        return parseInt(match[1], 10).toString(); // Convertir 006 -> 6
    }
    
    console.warn(`[extractNumericJobId] Could not extract numeric ID from: ${jobId}`);
    return jobId; // Fallback
};
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
}

interface ItemRowProps {
    item: any;
    index: number;
    onToggle: (index: number, checked: boolean) => void;
    onQuantityChange: (index: number, completedQuantity: number) => void;
    onQuantityBlur: (index: number, completedQuantity: number) => void;
    isSyncing?: boolean;
}

interface SectionHeaderProps {
    icon: string;
    title: string;
    badge?: string;
}

// Composant pour les headers de section avec icÃ´nes
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
            Alert.alert('Error', 'Please enter an item name');
            return;
        }

        const qty = parseInt(quantity);
        if (isNaN(qty) || qty < 1) {
            Alert.alert('Error', 'Please enter a valid quantity');
            return;
        }

        setIsLoading(true);
        try {
            // Petit délai minimum pour voir le chargement
            const [result] = await Promise.all([
                onAdd(name.trim(), qty),
                new Promise(resolve => setTimeout(resolve, 800)) // 800ms minimum
            ]);
            
            setName('');
            setQuantity('1');
            onClose();
        } catch (error) {
            Alert.alert('Error', 'Unable to add item. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            statusBarTranslucent={true}
        >
            <View style={{
                flex: 1,
                backgroundColor: 'rgba(0,0,0,0.5)',
                justifyContent: 'center',
                alignItems: 'center',
                padding: 20
            }}>
                <View style={{
                    backgroundColor: colors.background,
                    borderRadius: DESIGN_TOKENS.radius.lg,
                    padding: DESIGN_TOKENS.spacing.lg,
                    width: '100%',
                    maxWidth: 400,
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
                        Add Item
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
                            Item Name *
                        </Text>
                        <TextInput
                            value={name}
                            onChangeText={setName}
                            placeholder="Ex: 3-seat sofa"
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
                            Quantity *
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
                                Cancel
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
                                alignItems: 'center',
                                flexDirection: 'row',
                                justifyContent: 'center'
                            }}
                        >
                            {isLoading && (
                                <ActivityIndicator 
                                    size="small" 
                                    color={colors.background} 
                                    style={{ marginRight: 8 }}
                                />
                            )}
                            <Text style={{
                                fontSize: 16,
                                fontWeight: '600',
                                color: colors.background
                            }}>
                                {isLoading ? 'Adding...' : 'Add Item'}
                            </Text>
                        </Pressable>
                    </HStack>
                </VStack>
                </View>
            </View>
        </Modal>
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
const ContactRow: React.FC<ContactRowProps> = ({ label, value, contactType, icon }) => {
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
        
        <Pressable
            onPress={() => contactLink(value, contactType)}
            hitSlop={DESIGN_TOKENS.touch.hitSlop}
            style={({ pressed }) => ([
                {
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: DESIGN_TOKENS.spacing.md,
                    paddingHorizontal: DESIGN_TOKENS.spacing.lg,
                    backgroundColor: pressed 
                        ? colors.backgroundSecondary
                        : colors.tint,
                    borderRadius: DESIGN_TOKENS.radius.lg,
                    minHeight: 56, // Bouton plus grand
                    shadowColor: colors.shadow,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 3,
                }
            ])}
            accessibilityRole="button"
            accessibilityLabel={`Contact ${value}`}
        >
            <View style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: colors.background + '20',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: DESIGN_TOKENS.spacing.md
            }}>
                <Ionicons 
                    name={icon as any} 
                    size={18} 
                    color={colors.background} 
                />
            </View>
            <Text 
                style={{
                    fontSize: DESIGN_TOKENS.typography.body.fontSize,
                    fontWeight: '600',
                    color: colors.background,
                    flex: 1
                }}
            >
                {value}
            </Text>
        </Pressable>
    </VStack>
    );
};

// Composant pour un item avec toggle
const ItemRow: React.FC<ItemRowProps> = ({ item, index, onToggle, onQuantityChange, onQuantityBlur, isSyncing }) => {
    const { colors } = useCommonThemedStyles();
    const [completedQuantity, setCompletedQuantity] = useState(item.completedQuantity?.toString() || '0');

    const handleQuantityChangeText = (text: string) => {
        setCompletedQuantity(text);
        // Mise à jour locale immédiate
        const qty = parseInt(text) || 0;
        onQuantityChange(index, qty);
    };

    const handleQuantityBlur = () => {
        // Synchronisation API au blur
        const qty = parseInt(completedQuantity) || 0;
        onQuantityBlur(index, qty);
    };

    return (
    <VStack gap="sm" style={{ paddingVertical: DESIGN_TOKENS.spacing.md }}>
        <HStack gap="md" align="center">
            <VStack gap="xs" style={{ flex: 1 }}>
                <HStack gap="sm" align="center">
                    <Text 
                        style={{
                            fontSize: DESIGN_TOKENS.typography.body.fontSize,
                            lineHeight: DESIGN_TOKENS.typography.body.lineHeight,
                            fontWeight: '500',
                            color: colors.text,
                            flex: 1
                        }}
                    >
                        {item.name}
                    </Text>
                    {item.isTemp && (
                        <View style={{
                            backgroundColor: colors.textSecondary + '20',
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            borderRadius: 4
                        }}>
                            <Text style={{
                                fontSize: 10,
                                fontWeight: '600',
                                color: colors.textSecondary
                            }}>
                                LOCAL
                            </Text>
                        </View>
                    )}
                    {isSyncing && (
                        <View style={{
                            backgroundColor: colors.primary + '20',
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            borderRadius: 4,
                            flexDirection: 'row',
                            alignItems: 'center'
                        }}>
                            <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 4 }} />
                            <Text style={{
                                fontSize: 10,
                                fontWeight: '600',
                                color: colors.primary
                            }}>
                                SYNC
                            </Text>
                        </View>
                    )}
                </HStack>
                {item.number && (
                    <Text 
                        style={{
                            fontSize: DESIGN_TOKENS.typography.caption.fontSize,
                            color: colors.textSecondary,
                        }}
                    >
                        Expected: {item.number}
                    </Text>
                )}
            </VStack>
            <Pressable
                onPress={() => onToggle(index, !(item.item_checked || item.checked))}
                hitSlop={DESIGN_TOKENS.touch.hitSlop}
                style={{
                    padding: DESIGN_TOKENS.spacing.xs,
                }}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: item.item_checked || item.checked || false }}
                accessibilityLabel={`${(item.item_checked || item.checked) ? 'Uncheck' : 'Check'} ${item.name}`}
            >
                <Switch
                    value={item.item_checked || item.checked || false}
                    onValueChange={(v) => onToggle(index, v)}
                    thumbColor={(item.item_checked || item.checked) ? colors.tint : colors.backgroundTertiary}
                    trackColor={{ 
                        false: colors.backgroundTertiary, 
                        true: colors.tint + '50' // 50% opacity
                    }}
                    ios_backgroundColor={colors.backgroundTertiary}
                />
            </Pressable>
        </HStack>
        
        {/* Champ pour la quantité complétée */}
        <HStack gap="sm" align="center">
            <Text style={{
                fontSize: DESIGN_TOKENS.typography.caption.fontSize,
                color: colors.textSecondary,
                minWidth: 80
            }}>
                Completed:
            </Text>
            <TextInput
                value={completedQuantity}
                onChangeText={handleQuantityChangeText}
                onBlur={handleQuantityBlur}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.textSecondary}
                style={{
                    flex: 1,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: DESIGN_TOKENS.radius.sm,
                    paddingHorizontal: DESIGN_TOKENS.spacing.sm,
                    paddingVertical: DESIGN_TOKENS.spacing.xs,
                    fontSize: 14,
                    color: colors.text,
                    backgroundColor: colors.backgroundSecondary,
                    minHeight: 36
                }}
            />
        </HStack>
    </VStack>
    );
};

const JobPage: React.FC<JobPageProps> = ({ job, setJob }) => {
    const { colors } = useCommonThemedStyles();
    const [showAddItemModal, setShowAddItemModal] = useState(false);
    const [syncingItems, setSyncingItems] = useState<Set<string>>(new Set());
    
    const handleItemToggle = async (itemIndex: number, checked: boolean) => {
        const updatedJob = { ...job };
        if (!updatedJob.items || !updatedJob.items[itemIndex]) {
            return;
        }

        const item = updatedJob.items[itemIndex];
        
        // Mettre à jour localement d'abord pour un feedback immédiat
        updatedJob.items[itemIndex].item_checked = checked;
        updatedJob.items[itemIndex].checked = checked;
        setJob(updatedJob);

        // Synchroniser avec l'API si l'item a un ID et n'est pas temporaire
        if (item.id && !item.isTemp) {
            const numericJobId = extractNumericJobId(job.id);
            
            console.log(`[handleItemToggle] DEBUG - Item structure:`, JSON.stringify(item, null, 2));
            console.log(`[handleItemToggle] DEBUG - itemIndex: ${itemIndex}, item.id: "${item.id}" (type: ${typeof item.id})`);
            console.log(`[handleItemToggle] Job ID: ${numericJobId}, Item ID: ${item.id}`);
            
            const itemKey = `${itemIndex}-${item.id}`;
            setSyncingItems(prev => new Set(prev).add(itemKey));
            
            try {
                await updateJobItem(numericJobId, item.id, { 
                    is_checked: checked,
                    completedQuantity: item.completedQuantity || 0
                });
                console.log(`[handleItemToggle] Successfully updated item ${item.id} in API`);
            } catch (error) {
                console.error(`[handleItemToggle] Failed to update item ${item.id} in API:`, error);
            } finally {
                setSyncingItems(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(itemKey);
                    return newSet;
                });
            }
        } else {
            console.log(`[handleItemToggle] Item has no ID or is temporary, skipping API sync`);
        }
    };

    // Fonction pour synchroniser la quantité avec l'API (appelée sur onBlur)
    const handleQuantitySync = async (itemIndex: number, completedQuantity: number) => {
        const item = job.items?.[itemIndex];
        if (!item) return;

        // Synchroniser avec l'API si l'item a un ID et n'est pas temporaire
        if (item.id && !item.isTemp) {
            const numericJobId = extractNumericJobId(job.id);
            
            console.log(`[handleQuantitySync] DEBUG - Item structure:`, JSON.stringify(item, null, 2));
            console.log(`[handleQuantitySync] DEBUG - itemIndex: ${itemIndex}, item.id: "${item.id}" (type: ${typeof item.id})`);
            console.log(`[handleQuantitySync] Job ID: ${numericJobId}, Item ID: ${item.id}, Quantity: ${completedQuantity}`);
            
            const itemKey = `${itemIndex}-${item.id}`;
            setSyncingItems(prev => new Set(prev).add(itemKey));
            
            try {
                await updateJobItem(numericJobId, item.id, { 
                    completedQuantity,
                    is_checked: item.item_checked || item.checked || false
                });
                console.log(`[handleQuantitySync] Successfully updated quantity for item ${item.id} in API`);
            } catch (error) {
                console.error(`[handleQuantitySync] Failed to update quantity for item ${item.id} in API:`, error);
            } finally {
                setSyncingItems(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(itemKey);
                    return newSet;
                });
            }
        } else {
            console.log(`[handleQuantitySync] Item has no ID or is temporary, skipping API sync`);
        }
    };

    // Fonction pour mettre à jour localement la quantité (changement immédiat)
    const handleQuantityChange = (itemIndex: number, completedQuantity: number) => {
        const updatedJob = { ...job };
        if (!updatedJob.items || !updatedJob.items[itemIndex]) {
            return;
        }
        
        // Mettre à jour localement seulement
        updatedJob.items[itemIndex].completedQuantity = completedQuantity;
        setJob(updatedJob);
    };

    const handleAddItem = async (name: string, quantity: number) => {
        try {
            const numericJobId = extractNumericJobId(job.id);
            console.log(`[handleAddItem] Using numeric job ID: ${numericJobId} (from ${job.id})`);
            
            await addJobItem(numericJobId, { name, quantity });
            
            // Mettre Ã  jour la liste des items localement
            const updatedJob = { ...job };
            if (!updatedJob.items) {
                updatedJob.items = [];
            }
            updatedJob.items.push({
                name,
                number: quantity,
                checked: false,
                item_checked: false,
                completedQuantity: 0
            });
            setJob(updatedJob);
            
            Alert.alert('Success', 'Item added successfully');
        } catch (error) {
            console.error('Error adding item via API:', error);
            
            // Fallback: ajouter localement même si l'API échoue
            console.log('Falling back to local addition');
            const updatedJob = { ...job };
            if (!updatedJob.items) {
                updatedJob.items = [];
            }
            
            // Générer un ID temporaire
            const tempId = `temp_${Date.now()}`;
            updatedJob.items.push({
                id: tempId,
                name,
                number: quantity,
                checked: false,
                item_checked: false,
                completedQuantity: 0,
                isTemp: true // Marquer comme temporaire
            });
            setJob(updatedJob);
            
            Alert.alert(
                'Item Added Locally', 
                'Item added to local list. It will be synced when the API connection is available.',
                [{ text: 'OK', style: 'default' }]
            );
        }
    };

    const itemsCount = job.items?.length || 0;
    const checkedItems = job.items?.filter((item: any) => item.item_checked || item.checked).length || 0;

    return (
        <>
            <VStack gap="lg">
                {/* Section Time - Chronométrage et coûts */}
                <JobTimeSection job={job} />
                
                {/* Job Items Checklist */}
                <Card style={{ padding: DESIGN_TOKENS.spacing.lg }}>
                    <VStack gap="sm">
                        <SectionHeader 
                            icon="list-outline" 
                            title="Job Items" 
                            badge={itemsCount > 0 ? `${checkedItems}/${itemsCount}` : undefined}
                        />
                        
                        {job.items && job.items.length > 0 ? (
                            job.items.map((item: any, index: number) => {
                                const itemKey = `${index}-${item.id}`;
                                const isSyncing = syncingItems.has(itemKey);
                                
                                return (
                                    <ItemRow
                                        key={index}
                                        item={item}
                                        index={index}
                                        onToggle={handleItemToggle}
                                        onQuantityChange={handleQuantityChange}
                                        onQuantityBlur={handleQuantitySync}
                                        isSyncing={isSyncing}
                                    />
                                );
                            })
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
                                Add Item
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
                                />
                            )}
                            
                            {job.contractor.Email && (
                                <ContactRow
                                    label="Email"
                                    value={job.contractor.Email}
                                    contactType="mailto"
                                    icon="mail"
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
                                />
                            )}
                            
                            {job.contractee.Email && (
                                <ContactRow
                                    label="Email"
                                    value={job.contractee.Email}
                                    contactType="mailto"
                                    icon="mail"
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
