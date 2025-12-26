/**
 * TodaySection - Section "Aujourd'hui" pour la page d'accueil
 * Affiche la date du jour, le nombre de jobs et leurs statuts
 */
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { DESIGN_TOKENS } from '../../constants/Styles';
import { useJobsForDay } from '../../hooks/useJobsForDay';
import { useTranslation } from '../../localization';
import { HStack, VStack } from '../primitives/Stack';

interface TodaySectionProps {
  onPress: () => void;
  style?: any;
}

const TodaySection: React.FC<TodaySectionProps> = ({ onPress, style }) => {
  const { t } = useTranslation();
  
  // Récupérer les jobs du jour
  const today = new Date();
  const { jobs, isLoading, totalJobs, completedJobs, pendingJobs } = useJobsForDay(
    today.getDate(),
    today.getMonth() + 1, // getMonth() retourne 0-11, on veut 1-12
    today.getFullYear()
  );
  
  // Formatage de la date
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  };

  // Couleur du statut
  const getStatusColor = () => {
    if (isLoading) return Colors.light.textSecondary;
    if (pendingJobs > 0) return Colors.light.warning;
    if (completedJobs === totalJobs && totalJobs > 0) return Colors.light.success;
    return Colors.light.primary;
  };

  // Texte du statut
  const getStatusText = () => {
    if (isLoading) return t('home.today.loading');
    if (totalJobs === 0) return t('home.today.noJobs');
    if (completedJobs === totalJobs) return t('home.today.allCompleted');
    return `${pendingJobs} ${t('home.today.pending')}`;
  };

  return (
    <Pressable
      onPress={onPress}
      style={[
        {
          backgroundColor: Colors.light.background, // Fond plus clair pour se différencier des boutons
          borderRadius: DESIGN_TOKENS.radius.lg,
          padding: DESIGN_TOKENS.spacing.lg,
          marginBottom: DESIGN_TOKENS.spacing.md,
          shadowColor: Colors.light.shadow,
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
          borderWidth: 1,
          borderColor: Colors.light.border,
        },
        style
      ]}
    >
      <HStack gap="md" align="center">
        {/* Icône calendrier */}
        <View
          style={{
            width: 56,
            height: 56,
            backgroundColor: Colors.light.primary,
            borderRadius: DESIGN_TOKENS.radius.lg,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Ionicons name="today" size={28} color="white" />
        </View>
        
        {/* Contenu principal */}
        <VStack gap="xs" style={{ flex: 1 }}>
          <HStack justify="space-between" align="center">
            <Text
              style={{
                color: Colors.light.text,
                fontSize: DESIGN_TOKENS.typography.subtitle.fontSize,
                fontWeight: DESIGN_TOKENS.typography.subtitle.fontWeight,
              }}
            >
              {t('home.today.title')}
            </Text>
            
            <Ionicons 
              name="chevron-forward" 
              size={20} 
              color={Colors.light.textMuted} 
            />
          </HStack>
          
          {/* Date */}
          <Text
            style={{
              color: Colors.light.textSecondary,
              fontSize: DESIGN_TOKENS.typography.caption.fontSize,
              textTransform: 'capitalize',
            }}
          >
            {formatDate(new Date())}
          </Text>
          
          {/* Stats des jobs */}
          <HStack gap="lg" align="center">
            <VStack gap="xs">
              <Text
                style={{
                  color: Colors.light.text,
                  fontSize: 20,
                  fontWeight: 'bold',
                }}
              >
                {isLoading ? '...' : totalJobs}
              </Text>
              <Text
                style={{
                  color: Colors.light.textSecondary,
                  fontSize: DESIGN_TOKENS.typography.caption.fontSize,
                }}
              >
                {t('home.today.totalJobs')}
              </Text>
            </VStack>
            
            <View
              style={{
                width: 1,
                height: 30,
                backgroundColor: Colors.light.border,
              }}
            />
            
            <VStack gap="xs">
              <Text
                style={{
                  color: getStatusColor(),
                  fontSize: 16,
                  fontWeight: '600',
                }}
              >
                {getStatusText()}
              </Text>
              {totalJobs > 0 && !isLoading && (
                <Text
                  style={{
                    color: Colors.light.textSecondary,
                    fontSize: DESIGN_TOKENS.typography.caption.fontSize,
                  }}
                >
                  {completedJobs}/{totalJobs} {t('home.today.completed')}
                </Text>
              )}
            </VStack>
          </HStack>
        </VStack>
      </HStack>
    </Pressable>
  );
};

export default TodaySection;