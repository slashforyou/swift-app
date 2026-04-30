/**
 * ReviewFormScreen
 * Accessible via lien email : cobbr://review?token=<signed_token>
 * Formulaire public (sans auth) pour qu'un client soumette sa review.
 */
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DESIGN_TOKENS } from '../constants/Styles';
import { useTheme } from '../context/ThemeProvider';
import { submitClientReview } from '../services/scorecard';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type ScreenState = 'form' | 'loading' | 'success' | 'error';

// ─────────────────────────────────────────────────────────────────────────────
// StarRating sub-component
// ─────────────────────────────────────────────────────────────────────────────

interface StarRatingProps {
  value: number;
  onChange: (v: number) => void;
  label: string;
  testID?: string;
  required?: boolean;
}

const StarRating: React.FC<StarRatingProps> = ({ value, onChange, label, testID, required }) => {
  const { colors } = useTheme();
  return (
    <View testID={testID} style={{ gap: 8 }}>
      <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>
        {label}
        {required && (
          <Text style={{ color: '#E74C3C' }}> *</Text>
        )}
      </Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Pressable
            key={star}
            testID={`${testID}-star-${star}`}
            onPress={() => onChange(star)}
            accessibilityLabel={`${star} étoile${star > 1 ? 's' : ''}`}
            accessibilityRole="radio"
            style={({ pressed }) => ({
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Ionicons
              name={star <= value ? 'star' : 'star-outline'}
              size={32}
              color={star <= value ? '#F59E0B' : colors.border}
            />
          </Pressable>
        ))}
      </View>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ReviewFormScreen
// ─────────────────────────────────────────────────────────────────────────────

const ReviewFormScreen: React.FC = () => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  // Token passé en paramètre de route (deep link ou navigation interne)
  const token: string | undefined = route.params?.token;

  const [screenState, setScreenState] = useState<ScreenState>(token ? 'form' : 'error');
  const [errorMessage, setErrorMessage] = useState<string>(
    token ? '' : 'Lien de review invalide ou expiré.',
  );

  const [ratingOverall, setRatingOverall] = useState(0);
  const [ratingService, setRatingService] = useState(0);
  const [ratingTeam, setRatingTeam] = useState(0);
  const [comment, setComment] = useState('');
  const [commentLength, setCommentLength] = useState(0);

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (ratingOverall === 0) {
      setErrorMessage('Merci de donner une note globale.');
      setScreenState('error');
      return;
    }

    setScreenState('loading');
    try {
      await submitClientReview(token!, {
        rating_overall: ratingOverall,
        ...(ratingService > 0 && { rating_service: ratingService }),
        ...(ratingTeam > 0 && { rating_team: ratingTeam }),
        ...(comment.trim().length > 0 && { comment: comment.trim() }),
      });
      setScreenState('success');
    } catch (err: any) {
      setErrorMessage(err?.message ?? 'Une erreur est survenue. Réessayez.');
      setScreenState('error');
    }
  };

  const handleRetry = () => {
    setErrorMessage('');
    setScreenState('form');
  };

  // ── Render helpers ────────────────────────────────────────────────────────

  const renderSuccess = () => (
    <View
      testID="review-form-success"
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: DESIGN_TOKENS.spacing.xl,
        gap: DESIGN_TOKENS.spacing.lg,
      }}
    >
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: '#27AE60' + '20',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name="checkmark-circle" size={40} color="#27AE60" />
      </View>
      <Text style={{ fontSize: 22, fontWeight: '800', color: colors.text, textAlign: 'center' }}>
        Merci pour votre avis !
      </Text>
      <Text style={{ fontSize: 15, color: colors.textMuted, textAlign: 'center', lineHeight: 22 }}>
        Votre évaluation a bien été enregistrée. Elle nous aide à améliorer continuellement la qualité de notre service.
      </Text>
    </View>
  );

  const renderError = () => (
    <View
      testID="review-form-error"
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: DESIGN_TOKENS.spacing.xl,
        gap: DESIGN_TOKENS.spacing.lg,
      }}
    >
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: '#E74C3C' + '20',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name="alert-circle" size={40} color="#E74C3C" />
      </View>
      <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, textAlign: 'center' }}>
        Oups !
      </Text>
      <Text style={{ fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20 }}>
        {errorMessage}
      </Text>
      {token && (
        <Pressable
          testID="review-form-retry-button"
          onPress={handleRetry}
          style={({ pressed }) => ({
            backgroundColor: pressed ? '#4A90D9cc' : '#4A90D9',
            paddingVertical: 14,
            paddingHorizontal: 32,
            borderRadius: DESIGN_TOKENS.radius.lg,
          })}
          accessibilityRole="button"
          accessibilityLabel="Réessayer"
        >
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
            Réessayer
          </Text>
        </Pressable>
      )}
    </View>
  );

  const renderForm = () => (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        testID="review-form-scroll"
        contentContainerStyle={{
          padding: DESIGN_TOKENS.spacing.lg,
          gap: DESIGN_TOKENS.spacing.xl,
          paddingBottom: insets.bottom + 24,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 24, fontWeight: '800', color: colors.text }}>
            Évaluez votre déménagement
          </Text>
          <Text style={{ fontSize: 14, color: colors.textMuted, lineHeight: 20 }}>
            Votre retour nous aide à améliorer notre service. Cela ne prend que 30 secondes.
          </Text>
        </View>

        {/* Note globale — obligatoire */}
        <StarRating
          testID="review-rating-overall"
          label="Note globale"
          value={ratingOverall}
          onChange={setRatingOverall}
          required
        />

        {/* Note service */}
        <StarRating
          testID="review-rating-service"
          label="Qualité du service"
          value={ratingService}
          onChange={setRatingService}
        />

        {/* Note équipe */}
        <StarRating
          testID="review-rating-team"
          label="Comportement de l'équipe"
          value={ratingTeam}
          onChange={setRatingTeam}
        />

        {/* Commentaire */}
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>
              Commentaire (optionnel)
            </Text>
            <Text style={{ fontSize: 12, color: commentLength > 900 ? '#E74C3C' : colors.textMuted }}>
              {commentLength}/1000
            </Text>
          </View>
          <TextInput
            testID="review-comment-input"
            value={comment}
            onChangeText={(text) => {
              // Limiter à 1000 caractères
              const capped = text.slice(0, 1000);
              setComment(capped);
              setCommentLength(capped.length);
            }}
            placeholder="Partagez votre expérience..."
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            style={{
              backgroundColor: colors.backgroundSecondary,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: DESIGN_TOKENS.radius.md,
              padding: DESIGN_TOKENS.spacing.md,
              color: colors.text,
              fontSize: 14,
              minHeight: 100,
            }}
            accessibilityLabel="Zone de commentaire"
          />
        </View>

        {/* Submit button */}
        <Pressable
          testID="review-submit-button"
          onPress={handleSubmit}
          disabled={ratingOverall === 0}
          style={({ pressed }) => ({
            backgroundColor:
              ratingOverall === 0
                ? colors.border
                : pressed
                ? '#4A90D9cc'
                : '#4A90D9',
            paddingVertical: 16,
            borderRadius: DESIGN_TOKENS.radius.lg,
            alignItems: 'center',
          })}
          accessibilityRole="button"
          accessibilityLabel="Envoyer mon évaluation"
          accessibilityState={{ disabled: ratingOverall === 0 }}
        >
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
            Envoyer mon évaluation
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  // ── Layout ────────────────────────────────────────────────────────────────

  return (
    <View
      testID="review-form-screen"
      style={{
        flex: 1,
        backgroundColor: colors.background,
        paddingTop: insets.top,
      }}
    >
      {/* Top bar */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: DESIGN_TOKENS.spacing.md,
          paddingVertical: DESIGN_TOKENS.spacing.sm,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        {navigation.canGoBack() && (
          <Pressable
            testID="review-form-back-button"
            onPress={() => navigation.goBack()}
            style={({ pressed }) => ({
              opacity: pressed ? 0.6 : 1,
              marginRight: 12,
              padding: 4,
            })}
            accessibilityRole="button"
            accessibilityLabel="Retour"
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
        )}
        <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text }}>
          Votre avis
        </Text>
      </View>

      {/* Content */}
      {screenState === 'loading' && (
        <View
          testID="review-form-loading"
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        >
          <ActivityIndicator size="large" color="#4A90D9" />
          <Text style={{ marginTop: 12, color: colors.textMuted }}>Envoi en cours…</Text>
        </View>
      )}
      {screenState === 'success' && renderSuccess()}
      {screenState === 'error' && renderError()}
      {screenState === 'form' && renderForm()}
    </View>
  );
};

export default ReviewFormScreen;
