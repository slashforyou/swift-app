import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useCommonThemedStyles } from '../hooks/useCommonStyles';
import Ionicons from '@react-native-vector-icons/ionicons';

const JobMenu = ({ jobPanel, setJobPanel }: any ) => {
    const { colors, styles: commonStyles } = useCommonThemedStyles();

    // Styles personnalisés basés sur notre système commun
    const customStyles = StyleSheet.create({
        menuContainer: {
            ...commonStyles.tabBar, // Utilise le style de tabBar commun
            flexDirection: 'row',
            justifyContent: 'space-between',
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            width: '100%',
        },
            menuItem: {
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 10,
                display: 'flex',
                flexDirection: 'column',
            },
            menuIcon: {
                marginBottom: 5,
                alignSelf: 'center',
            },
        });

    const switchJobPanel = (panelIndex: number) => {
        if (jobPanel !== panelIndex) {
            setJobPanel(panelIndex);
        }
    };

    return (
        <View style={customStyles.menuContainer}>
            <Text style={customStyles.menuItem} onPress={() => switchJobPanel(0)}>
                <Ionicons name="bookmark" style={customStyles.menuIcon} size={24} color={jobPanel === 0 ? colors.primary : colors.textSecondary} />
            </Text>
            <Text style={customStyles.menuItem} onPress={() => switchJobPanel(1)}>
                <Ionicons name="construct" style={customStyles.menuIcon} size={24} color={jobPanel === 1 ? colors.primary : colors.textSecondary} />
            </Text>
            <Text style={customStyles.menuItem} onPress={() => switchJobPanel(2)}>
                <Ionicons name="person" style={customStyles.menuIcon} size={24} color={jobPanel === 2 ? colors.primary : colors.textSecondary} />
            </Text>
            <Text style={customStyles.menuItem} onPress={() => switchJobPanel(3)}>
                <Ionicons name="chatbubble" style={customStyles.menuIcon} size={24} color={jobPanel === 3 ? colors.primary : colors.textSecondary} />
            </Text>
            <Text style={customStyles.menuItem} onPress={() => switchJobPanel(4)}>
                <Ionicons name="card" style={customStyles.menuIcon} size={24} color={jobPanel === 4 ? colors.primary : colors.textSecondary} />
            </Text>
        </View>
    );
}

export default JobMenu;