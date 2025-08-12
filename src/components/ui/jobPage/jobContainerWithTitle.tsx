import React from 'react';
import { View, Text } from 'react-native';

const JobContainerWithTitle = ({ title, children }: { title: string; children: React.ReactNode }) => {
    const Style = {
        jobContainer: {
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
        jobContainerTitle: {
            width: '100%',
            padding: 10,
            backgroundColor: '#f0f0f0',
            borderBottomWidth: 1,
            borderBottomColor: '#ddd',
            alignItems: 'center',
            borderTopLeftRadius: 10,
            borderTopRightRadius: 10,
        },
        jobContainerTitleText: {
            fontSize: 18,
            fontWeight: 'bold',
            color: '#333',
        },
        jobContainerChildrenBloc: {
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
        },
    };
    
    return (
        <View style={Style.jobContainer}>
            <View style={Style.jobContainerTitle}>
                <Text style={Style.jobContainerTitleText}>{title}</Text>
            </View>
            <View style={Style.jobContainerChildrenBloc}>
                {children}
            </View>
        </View>
    );
};

export default JobContainerWithTitle;