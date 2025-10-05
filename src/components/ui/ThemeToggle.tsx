/**
 * Theme Toggle Button
 * Allows users to switch between light and dark themes
 */

import React from 'react'
import { TouchableOpacity, Text, StyleSheet } from 'react-native'
import { useTheme } from '../../context/ThemeProvider'
import { Ionicons } from '@expo/vector-icons'

interface ThemeToggleProps {
  style?: any
  showText?: boolean
  size?: 'small' | 'medium' | 'large'
}

export function ThemeToggle({ style, showText = true, size = 'medium' }: ThemeToggleProps) {
  const { theme, isDark, toggleTheme, colors } = useTheme()
  
  const iconSizes = {
    small: 20,
    medium: 24,
    large: 28
  }
  
  const textSizes = {
    small: 12,
    medium: 14,
    large: 16
  }

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.backgroundSecondary,
      paddingHorizontal: showText ? 12 : 8,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    text: {
      marginLeft: showText ? 8 : 0,
      fontSize: textSizes[size],
      color: colors.text,
      fontWeight: '500',
    },
  })

  return (
    <TouchableOpacity 
      style={[styles.container, style]} 
      onPress={toggleTheme}
      activeOpacity={0.7}
    >
      <Ionicons 
        name={isDark ? 'sunny' : 'moon'} 
        size={iconSizes[size]} 
        color={colors.primary} 
      />
      {showText && (
        <Text style={styles.text}>
          {isDark ? 'Light' : 'Dark'}
        </Text>
      )}
    </TouchableOpacity>
  )
}

/**
 * Simple icon-only theme toggle
 */
export function ThemeToggleIcon({ style, size = 'medium' }: Omit<ThemeToggleProps, 'showText'>) {
  return <ThemeToggle style={style} size={size} showText={false} />
}