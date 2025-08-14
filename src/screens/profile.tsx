// The profile screen displays user profile information and allows editing.
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import TopMenu from '../components/top_menu/top_menu';
import { Background } from '@react-navigation/elements';
import { backup } from 'node:sqlite';

const Profile = () => {
    const navigation = useNavigation();
    const [user, setUser] = useState({
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com"
    });

    const Style = {
        profileContainer: {
            flex: 1,
            backgroundColor: '#f9f9f9',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
        },
        profileContainerScroll: {
            width: '100%',
            flex: 1,
            marginTop: 80,
        },
        profileContainerScrollContent: {
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
        },
        profilePicture: {
            width: '100%',
            padding: 20,
            backgroundColor: '#721c24',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottomWidth: 1,
            borderBottomColor: '#ddd',
        },
        profilePictureTitle: {
            fontSize: 20,
            color: '#fff',
            marginBottom: 10,
            width: '100%',
            textAlign: 'left',
        },
        profilePictureImage: {
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: '#e0e0e0',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 10,
        },
        profileName: {
            fontSize: 20,
            fontWeight: 'bold',
            color: '#fff',
            marginBottom: 10,
            letterSpacing: 1,
            textAlign: 'center',
            width: '100%',
        },
        profileDetails: {
            width: '95%',
            padding: 20,
            backgroundColor: '#fff',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            borderRadius: 10,
            shadowColor: '#999',
            shadowOffset: {
                width: 0,
                height: 2,
            },
            shadowOpacity: 0.1,
            shadowRadius: 10,
            elevation: 5,
            marginBottom: 20,
            marginTop: 20,
        },
        profileDetailsItem: {
            width: '100%',
            padding: 10,
            borderBottomWidth: 1,
            borderBottomColor: '#ddd',
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        profileDetailsItemText: {
            fontSize: 16,
            color: '#333',
            flex: 1,
        },
        profileDetailsItemValue: {
            fontSize: 16,
            color: '#555',
            flex: 2,
        },
        profileDetailsItemButton: {
            paddingVertical: 5,
            paddingHorizontal: 10,
            backgroundColor: '#721c24',
            borderRadius: 5,
            alignItems: 'center',
            justifyContent: 'center',
        },
        profileDetailsItemButtonText: {
            color: '#fff',
            fontSize: 14,
        },
        profileDetailsItemButtonDisabled: {
            backgroundColor: '#ccc',
        },
    };

    return (
        <View style={ Style.profileContainer }>
            <TopMenu navigation={navigation} />
            <ScrollView style={ Style.profileContainerScroll } contentContainerStyle={ Style.profileContainerScrollContent }>
                <View style={ Style.profilePicture }>
                    <Text style={ Style.profilePictureTitle }>Profile</Text>
                    <View style={ Style.profilePictureImage }>
                        <Text>Image Placeholder</Text>
                    </View>
                    <Text style={ Style.profileName }>
                        {user.firstName} {user.lastName}
                    </Text>
                    {/* TODO : Progress bar with level of the employee/worker */}
                </View>
                <View style={ Style.profileDetails }>
                    <View style={ Style.profileDetailsItem }>
                        <Text style={ Style.profileDetailsItemText }>First Name:</Text>
                        <Text style={ Style.profileDetailsItemValue }>{user.firstName}</Text>
                        <Pressable style={ Style.profileDetailsItemButton }>
                            <Text style={ Style.profileDetailsItemButtonText }>Edit</Text>
                        </Pressable>
                    </View>
                    <View style={ Style.profileDetailsItem }>
                        <Text style={ Style.profileDetailsItemText }>Last Name:</Text>
                        <Text style={ Style.profileDetailsItemValue }>{user.lastName}</Text>
                        <Pressable style={ Style.profileDetailsItemButton }>
                            <Text style={ Style.profileDetailsItemButtonText }>Edit</Text>
                        </Pressable>
                    </View>
                    <View style={ Style.profileDetailsItem }>
                        <Text style={ Style.profileDetailsItemText }>Email:</Text>
                        <Text style={ Style.profileDetailsItemValue }>{user.email}</Text>
                        <Pressable style={ Style.profileDetailsItemButton }>
                            <Text style={ Style.profileDetailsItemButtonText }>Edit</Text>
                        </Pressable>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

export default Profile;
