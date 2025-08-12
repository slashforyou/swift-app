// Job Page for displaying job details including type of job, number of men, number of stops, and more.

import JobContainerWithTitle from '@/src/components/ui/jobPage/jobContainerWithTitle';
import JobPageScrollContainer from '@/src/components/ui/jobPage/jobPageScrollContainer';
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';

const JobPage = ({ job }: { job: any }) => {
    const Style = {
        jobDetailsPageItemsContainer: {
            marginTop: 20,
            marginBottom: 20,
            width: '95%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            borderColor: '#ddd',
            shadowColor: '#000',
            shadowOffset: {
                width: 0,
                height: 2,
            },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
            backgroundColor: '#f9f9f9',
            borderRadius: 10,
        },
        jobDetailsPageItem: {
            padding: 10,
            marginBottom: 5,
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '95%',
            borderBottomWidth: 1,
            borderBottomColor: '#ddd',
            position: 'relative',
        },
        jobDetailsItemName: {
            fontSize: 16,
            fontWeight: 'bold',
            color: '#333',
            flex: 1,
        },
        jobDetailsItemNumber: {
            fontSize: 16,
            borderWidth: 1,
            borderColor: '#ddd',
            padding: 5,
            borderRadius: 5,
            backgroundColor: '#fff',

        },
        jobDetailsItemCheckBox: {
            backgroundColor: '#e0e0e0',
            borderWidth: 1,
            borderColor: '#ccc',
            padding: 5,
            borderRadius: 5,
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: 10,
        },
        jobDetailsItemCheckBoxText: {
            fontSize: 16,
            color: '#333',
        },
        jobDetailsPageItemsTitle: {
            width: '100%',
            padding: 10,
            backgroundColor: '#f0f0f0',
            borderBottomWidth: 1,
            borderBottomColor: '#ddd',
            alignItems: 'center',
            borderTopLeftRadius: 10,
            borderTopRightRadius: 10,
        },
        jobDetailsPageItemsTitleText: {
            fontSize: 18,
            fontWeight: 'bold',
            color: '#333',
        },
        jobDetailsPageDetails: {
            padding: 10,
            marginBottom: 20,
            width: '95%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            borderColor: '#ddd',
            shadowColor: '#000',
            shadowOffset: {
                width: 0,
                height: 2,
            },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
            backgroundColor: '#f9f9f9',
            borderRadius: 10,
        },
        jobDetailsPageDetail: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            paddingVertical: 10,
            borderBottomWidth: 1,
            borderBottomColor: '#ddd',
        },
        jobDetailsPageDetailName: {
            fontSize: 16,
            fontWeight: 'bold',
            color: '#333',
            flex: 1,
        },
        jobDetailsPageDetailValue: {
            fontSize: 16,
            color: '#333',
            flex: 2,
        },
    };

    return (
        <JobPageScrollContainer>
            <JobContainerWithTitle title="Job Details">
                <View style={Style.jobDetailsPageItem}>
                    <Text style={Style.jobDetailsItemName}> Item Name </Text>
                    <Text style={Style.jobDetailsItemNumber}> 1 </Text>
                    {/* Checkable case at the end */}
                    <Pressable style={Style.jobDetailsItemCheckBox}>
                        <Text style={Style.jobDetailsItemCheckBoxText}>✓</Text>
                    </Pressable>
                </View>
            </JobContainerWithTitle>
            <View style={Style.jobDetailsPageDetails}>
                <View style={Style.jobDetailsPageDetail}>
                    <Text style={Style.jobDetailsPageDetailName}>Job Type:</Text>
                    <Text style={Style.jobDetailsPageDetailValue}>{job.type || "N/A"}</Text>
                </View>
                <View style={Style.jobDetailsPageDetail}>
                    <Text style={Style.jobDetailsPageDetailName}>Number of Items:</Text>
                    <Text style={Style.jobDetailsPageDetailValue}>{job.itemsCount || 0}</Text>
                </View>
                <View style={Style.jobDetailsPageDetail}>
                    <Text style={Style.jobDetailsPageDetailName}>Job Status:</Text>
                    <Text style={Style.jobDetailsPageDetailValue}>{job.status || "N/A"}</Text>
                </View>
            </View>
        </JobPageScrollContainer>
    );
};

export default JobPage;