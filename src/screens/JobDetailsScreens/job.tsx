// Job Page for displaying job details including type of job, number of men, number of stops, and more.

import JobContainerWithTitle from '@/src/components/ui/jobPage/jobContainerWithTitle';
import JobPageScrollContainer from '@/src/components/ui/jobPage/jobPageScrollContainer';
import React, { useState } from 'react';
import { View, Text, Switch, ScrollView, Pressable } from 'react-native';
import Checkbox from 'expo-checkbox';
import contactLink from '@/src/services/contactLink';


const JobPage = ({ job, setJob }: { job: any, setJob: React.Dispatch<React.SetStateAction<any>> }) => {
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
        checkbox: {
            marginLeft: 10,
        },
        jobDetailsPageContractorSection: {
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
        jobDetailsPageContractorTitle: {
            fontSize: 18,
            fontWeight: 'bold',
            color: '#333',
            marginBottom: 10,
        },
        jobDetailsPageContractorDetail: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            paddingVertical: 10,
            borderBottomWidth: 1,
            borderBottomColor: '#ddd',
        },
        jobDetailsPageContractorDetailName: {
            fontSize: 16,
            fontWeight: 'bold',
            color: '#333',
            flex: 1,
        },
        jobDetailsPageContractorDetailValue: {
            fontSize: 16,
            color: '#333',
            flex: 2,
        },
        jobDetailsPageContractorDetailButton: {
            backgroundColor: '#2563eb',
            padding: 10,
            borderRadius: 5,
            marginLeft: 10,
        },
        jobDetailsPageContractorDetailButtonText: {
            color: '#fff',
            fontSize: 16,
            fontWeight: 'bold',
        },
        jobDetailsPageContracteeSection: {
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
        jobDetailsPageContracteeTitle: {
            fontSize: 18,
            fontWeight: 'bold',
            color: '#333',
            marginBottom: 10,
        },
        jobDetailsPageContracteeDetail: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            paddingVertical: 10,
            borderBottomWidth: 1,
            borderBottomColor: '#ddd',
        },
        jobDetailsPageContracteeDetailName: {
            fontSize: 16,
            fontWeight: 'bold',
            color: '#333',
            flex: 1,
        },
        jobDetailsPageContracteeDetailValue: {
            fontSize: 16,
            color: '#333',
            flex: 2,
        },
        jobDetailsPageContracteeDetailButton: {
            backgroundColor: '#2563eb',
            padding: 10,
            borderRadius: 5,
            marginLeft: 10,
        },
        jobDetailsPageContracteeDetailButtonText: {
            color: '#fff',
            fontSize: 16,
            fontWeight: 'bold',
        },
        jobDetailsPageItemCheckBox: {
            backgroundColor: '#e0e0e0',
            borderWidth: 1,
            borderColor: '#ccc',
            padding: 5,
            borderRadius: 5,
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: 10,
        },

    };

    return (
        <JobPageScrollContainer>
            <JobContainerWithTitle title="Job Details">


                {
                    job.items && job.items.length > 0 && job.items.map((item: any, index: number) => (
                        <View key={index} style={Style.jobDetailsPageItem}>
                            <Text style={Style.jobDetailsItemName}>{item.name}</Text>
                            <Text style={Style.jobDetailsItemNumber}>{item.number}</Text>
                            <Switch
                                value={item.checked}
                                onValueChange={(v) => {
                                    item.checked = v; // Update the item's checked state
                                    setJob({ ...job }); // Trigger a re-render
                                }}
                                color={item.checked ? '#2563eb' : undefined} // blue when checked
                                style={Style.checkbox}
                            />
                        </View>
                    ))
                }
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
            <View style={Style.jobDetailsPageContractorSection}>
                <Text style={Style.jobDetailsPageContractorTitle}>Contractor Details</Text>
                <View style={Style.jobDetailsPageContractorDetail}>
                    <Text style={Style.jobDetailsPageContractorDetailName}>Name:</Text>
                    <Text style={Style.jobDetailsPageContractorDetailValue}>{job.contractor.Name || "N/A"}</Text>
                </View>
                <View style={Style.jobDetailsPageContractorDetail}>
                    <Text style={Style.jobDetailsPageContractorDetailName}>Contact Name :</Text>
                    <Text style={Style.jobDetailsPageContractorDetailValue}>{job.contractor.ContactName || "N/A"}</Text>
                </View>
                <View style={Style.jobDetailsPageContractorDetail}>
                    <Text style={Style.jobDetailsPageContractorDetailName}>Phone:</Text>
                    <Text style={Style.jobDetailsPageContractorDetailValue}>{job.contractor.Phone || "N/A"}</Text>
                    <Pressable onPress={() => contactLink(job.contractor.Phone, 'tel')} style={Style.jobDetailsPageContractorDetailButton}>
                        <Text style={Style.jobDetailsPageContractorDetailButtonText}>Call</Text>
                    </Pressable>
                </View>
                <View style={Style.jobDetailsPageContractorDetail}>
                    <Text style={Style.jobDetailsPageContractorDetailName}>Email:</Text>
                    <Text style={Style.jobDetailsPageContractorDetailValue}>{job.contractor.Email || "N/A"}</Text>
                    <Pressable onPress={() => contactLink(job.contractor.Email, 'mailto')} style={Style.jobDetailsPageContractorDetailButton}>
                        <Text style={Style.jobDetailsPageContractorDetailButtonText}>Email</Text>
                    </Pressable>
                </View>
            </View>
            <View style={Style.jobDetailsPageContracteeSection}>
                <Text style={Style.jobDetailsPageContracteeTitle}>Contractee Details</Text>
                <View style={Style.jobDetailsPageContracteeDetail}>
                    <Text style={Style.jobDetailsPageContracteeDetailName}>Name:</Text>
                    <Text style={Style.jobDetailsPageContracteeDetailValue}>{job.contractee.Name || "N/A"}</Text>
                </View>
                <View style={Style.jobDetailsPageContracteeDetail}>
                    <Text style={Style.jobDetailsPageContracteeDetailName}>Contact Name:</Text>
                    <Text style={Style.jobDetailsPageContracteeDetailValue}>{job.contractee.ContactName || "N/A"}</Text>
                </View>
                <View style={Style.jobDetailsPageContracteeDetail}>
                    <Text style={Style.jobDetailsPageContracteeDetailName}>Phone:</Text>
                    <Text style={Style.jobDetailsPageContracteeDetailValue}>{job.contractee.Phone || "N/A"}</Text>
                    <Pressable onPress={() => contactLink(job.contractee.Phone, 'tel')} style={Style.jobDetailsPageContracteeDetailButton}>
                        <Text style={Style.jobDetailsPageContracteeDetailButtonText}>Call</Text>
                    </Pressable>
                </View>
                <View style={Style.jobDetailsPageContracteeDetail}>
                    <Text style={Style.jobDetailsPageContracteeDetailName}>Email:</Text>
                    <Text style={Style.jobDetailsPageContracteeDetailValue}>{job.contractee.Email || "N/A"}</Text>
                    <Pressable onPress={() => contactLink(job.contractee.Email, 'mailto')} style={Style.jobDetailsPageContracteeDetailButton}>
                        <Text style={Style.jobDetailsPageContracteeDetailButtonText}>Email</Text>
                    </Pressable>
                </View>
            </View>

        </JobPageScrollContainer>
    );
};

export default JobPage;