import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';

const JobMenu = ({ jobPanel, setJobPanel }: any ) => {

    const styles = StyleSheet.create({
        menuContainer: {
            flexDirection: 'row',
            justifyContent: 'space-around',
            padding: 10,
            backgroundColor: '#f8f8f8',
            borderTopWidth: 1,
            borderColor: '#ddd',
            paddingBottom: 40, // Adjusted padding to prevent overlap with bottom tab bar
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1000, // Ensure the menu is above other components
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 5,
        },
        menuItem: {
            flex: 1,
            alignItems: 'center',
            paddingVertical: 10,
        },
    });

    const switchJobPanel = (panelIndex: number) => {
        if (jobPanel !== panelIndex) {
            setJobPanel(panelIndex);
        }
    };

    return (
        <View style={styles.menuContainer}>
            <Text style={styles.menuItem} onPress={() => switchJobPanel(0)}>
                <Ionicons name="bookmark" size={24} color={jobPanel === 0 ? 'blue' : '#333'} />
            </Text>
            <Text style={styles.menuItem} onPress={() => switchJobPanel(1)}>
                <Ionicons name="chatbubble" size={24} color={jobPanel === 1 ? 'blue' : '#333'} />
            </Text>
            <Text style={styles.menuItem} onPress={() => switchJobPanel(2)}>
                <Ionicons name="call" size={24} color={jobPanel === 2 ? 'blue' : '#333'} />
            </Text>
            <Text style={styles.menuItem} onPress={() => switchJobPanel(3)}>
                <Ionicons name="information-circle" size={24} color={jobPanel === 3 ? 'blue' : '#333'} />
            </Text>
            <Text style={styles.menuItem} onPress={() => switchJobPanel(4)}>
                <Ionicons name="settings" size={24} color={jobPanel === 4 ? 'blue' : '#333'} />
            </Text>
        </View>
    );
}

export default JobMenu;