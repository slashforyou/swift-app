// The parameters screen allows users to view and edit their settings.
import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import TopMenu from '../components/top_menu/top_menu';
import { useNavigation } from '@react-navigation/native';

const Parameters = () => {
    const navigation = useNavigation();

    const Style = {
        parametersContainer: {
            flex: 1,
            backgroundColor: '#f9f9f9',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
        },
        parametersContainerScroll: {
            width: '100%',
            flex: 1,
            marginTop: 80,
        },
        parametersContainerScrollContent: {
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
        },
        parametersTitle: {
            fontSize: 20,
            color: '#333',
            marginBottom: 10,
            width: '100%',
            textAlign: 'left',
        },
        parametersItem: {
            width: '95%',
            padding: 20,
            backgroundColor: '#fff',
            borderRadius: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
            marginBottom: 20,
        },
        parametersBackButton: {
            backgroundColor: '#2563eb',
            padding: 10,
            borderRadius: 5,
            marginTop: 20,
        },
        parametersBackButtonText: {
            color: '#fff',
            fontSize: 16,
            fontWeight: 'bold',
        },
    };

    return (
        <View style={Style.parametersContainer}>
            <TopMenu title="Parameters" navigation={navigation} />
            <ScrollView style={Style.parametersContainerScroll} contentContainerStyle={Style.parametersContainerScrollContent}>
                <Text style={Style.parametersTitle}>Settings</Text>
                <View style={Style.parametersItem}>
                    <Text>Notification Settings</Text>
                    {/* Add notification settings options here */}
                </View>
                <View style={Style.parametersItem}>
                    <Text>Privacy Settings</Text>
                    {/* Add privacy settings options here */}
                </View>
                <View style={Style.parametersItem}>
                    <Text>Account Settings</Text>
                    {/* Add account settings options here */}
                </View>
                <Pressable onPress={() => navigation.goBack()} style={ Style.parametersBackButton }>
                    <Text style={ Style.parametersBackButtonText }>Go Back</Text>
                </Pressable>
            </ScrollView>
        </View>
    );
};

export default Parameters;
