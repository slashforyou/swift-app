// Client Page for Job Details, displaying client informat            <View style={[commonStyles.card, { marginTop: 16 }]>           <View style={[commonStyles.card, { marginTop: 16 }]>on such as name, phone, and email.
import JobContainerWithTitle from '@/src/components/ui/jobPage/jobContainerWithTitle';
import JobPageScrollContainer from '@/src/components/ui/jobPage/jobPageScrollContainer';
import contactLink from '@/src/services/contactLink';
import Ionicons from '@react-native-vector-icons/ionicons';
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useCommonThemedStyles } from '../../hooks/useCommonStyles';

const JobClient = ({ job, setJob }: any) => {
    const { colors, styles: commonStyles } = useCommonThemedStyles();

    return (
        <JobPageScrollContainer>
            {/* Client Information Card */}
            <JobContainerWithTitle title="Client Details">
                <View style={commonStyles.listItem}>
                    <Text style={[commonStyles.bodySmall, commonStyles.textSemiBold, { color: colors.textSecondary }]}>
                        First Name
                    </Text>
                    <Text style={[commonStyles.body, { color: colors.text, marginTop: 4 }]}>
                        {job.client?.firstName || 'Not specified'}
                    </Text>
                </View>
                
                <View style={commonStyles.listItem}>
                    <Text style={[commonStyles.bodySmall, commonStyles.textSemiBold, { color: colors.textSecondary }]}>
                        Last Name
                    </Text>
                    <Text style={[commonStyles.body, { color: colors.text, marginTop: 4 }]}>
                        {job.client?.lastName || 'Not specified'}
                    </Text>
                </View>

                {job.client?.phone && (
                    <View style={commonStyles.listItem}>
                        <Text style={[commonStyles.bodySmall, commonStyles.textSemiBold, { color: colors.textSecondary }]}>
                            Phone
                        </Text>
                        <Text style={[commonStyles.body, { color: colors.text, marginTop: 4 }]}>
                            {job.client.phone}
                        </Text>
                    </View>
                )}

                {job.client?.email && (
                    <View style={commonStyles.listItem}>
                        <Text style={[commonStyles.bodySmall, commonStyles.textSemiBold, { color: colors.textSecondary }]}>
                            Email
                        </Text>
                        <Text style={[commonStyles.body, { color: colors.text, marginTop: 4 }]}>
                            {job.client.email}
                        </Text>
                    </View>
                )}
            </JobContainerWithTitle>

            {/* Quick Action Buttons */}
            <View style={[commonStyles.card, { marginTop: 16 }]}>
                <Text style={[commonStyles.h4, { color: colors.text, marginBottom: 12 }]}>
                    Quick Actions
                </Text>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                    {job.client?.phone && (
                        <>
                            <Pressable 
                                style={[commonStyles.buttonSecondary, { flex: 1 }]}
                                onPress={() => contactLink(job.client?.phone, 'tel')}
                            >
                                <Ionicons name="call" size={20} color={colors.primary} />
                                <Text style={[commonStyles.buttonSecondaryText, { marginLeft: 8 }]}>Call</Text>
                            </Pressable>
                            
                            <Pressable 
                                style={[commonStyles.buttonSecondary, { flex: 1 }]}
                                onPress={() => contactLink(job.client?.phone, 'sms')}
                            >
                                <Ionicons name="chatbubble" size={20} color={colors.primary} />
                                <Text style={[commonStyles.buttonSecondaryText, { marginLeft: 8 }]}>SMS</Text>
                            </Pressable>
                        </>
                    )}
                    
                    {job.client?.email && (
                        <Pressable 
                            style={[commonStyles.buttonSecondary, { flex: 1 }]}
                            onPress={() => contactLink(job.client?.email, 'mailto')}
                        >
                            <Ionicons name="mail" size={20} color={colors.primary} />
                            <Text style={[commonStyles.buttonSecondaryText, { marginLeft: 8 }]}>Email</Text>
                        </Pressable>
                    )}
                </View>
            </View>
        </JobPageScrollContainer>
    );
};

export default JobClient;