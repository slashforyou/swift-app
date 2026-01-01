/**
 * PaymentWindow - Interface de paiement moderne avec temps réel
 * ✅ Intégré au JobTimerContext pour calculs en temps réel
 * ✅ Intégration Stripe Elements pour vrais paiements
 */
import Ionicons from '@react-native-vector-icons/ionicons';
import { CardField, useConfirmPayment } from '@stripe/stripe-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    Modal,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DESIGN_TOKENS } from '../../constants/Styles';
import { useJobTimerContext } from '../../context/JobTimerProvider';
import { useTheme } from '../../context/ThemeProvider';
import { useJobPayment } from '../../hooks/useJobPayment';
import { useTranslation } from '../../localization/useLocalization';
import {
    trackPaymentFunnelStep,
    trackPaymentMethodSelected
} from '../../services/stripeAnalytics';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface PaymentWindowProps {
  job: any;
  setJob: (job: any) => void;
  visibleCondition: string | null;
  setVisibleCondition: React.Dispatch<React.SetStateAction<string | null>>;
}

interface PaymentState {
  step: 'method' | 'card' | 'cash' | 'processing' | 'success';
  selectedMethod: 'card' | 'cash' | null;
  newCard: {
    number: string;
    expiry: string;
    cvv: string;
    name: string;
  };
  cashAmount: string;
  isProcessing: boolean;
  // ✅ Données Payment Intent Stripe
  paymentIntentId: string | null;
  clientSecret: string | null;
  // ✅ État CardField Stripe
  cardComplete: boolean;
  cardError: string | null;
}

const PaymentWindow: React.FC<PaymentWindowProps> = ({ 
  job, 
  setJob, 
  visibleCondition, 
  setVisibleCondition 
}) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const isVisible = visibleCondition === 'paymentWindow';
  
  // ✅ Hooks Stripe pour les vrais paiements
  const { confirmPayment } = useConfirmPayment();
  
  // Note: usePaymentSheet désactivé temporairement (incompatible avec Expo managed)
  // const { initPaymentSheet, presentPaymentSheet, loading } = usePaymentSheet();
  
  // ✅ Utiliser le timer context pour les calculs en temps réel
  const { 
    billableTime, 
    calculateCost, 
    formatTime,
    HOURLY_RATE_AUD 
  } = useJobTimerContext();
  
  // ✅ Calculer le montant à payer en temps réel basé sur le billableTime
  const getPaymentAmount = () => {
    // Utiliser le coût calculé en temps réel
    const costData = calculateCost(billableTime);
    const realTimeCost = costData.cost;
    
    // Fallback sur les données du job si le timer n'a pas encore démarré
    const jobData = job?.job || job;
    const estimatedCost = jobData?.estimatedCost || jobData?.actualCost || 0;
    
    // Retourner le coût temps réel s'il est supérieur à 0, sinon l'estimé
    return realTimeCost > 0 ? realTimeCost : estimatedCost;
  };

  // ✅ Changer EUR → AUD pour correspondre au taux horaire
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
    }).format(amount);
  };

  const paymentAmount = getPaymentAmount();
  const costData = calculateCost(billableTime);
  
  // ✅ Hook pour les paiements de job
  const jobPayment = useJobPayment();
  
  // Payment state
  const [state, setState] = useState<PaymentState>({
    step: 'method',
    selectedMethod: null,
    newCard: { number: '', expiry: '', cvv: '', name: '' },
    cashAmount: '',
    isProcessing: false,
    paymentIntentId: null,
    clientSecret: null,
    cardComplete: false,
    cardError: null,
  });

  // Animations
  const slideAnimation = useRef(new Animated.Value(screenHeight)).current;
  const backdropAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      // 📊 Track payment window view
      const jobId = job?.id || job?.job?.id;
      if (jobId) {
        trackPaymentFunnelStep('view_payment', jobId);
      }

      Animated.parallel([
        Animated.timing(backdropAnimation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnimation, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(backdropAnimation, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnimation, {
          toValue: screenHeight,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible]);

  const updateState = (updates: Partial<PaymentState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const handleClose = () => {
    // ✅ Reset du hook de paiement
    jobPayment.reset();
    setVisibleCondition(null);
  };

  const handleMethodSelect = (method: 'card' | 'cash') => {
    // 📊 Track payment method selection
    const jobId = job?.id || job?.job?.id;
    if (jobId) {
      trackPaymentMethodSelected(method, jobId);
      trackPaymentFunnelStep('select_method', jobId, method);
    }
    
    updateState({ selectedMethod: method, step: method });
  };

  // ✅ Fallback pour PaymentSheet (temporairement désactivé pour compatibilité Expo)
  const handlePaymentSheet = async () => {
    // Redirect vers la méthode carte pour le moment
    Alert.alert(
      t('payment.window.paymentSheetUnavailable'),
      t('payment.window.paymentSheetFallbackMessage'),
      [
        { text: "OK", onPress: () => handleMethodSelect('card') }
      ]
    );
  };

  const handleCardPayment = async () => {
    // ✅ Vérifier que le CardField Stripe est valide
    if (!state.cardComplete || state.cardError) {
      Alert.alert(
        t('payment.missingInfo.title'), 
        state.cardError || t('payment.missingInfo.message')
      );
      return;
    }

    updateState({ isProcessing: true, step: 'processing' });
    
    try {
      // TEMP_DISABLED: console.log('🚀 [PaymentWindow] Starting REAL Stripe payment process...');
      
      // ✅ 1. Créer le Payment Intent via notre backend
      const jobId = job?.id || job?.job?.id;
      if (!jobId) {
        throw new Error(t('payment.errors.jobIdNotFound'));
      }

      // TEMP_DISABLED: console.log(`💳 [PaymentWindow] Creating Payment Intent for job ${jobId}, amount: ${paymentAmount}`);
      
      const paymentIntent = await jobPayment.createPayment(jobId, {
        amount: Math.round(paymentAmount * 100), // Convertir en centimes
        currency: 'AUD',
        description: `Paiement job ${job?.title || jobId}`
      });

      // TEMP_DISABLED: console.log(`✅ [PaymentWindow] Payment Intent created: ${paymentIntent.payment_intent_id}`);

      // ✅ 2. Utiliser Stripe Elements pour confirmer le paiement
      // TEMP_DISABLED: console.log('💳 [PaymentWindow] Confirming payment with Stripe...');
      
      const { error, paymentIntent: confirmedPayment } = await confirmPayment(
        paymentIntent.client_secret, 
        {
          paymentMethodType: 'Card',
        }
      );

      if (error) {
        console.error('❌ [PaymentWindow] Stripe confirmation failed:', error);
        throw new Error(error.message);
      }

      // TEMP_DISABLED: console.log(`✅ [PaymentWindow] Payment confirmed by Stripe: ${confirmedPayment?.status}`);

      // ✅ 3. Confirmer le paiement côté backend avec le statut Stripe réel
      // TEMP_DISABLED: console.log(`✅ [PaymentWindow] Confirming payment in backend: ${paymentIntent.payment_intent_id}`);
      
      const backendStatus = confirmedPayment?.status === 'Succeeded' ? 'succeeded' : 'failed';
      const confirmResult = await jobPayment.confirmPayment(
        jobId, 
        paymentIntent.payment_intent_id, 
        backendStatus
      );

      // TEMP_DISABLED: console.log(`✅ [PaymentWindow] Payment confirmed successfully!`, confirmResult);

      // ✅ 4. Mettre à jour le job avec les nouvelles données
      setJob(confirmResult.job);
      
      updateState({ step: 'success' });
      
      setTimeout(() => {
        handleClose();
      }, 2000);
      
    } catch (error) {

      console.error('❌ [PaymentWindow] REAL payment failed:', error);
      
      Alert.alert(
        t('payment.errors.paymentError'), 
        error instanceof Error ? error.message : t('payment.errors.processingFailed')
      );
      updateState({ isProcessing: false, step: 'card' });
    }
  };

  const handleCashPayment = async () => {
    const cashValue = parseFloat(state.cashAmount);
    if (!cashValue || cashValue < paymentAmount) {
      Alert.alert(t('payment.window.incorrectAmount'), t('payment.window.incorrectAmountMessage', { amount: formatCurrency(paymentAmount) }));
      return;
    }

    updateState({ isProcessing: true, step: 'processing' });
    
    try {
      // TEMP_DISABLED: console.log('💰 [PaymentWindow] Starting REAL cash payment process...');
      
      // ✅ 1. Créer le Payment Intent pour paiement cash
      const jobId = job?.id || job?.job?.id;
      if (!jobId) {
        throw new Error('ID du job non trouvé');
      }

      // TEMP_DISABLED: console.log(`💰 [PaymentWindow] Creating Payment Intent for cash payment, job ${jobId}`);
      
      const paymentIntent = await jobPayment.createPayment(jobId, {
        amount: Math.round(paymentAmount * 100), // Convertir en centimes
        currency: 'AUD',
        description: `Paiement cash job ${job?.title || jobId}`
      });

      // TEMP_DISABLED: console.log(`✅ [PaymentWindow] Payment Intent created for cash: ${paymentIntent.payment_intent_id}`);

      // Simuler le traitement cash (instantané)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // ✅ 2. Confirmer le paiement cash côté backend
      // TEMP_DISABLED: console.log(`💰 [PaymentWindow] Confirming cash payment: ${paymentIntent.payment_intent_id}`);
      
      const confirmResult = await jobPayment.confirmPayment(
        jobId, 
        paymentIntent.payment_intent_id, 
        'succeeded'
      );

      // TEMP_DISABLED: console.log(`✅ [PaymentWindow] Cash payment confirmed!`, confirmResult);

      // ✅ 3. Mettre à jour le job
      setJob(confirmResult.job);
      
      updateState({ step: 'success' });
      
      setTimeout(() => {
        handleClose();
      }, 2000);
      
    } catch (error) {

      console.error('❌ [PaymentWindow] REAL cash payment failed:', error);
      
      Alert.alert(
        t('payment.errors.generic'), 
        error instanceof Error ? error.message : t('payment.errors.processingFailed')
      );
      updateState({ isProcessing: false, step: 'cash' });
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const renderMethodSelection = () => (
    <View style={{ flex: 1, padding: DESIGN_TOKENS.spacing.lg }}>
      <Text style={{
        fontSize: 24,
        fontWeight: '700',
        color: colors.text,
        textAlign: 'center',
        marginBottom: DESIGN_TOKENS.spacing.xs,
      }}>
        {t('payment.window.chooseMethod')}
      </Text>
      
      <Text style={{
        fontSize: 16,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: DESIGN_TOKENS.spacing.sm,
      }}>
        {t('payment.window.amountToPay')} {formatCurrency(paymentAmount)}
      </Text>

      {/* ✅ Affichage des erreurs de paiement */}
      {jobPayment.error && (
        <View style={{
          backgroundColor: colors.errorBanner,
          borderRadius: DESIGN_TOKENS.radius.md,
          padding: DESIGN_TOKENS.spacing.md,
          marginBottom: DESIGN_TOKENS.spacing.lg,
          borderLeftWidth: 3,
          borderLeftColor: colors.error,
        }}>
          <Text style={{
            fontSize: 14,
            color: colors.error,
            fontWeight: '600',
            marginBottom: 4,
          }}>
            {t('payment.window.paymentError')}
          </Text>
          <Text style={{
            fontSize: 13,
            color: colors.errorBannerText,
          }}>
            {jobPayment.error}
          </Text>
        </View>
      )}

      {/* ✅ Statut Payment Intent */}
      {state.paymentIntentId && (
        <View style={{
          backgroundColor: colors.tint + '10',
          borderRadius: DESIGN_TOKENS.radius.md,
          padding: DESIGN_TOKENS.spacing.md,
          marginBottom: DESIGN_TOKENS.spacing.lg,
          borderLeftWidth: 3,
          borderLeftColor: colors.tint,
        }}>
          <Text style={{
            fontSize: 12,
            color: colors.textSecondary,
            marginBottom: 4,
          }}>
            🔐 Payment Intent créé
          </Text>
          <Text style={{
            fontSize: 11,
            fontFamily: 'monospace',
            color: colors.tint,
          }}>
            {state.paymentIntentId}
          </Text>
        </View>
      )}

      {/* ✅ Afficher le temps facturable */}
      {billableTime > 0 && (
        <View style={{
          backgroundColor: colors.backgroundSecondary,
          borderRadius: DESIGN_TOKENS.radius.md,
          padding: DESIGN_TOKENS.spacing.md,
          marginBottom: DESIGN_TOKENS.spacing.lg,
          alignItems: 'center',
        }}>
          <Text style={{
            fontSize: 12,
            color: colors.textSecondary,
            marginBottom: 4,
          }}>
            Temps facturable
          </Text>
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: colors.tint,
          }}>
            {formatTime(billableTime)} • {costData.hours.toFixed(2)}h @ {HOURLY_RATE_AUD} AUD/h
          </Text>
        </View>
      )}

      <View style={{ gap: DESIGN_TOKENS.spacing.md }}>
        {/* ✅ Nouvelle option PaymentSheet pour une meilleure UX */}
        <Pressable
          onPress={handlePaymentSheet}
          disabled={state.isProcessing}
          style={({ pressed }) => ({
            backgroundColor: pressed ? colors.backgroundTertiary : colors.backgroundSecondary,
            borderRadius: DESIGN_TOKENS.radius.lg,
            padding: DESIGN_TOKENS.spacing.lg,
            flexDirection: 'row',
            alignItems: 'center',
            gap: DESIGN_TOKENS.spacing.md,
            borderWidth: 2,
            borderColor: colors.tint,
            opacity: state.isProcessing ? 0.7 : 1,
          })}
        >
          <View style={{
            backgroundColor: colors.tint,
            borderRadius: DESIGN_TOKENS.radius.lg,
            padding: DESIGN_TOKENS.spacing.md,
          }}>
            <Ionicons name="shield-checkmark" size={24} color={colors.background} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{
              fontSize: 18,
              fontWeight: '600',
              color: colors.text,
              marginBottom: 4,
            }}>
              {t('payment.window.securePayment')}
            </Text>
            <Text style={{
              fontSize: 14,
              color: colors.textSecondary,
            }}>
              Interface moderne avec Apple Pay / Google Pay
            </Text>
          </View>
          {state.isProcessing ? (
            <ActivityIndicator size="small" color={colors.tint} />
          ) : (
            <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
          )}
        </Pressable>

        <Pressable
          onPress={() => handleMethodSelect('card')}
          style={({ pressed }) => ({
            backgroundColor: pressed ? colors.backgroundTertiary : colors.backgroundSecondary,
            borderRadius: DESIGN_TOKENS.radius.lg,
            padding: DESIGN_TOKENS.spacing.lg,
            flexDirection: 'row',
            alignItems: 'center',
            gap: DESIGN_TOKENS.spacing.md,
            borderWidth: 2,
            borderColor: colors.border,
          })}
        >
          <View style={{
            backgroundColor: colors.tint,
            borderRadius: DESIGN_TOKENS.radius.lg,
            padding: DESIGN_TOKENS.spacing.md,
          }}>
            <Ionicons name="card" size={24} color={colors.background} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{
              fontSize: 18,
              fontWeight: '600',
              color: colors.text,
              marginBottom: 4,
            }}>
              {t('payment.window.cardManualTitle')}
            </Text>
            <Text style={{
              fontSize: 14,
              color: colors.textSecondary,
            }}>
              {t('payment.window.secureCardPayment')}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
        </Pressable>

        <Pressable
          onPress={() => handleMethodSelect('cash')}
          style={({ pressed }) => ({
            backgroundColor: pressed ? colors.backgroundTertiary : colors.backgroundSecondary,
            borderRadius: DESIGN_TOKENS.radius.lg,
            padding: DESIGN_TOKENS.spacing.lg,
            flexDirection: 'row',
            alignItems: 'center',
            gap: DESIGN_TOKENS.spacing.md,
            borderWidth: 2,
            borderColor: colors.border,
          })}
        >
          <View style={{
            backgroundColor: colors.success,
            borderRadius: DESIGN_TOKENS.radius.lg,
            padding: DESIGN_TOKENS.spacing.md,
          }}>
            <Ionicons name="cash" size={24} color={colors.background} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{
              fontSize: 18,
              fontWeight: '600',
              color: colors.text,
              marginBottom: 4,
            }}>
              {t('payment.window.cashPayment')}
            </Text>
            <Text style={{
              fontSize: 14,
              color: colors.textSecondary,
            }}>
              {t('payment.window.cashPayment')}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
        </Pressable>
      </View>
    </View>
  );

  const renderCardForm = () => (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: DESIGN_TOKENS.spacing.lg }}>
      <Text style={{
        fontSize: 24,
        fontWeight: '700',
        color: colors.text,
        textAlign: 'center',
        marginBottom: DESIGN_TOKENS.spacing.xs,
      }}>
        {t('payment.window.cardInfo')}
      </Text>
      
      <Text style={{
        fontSize: 16,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: DESIGN_TOKENS.spacing.sm,
      }}>
        {formatCurrency(paymentAmount)}
      </Text>

      {/* ✅ Afficher le détail du calcul */}
      {billableTime > 0 && (
        <View style={{
          backgroundColor: colors.backgroundSecondary,
          borderRadius: DESIGN_TOKENS.radius.md,
          padding: DESIGN_TOKENS.spacing.md,
          marginBottom: DESIGN_TOKENS.spacing.lg,
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>Temps facturable</Text>
            <Text style={{ fontSize: 12, fontWeight: '600', color: colors.text }}>
              {formatTime(billableTime)}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>Taux horaire</Text>
            <Text style={{ fontSize: 12, fontWeight: '600', color: colors.text }}>
              {costData.hours.toFixed(2)}h × {HOURLY_RATE_AUD} AUD/h
            </Text>
          </View>
        </View>
      )}

      {/* ✅ Stripe CardField - Remplace tous les champs de carte */}
      <View style={{ marginBottom: DESIGN_TOKENS.spacing.xl }}>
        <Text style={{
          fontSize: 14,
          fontWeight: '600',
          color: colors.text,
          marginBottom: DESIGN_TOKENS.spacing.xs,
        }}>
          Informations de la carte
        </Text>
        
        <CardField
          postalCodeEnabled={false}
          placeholders={{
            number: '1234 5678 9012 3456',
            // ✅ Simplifier les placeholders selon la doc Stripe
          }}
          cardStyle={{
            backgroundColor: colors.backgroundSecondary,
            borderColor: state.cardError ? colors.error : colors.border,
            borderWidth: 2,
            borderRadius: DESIGN_TOKENS.radius.lg,
            fontSize: 16,
            placeholderColor: colors.textSecondary,
            textColor: colors.text,
          }}
          style={{
            width: '100%',
            height: 50,
            marginVertical: 4,
          }}
          onCardChange={(cardDetails) => {
            // TEMP_DISABLED: console.log('💳 Card changed:', cardDetails);
            
            // ✅ Gestion simplifiée des erreurs
            let errorMessage = null;
            if (!cardDetails.complete && cardDetails.number) {
              if (cardDetails.number.length > 0 && cardDetails.validNumber === 'Invalid') {
                errorMessage = 'Numéro de carte invalide';
              }
            }
            
            updateState({
              cardComplete: cardDetails.complete,
              cardError: errorMessage,
            });
          }}
          onFocus={(focusedField) => {
            // TEMP_DISABLED: console.log('💳 Focused field:', focusedField);
          }}
        />

        {/* ✅ Afficher l'erreur de validation */}
        {state.cardError && (
          <Text style={{
            fontSize: 12,
            color: colors.error,
            marginTop: DESIGN_TOKENS.spacing.xs,
          }}>
            {state.cardError}
          </Text>
        )}

        {/* ✅ Champ nom du porteur séparé */}
        <View style={{ marginTop: DESIGN_TOKENS.spacing.md }}>
          <Text style={{
            fontSize: 14,
            fontWeight: '600',
            color: colors.text,
            marginBottom: DESIGN_TOKENS.spacing.xs,
          }}>
            Nom du porteur
          </Text>
          <TextInput
            style={{
              backgroundColor: colors.backgroundSecondary,
              borderRadius: DESIGN_TOKENS.radius.lg,
              padding: DESIGN_TOKENS.spacing.md,
              fontSize: 16,
              color: colors.text,
              borderWidth: 2,
              borderColor: colors.border,
              height: 50, // Même hauteur que CardField
            }}
            placeholder={t('payment.window.cardNamePlaceholder')}
            placeholderTextColor={colors.textSecondary}
            value={state.newCard.name}
            onChangeText={(text) => updateState({ 
              newCard: { ...state.newCard, name: text } 
            })}
          />
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: DESIGN_TOKENS.spacing.md }}>
        <Pressable
          onPress={() => updateState({ step: 'method' })}
          style={({ pressed }) => ({
            flex: 1,
            backgroundColor: pressed ? colors.backgroundTertiary : colors.backgroundSecondary,
            borderRadius: DESIGN_TOKENS.radius.lg,
            padding: DESIGN_TOKENS.spacing.md,
            alignItems: 'center',
            borderWidth: 2,
            borderColor: colors.border,
          })}
        >
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: colors.text,
          }}>
            Retour
          </Text>
        </Pressable>

        <Pressable
          onPress={handleCardPayment}
          disabled={state.isProcessing || !state.cardComplete || !state.newCard.name.trim()}
          style={({ pressed }) => {
            const isReady = state.cardComplete && state.newCard.name.trim().length > 0;
            return {
              flex: 2,
              backgroundColor: pressed 
                ? (isReady ? colors.tint + 'DD' : colors.border) 
                : (isReady ? colors.tint : colors.border),
              borderRadius: DESIGN_TOKENS.radius.lg,
              padding: DESIGN_TOKENS.spacing.md,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: DESIGN_TOKENS.spacing.xs,
              opacity: state.isProcessing ? 0.7 : 1,
            };
          }}
        >
          {state.isProcessing && <ActivityIndicator size="small" color={colors.background} />}
          <Text style={{
            fontSize: 16,
            fontWeight: '700',
            color: (state.cardComplete && state.newCard.name.trim()) ? colors.background : colors.textSecondary,
          }}>
            {state.isProcessing 
              ? 'Traitement...' 
              : (state.cardComplete && state.newCard.name.trim()) 
                ? `Payer ${formatCurrency(paymentAmount)}` 
                : 'Complétez les informations'}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );

  const renderCashForm = () => (
    <View style={{ flex: 1, padding: DESIGN_TOKENS.spacing.lg }}>
      <Text style={{
        fontSize: 24,
        fontWeight: '700',
        color: colors.text,
        textAlign: 'center',
        marginBottom: DESIGN_TOKENS.spacing.xs,
      }}>
        {t('payment.window.cashPaymentTitle')}
      </Text>
      
      <Text style={{
        fontSize: 16,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: DESIGN_TOKENS.spacing.sm,
      }}>
        {t('payment.window.amountToPay')} {formatCurrency(paymentAmount)}
      </Text>

      {/* ✅ Afficher le détail du calcul */}
      {billableTime > 0 && (
        <View style={{
          backgroundColor: colors.backgroundSecondary,
          borderRadius: DESIGN_TOKENS.radius.md,
          padding: DESIGN_TOKENS.spacing.md,
          marginBottom: DESIGN_TOKENS.spacing.lg,
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>{t('jobDetails.payment.liveTracking.billableTime')}</Text>
            <Text style={{ fontSize: 12, fontWeight: '600', color: colors.text }}>
              {formatTime(billableTime)}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>{t('jobDetails.payment.billingBreakdown.hourlyRate')}</Text>
            <Text style={{ fontSize: 12, fontWeight: '600', color: colors.text }}>
              {costData.hours.toFixed(2)}h × {HOURLY_RATE_AUD} AUD/h
            </Text>
          </View>
        </View>
      )}

      <View style={{ marginBottom: DESIGN_TOKENS.spacing.xl }}>
        <Text style={{
          fontSize: 14,
          fontWeight: '600',
          color: colors.text,
          marginBottom: DESIGN_TOKENS.spacing.xs,
        }}>
          {t('payment.window.amountReceived')}
        </Text>
        <TextInput
          style={{
            backgroundColor: colors.backgroundSecondary,
            borderRadius: DESIGN_TOKENS.radius.lg,
            padding: DESIGN_TOKENS.spacing.lg,
            fontSize: 24,
            fontWeight: '700',
            color: colors.text,
            textAlign: 'center',
            borderWidth: 2,
            borderColor: colors.border,
          }}
          placeholder={paymentAmount.toString()}
          placeholderTextColor={colors.textSecondary}
          value={state.cashAmount}
          onChangeText={(text) => updateState({ cashAmount: text })}
          keyboardType="numeric"
        />
        
        {parseFloat(state.cashAmount) > paymentAmount && (
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: colors.success,
            textAlign: 'center',
            marginTop: DESIGN_TOKENS.spacing.sm,
          }}>
            Rendu : {formatCurrency(parseFloat(state.cashAmount) - paymentAmount)}
          </Text>
        )}
      </View>

      <View style={{ flexDirection: 'row', gap: DESIGN_TOKENS.spacing.md }}>
        <Pressable
          onPress={() => updateState({ step: 'method' })}
          style={({ pressed }) => ({
            flex: 1,
            backgroundColor: pressed ? colors.backgroundTertiary : colors.backgroundSecondary,
            borderRadius: DESIGN_TOKENS.radius.lg,
            padding: DESIGN_TOKENS.spacing.md,
            alignItems: 'center',
            borderWidth: 2,
            borderColor: colors.border,
          })}
        >
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: colors.text,
          }}>
            Retour
          </Text>
        </Pressable>

        <Pressable
          onPress={handleCashPayment}
          disabled={!state.cashAmount || parseFloat(state.cashAmount) < paymentAmount || state.isProcessing}
          style={({ pressed }) => ({
            flex: 2,
            backgroundColor: (!state.cashAmount || parseFloat(state.cashAmount) < paymentAmount)
              ? colors.backgroundTertiary
              : (pressed ? colors.successLight : colors.success),
            borderRadius: DESIGN_TOKENS.radius.lg,
            padding: DESIGN_TOKENS.spacing.md,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            gap: DESIGN_TOKENS.spacing.xs,
            opacity: (!state.cashAmount || parseFloat(state.cashAmount) < paymentAmount || state.isProcessing) ? 0.5 : 1,
          })}
        >
          {state.isProcessing && <ActivityIndicator size="small" color={colors.background} />}
          <Ionicons name="cash" size={18} color={colors.background} />
          <Text style={{
            fontSize: 16,
            fontWeight: '700',
            color: colors.background,
          }}>
            {state.isProcessing ? t('payment.buttons.processing') : t('payment.buttons.confirm')}
          </Text>
        </Pressable>
      </View>
    </View>
  );

  const renderProcessing = () => (
    <View style={{ 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center', 
      padding: DESIGN_TOKENS.spacing.lg 
    }}>
      <ActivityIndicator size="large" color={colors.tint} />
      <Text style={{
        fontSize: 18,
        fontWeight: '600',
        color: colors.text,
        marginTop: DESIGN_TOKENS.spacing.lg,
        textAlign: 'center',
      }}>
        {t('payment.window.processingPayment')}
      </Text>
    </View>
  );

  const renderSuccess = () => (
    <View style={{ 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center', 
      padding: DESIGN_TOKENS.spacing.lg 
    }}>
      <View style={{
        backgroundColor: colors.success + '20',
        borderRadius: 50,
        padding: DESIGN_TOKENS.spacing.lg,
        marginBottom: DESIGN_TOKENS.spacing.lg,
      }}>
        <Ionicons name="checkmark" size={48} color={colors.success} />
      </View>
      
      <Text style={{
        fontSize: 24,
        fontWeight: '700',
        color: colors.text,
        textAlign: 'center',
        marginBottom: DESIGN_TOKENS.spacing.sm,
      }}>
        {t('payment.window.paymentSuccess')}
      </Text>
      
      <Text style={{
        fontSize: 16,
        color: colors.textSecondary,
        textAlign: 'center',
      }}>
        {t('payment.window.paymentSuccessMessage', { amount: formatCurrency(paymentAmount) })}
      </Text>
    </View>
  );

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <View style={{ flex: 1 }}>
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            opacity: backdropAnimation,
          }}
        >
          <Pressable
            style={{ flex: 1 }}
            onPress={handleClose}
          />
        </Animated.View>

        <Animated.View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: screenHeight * 0.85,
            backgroundColor: colors.background,
            borderTopLeftRadius: DESIGN_TOKENS.radius.xl,
            borderTopRightRadius: DESIGN_TOKENS.radius.xl,
            transform: [{ translateY: slideAnimation }],
            paddingTop: insets.top,
          }}
        >
          {/* Header */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: DESIGN_TOKENS.spacing.lg,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}>
            <Text style={{
              fontSize: 18,
              fontWeight: '600',
              color: colors.text,
            }}>
              Paiement
            </Text>
            
            <Pressable
              onPress={handleClose}
              style={({ pressed }) => ({
                backgroundColor: pressed ? colors.backgroundSecondary : 'transparent',
                borderRadius: DESIGN_TOKENS.radius.lg,
                padding: DESIGN_TOKENS.spacing.xs,
              })}
            >
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* Content */}
          {state.step === 'method' && renderMethodSelection()}
          {state.step === 'card' && renderCardForm()}
          {state.step === 'cash' && renderCashForm()}
          {state.step === 'processing' && renderProcessing()}
          {state.step === 'success' && renderSuccess()}
        </Animated.View>
      </View>
    </Modal>
  );
};

export default PaymentWindow;