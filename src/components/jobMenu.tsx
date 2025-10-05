import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemedStyles, useThemeColors } from '../../hooks/useThemeColor';
import Ionicons from '@react-native-vector-icons/ionicons';

const JobMenu = ({ jobPanel, setJobPanel }: any ) => {
    const colors = useThemeColors();

    const createStyles = (colors: any) =>
        StyleSheet.create({
            menuContainer: {
                flexDirection: 'row',
                justifyContent: 'space-between',
                padding: 10,
                backgroundColor: colors.backgroundSecondary,
                borderTopWidth: 1,
                borderColor: colors.border,
                paddingBottom: 40, // Adjusted padding to prevent overlap with bottom tab bar
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 1000, // Ensure the menu is above other components
                shadowColor: colors.shadow,
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 5,
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

    const styles = useThemedStyles(createStyles);

    const switchJobPanel = (panelIndex: number) => {
        if (jobPanel !== panelIndex) {
            setJobPanel(panelIndex);
        }
    };

    return (
        <View style={styles.menuContainer}>
            <Text style={styles.menuItem} onPress={() => switchJobPanel(0)}>
                <Ionicons name="bookmark" style={styles.menuIcon} size={24} color={jobPanel === 0 ? colors.primary : colors.textSecondary} />
            </Text>
            <Text style={styles.menuItem} onPress={() => switchJobPanel(1)}>
                <Ionicons name="construct" style={styles.menuIcon} size={24} color={jobPanel === 1 ? colors.primary : colors.textSecondary} />
            </Text>
            <Text style={styles.menuItem} onPress={() => switchJobPanel(2)}>
                <Ionicons name="person" style={styles.menuIcon} size={24} color={jobPanel === 2 ? colors.primary : colors.textSecondary} />
            </Text>
            <Text style={styles.menuItem} onPress={() => switchJobPanel(3)}>
                <Ionicons name="chatbubble" style={styles.menuIcon} size={24} color={jobPanel === 3 ? colors.primary : colors.textSecondary} />
            </Text>
            <Text style={styles.menuItem} onPress={() => switchJobPanel(4)}>
                <Ionicons name="card" style={styles.menuIcon} size={24} color={jobPanel === 4 ? colors.primary : colors.textSecondary} />
            </Text>
        </View>
    );
}

export default JobMenu;