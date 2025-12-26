/**
 * Exemple d'écran Job Steps avec analytics intégré
 * Démontre l'utilisation complète du système de monitoring
 */

import React, { useEffect, useState } from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeProvider';
import { useAnalytics } from '../hooks/useAnalytics';
import { updateJobStep } from '../services/jobSteps';
import { logger } from '../services/logger';

interface JobStepScreenProps {
  route: {
    params: {
      jobId: string;
      currentStep: number;
      totalSteps: number;
    }
  };
  navigation: any;
}

export default function JobStepScreen({ route, navigation }: JobStepScreenProps) {
  const { jobId, currentStep: initialStep, totalSteps } = route.params;
  const { colors } = useTheme();
  const analytics = useAnalytics('JobStepScreen', 'JobList');
  
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [isUpdating, setIsUpdating] = useState(false);
  const [notes, setNotes] = useState('');

  // Log de l'initialisation de l'écran
  useEffect(() => {
    logger.info('JobStepScreen initialized', {
      jobId,
      currentStep: initialStep,
      totalSteps,
      screenName: 'JobStepScreen'
    });

    // Track que l'utilisateur a ouvert cet écran job
    analytics.track.userAction('job_step_screen_opened', {
      job_id: jobId,
      current_step: initialStep,
      total_steps: totalSteps,
      progress_percentage: Math.round((initialStep / totalSteps) * 100)
    });
  }, [jobId, initialStep, totalSteps]);

  // Fonction pour mettre à jour l'étape avec analytics
  const handleUpdateStep = async (newStep: number, stepNotes?: string) => {
    // Track le début de l'action
    analytics.track.userAction('job_step_update_started', {
      job_id: jobId,
      from_step: currentStep,
      to_step: newStep
    });

    // Timer pour mesurer la performance (méthode alternative)
    const startTime = Date.now();

    setIsUpdating(true);

    try {
      logger.info('Starting job step update', {
        jobId,
        fromStep: currentStep,
        toStep: newStep,
        notes: stepNotes
      });

      // Appel API avec mesure de performance automatique
      await updateJobStep(jobId, newStep, stepNotes);
      
      // Mise à jour réussie
      setCurrentStep(newStep);
      
      // Track le succès
      analytics.track.jobStep(jobId, newStep, totalSteps, stepNotes);
      
      logger.info('Job step updated successfully', {
        jobId,
        newStep,
        totalSteps,
        isCompleted: newStep === totalSteps
      });

      // Analytics spéciales si job complété
      if (newStep === totalSteps) {
        analytics.track.userAction('job_completed', {
          job_id: jobId,
          total_steps: totalSteps,
          completion_time: new Date().toISOString()
        });
        
        logger.info('Job completed', { jobId, totalSteps });
      }

      // Navigation automatique si job terminé
      if (newStep === totalSteps) {
        setTimeout(() => {
          analytics.track.navigation('JobCompletion', 'JobStepScreen');
          navigation.navigate('JobCompletion', { jobId });
        }, 1500);
      }

    } catch (error) {
      logger.error('Failed to update job step', {
        error: error instanceof Error ? error.message : 'Unknown error',
        jobId,
        targetStep: newStep,
        currentStep
      });

      // Track l'erreur
      analytics.track.event('job_step_update_failed', 'error', {
        job_id: jobId,
        target_step: newStep,
        current_step: currentStep,
        error_message: error instanceof Error ? error.message : 'Unknown error'
      });

      Alert.alert(
        'Erreur',
        'Impossible de mettre à jour l\'étape. Veuillez réessayer.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsUpdating(false);
      
      // Track la performance de l'opération
      const operationDuration = Date.now() - startTime;
      analytics.track.event('job_step_update_performance', 'technical', {
        job_id: jobId,
        duration_ms: operationDuration,
        target_step: newStep
      });
    }
  };

  // Bouton pour avancer d'une étape
  const handleNextStep = () => {
    if (currentStep < totalSteps) {
      handleUpdateStep(currentStep + 1, notes);
    }
  };

  // Bouton pour reculer d'une étape
  const handlePreviousStep = () => {
    if (currentStep > 1) {
      analytics.track.userAction('job_step_backward', {
        job_id: jobId,
        from_step: currentStep,
        to_step: currentStep - 1
      });
      
      handleUpdateStep(currentStep - 1, notes);
    }
  };

  // Track quand l'utilisateur ajoute des notes
  const handleNotesChange = (text: string) => {
    setNotes(text);
    
    if (text.length > 0 && text.length % 50 === 0) { // Track tous les 50 caractères
      analytics.track.userAction('job_notes_typed', {
        job_id: jobId,
        current_step: currentStep,
        notes_length: text.length
      });
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: 20 }}>
      <Text style={{ 
        fontSize: 24, 
        fontWeight: 'bold', 
        color: colors.text, 
        marginBottom: 20 
      }}>
        Étape {currentStep} sur {totalSteps}
      </Text>

      <View style={{
        backgroundColor: colors.backgroundSecondary,
        padding: 20,
        borderRadius: 8,
        marginBottom: 20
      }}>
        <Text style={{ color: colors.text, fontSize: 16 }}>
          Progression: {Math.round((currentStep / totalSteps) * 100)}%
        </Text>
        
        <View style={{
          backgroundColor: colors.background,
          height: 8,
          borderRadius: 4,
          marginTop: 10,
          overflow: 'hidden'
        }}>
          <View style={{
            backgroundColor: colors.primary,
            width: `${(currentStep / totalSteps) * 100}%`,
            height: '100%',
            borderRadius: 4
          }} />
        </View>
      </View>

      {/* Boutons de navigation */}
      <View style={{ 
        flexDirection: 'row', 
        justifyContent: 'space-between',
        marginBottom: 20 
      }}>
        <TouchableOpacity
          style={{
            backgroundColor: currentStep > 1 ? colors.primaryLight : colors.textMuted,
            padding: 15,
            borderRadius: 8,
            flex: 1,
            marginRight: 10
          }}
          disabled={currentStep <= 1 || isUpdating}
          onPress={handlePreviousStep}
        >
          <Text style={{ 
            color: colors.background, 
            textAlign: 'center',
            fontWeight: 'bold'
          }}>
            Précédent
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            backgroundColor: isUpdating ? colors.textMuted : colors.primary,
            padding: 15,
            borderRadius: 8,
            flex: 1,
            marginLeft: 10
          }}
          disabled={currentStep >= totalSteps || isUpdating}
          onPress={handleNextStep}
        >
          <Text style={{ 
            color: colors.background, 
            textAlign: 'center',
            fontWeight: 'bold'
          }}>
            {isUpdating ? 'Mise à jour...' : 
             currentStep === totalSteps - 1 ? 'Terminer' : 'Suivant'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Zone pour les notes */}
      <View style={{
        backgroundColor: colors.backgroundSecondary,
        padding: 15,
        borderRadius: 8,
        marginBottom: 20
      }}>
        <Text style={{ 
          color: colors.text, 
          fontSize: 16, 
          fontWeight: 'bold',
          marginBottom: 10 
        }}>
          Notes pour cette étape:
        </Text>
        <TextInput
          style={{
            borderColor: colors.border,
            borderWidth: 1,
            borderRadius: 8,
            padding: 10,
            color: colors.text,
            backgroundColor: colors.background,
            minHeight: 80,
            textAlignVertical: 'top'
          }}
          multiline
          placeholder="Ajouter des notes..."
          placeholderTextColor={colors.textSecondary}
          value={notes}
          onChangeText={handleNotesChange}
        />
      </View>

      {/* Debug Info (développement uniquement) */}
      {__DEV__ && (
        <View style={{
          backgroundColor: colors.primaryLight + '40',
          padding: 10,
          borderRadius: 8
        }}>
          <Text style={{ color: colors.text, fontSize: 12 }}>
            DEBUG - Job ID: {jobId}
          </Text>
          <Text style={{ color: colors.text, fontSize: 12 }}>
            Analytics: Screen tracking active
          </Text>
          <Text style={{ color: colors.text, fontSize: 12 }}>
            Logging: Events logged to backend
          </Text>
        </View>
      )}
    </View>
  );
}