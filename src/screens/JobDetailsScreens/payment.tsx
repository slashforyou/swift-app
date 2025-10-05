// Payment page for Job Details, displaying payment information and allowing the user to make a payment.
import JobContainerWithTitle from '@/src/components/ui/jobPage/jobContainerWithTitle';
import JobPageScrollContainer from '@/src/components/ui/jobPage/jobPageScrollContainer';
import { useCommonThemedStyles } from '../../hooks/useCommonStyles';
import Ionicons from '@react-native-vector-icons/ionicons';
import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import PaymentWindow from './paymentWindow';
const JobPayment = ({ job, setJob }: { job: any, setJob: React.Dispatch<React.SetStateAction<any>> }) => {
    const { colors, styles: commonStyles } = useCommonThemedStyles();
    const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
    // This state can be used to control the visibility of the payment window

    return (
        <>
        <JobPageScrollContainer>
            <JobContainerWithTitle title="Payment">
                {
                    job.payment && job.payment.status === 'unsettled' ? (
                        <Pressable 
                            style={[commonStyles.buttonPrimary, { marginVertical: 16, flexDirection: 'row', gap: 8 }]} 
                            onPress={() => setPaymentStatus('paymentWindow')}
                        >
                            <Text style={commonStyles.buttonPrimaryText}>Make Payment</Text>
                            <Ionicons name="chevron-forward" size={18} color="#fff" />
                        </Pressable>
                    ) : (
                        <View style={[commonStyles.panel, { marginVertical: 16, backgroundColor: colors.warningLight }]}>
                            <Text style={[commonStyles.body, { color: colors.warning }]}>No payment details available</Text>
                        </View>
                    )
                }  
                
                {/* Payment Status */}
                <View style={commonStyles.card}>
                    <View style={[commonStyles.flexRow, { alignItems: 'center', gap: 8, marginBottom: 12 }]}>
                        <Ionicons name="information-circle" size={20} color={colors.primary} />
                        <Text style={[commonStyles.h4, { marginBottom: 0 }]}>Payment Status</Text>
                    </View>
                    <Text style={[commonStyles.body, commonStyles.textSemiBold]}>
                        Status: {job.payment?.status || 'N/A'}
                    </Text>
                </View>

                {/* Payment Details */}
                <View style={commonStyles.card}>
                    <View style={[commonStyles.flexRow, { alignItems: 'center', gap: 8, marginBottom: 16 }]}>
                        <Ionicons name="folder" size={20} color={colors.primary} />
                        <Text style={[commonStyles.h4, { marginBottom: 0 }]}>Payment Details</Text>
                    </View>
                    
                    <View style={commonStyles.listItem}>
                        <Text style={commonStyles.bodySmall}>Status:</Text>
                        <Text style={commonStyles.body}>{job.payment?.status || 'N/A'}</Text>
                    </View>
                    
                    <View style={commonStyles.listItem}>
                        <Text style={commonStyles.bodySmall}>Amount:</Text>
                        <Text style={commonStyles.body}>{job.payment?.amount || 'N/A'}</Text>
                    </View>
                    
                    <View style={commonStyles.listItem}>
                        <Text style={commonStyles.bodySmall}>Amount Without Tax:</Text>
                        <Text style={commonStyles.body}>{job.payment?.amountWithoutTax || 'N/A'}</Text>
                    </View>
                    
                    <View style={commonStyles.listItem}>
                        <Text style={commonStyles.bodySmall}>Amount Paid:</Text>
                        <Text style={commonStyles.body}>{job.payment?.amountPaid || 'N/A'}</Text>
                    </View>
                    
                    <View style={commonStyles.listItem}>
                        <Text style={commonStyles.bodySmall}>Amount To Be Paid:</Text>
                        <Text style={commonStyles.body}>{job.payment?.amountToBePaid || 'N/A'}</Text>
                    </View>
                    
                    <View style={commonStyles.listItem}>
                        <Text style={commonStyles.bodySmall}>Currency:</Text>
                        <Text style={commonStyles.body}>{job.payment?.currency || 'N/A'}</Text>
                    </View>
                    
                    <View style={commonStyles.listItem}>
                        <Text style={commonStyles.bodySmall}>Due Date:</Text>
                        <Text style={commonStyles.body}>{job.payment?.dueDate || 'N/A'}</Text>
                    </View>
                    
                    <View style={commonStyles.listItem}>
                        <Text style={commonStyles.bodySmall}>Payment Method:</Text>
                        <Text style={commonStyles.body}>{job.payment?.paymentMethod || 'N/A'}</Text>
                    </View>
                    
                    <View style={commonStyles.listItem}>
                        <Text style={commonStyles.bodySmall}>Transaction ID:</Text>
                        <Text style={commonStyles.body}>{job.payment?.transactionId || 'N/A'}</Text>
                    </View>
                    
                    <View style={commonStyles.listItem}>
                        <Text style={commonStyles.bodySmall}>Payment Link:</Text>
                        <Text style={commonStyles.body}>{job.payment?.paymentLink || 'N/A'}</Text>
                    </View>
                    
                    <View style={commonStyles.listItem}>
                        <Text style={commonStyles.bodySmall}>Payment Time:</Text>
                        <Text style={commonStyles.body}>{job.payment?.paymentTime || 'N/A'}</Text>
                    </View>
                    
                    <View style={[commonStyles.listItem, { borderBottomWidth: 0 }]}>
                        <Text style={commonStyles.bodySmall}>Payment Details:</Text>
                        <Text style={commonStyles.body}>{job.payment?.paymentDetails || 'N/A'}</Text>
                    </View>
                </View>

                {/* Saved Cards */}
                {job.payment?.savedCards && job.payment.savedCards.length > 0 && job.payment.savedCards.map((card: any, index: number) => (
                    <View key={index} style={commonStyles.card}>
                        <View style={[commonStyles.flexRow, { alignItems: 'center', gap: 8, marginBottom: 16 }]}>
                            <Ionicons name="card" size={20} color={colors.primary} />
                            <Text style={[commonStyles.h4, { marginBottom: 0 }]}>Saved Card {index + 1}</Text>
                        </View>
                        
                        <View style={commonStyles.listItem}>
                            <Text style={commonStyles.bodySmall}>Card Number:</Text>
                            <Text style={commonStyles.body}>{card.cardNumber || 'N/A'}</Text>
                        </View>
                        
                        <View style={commonStyles.listItem}>
                            <Text style={commonStyles.bodySmall}>Card Holder Name:</Text>
                            <Text style={commonStyles.body}>{card.cardHolderName || 'N/A'}</Text>
                        </View>
                        
                        <View style={[commonStyles.listItem, { borderBottomWidth: 0 }]}>
                            <Text style={commonStyles.bodySmall}>Expiry Date:</Text>
                            <Text style={commonStyles.body}>{card.expiryDate || 'N/A'}</Text>
                        </View>
                    </View>
                ))}

                {/* Tax Details */}
                {job.payment?.taxe && (
                    <View style={commonStyles.card}>
                        <View style={[commonStyles.flexRow, { alignItems: 'center', gap: 8, marginBottom: 16 }]}>
                            <Ionicons name="receipt" size={20} color={colors.primary} />
                            <Text style={[commonStyles.h4, { marginBottom: 0 }]}>Tax Details</Text>
                        </View>
                        
                        <View style={commonStyles.listItem}>
                            <Text style={commonStyles.bodySmall}>GST:</Text>
                            <Text style={commonStyles.body}>{job.payment.taxe.gst || 'N/A'}</Text>
                        </View>
                        
                        <View style={commonStyles.listItem}>
                            <Text style={commonStyles.bodySmall}>GST Rate:</Text>
                            <Text style={commonStyles.body}>{job.payment.taxe.gstRate || 'N/A'}%</Text>
                        </View>
                        
                        <View style={[commonStyles.listItem, { borderBottomWidth: 0 }]}>
                            <Text style={commonStyles.bodySmall}>Amount Without Tax:</Text>
                            <Text style={commonStyles.body}>{job.payment.taxe.amountWithoutTax || 'N/A'}</Text>
                        </View>
                    </View>
                )}
            </JobContainerWithTitle>
        </JobPageScrollContainer>
        <PaymentWindow job={job} visibleCondition={paymentStatus} setVisibleCondition={setPaymentStatus} />
        </>
    );
};
export default JobPayment;