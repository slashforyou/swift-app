import Navigation from "@/src/navigation/index";
import { View, Pressable, Text, StyleSheet } from "react-native";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import React from 'react';
import { useThemedStyles, useThemeColors } from '../../../hooks/useThemeColor';
import { Colors } from '../../constants/Colors';

const TopMenu = ({ navigation }: any) => {
  const styles = useThemedStyles(createTopMenuStyles);
  const colors = useThemeColors();

  return (
    <View style={styles.topMenu}>
      <Pressable style={styles.backButton} onPress={() => navigation.navigate('Home')}>
        <Ionicons name="home" size={24} color={colors.background} />
      </Pressable>
    </View>
  );
}

// Create themed styles function
const createTopMenuStyles = (colors: typeof Colors.light) => StyleSheet.create({
  topMenu: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    width: '100%',
    padding: 10,
    paddingTop: 25,
    backgroundColor: colors.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    position: 'absolute' as const,
    top: 0,
    zIndex: 1000,
    elevation: 5,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    padding: 10,
    backgroundColor: 'transparent',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: colors.background,
  },
});

export default TopMenu;