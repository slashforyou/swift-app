/**
 * TeamBadge Component
 * Badge coloré pour afficher une équipe
 * Phase 2 - STAFF-02
 * 
 * @example
 * <TeamBadge team={job.team} size="md" />
 * <TeamBadge team={team} showMembers onPress={() => openTeamDetails()} />
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ViewStyle,
} from 'react-native';
import { DESIGN_TOKENS } from '../../constants/Styles';
import { useTheme } from '../../context/ThemeProvider';
import { Team } from '../../services/teamsService';

// ============================================================================
// Types
// ============================================================================

export interface TeamBadgeProps {
  /** Team object to display */
  team: Team | null | undefined;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Show member count */
  showMembers?: boolean;
  /** Show color dot */
  showColorDot?: boolean;
  /** Optional press handler */
  onPress?: () => void;
  /** Custom style */
  style?: ViewStyle;
  /** Display style variant */
  variant?: 'filled' | 'outline' | 'subtle';
}

// ============================================================================
// Component
// ============================================================================

export const TeamBadge: React.FC<TeamBadgeProps> = ({
  team,
  size = 'md',
  showMembers = false,
  showColorDot = true,
  onPress,
  style,
  variant = 'subtle',
}) => {
  const { colors } = useTheme();

  if (!team) {
    return null;
  }

  const teamColor = team.color || '#3B82F6';

  // Size configurations
  const sizeConfig = {
    sm: {
      paddingH: DESIGN_TOKENS.spacing.sm,
      paddingV: 4,
      fontSize: 11,
      dotSize: 8,
      iconSize: 10,
    },
    md: {
      paddingH: DESIGN_TOKENS.spacing.md,
      paddingV: 6,
      fontSize: 12,
      dotSize: 10,
      iconSize: 12,
    },
    lg: {
      paddingH: DESIGN_TOKENS.spacing.lg,
      paddingV: 8,
      fontSize: 14,
      dotSize: 12,
      iconSize: 14,
    },
  };

  const config = sizeConfig[size];

  // Variant styles
  const getVariantStyles = () => {
    switch (variant) {
      case 'filled':
        return {
          backgroundColor: teamColor,
          borderColor: teamColor,
          textColor: '#FFFFFF',
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor: teamColor,
          textColor: teamColor,
        };
      case 'subtle':
      default:
        return {
          backgroundColor: `${teamColor}15`,
          borderColor: 'transparent',
          textColor: teamColor,
        };
    }
  };

  const variantStyles = getVariantStyles();

  const content = (
    <View
      style={[
        styles.container,
        {
          backgroundColor: variantStyles.backgroundColor,
          borderColor: variantStyles.borderColor,
          paddingHorizontal: config.paddingH,
          paddingVertical: config.paddingV,
        },
        style,
      ]}
    >
      {showColorDot && variant !== 'filled' && (
        <View
          style={[
            styles.colorDot,
            {
              width: config.dotSize,
              height: config.dotSize,
              borderRadius: config.dotSize / 2,
              backgroundColor: teamColor,
            },
          ]}
        />
      )}
      
      <Text
        style={[
          styles.name,
          {
            fontSize: config.fontSize,
            color: variantStyles.textColor,
          },
        ]}
        numberOfLines={1}
      >
        {team.name}
      </Text>
      
      {showMembers && (
        <View style={styles.memberInfo}>
          <Ionicons
            name="people-outline"
            size={config.iconSize}
            color={variantStyles.textColor}
          />
          <Text
            style={[
              styles.memberCount,
              {
                fontSize: config.fontSize - 1,
                color: variantStyles.textColor,
              },
            ]}
          >
            {team.member_count}
          </Text>
        </View>
      )}
      
      {onPress && (
        <Ionicons
          name="chevron-forward"
          size={config.iconSize}
          color={variantStyles.textColor}
          style={{ marginLeft: 2 }}
        />
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

// ============================================================================
// TeamBadgeList - Display multiple teams
// ============================================================================

export interface TeamBadgeListProps {
  teams: Team[];
  size?: 'sm' | 'md' | 'lg';
  maxDisplay?: number;
  onTeamPress?: (team: Team) => void;
  style?: ViewStyle;
}

export const TeamBadgeList: React.FC<TeamBadgeListProps> = ({
  teams,
  size = 'sm',
  maxDisplay = 3,
  onTeamPress,
  style,
}) => {
  const { colors } = useTheme();
  
  const displayedTeams = teams.slice(0, maxDisplay);
  const remainingCount = teams.length - maxDisplay;

  return (
    <View style={[styles.listContainer, style]}>
      {displayedTeams.map((team) => (
        <TeamBadge
          key={team.id}
          team={team}
          size={size}
          onPress={onTeamPress ? () => onTeamPress(team) : undefined}
        />
      ))}
      
      {remainingCount > 0 && (
        <View
          style={[
            styles.moreIndicator,
            { backgroundColor: colors.backgroundSecondary },
          ]}
        >
          <Text style={[styles.moreText, { color: colors.textMuted }]}>
            +{remainingCount}
          </Text>
        </View>
      )}
    </View>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: DESIGN_TOKENS.radius.full,
    borderWidth: 1,
    gap: DESIGN_TOKENS.spacing.xs,
  },
  colorDot: {
    // Size set dynamically
  },
  name: {
    fontWeight: '500',
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginLeft: 2,
  },
  memberCount: {
    fontWeight: '500',
  },
  
  // List styles
  listContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DESIGN_TOKENS.spacing.xs,
  },
  moreIndicator: {
    paddingHorizontal: DESIGN_TOKENS.spacing.sm,
    paddingVertical: 4,
    borderRadius: DESIGN_TOKENS.radius.full,
  },
  moreText: {
    fontSize: 11,
    fontWeight: '600',
  },
});

export default TeamBadge;
