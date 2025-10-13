import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

// Components
import LanguageButton from '../../components/calendar/LanguageButton'

// Hooks & Utils
import { useCommonThemedStyles } from '../../constants/Styles'
import { useTheme } from '../../context/ThemeProvider'
import { useLocalization } from '../../localization/useLocalization'

/**
 * Jobs & Billing Screen
 * Manages job creation and billing
 */
export default function JobsBillingScreen() {
  const { t } = useLocalization()
  const commonStyles = useCommonThemedStyles()
  const { colors } = useTheme()

  const styles = StyleSheet.create({
    container: {
      ...commonStyles.container,
      paddingHorizontal: 20,
      paddingTop: 20,
      position: 'relative',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingBottom: 20,
    },
    title: {
      ...commonStyles.title,
      color: colors.text,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    placeholder: {
      ...commonStyles.bodyText,
      color: colors.textSecondary,
      textAlign: 'center',
    }
  })

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('business.jobs.title')}</Text>
        <LanguageButton />
      </View>

      <View style={styles.content}>
        <Text style={styles.placeholder}>
          {t('business.jobs.placeholder')}
        </Text>
      </View>
    </View>
  )
}