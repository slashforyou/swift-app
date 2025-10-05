// Job Page for displaying job details including type of job, number of men, number of stops, and more.

import JobContainerWithTitle from '@/src/components/ui/jobPage/jobContainerWithTitle';
import JobPageScrollContainer from '@/src/components/ui/jobPage/jobPageScrollContainer';
import React from 'react';
import { View, Text, Switch, Pressable } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import contactLink from '@/src/services/contactLink';
import { useCommonThemedStyles } from '../../hooks/useCommonStyles';


const JobPage = ({ job, setJob }: { job: any, setJob: React.Dispatch<React.SetStateAction<any>> }) => {
    const { colors, styles: commonStyles } = useCommonThemedStyles();

    const handleItemToggle = (itemIndex: number, checked: boolean) => {
        const updatedJob = { ...job };
        if (updatedJob.items && updatedJob.items[itemIndex]) {
            updatedJob.items[itemIndex].checked = checked;
            setJob(updatedJob);
        }
    };

    return (
        <JobPageScrollContainer>
            {/* Job Items Checklist */}
            {job.items && job.items.length > 0 && (
                <JobContainerWithTitle title="Job Items">
                    {job.items.map((item: any, index: number) => (
                        <View key={index} style={[commonStyles.listItem, { paddingVertical: 12 }]}>
                            <View style={{ flex: 1 }}>
                                <Text style={[commonStyles.body, commonStyles.textSemiBold, { color: colors.text }]}>
                                    {item.name}
                                </Text>
                                {item.number && (
                                    <Text style={[commonStyles.bodySmall, { color: colors.textSecondary, marginTop: 2 }]}>
                                        Quantity: {item.number}
                                    </Text>
                                )}
                            </View>
                            <Switch
                                value={item.checked || false}
                                onValueChange={(v) => handleItemToggle(index, v)}
                                thumbColor={item.checked ? colors.primary : colors.backgroundTertiary}
                                trackColor={{ 
                                    false: colors.backgroundTertiary, 
                                    true: colors.primaryLight 
                                }}
                            />
                        </View>
                    ))}
                </JobContainerWithTitle>
            )}

            {/* Job Details */}
            <JobContainerWithTitle title="Job Information">
                {job.type && (
                    <View style={commonStyles.listItem}>
                        <Text style={[commonStyles.bodySmall, commonStyles.textSemiBold, { color: colors.textSecondary }]}>
                            Job Type
                        </Text>
                        <Text style={[commonStyles.body, { color: colors.text, marginTop: 4 }]}>
                            {job.type}
                        </Text>
                    </View>
                )}

                <View style={commonStyles.listItem}>
                    <Text style={[commonStyles.bodySmall, commonStyles.textSemiBold, { color: colors.textSecondary }]}>
                        Number of Items
                    </Text>
                    <Text style={[commonStyles.body, { color: colors.text, marginTop: 4 }]}>
                        {job.itemsCount || job.items?.length || 0}
                    </Text>
                </View>

                {job.status && (
                    <View style={commonStyles.listItem}>
                        <Text style={[commonStyles.bodySmall, commonStyles.textSemiBold, { color: colors.textSecondary }]}>
                            Status
                        </Text>
                        <View style={[{ backgroundColor: colors.primaryLight, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16, marginTop: 4 }]}>
                            <Text style={[commonStyles.bodySmall, { color: colors.primary }]}>
                                {job.status}
                            </Text>
                        </View>
                    </View>
                )}
            </JobContainerWithTitle>

            {/* Contractor Details */}
            {job.contractor && (
                <JobContainerWithTitle title="Contractor">
                    {job.contractor.Name && (
                        <View style={commonStyles.listItem}>
                            <Text style={[commonStyles.bodySmall, commonStyles.textSemiBold, { color: colors.textSecondary }]}>
                                Company Name
                            </Text>
                            <Text style={[commonStyles.body, { color: colors.text, marginTop: 4 }]}>
                                {job.contractor.Name}
                            </Text>
                        </View>
                    )}

                    {job.contractor.ContactName && (
                        <View style={commonStyles.listItem}>
                            <Text style={[commonStyles.bodySmall, commonStyles.textSemiBold, { color: colors.textSecondary }]}>
                                Contact Person
                            </Text>
                            <Text style={[commonStyles.body, { color: colors.text, marginTop: 4 }]}>
                                {job.contractor.ContactName}
                            </Text>
                        </View>
                    )}

                    {job.contractor.Phone && (
                        <View style={[commonStyles.listItem, { paddingBottom: 0 }]}>
                            <View style={{ flex: 1 }}>
                                <Text style={[commonStyles.bodySmall, commonStyles.textSemiBold, { color: colors.textSecondary }]}>
                                    Phone
                                </Text>
                                <Text style={[commonStyles.body, { color: colors.text, marginTop: 4 }]}>
                                    {job.contractor.Phone}
                                </Text>
                            </View>
                            <Pressable 
                                style={[{ backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, flexDirection: 'row', alignItems: 'center' }]}
                                onPress={() => contactLink(job.contractor.Phone, 'tel')}
                            >
                                <Ionicons name="call" size={16} color={colors.buttonPrimaryText} />
                                <Text style={[commonStyles.buttonPrimaryText, { marginLeft: 6, fontSize: 14 }]}>Call</Text>
                            </Pressable>
                        </View>
                    )}

                    {job.contractor.Email && (
                        <View style={[commonStyles.listItem, { paddingBottom: 0 }]}>
                            <View style={{ flex: 1 }}>
                                <Text style={[commonStyles.bodySmall, commonStyles.textSemiBold, { color: colors.textSecondary }]}>
                                    Email
                                </Text>
                                <Text style={[commonStyles.body, { color: colors.text, marginTop: 4 }]}>
                                    {job.contractor.Email}
                                </Text>
                            </View>
                            <Pressable 
                                style={[{ backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, flexDirection: 'row', alignItems: 'center' }]}
                                onPress={() => contactLink(job.contractor.Email, 'mailto')}
                            >
                                <Ionicons name="mail" size={16} color={colors.buttonPrimaryText} />
                                <Text style={[commonStyles.buttonPrimaryText, { marginLeft: 6, fontSize: 14 }]}>Email</Text>
                            </Pressable>
                        </View>
                    )}
                </JobContainerWithTitle>
            )}

            {/* Contractee Details */}
            {job.contractee && (
                <JobContainerWithTitle title="Contractee">
                    {job.contractee.Name && (
                        <View style={commonStyles.listItem}>
                            <Text style={[commonStyles.bodySmall, commonStyles.textSemiBold, { color: colors.textSecondary }]}>
                                Company Name
                            </Text>
                            <Text style={[commonStyles.body, { color: colors.text, marginTop: 4 }]}>
                                {job.contractee.Name}
                            </Text>
                        </View>
                    )}

                    {job.contractee.ContactName && (
                        <View style={commonStyles.listItem}>
                            <Text style={[commonStyles.bodySmall, commonStyles.textSemiBold, { color: colors.textSecondary }]}>
                                Contact Person
                            </Text>
                            <Text style={[commonStyles.body, { color: colors.text, marginTop: 4 }]}>
                                {job.contractee.ContactName}
                            </Text>
                        </View>
                    )}

                    {job.contractee.Phone && (
                        <View style={[commonStyles.listItem, { paddingBottom: 0 }]}>
                            <View style={{ flex: 1 }}>
                                <Text style={[commonStyles.bodySmall, commonStyles.textSemiBold, { color: colors.textSecondary }]}>
                                    Phone
                                </Text>
                                <Text style={[commonStyles.body, { color: colors.text, marginTop: 4 }]}>
                                    {job.contractee.Phone}
                                </Text>
                            </View>
                            <Pressable 
                                style={[{ backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, flexDirection: 'row', alignItems: 'center' }]}
                                onPress={() => contactLink(job.contractee.Phone, 'tel')}
                            >
                                <Ionicons name="call" size={16} color={colors.buttonPrimaryText} />
                                <Text style={[commonStyles.buttonPrimaryText, { marginLeft: 6, fontSize: 14 }]}>Call</Text>
                            </Pressable>
                        </View>
                    )}

                    {job.contractee.Email && (
                        <View style={[commonStyles.listItem, { paddingBottom: 0 }]}>
                            <View style={{ flex: 1 }}>
                                <Text style={[commonStyles.bodySmall, commonStyles.textSemiBold, { color: colors.textSecondary }]}>
                                    Email
                                </Text>
                                <Text style={[commonStyles.body, { color: colors.text, marginTop: 4 }]}>
                                    {job.contractee.Email}
                                </Text>
                            </View>
                            <Pressable 
                                style={[{ backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, flexDirection: 'row', alignItems: 'center' }]}
                                onPress={() => contactLink(job.contractee.Email, 'mailto')}
                            >
                                <Ionicons name="mail" size={16} color={colors.buttonPrimaryText} />
                                <Text style={[commonStyles.buttonPrimaryText, { marginLeft: 6, fontSize: 14 }]}>Email</Text>
                            </Pressable>
                        </View>
                    )}
                </JobContainerWithTitle>
            )}
        </JobPageScrollContainer>
    );
};

export default JobPage;