// Payment page for Job Details, displaying payment information and allowing the user to make a payment.
import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
const JobPayment = ({ job }: { job: any }) => {
    const Style = {
        jobDetailsPage: {
            flex: 1,
            marginTop: 80,
            marginBottom: 95,
            backgroundColor: '#fff',
            paddingTop: 30,
        },
        jobDetailsPageContainerScroll: {
            padding: 20,
        },
        jobDetailsPageTitle: {
            marginBottom: 20,
        },
        jobDetailsPageTitleText: {
            fontSize: 24,
            fontWeight: 'bold',
        },
        jobDetailsPagePaymentText: {
            fontSize: 16,
            marginBottom: 10,
        },
    };

    return (
        <View style={Style.jobDetailsPage}>
            <ScrollView contentContainerStyle={Style.jobDetailsPageContainerScroll}>
                <View style={Style.jobDetailsPageTitle}>
                    <Text style={Style.jobDetailsPageTitleText}>Job Payment</Text>
                </View>
                <Text style={Style.jobDetailsPagePaymentText}>{job.payment || "No payment information available."}</Text>
            </ScrollView>
        </View>
    );
};
export default JobPayment;