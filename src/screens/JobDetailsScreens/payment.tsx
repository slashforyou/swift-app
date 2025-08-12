// Payment page for Job Details, displaying payment information and allowing the user to make a payment.
import JobContainerWithTitle from '@/src/components/ui/jobPage/jobContainerWithTitle';
import JobPageScrollContainer from '@/src/components/ui/jobPage/jobPageScrollContainer';
import Ionicons from '@react-native-vector-icons/ionicons';
import { backup } from 'node:sqlite';
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import PaymentWindow from './paymentWindow';
const JobPayment = ({ job }: { job: any }) => {
    const Style = {
        jobDetailsPage: {
            flex: 1,
            marginTop: 80,
            marginBottom: 95,
            backgroundColor: '#fff',
            paddingTop: 30,
        },
        jobPaymentAlertBox: {
            padding: 20,
            backgroundColor: '#f8d7da',
            borderRadius: 5,
            marginTop: 20,
            marginBottom: 20,
        },
        jobPaymentAlertBoxText: {
            color: '#721c24',
            fontSize: 16,
        },
        jobDetailsPageTitle: {
            padding: 20,
            backgroundColor: '#f0f0f0',
            borderBottomWidth: 1,
            borderBottomColor: '#ccc',
        },
        jobDetailsPageTitleText: {
            fontSize: 18,
            fontWeight: 'bold',
            color: '#333',
        },
        jobPaymentButton: {
            backgroundColor: '#28a745',
            padding: 15,
            borderRadius: 5,
            alignItems: 'center',
            marginTop: 20,
            marginBottom: 20,
            width: '90%',
            alignSelf: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            borderWidth: 2,
            borderColor: '#2db94eff',
            gap: 10,
        },
        jobPaymentButtonText: {
            color: '#fff',
            fontSize: 16,
            fontWeight: 'bold',
        },
        jobPaymentDetails: {
            width: '100%',
            paddingHorizontal: 5,
        },
        jobDetailsContent: {
            backgroundColor: '#fff',
            borderRadius: 5,
            marginTop: 20,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: '#ccc',
        },
        jobPaymentDetailsText: {
            fontSize: 16,
            color: '#333',
            marginBottom: 10,
        },
        jobPaymentDetailsSubTitle: {
            fontSize: 16,
            color: '#555',
            marginBottom: 5,
        },
        jobPaymentDetailsValue: {
            fontSize: 16,
            color: '#333',
            marginBottom: 10,
        },
        jobPaymentDetailsSavedCard: {
            padding: 20,
            backgroundColor: '#f9f9f9',
            borderRadius: 5,
            marginTop: 20,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: '#ccc',
        },
        jobPaymentDetailsSavedCardText: {
            fontSize: 16,
            color: '#333',
            marginBottom: 10,
        },
        jobPaymentDetailsTax: {
            padding: 20,
            backgroundColor: '#f9f9f9',
            borderRadius: 5,
            marginTop: 20,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: '#ccc',

        },
        jobPaymentDetailsTaxText: {
            fontSize: 16,
            color: '#333',
            marginBottom: 10,
        },
        jobPaymentDetailsTaxRate: {
            fontSize: 16,
            color: '#555',
            marginBottom: 5,
        },
        jobPaymentDetailCard: {
            backgroundColor: '#f9f9f9',
            borderRadius: 5,
            marginTop: 20,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: '#ccc',
            
        },
        jobPaymentDetailTax: {
            backgroundColor: '#f9f9f9',
            borderWidth: 1,
            borderColor: '#ccc',
            borderRadius: 5,
            marginTop: 20,
            marginBottom: 5,
        },
        jobPaymentDetailStatus: {
            backgroundColor: '#eee',
            borderRadius: 5,
            borderWidth: 1,
            borderColor: '#ccc',
            marginTop: 5,
        },
        jobPaymentDetailTitle: {
            fontSize: 18,
            marginBottom: 10,
            width: '100%',
            backgroundColor: '#eee',
            paddingVertical: 10,
            paddingHorizontal: 15,
            borderBottomWidth: 1,
            borderBottomColor: '#ccc',
            fontWeight: 'bold',
            color: '#444',
            borderTopLeftRadius: 5,
            borderTopRightRadius: 5,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-start',
            gap: 10,
        },
        jobPaymentDetailText: {
            fontSize: 16,
            color: '#333',
            marginBottom: 5,
            borderBottomWidth: 1,
            borderBottomColor: '#ccc',
            paddingVertical: 10,
            paddingHorizontal: 15,
            width: '100%',
        },
        jobPaymentDetailIcon: {
            marginRight: 10,
        },

    };

    const [paymentStatus, setPaymentStatus] = useState(false);
    // This state can be used to control the visibility of the payment window

    return (
        <>
        <JobPageScrollContainer>
            <JobContainerWithTitle title="Payment">
                {
                    job.payment && job.payment.status === 'unsettled' ? (
                        <Pressable style={Style.jobPaymentButton} onPress={() => setPaymentStatus(true)}>
                            <Text style={Style.jobPaymentButtonText}>Make Payment</Text>
                            <Ionicons style={Style.jobPaymentDetailIcon} name="chevron-forward" size={18} color="#fff" />
                        </Pressable>
                    ) : (
                        <View style={Style.jobPaymentAlertBox}>
                            <Text style={Style.jobPaymentAlertBoxText}>No payment details available</Text>
                        </View>
                    )
                }  
                <View style={Style.jobPaymentDetails}>
                    <View style={Style.jobPaymentDetailStatus}>
                        <Text style={Style.jobPaymentDetailText}>Payment Status: {job.payment?.status || 'N/A'}</Text>
                    </View>
                    <View style={Style.jobDetailsContent}>
                        <Text style={Style.jobPaymentDetailTitle}>
                            <Ionicons name='folder' size={20} color='#444' />
                            {" "}Payment Details
                        </Text>
                        <Text style={Style.jobPaymentDetailText}>Status: {job.payment?.status || 'N/A'}</Text>
                        <Text style={Style.jobPaymentDetailText}>Amount: {job.payment?.amount || 'N/A'}</Text>
                        <Text style={Style.jobPaymentDetailText}>Amount Without Tax: {job.payment?.amountWithoutTax || 'N/A'}</Text>
                        <Text style={Style.jobPaymentDetailText}>Amount Paid: {job.payment?.amountPaid || 'N/A'}</Text>
                        <Text style={Style.jobPaymentDetailText}>Amount To Be Paid: {job.payment?.amountToBePaid || 'N/A'}</Text>
                        <Text style={Style.jobPaymentDetailText}>Currency: {job.payment?.currency || 'N/A'}</Text>
                        <Text style={Style.jobPaymentDetailText}>Due Date: {job.payment?.dueDate || 'N/A'}</Text>
                        <Text style={Style.jobPaymentDetailText}>Payment Method: {job.payment?.paymentMethod || 'N/A'}</Text>
                        <Text style={Style.jobPaymentDetailText}>Transaction ID: {job.payment?.transactionId || 'N/A'}</Text>
                        <Text style={Style.jobPaymentDetailText}>Payment Link: {job.payment?.paymentLink || 'N/A'}</Text>
                        <Text style={Style.jobPaymentDetailText}>Payment Time: {job.payment?.paymentTime || 'N/A'}</Text>
                        <Text style={Style.jobPaymentDetailText}>Payment Details: {job.payment?.paymentDetails || 'N/A'}</Text>
                    </View>
                    {job.payment?.savedCard && (
                        <View style={Style.jobPaymentDetailCard}>
                            <Text style={Style.jobPaymentDetailTitle}>
                                <Ionicons name='card' size={20} color='#444' />
                                {" "}Saved Card Details:
                            </Text>
                            <Text style={Style.jobPaymentDetailText}>Card Type: {job.payment.savedCard.cardType || 'N/A'}</Text>
                            <Text style={Style.jobPaymentDetailText}>Last Four Digits: {job.payment.savedCard.lastFourDigits || 'N/A'}</Text>
                            <Text style={Style.jobPaymentDetailText}>Expiry Date: {job.payment.savedCard.expiryDate || 'N/A'}</Text>
                            <Text style={Style.jobPaymentDetailText}>Card Holder Name: {job.payment.savedCard.cardHolderName || 'N/A'}</Text>
                        </View>
                    )}
                    {job.payment?.taxe && (
                        <View style={Style.jobPaymentDetailTax}>
                            <Text style={Style.jobPaymentDetailTitle}>
                                <Ionicons style={Style.jobPaymentDetailIcon} name='receipt' size={20} color='#444' />
                                {" "}Tax Details:
                            </Text>
                            <Text style={Style.jobPaymentDetailText}>GST: {job.payment.taxe.gst || 'N/A'}</Text>
                            <Text style={Style.jobPaymentDetailText}>GST Rate: {job.payment.taxe.gstRate || 'N/A'}%</Text>
                            <Text style={Style.jobPaymentDetailText}>Amount Without Tax: {job.payment.taxe.amountWithoutTax || 'N/A'}</Text>
                        </View>
                    )}
                </View>
            </JobContainerWithTitle>
        </JobPageScrollContainer>
            <PaymentWindow job={job} status={paymentStatus} setPaymentStatus={setPaymentStatus} />
        </>
    );
};
export default JobPayment;