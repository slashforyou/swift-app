import React from 'react';
import { ScrollView } from 'react-native';

const JobPageScrollContainer = ({ children } : { children: React.ReactNode }) => {
    const Style = {
        jobDetailsPage: {
            flex: 1,
            marginTop: 80,
            marginBottom: 95,
            backgroundColor: '#fff',
            paddingTop: 50,
            paddingBottom: 50,
            height: 'calc(100% - 80px)',
            width: '100%',
        },
        jobDetailsPageContainerScroll: {
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            paddingBottom: 50,
        },
    }

    return (
        <ScrollView style={Style.jobDetailsPage} contentContainerStyle={Style.jobDetailsPageContainerScroll}>        
                {
                    children
                }
        </ScrollView>
    );
}
export default JobPageScrollContainer;