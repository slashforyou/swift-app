import React from 'react';
import { View, Text, ActivityIndicator, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCommonThemedStyles } from '../../hooks/useCommonStyles';
import { DESIGN_TOKENS } from '../../constants/Styles';
import { useTranslation } from '../../localization';

// Loading skeleton for jobs
export const JobsLoadingSkeleton: React.FC = () => {
  const { colors } = useCommonThemedStyles();
  
  const SkeletonItem = () => (
    <View style={{
      backgroundColor: colors.backgroundSecondary,
      borderRadius: DESIGN_TOKENS.radius.lg,
      padding: DESIGN_TOKENS.spacing.lg,
      marginBottom: DESIGN_TOKENS.spacing.md,
      opacity: 0.7,
    }}>
      {/* Header skeleton */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: DESIGN_TOKENS.spacing.md,
      }}>
        <View style={{
          backgroundColor: colors.backgroundTertiary,
          height: 20,
          width: '30%',
          borderRadius: 4,
        }} />
        <View style={{
          backgroundColor: colors.backgroundTertiary,
          height: 24,
          width: 80,
          borderRadius: 12,
        }} />
      </View>
      
      {/* Content skeleton */}
      <View style={{
        backgroundColor: colors.backgroundTertiary,
        height: 16,
        width: '60%',
        borderRadius: 4,
        marginBottom: DESIGN_TOKENS.spacing.sm,
      }} />
      <View style={{
        backgroundColor: colors.backgroundTertiary,
        height: 16,
        width: '80%',
        borderRadius: 4,
        marginBottom: DESIGN_TOKENS.spacing.md,
      }} />
      
      {/* Time skeleton */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
      }}>
        <View style={{
          backgroundColor: colors.backgroundTertiary,
          height: 14,
          width: '25%',
          borderRadius: 4,
        }} />
        <View style={{
          backgroundColor: colors.backgroundTertiary,
          height: 14,
          width: '25%',
          borderRadius: 4,
        }} />
      </View>
    </View>
  );

  return (
    <View>
      <SkeletonItem />
      <SkeletonItem />
      <SkeletonItem />
    </View>
  );
};

// Empty state component
interface EmptyDayStateProps {
  date: string;
  onRefresh: () => void;
}

export const EmptyDayState: React.FC<EmptyDayStateProps> = ({ date, onRefresh }) => {
  const { colors, styles } = useCommonThemedStyles();
  const { t } = useTranslation();
  
  return (
    <View style={{
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: DESIGN_TOKENS.spacing.xl * 2,
      paddingHorizontal: DESIGN_TOKENS.spacing.lg,
    }}>
      <View style={{
        backgroundColor: colors.backgroundSecondary,
        borderRadius: 50,
        width: 100,
        height: 100,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: DESIGN_TOKENS.spacing.lg,
      }}>
        <Ionicons 
          name="calendar-outline" 
          size={40} 
          color={colors.textSecondary} 
        />
      </View>
      
      <Text style={[
        styles.h3,
        { 
          color: colors.text,
          textAlign: 'center',
          marginBottom: DESIGN_TOKENS.spacing.sm 
        }
      ]}>
        {t('calendar.noJobsScheduled')}
      </Text>
      
      <Text style={[
        styles.body,
        { 
          color: colors.textSecondary,
          textAlign: 'center',
          marginBottom: DESIGN_TOKENS.spacing.lg,
          lineHeight: 22
        }
      ]}>
        {t('calendar.freeDay')} {date}.{'\n'}
        {t('calendar.enjoyTimeOff')}
      </Text>
      
      <Pressable
        onPress={onRefresh}
        style={({ pressed }) => ({
          backgroundColor: pressed ? colors.primaryHover : colors.primary,
          paddingHorizontal: DESIGN_TOKENS.spacing.lg,
          paddingVertical: DESIGN_TOKENS.spacing.md,
          borderRadius: DESIGN_TOKENS.radius.md,
          flexDirection: 'row',
          alignItems: 'center',
          transform: pressed ? [{ scale: 0.98 }] : [{ scale: 1 }],
        })}
      >
        <Ionicons 
          name="refresh" 
          size={16} 
          color={colors.buttonPrimaryText}
          style={{ marginRight: DESIGN_TOKENS.spacing.xs }}
        />
        <Text style={[
          styles.buttonText,
          { color: colors.buttonPrimaryText }
        ]}>
          {t('calendar.refresh')}
        </Text>
      </Pressable>
    </View>
  );
};

// Error state component
interface ErrorStateProps {
  error: string;
  onRetry: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ error, onRetry }) => {
  const { colors, styles } = useCommonThemedStyles();
  const { t } = useTranslation();
  
  return (
    <View style={{
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: DESIGN_TOKENS.spacing.xl * 2,
      paddingHorizontal: DESIGN_TOKENS.spacing.lg,
    }}>
      <View style={{
        backgroundColor: colors.errorBanner,
        borderRadius: 50,
        width: 100,
        height: 100,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: DESIGN_TOKENS.spacing.lg,
      }}>
        <Ionicons 
          name="alert-circle-outline" 
          size={40} 
          color={colors.error} 
        />
      </View>
      
      <Text style={[
        styles.h3,
        { 
          color: colors.text,
          textAlign: 'center',
          marginBottom: DESIGN_TOKENS.spacing.sm 
        }
      ]}>
        {t('calendar.somethingWentWrong')}
      </Text>
      
      <Text style={[
        styles.body,
        { 
          color: colors.textSecondary,
          textAlign: 'center',
          marginBottom: DESIGN_TOKENS.spacing.lg,
          lineHeight: 22
        }
      ]}>
        {error}
      </Text>
      
      <Pressable
        onPress={onRetry}
        style={({ pressed }) => ({
          backgroundColor: pressed ? colors.primaryHover : colors.primary,
          paddingHorizontal: DESIGN_TOKENS.spacing.lg,
          paddingVertical: DESIGN_TOKENS.spacing.md,
          borderRadius: DESIGN_TOKENS.radius.md,
          flexDirection: 'row',
          alignItems: 'center',
          transform: pressed ? [{ scale: 0.98 }] : [{ scale: 1 }],
        })}
      >
        <Ionicons 
          name="refresh" 
          size={16} 
          color={colors.buttonPrimaryText}
          style={{ marginRight: DESIGN_TOKENS.spacing.xs }}
        />
        <Text style={[
          styles.buttonText,
          { color: colors.buttonPrimaryText }
        ]}>
          {t('calendar.tryAgain')}
        </Text>
      </Pressable>
    </View>
  );
};