/**
 * PaymentWindow - Interface de paiement moderne avec données API réelles
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  Pressable, 
  TextInput, 
  Modal, 
  Animated, 
  Dimensions, 
  Alert,
  ActivityIndicator 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@react-native-vector-icons/ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { DESIGN_TOKENS } from '../../constants/Styles';
import { useTheme } from '../../context/ThemeProvider';

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
}

const PaymentWindow: React.FC<PaymentWindowProps> = ({ 
  job, 
  setJob, 
  visibleCondition, 
  setVisibleCondition 
}) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const isVisible = visibleCondition === 'paymentWindow';
  
  // Extraire les informations de coût depuis les données du job (comme dans payment.tsx)
  const getPaymentAmount = () => {
    const jobData = job?.job || job;
    return jobData?.actualCost || jobData?.estimatedCost || 0;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const paymentAmount = getPaymentAmount();
  
  // Payment state
  const [state, setState] = useState<PaymentState>({
    step: 'method',
    selectedMethod: null,
    newCard: { number: '', expiry: '', cvv: '', name: '' },
    cashAmount: '',
    isProcessing: false,
  });

  // Animations
  const slideAnimation = useRef(new Animated.Value(screenHeight)).current;
  const backdropAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
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
    setVisibleCondition(null);
  };

  const handleMethodSelect = (method: 'card' | 'cash') => {
    updateState({ selectedMethod: method, step: method });
  };

  const handleCardPayment = async () => {
    if (!state.newCard.number || !state.newCard.expiry || !state.newCard.cvv || !state.newCard.name) {
      Alert.alert("Informations manquantes", "Veuillez remplir tous les champs de la carte.");
      return;
    }

    updateState({ isProcessing: true, step: 'processing' });
    
    try {
      // Simuler le traitement du paiement
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mettre à jour le job avec le paiement effectué
      const updatedJob = {
        ...job,
        job: {
          ...job.job,
          actualCost: paymentAmount, // Marquer comme payé
        }
      };
      setJob(updatedJob);
      
      updateState({ step: 'success' });
      
      setTimeout(() => {
        handleClose();
      }, 2000);
      
    } catch (error) {
      Alert.alert("Erreur de paiement", "Une erreur s'est produite lors du traitement du paiement.");
      updateState({ isProcessing: false, step: 'card' });
    }
  };

  const handleCashPayment = async () => {
    const cashValue = parseFloat(state.cashAmount);
    if (!cashValue || cashValue < paymentAmount) {
      Alert.alert("Montant incorrect", `Le montant doit être au moins ${formatCurrency(paymentAmount)}`);
      return;
    }

    updateState({ isProcessing: true, step: 'processing' });
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const updatedJob = {
        ...job,
        job: {
          ...job.job,
          actualCost: paymentAmount,
        }
      };
      setJob(updatedJob);
      
      updateState({ step: 'success' });
      
      setTimeout(() => {
        handleClose();
      }, 2000);
      
    } catch (error) {
      Alert.alert("Erreur", "Une erreur s'est produite lors de l'enregistrement du paiement.");
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
        Choisir le mode de paiement
      </Text>
      
      <Text style={{
        fontSize: 16,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: DESIGN_TOKENS.spacing.xl,
      }}>
        Montant à payer : {formatCurrency(paymentAmount)}
      </Text>

      <View style={{ gap: DESIGN_TOKENS.spacing.md }}>
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
              Carte bancaire
            </Text>
            <Text style={{
              fontSize: 14,
              color: colors.textSecondary,
            }}>
              Paiement sécurisé par carte
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
            backgroundColor: '#10B981',
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
              Espèces
            </Text>
            <Text style={{
              fontSize: 14,
              color: colors.textSecondary,
            }}>
              Paiement en liquide
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
        Informations de la carte
      </Text>
      
      <Text style={{
        fontSize: 16,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: DESIGN_TOKENS.spacing.xl,
      }}>
        {formatCurrency(paymentAmount)}
      </Text>

      <View style={{ gap: DESIGN_TOKENS.spacing.lg, marginBottom: DESIGN_TOKENS.spacing.xl }}>
        <View>
          <Text style={{
            fontSize: 14,
            fontWeight: '600',
            color: colors.text,
            marginBottom: DESIGN_TOKENS.spacing.xs,
          }}>
            Numéro de carte
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
            }}
            placeholder="1234 5678 9012 3456"
            placeholderTextColor={colors.textSecondary}
            value={state.newCard.number}
            onChangeText={(text) => updateState({ 
              newCard: { ...state.newCard, number: formatCardNumber(text) } 
            })}
            maxLength={19}
            keyboardType="numeric"
          />
        </View>

        <View style={{ flexDirection: 'row', gap: DESIGN_TOKENS.spacing.md }}>
          <View style={{ flex: 1 }}>
            <Text style={{
              fontSize: 14,
              fontWeight: '600',
              color: colors.text,
              marginBottom: DESIGN_TOKENS.spacing.xs,
            }}>
              Date d'expiration
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
              }}
              placeholder="MM/AA"
              placeholderTextColor={colors.textSecondary}
              value={state.newCard.expiry}
              onChangeText={(text) => updateState({ 
                newCard: { ...state.newCard, expiry: formatExpiry(text) } 
              })}
              maxLength={5}
              keyboardType="numeric"
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={{
              fontSize: 14,
              fontWeight: '600',
              color: colors.text,
              marginBottom: DESIGN_TOKENS.spacing.xs,
            }}>
              CVV
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
              }}
              placeholder="123"
              placeholderTextColor={colors.textSecondary}
              value={state.newCard.cvv}
              onChangeText={(text) => updateState({ 
                newCard: { ...state.newCard, cvv: text.replace(/[^0-9]/g, '') } 
              })}
              maxLength={4}
              keyboardType="numeric"
              secureTextEntry
            />
          </View>
        </View>

        <View>
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
            }}
            placeholder="Jean Dupont"
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
          disabled={state.isProcessing}
          style={({ pressed }) => ({
            flex: 2,
            backgroundColor: pressed ? colors.tint + 'DD' : colors.tint,
            borderRadius: DESIGN_TOKENS.radius.lg,
            padding: DESIGN_TOKENS.spacing.md,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            gap: DESIGN_TOKENS.spacing.xs,
            opacity: state.isProcessing ? 0.7 : 1,
          })}
        >
          {state.isProcessing && <ActivityIndicator size="small" color={colors.background} />}
          <Text style={{
            fontSize: 16,
            fontWeight: '700',
            color: colors.background,
          }}>
            {state.isProcessing ? 'Traitement...' : `Payer ${formatCurrency(paymentAmount)}`}
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
        Paiement en espèces
      </Text>
      
      <Text style={{
        fontSize: 16,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: DESIGN_TOKENS.spacing.xl,
      }}>
        Montant à payer : {formatCurrency(paymentAmount)}
      </Text>

      <View style={{ marginBottom: DESIGN_TOKENS.spacing.xl }}>
        <Text style={{
          fontSize: 14,
          fontWeight: '600',
          color: colors.text,
          marginBottom: DESIGN_TOKENS.spacing.xs,
        }}>
          Montant reçu
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
            color: '#10B981',
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
              : (pressed ? '#10B981DD' : '#10B981'),
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
            {state.isProcessing ? 'Enregistrement...' : 'Confirmer le paiement'}
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
        Traitement du paiement...
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
        backgroundColor: '#D1FAE5',
        borderRadius: 50,
        padding: DESIGN_TOKENS.spacing.lg,
        marginBottom: DESIGN_TOKENS.spacing.lg,
      }}>
        <Ionicons name="checkmark" size={48} color="#10B981" />
      </View>
      
      <Text style={{
        fontSize: 24,
        fontWeight: '700',
        color: colors.text,
        textAlign: 'center',
        marginBottom: DESIGN_TOKENS.spacing.sm,
      }}>
        Paiement réussi !
      </Text>
      
      <Text style={{
        fontSize: 16,
        color: colors.textSecondary,
        textAlign: 'center',
      }}>
        Le paiement de {formatCurrency(paymentAmount)} a été traité avec succès.
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