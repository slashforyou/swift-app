// Client Page for Job Details, displaying client information such as name, phone, and email.
import JobContainerWithTitle from '@/src/components/ui/jobPage/jobContainerWithTitle';
import JobPageScrollContainer from '@/src/components/ui/jobPage/jobPageScrollContainer';
import contactLink from '@/src/services/contactLink';
import Ionicons from '@react-native-vector-icons/ionicons';
import { backup } from 'node:sqlite';
import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { text } from 'stream/consumers';

const JobClient = ({ job }: any) => {
    const Style = {
        jobDetailsPageClientZone: {
            flex: 1,
            marginTop: 80,
            marginBottom: 95,
            backgroundColor: '#fff',
            paddingTop: 30,
            width: '100%',
        },
        jobDetailsPageClientZoneContainerScroll: {
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
        },
        jobDetailsPageClientZoneText: {
            fontSize: 16,
            width: '100%',
            textAlign: 'left',
            fontWeight: 'bold',
            color: '#333',
            padding: 10,
        },
        jobDetailsPageClientZoneMain: {
            width: '95%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            marginBottom: 20,
            backgroundColor: '#f9f9f9',
            borderRadius: 10,
            shadowColor: '#000',
            shadowOffset: {
                width: 0,
                height: 2,
            },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
        },
        jobDetailsPageClientZoneQuickButtons: {
            flexDirection: 'row',
            justifyContent: 'space-around',
            width: '95%',
            marginTop: 10,
            gap: 10,

        },
        jobDetailsPageClientZoneQuickButton: {
            padding: 10,
            backgroundColor: '#f0f0f0',
            borderRadius: 5,
            shadowColor: '#000',
            shadowOffset: {
                width: 0,
                height: 2,
            },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
            borderWidth: 1,
            borderColor: '#ccc',
            flex: 1,
            textAlign: 'center',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
        },
        jobDetailsPageClientZoneQuickButtonText: {
            fontSize: 16,
            color: '#000',
        },
        jobDetailsPageClientZoneQuickButtonIcon: {
            marginRight: 5,
        },
        jobDetailsPageClientZoneTitle: {
            width: '100%',
            padding: 10,
            backgroundColor: '#f0f0f0',
            borderTopLeftRadius: 10,
            borderTopRightRadius: 10,
            borderBottomWidth: 1,
            borderBottomColor: '#ddd',
            alignItems: 'center',
            justifyContent: 'center',
        },
        jobDetailsPageClientZoneTitleText: {
            fontSize: 18,
            fontWeight: 'bold',
            color: '#333',
            textAlign: 'center',
        },
        
    };

    return (
        <JobPageScrollContainer>
            <JobContainerWithTitle title="Client Details">
                <Text style={Style.jobDetailsPageClientZoneText}>First-name: {job.client?.firstName}</Text>
                <Text style={Style.jobDetailsPageClientZoneText}>Last-name: {job.client?.lastName}</Text>
            </JobContainerWithTitle>
            <View style={Style.jobDetailsPageClientZoneQuickButtons}>
                <Pressable style={ Style.jobDetailsPageClientZoneQuickButton } onPress={() => contactLink(job.client?.phone, 'tel')}>
                    <Ionicons name="call" size={24} color="#000" style={Style.jobDetailsPageClientZoneQuickButtonIcon} />
                </Pressable>
                <Pressable style={ Style.jobDetailsPageClientZoneQuickButton } onPress={() => contactLink(job.client?.phone, 'sms')}>
                    <Ionicons name="chatbubble" size={24} color="#000" style={Style.jobDetailsPageClientZoneQuickButtonIcon} />
                </Pressable>
                <Pressable style={ Style.jobDetailsPageClientZoneQuickButton } onPress={() => contactLink(job.client?.email, 'mailto')}>
                    <Ionicons name="mail" size={24} color="#000" style={Style.jobDetailsPageClientZoneQuickButtonIcon} />
                </Pressable>
            </View>
        </JobPageScrollContainer>
    );
};

export default JobClient;