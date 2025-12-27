/**/**

 * TodaySection - Section "Aujourd'hui" pour la page d'accueil * TodaySection - Section "Aujourd'hui" pour la page d'accueil

 * Affiche la date du jour, le nombre de jobs et leurs statuts * Affiche la date du jour, le nombre de jobs et leurs statuts

 */ */

import { Ionicons } from '@expo/vector-icons';import { Ionicons } from '@expo/vector-icons';

import React from 'react';import React from 'react';

import { Pressable, Text, View } from 'react-native';import { Pressable, Text, View } from 'react-native';

import { DESIGN_TOKENS } from '../../constants/Styles';import { Colors } from '../../constants/Colors';

import { useTheme } from '../../context/ThemeProvider';import { DESIGN_TOKENS } from '../../constants/Styles';

import { useJobsForDay } from '../../hooks/useJobsForDay';import { useJobsForDay } from '../../hooks/useJobsForDay';

import { useTranslation } from '../../localization';import { useTranslation } from '../../localization';

import { HStack, VStack } from '../primitives/Stack';import { HStack, VStack } from '../primitives/Stack';



interface TodaySectionProps {interface TodaySectionProps {

  onPress: () => void;  onPress: () => void;

  style?: any;  style?: any;

}}



const TodaySection: React.FC<TodaySectionProps> = ({ onPress, style }) => {const TodaySection: React.FC<TodaySectionProps> = ({ onPress, style }) => {

  const { t } = useTranslation();  const { t } = useTranslation();

  const { colors } = useTheme();  

    // Récupérer les jobs du jour

  // Récupérer les jobs du jour  const today = new Date();

  const today = new Date();  const { jobs, isLoading, totalJobs, completedJobs, pendingJobs } = useJobsForDay(

  const { jobs, isLoading, totalJobs, completedJobs, pendingJobs } = useJobsForDay(    today.getDate(),

    today.getDate(),    today.getMonth() + 1, // getMonth() retourne 0-11, on veut 1-12

    today.getMonth() + 1,    today.getFullYear()

    today.getFullYear()  );

  );  

    // Formatage de la date

  // Formatage de la date  const formatDate = (date: Date) => {

  const formatDate = (date: Date) => {    return date.toLocaleDateString('fr-FR', {

    return date.toLocaleDateString('fr-FR', {      weekday: 'long',

      weekday: 'long',      day: 'numeric',

      day: 'numeric',      month: 'long'

      month: 'long'    });

    });  };

  };

  // Couleur du statut

  // Couleur du statut  const getStatusColor = () => {

  const getStatusColor = () => {    if (isLoading) return Colors.light.textSecondary;

    if (isLoading) return colors.textSecondary;    if (pendingJobs > 0) return Colors.light.warning;

    if (pendingJobs > 0) return colors.warning;    if (completedJobs === totalJobs && totalJobs > 0) return Colors.light.success;

    if (completedJobs === totalJobs && totalJobs > 0) return colors.success;    return Colors.light.primary;

    return colors.primary;  };

  };

  // Texte du statut

  // Texte du statut  const getStatusText = () => {

  const getStatusText = () => {    if (isLoading) return t('home.today.loading');

    if (isLoading) return t('home.today.loading');    if (totalJobs === 0) return t('home.today.noJobs');

    if (totalJobs === 0) return t('home.today.noJobs');    if (completedJobs === totalJobs) return t('home.today.allCompleted');

    if (completedJobs === totalJobs) return t('home.today.allCompleted');    return `${pendingJobs} ${t('home.today.pending')}`;

    return `${pendingJobs} ${t('home.today.pending')}`;  };

  };

  return (

  return (    <Pressable

    <Pressable      onPress={onPress}

      onPress={onPress}      style={[

      style={[        {

        {          backgroundColor: Colors.light.background, // Fond plus clair pour se différencier des boutons

          backgroundColor: colors.background,          borderRadius: DESIGN_TOKENS.radius.lg,

          borderRadius: DESIGN_TOKENS.radius.lg,          padding: DESIGN_TOKENS.spacing.lg,

          padding: DESIGN_TOKENS.spacing.lg,          marginBottom: DESIGN_TOKENS.spacing.md,

          marginBottom: DESIGN_TOKENS.spacing.md,          shadowColor: Colors.light.shadow,

          shadowColor: colors.shadow,          shadowOffset: {

          shadowOffset: {            width: 0,

            width: 0,            height: 2,

            height: 2,          },

          },          shadowOpacity: 0.1,

          shadowOpacity: 0.1,          shadowRadius: 4,

          shadowRadius: 4,          elevation: 3,

          elevation: 3,          borderWidth: 1,

          borderWidth: 1,          borderColor: Colors.light.border,

          borderColor: colors.border,        },

        },        style

        style      ]}

      ]}    >

    >      <HStack gap="md" align="center">

      <HStack gap="md" align="center">        {/* Icône calendrier */}

        {/* Icône calendrier */}        <View

        <View          style={{

          style={{            width: 56,

            width: 56,            height: 56,

            height: 56,            backgroundColor: Colors.light.primary,

            backgroundColor: colors.primary,            borderRadius: DESIGN_TOKENS.radius.lg,

            borderRadius: DESIGN_TOKENS.radius.lg,            justifyContent: 'center',

            justifyContent: 'center',            alignItems: 'center',

            alignItems: 'center',          }}

          }}        >

        >          <Ionicons name="today" size={28} color="white" />

          <Ionicons name="today" size={28} color={colors.buttonPrimaryText} />        </View>

        </View>        

                {/* Contenu principal */}

        {/* Contenu principal */}        <VStack gap="xs" style={{ flex: 1 }}>

        <VStack gap="xs" style={{ flex: 1 }}>          <HStack justify="space-between" align="center">

          <HStack justify="space-between" align="center">            <Text

            <Text              style={{

              style={{                color: Colors.light.text,

                color: colors.text,                fontSize: DESIGN_TOKENS.typography.subtitle.fontSize,

                fontSize: DESIGN_TOKENS.typography.subtitle.fontSize,                fontWeight: DESIGN_TOKENS.typography.subtitle.fontWeight,

                fontWeight: DESIGN_TOKENS.typography.subtitle.fontWeight,              }}

              }}            >

            >              {t('home.today.title')}

              {t('home.today.title')}            </Text>

            </Text>            

                        <Ionicons 

            <Ionicons               name="chevron-forward" 

              name="chevron-forward"               size={20} 

              size={20}               color={Colors.light.textMuted} 

              color={colors.textMuted}             />

            />          </HStack>

          </HStack>          

                    {/* Date */}

          {/* Date */}          <Text

          <Text            style={{

            style={{              color: Colors.light.textSecondary,

              color: colors.textSecondary,              fontSize: DESIGN_TOKENS.typography.caption.fontSize,

              fontSize: DESIGN_TOKENS.typography.caption.fontSize,              textTransform: 'capitalize',

              textTransform: 'capitalize',            }}

            }}          >

          >            {formatDate(new Date())}

            {formatDate(new Date())}          </Text>

          </Text>          

                    {/* Stats des jobs */}

          {/* Stats des jobs */}          <HStack gap="lg" align="center">

          <HStack gap="lg" align="center">            <VStack gap="xs">

            <VStack gap="xs">              <Text

              <Text                style={{

                style={{                  color: Colors.light.text,

                  color: colors.text,                  fontSize: 20,

                  fontSize: 20,                  fontWeight: 'bold',

                  fontWeight: 'bold',                }}

                }}              >

              >                {isLoading ? '...' : totalJobs}

                {isLoading ? '...' : totalJobs}              </Text>

              </Text>              <Text

              <Text                style={{

                style={{                  color: Colors.light.textSecondary,

                  color: colors.textSecondary,                  fontSize: DESIGN_TOKENS.typography.caption.fontSize,

                  fontSize: DESIGN_TOKENS.typography.caption.fontSize,                }}

                }}              >

              >                {t('home.today.totalJobs')}

                {t('home.today.totalJobs')}              </Text>

              </Text>            </VStack>

            </VStack>            

                        <View

            <View              style={{

              style={{                width: 1,

                width: 1,                height: 30,

                height: 30,                backgroundColor: Colors.light.border,

                backgroundColor: colors.border,              }}

              }}            />

            />            

                        <VStack gap="xs">

            <VStack gap="xs">              <Text

              <Text                style={{

                style={{                  color: getStatusColor(),

                  color: getStatusColor(),                  fontSize: 16,

                  fontSize: 16,                  fontWeight: '600',

                  fontWeight: '600',                }}

                }}              >

              >                {getStatusText()}

                {getStatusText()}              </Text>

              </Text>              {totalJobs > 0 && !isLoading && (

              {totalJobs > 0 && !isLoading && (                <Text

                <Text                  style={{

                  style={{                    color: Colors.light.textSecondary,

                    color: colors.textSecondary,                    fontSize: DESIGN_TOKENS.typography.caption.fontSize,

                    fontSize: DESIGN_TOKENS.typography.caption.fontSize,                  }}

                  }}                >

                >                  {completedJobs}/{totalJobs} {t('home.today.completed')}

                  {completedJobs}/{totalJobs} {t('home.today.completed')}                </Text>

                </Text>              )}

              )}            </VStack>

            </VStack>          </HStack>

          </HStack>        </VStack>

        </VStack>      </HStack>

      </HStack>    </Pressable>

    </Pressable>  );

  );};

};

export default TodaySection;
export default TodaySection;
