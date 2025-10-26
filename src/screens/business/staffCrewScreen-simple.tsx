/**
 * StaffCrewScreen - Version simplifiée pour debug
 */
import React from 'react'
import { ScrollView, Text, View } from 'react-native'
import { DESIGN_TOKENS } from '../../constants/Styles'
import { useTheme } from '../../context/ThemeProvider'

export default function StaffCrewScreen() {
  const { colors } = useTheme()

  return (
    <ScrollView 
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        flexGrow: 1,
        padding: DESIGN_TOKENS.spacing.lg,
      }}
    >
      <View style={{
        backgroundColor: colors.backgroundSecondary,
        padding: DESIGN_TOKENS.spacing.md,
        borderRadius: DESIGN_TOKENS.radius.md,
        marginBottom: DESIGN_TOKENS.spacing.md,
      }}>
        <Text style={{
          fontSize: 24,
          fontWeight: 'bold',
          color: colors.text,
          marginBottom: DESIGN_TOKENS.spacing.sm,
        }}>
          Staff Management
        </Text>
        <Text style={{
          fontSize: 16,
          color: colors.textSecondary,
        }}>
          Manage your team members and contractors
        </Text>
      </View>

      <View style={{
        backgroundColor: colors.backgroundSecondary,
        padding: DESIGN_TOKENS.spacing.md,
        borderRadius: DESIGN_TOKENS.radius.md,
      }}>
        <Text style={{
          fontSize: 18,
          fontWeight: '600',
          color: colors.text,
          marginBottom: DESIGN_TOKENS.spacing.sm,
        }}>
          Quick Stats
        </Text>
        <Text style={{
          fontSize: 14,
          color: colors.textSecondary,
        }}>
          • Active Staff: 3{'\n'}
          • Teams: 2{'\n'}
          • Average Rate: $32/hr
        </Text>
      </View>
    </ScrollView>
  )
}