/**
 * Job Page - Affichage des détails du travail, items à checker, contacts
 * Conforme aux normes mobiles iOS/Android - Touch targets ≥44pt, 8pt grid
 */
import React from 'react';
import { View, Text, Switch, Pressable } from 'react-native';
import { VStack, HStack } from '../../components/primitives/Stack';
import { Card } from '../../components/ui/Card';
import { DESIGN_TOKENS } from '../../constants/Styles';
import { Colors } from '../../constants/Colors';
import contactLink from '../../services/contactLink';
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

// Composant pour afficher une information simple
const InfoRow: React.FC<InfoRowProps> = ({ label, value, badge }) => (
    <VStack gap="xs" style={{ paddingVertical: DESIGN_TOKENS.spacing.sm }}>
        <Text 
            style={{
                fontSize: DESIGN_TOKENS.typography.caption.fontSize,
                lineHeight: DESIGN_TOKENS.typography.caption.lineHeight,
                fontWeight: DESIGN_TOKENS.typography.caption.fontWeight,
                color: Colors.light.textSecondary,
            }}
        >
            {label}
        </Text>
        {badge ? (
            <View 
                style={{
                    backgroundColor: Colors.light.backgroundTertiary,
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
                        color: Colors.light.tint,
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
                    color: Colors.light.text,
                }}
            >
                {value}
            </Text>
        )}
    </VStack>
);

// Composant pour afficher une ligne de contact avec bouton d'action
const ContactRow: React.FC<ContactRowProps> = ({ label, value, contactType, icon, buttonLabel, description }) => (
    <VStack gap="xs" style={{ paddingVertical: DESIGN_TOKENS.spacing.sm }}>
        <Text 
            style={{
                fontSize: DESIGN_TOKENS.typography.caption.fontSize,
                lineHeight: DESIGN_TOKENS.typography.caption.lineHeight,
                fontWeight: DESIGN_TOKENS.typography.caption.fontWeight,
                color: Colors.light.textSecondary,
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
                        color: Colors.light.text,
                    }}
                >
                    {value}
                </Text>
                {description && (
                    <Text 
                        style={{
                            fontSize: DESIGN_TOKENS.typography.caption.fontSize,
                            color: Colors.light.textSecondary,
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
                            ? Colors.light.backgroundSecondary
                            : Colors.light.tint,
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
                    color={Colors.light.background} 
                />
                <Text 
                    style={{
                        fontSize: DESIGN_TOKENS.typography.body.fontSize,
                        fontWeight: '500',
                        color: Colors.light.background,
                        marginLeft: DESIGN_TOKENS.spacing.xs,
                    }}
                >
                    {buttonLabel}
                </Text>
            </Pressable>
        </HStack>
    </VStack>
);

// Composant pour un item avec toggle
const ItemRow: React.FC<ItemRowProps> = ({ item, index, onToggle }) => (
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
                    color: Colors.light.text,
                }}
            >
                {item.name}
            </Text>
            {item.number && (
                <Text 
                    style={{
                        fontSize: DESIGN_TOKENS.typography.caption.fontSize,
                        color: Colors.light.textSecondary,
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
                thumbColor={item.checked ? Colors.light.tint : Colors.light.backgroundTertiary}
                trackColor={{ 
                    false: Colors.light.backgroundTertiary, 
                    true: Colors.light.tint + '50' // 50% opacity
                }}
                ios_backgroundColor={Colors.light.backgroundTertiary}
            />
        </Pressable>
    </HStack>
);

const JobPage: React.FC<JobPageProps> = ({ job, setJob }) => {
    const handleItemToggle = (itemIndex: number, checked: boolean) => {
        const updatedJob = { ...job };
        if (updatedJob.items && updatedJob.items[itemIndex]) {
            updatedJob.items[itemIndex].checked = checked;
            setJob(updatedJob);
        }
    };

    return (
        <VStack gap="lg">
                {/* Job Items Checklist */}
                {job.items && job.items.length > 0 && (
                    <Card style={{ padding: DESIGN_TOKENS.spacing.lg }}>
                        <VStack gap="sm">
                            <Text 
                                style={{
                                    fontSize: DESIGN_TOKENS.typography.subtitle.fontSize,
                                    lineHeight: DESIGN_TOKENS.typography.subtitle.lineHeight,
                                    fontWeight: DESIGN_TOKENS.typography.subtitle.fontWeight,
                                    color: Colors.light.text,
                                    marginBottom: DESIGN_TOKENS.spacing.sm,
                                }}
                            >
                                Job Items
                            </Text>
                            
                            {job.items.map((item: any, index: number) => (
                                <ItemRow
                                    key={index}
                                    item={item}
                                    index={index}
                                    onToggle={handleItemToggle}
                                />
                            ))}
                        </VStack>
                    </Card>
                )}

                {/* Job Information */}
                <Card style={{ padding: DESIGN_TOKENS.spacing.lg }}>
                    <VStack gap="sm">
                        <Text 
                            style={{
                                fontSize: DESIGN_TOKENS.typography.subtitle.fontSize,
                                lineHeight: DESIGN_TOKENS.typography.subtitle.lineHeight,
                                fontWeight: DESIGN_TOKENS.typography.subtitle.fontWeight,
                                color: Colors.light.text,
                                marginBottom: DESIGN_TOKENS.spacing.sm,
                            }}
                        >
                            Job Information
                        </Text>
                        
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
                            <Text 
                                style={{
                                    fontSize: DESIGN_TOKENS.typography.subtitle.fontSize,
                                    lineHeight: DESIGN_TOKENS.typography.subtitle.lineHeight,
                                    fontWeight: DESIGN_TOKENS.typography.subtitle.fontWeight,
                                    color: Colors.light.text,
                                    marginBottom: DESIGN_TOKENS.spacing.sm,
                                }}
                            >
                                Contractor
                            </Text>
                            
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
                            <Text 
                                style={{
                                    fontSize: DESIGN_TOKENS.typography.subtitle.fontSize,
                                    lineHeight: DESIGN_TOKENS.typography.subtitle.lineHeight,
                                    fontWeight: DESIGN_TOKENS.typography.subtitle.fontWeight,
                                    color: Colors.light.text,
                                    marginBottom: DESIGN_TOKENS.spacing.sm,
                                }}
                            >
                                Contractee
                            </Text>
                            
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
    );
};

export default JobPage;