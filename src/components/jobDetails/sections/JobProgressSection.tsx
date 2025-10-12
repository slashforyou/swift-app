/**
 * JobProgressSection - Section modulaire pour la progression du job
 */
import React, { useState } from 'react';
import { Text, View, Pressable, Animated } from 'react-native';
import { useTheme } from '../../../context/ThemeProvider';
import { DESIGN_TOKENS } from '../../../constants/Styles';
import SectionCard from '../SectionCard';
import JobTimeLine from '../../ui/jobPage/jobTimeLine';
import Ionicons from '@react-native-vector-icons/ionicons';
import { calculateProgressPercentage } from '../../../utils/jobStepsUtils';

interface JobProgressSectionProps {
    job: any;
    onAdvanceStep?: () => void;
}

const JobProgressSection: React.FC<JobProgressSectionProps> = ({ job, onAdvanceStep }) => {
    const { colors } = useTheme();
    const [isExpanded, setIsExpanded] = useState(false); // Rétracté par défaut
    const [rotateAnim] = useState(new Animated.Value(isExpanded ? 1 : 0));

    const toggleExpanded = () => {
        setIsExpanded(!isExpanded);
        Animated.timing(rotateAnim, {
            toValue: isExpanded ? 0 : 1,
            duration: 200,
            useNativeDriver: true,
        }).start();
    };

    const rotateInterpolate = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '180deg'],
    });

    // Utiliser l'utilitaire partagé pour le calcul de progression
    const progressPercentage = calculateProgressPercentage(job);

    return (
        <SectionCard level="primary" elevated={true}>
            {/* Header avec bouton expand/collapse */}
            <Pressable 
                onPress={toggleExpanded}
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: isExpanded ? DESIGN_TOKENS.spacing.lg : DESIGN_TOKENS.spacing.sm,
                }}
            >
                <View style={{ flex: 1 }}>
                    <Text style={{
                        fontSize: 18,
                        fontWeight: '700',
                        color: colors.text,
                        marginBottom: 2,
                    }}>
                        Timeline
                    </Text>
                    {!isExpanded && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                            <Text style={{ fontSize: 20, marginRight: 8 }}>🚛</Text>
                            <Text style={{
                                fontSize: 16,
                                fontWeight: '600',
                                color: colors.primary,
                            }}>
                                {progressPercentage}% complété
                            </Text>
                        </View>
                    )}
                    {isExpanded && (
                        <Text style={{
                            fontSize: 14,
                            color: colors.textSecondary,
                        }}>
                            Suivi détaillé du statut et de l'avancement
                        </Text>
                    )}
                </View>
                <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
                    <Ionicons 
                        name="chevron-down" 
                        size={24} 
                        color={colors.textSecondary} 
                    />
                </Animated.View>
            </Pressable>
            
            {/* Timeline rétractable */}
            {isExpanded && <JobTimeLine job={job} onAdvanceStep={onAdvanceStep} />}
        </SectionCard>
    );
};

export default JobProgressSection;