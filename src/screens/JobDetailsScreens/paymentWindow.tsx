/**
 * PaymentWindow - Modern payment interface with animations
 * Coherent design system, interactive credit card, enhanced security
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
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { VStack, HStack } from '../../components/primitives/Stack';
import { DESIGN_TOKENS } from '../../constants/Styles';
import { Colors } from '../../constants/Colors';
import CardForm from '../../../src/components/CardForm';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Types et interfaces
interface SavedCard {
  id: number | string;
  cardNumber: string;
  expiryDate: string;
  cardHolderName: string;
  cardType?: 'visa' | 'mastercard' | 'amex' | 'discover';
  cvv?: string;
}

interface PaymentData {
  amount: string;
  currency: string;
  amountToBePaid: string;
  taxe: {
    gst: string;
    gstRate: string;
    amountWithoutTax: string;
  };
  savedCards?: SavedCard[];
}

interface Job {
  id: string;
  payment: PaymentData;
}

interface PaymentWindowProps {
  job: Job;
  setJob: React.Dispatch<React.SetStateAction<Job>>;
  visibleCondition: string | null;
  setVisibleCondition: React.Dispatch<React.SetStateAction<string | null>>;
}

interface PaymentState {
  step: 'method' | 'card' | 'cash' | 'processing' | 'success';
  selectedMethod: 'card' | 'cash' | null;
  selectedCard: SavedCard | null;
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
  console.log('🔄 PaymentWindow render'); // DEBUG
  const insets = useSafeAreaInsets();
  const isVisible = visibleCondition === 'paymentWindow';
  
  // Payment state
  const [state, setState] = useState<PaymentState>({
    step: 'method',
    selectedMethod: null,
    selectedCard: null,
    newCard: { number: '', expiry: '', cvv: '', name: '' },
    cashAmount: '',
    isProcessing: false,
  });

  // Animations
  const slideAnimation = useRef(new Animated.Value(screenHeight)).current;
  const backdropAnimation = useRef(new Animated.Value(0)).current;
  const scaleAnimation = useRef(new Animated.Value(0.9)).current;
  const cardFlipAnimation = useRef(new Animated.Value(0)).current;

  // Update validation when selecting a saved card
  useEffect(() => {
    if (state.selectedCard) {
      const card = state.newCard;
      const cardType = getCardType(card.number);
      const numberValidation = validateCardNumber(card.number);
      const expiryValidation = validateExpiry(card.expiry);
      const cvvValidation = validateCVV(card.cvv, cardType);
      
      setCardValidation({
        number: numberValidation,
        expiry: expiryValidation,
        cvv: cvvValidation,
        cardType
      });
    }
  }, [state.selectedCard, state.newCard]);

  // Animation effects
  useEffect(() => {
    if (isVisible) {
      setState(prev => ({ ...prev, step: 'method' }));
      
      Animated.parallel([
        Animated.timing(backdropAnimation, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnimation, {
          toValue: 0,
          tension: 80,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnimation, {
          toValue: 1,
          tension: 100,
          friction: 6,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(backdropAnimation, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnimation, {
          toValue: screenHeight * 0.8,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible]);

  // Helper functions
  const updateState = (updates: Partial<PaymentState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  // Validation state
  const [cardValidation, setCardValidation] = useState({
    number: { isValid: false, message: '' },
    expiry: { isValid: false, message: '' },
    cvv: { isValid: false, message: '' },
    cardType: 'unknown' as 'visa' | 'mastercard' | 'amex' | 'discover' | 'unknown'
  });

  // Debounced setState to avoid frequent re-renders
  const debouncedStateUpdate = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debouncedStateUpdate.current) {
        clearTimeout(debouncedStateUpdate.current);
      }
    };
  }, []);
  
  const handleCardUpdate = useCallback((card: { number: string; expiry: string; cvv: string; name: string }) => {
    console.log('📝 Card update (debounced):', card); // DEBUG
    
    // SOLUTION: No validation here to avoid re-renders!
    // Just update the card data
    setState(prev => ({ 
      ...prev, 
      newCard: card
    }));
  }, []);

  // Separate callback for validation that doesn't cause re-render
  const handleValidationUpdate = useCallback((validation: {
    cardType: string;
    isNumberValid: boolean;
    isExpiryValid: boolean;
    isCvvValid: boolean;
    numberMessage: string;
  }) => {
    console.log('🔍 Validation update:', validation); // DEBUG
    
    // Update validation separately
    setCardValidation({
      number: { isValid: validation.isNumberValid, message: validation.numberMessage },
      expiry: { isValid: validation.isExpiryValid, message: '' },
      cvv: { isValid: validation.isCvvValid, message: '' },
      cardType: validation.cardType as any
    });
  }, []);

  // Advanced card type detection
  const getCardType = (number: string): 'visa' | 'mastercard' | 'amex' | 'discover' | 'unknown' => {
    const cleanNumber = number.replace(/\s/g, '');
    
    // Visa: starts with 4, 13-19 digits
    if (/^4[0-9]{12}(?:[0-9]{3})?$/.test(cleanNumber) || cleanNumber.startsWith('4')) {
      return 'visa';
    }
    
    // Mastercard: 5[1-5] or 2[2-7], 16 digits
    if (/^5[1-5][0-9]{14}$/.test(cleanNumber) || /^2[2-7][0-9]{14}$/.test(cleanNumber) || 
        cleanNumber.startsWith('5') || (cleanNumber.startsWith('2') && cleanNumber.length >= 2 && parseInt(cleanNumber.substring(0,2)) >= 22)) {
      return 'mastercard';
    }
    
    // American Express: 34 or 37, 15 digits
    if (/^3[47][0-9]{13}$/.test(cleanNumber) || cleanNumber.startsWith('34') || cleanNumber.startsWith('37')) {
      return 'amex';
    }
    
    // Discover: 6011, 622126-622925, 644-649, 65, 16 digits
    if (/^6(?:011|5[0-9]{2})[0-9]{12}$/.test(cleanNumber) || cleanNumber.startsWith('6011') || cleanNumber.startsWith('65')) {
      return 'discover';
    }
    
    return 'unknown';
  };

  // Card number validation
  const validateCardNumber = (number: string): { isValid: boolean; message: string } => {
    const cleanNumber = number.replace(/\s/g, '');
    const cardType = getCardType(cleanNumber);
    
    if (cleanNumber.length === 0) {
      return { isValid: false, message: 'Number required' };
    }
    
    // Length verification by card type
    const expectedLengths = {
      visa: [13, 16, 19],
      mastercard: [16],
      amex: [15],
      discover: [16],
      unknown: [16]
    };
    
    const validLengths = expectedLengths[cardType];
    if (!validLengths.includes(cleanNumber.length)) {
      return { 
        isValid: false, 
        message: `${cardType.toUpperCase()} must have ${validLengths.join(' or ')} digits` 
      };
    }
    
    // Luhn algorithm for validation
    if (!luhnCheck(cleanNumber)) {
      return { isValid: false, message: 'Invalid card number' };
    }
    
    return { isValid: true, message: 'Valid' };
  };

  // Luhn algorithm
  const luhnCheck = (number: string): boolean => {
    let sum = 0;
    let alternate = false;
    
    for (let i = number.length - 1; i >= 0; i--) {
      let n = parseInt(number.charAt(i), 10);
      
      if (alternate) {
        n *= 2;
        if (n > 9) {
          n = (n % 10) + 1;
        }
      }
      
      sum += n;
      alternate = !alternate;
    }
    
    return (sum % 10) === 0;
  };

  // Expiry date validation
  const validateExpiry = (expiry: string): { isValid: boolean; message: string } => {
    if (expiry.length !== 4) {
      return { isValid: false, message: 'MM/YY format required' };
    }
    
    const month = parseInt(expiry.substring(0, 2));
    const year = parseInt(expiry.substring(2, 4)) + 2000;
    
    if (month < 1 || month > 12) {
      return { isValid: false, message: 'Invalid month' };
    }
    
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    
    if (year < currentYear || (year === currentYear && month < currentMonth)) {
      return { isValid: false, message: 'Expired date' };
    }
    
    return { isValid: true, message: 'Valid' };
  };

  // CVV validation
  const validateCVV = (cvv: string, cardType: string): { isValid: boolean; message: string } => {
    if (cvv.length === 0) {
      return { isValid: false, message: 'CVV required' };
    }
    
    const expectedLength = cardType === 'amex' ? 4 : 3;
    
    if (cvv.length !== expectedLength) {
      return { 
        isValid: false, 
        message: `CVV must have ${expectedLength} digits for ${cardType.toUpperCase()}` 
      };
    }
    
    return { isValid: true, message: 'Valid' };
  };

  const formatCardNumber = (number: string): string => {
    return number.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ').trim();
  };

  const formatExpiry = (expiry: string): string => {
    return expiry.replace(/\D/g, '').replace(/(\d{2})(\d{1,2})/, '$1/$2');
  };

  const maskCardNumber = (number: string): string => {
    return number.replace(/\d(?=\d{4})/g, '•');
  };

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(backdropAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnimation, {
        toValue: screenHeight * 0.8,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisibleCondition(null);
    });
  };

  const handlePayment = async () => {
    updateState({ isProcessing: true, step: 'processing' });
    
    // Simulation du paiement
    setTimeout(() => {
      updateState({ isProcessing: false, step: 'success' });
      
      // Update job
      setJob(prev => ({
        ...prev,
        payment: {
          ...prev.payment,
          status: 'paid',
        }
      }));
      
      // Close after success
      setTimeout(() => {
        handleClose();
      }, 2000);
    }, 3000);
  };

  if (!isVisible) return null;

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      hardwareAccelerated
      statusBarTranslucent
      presentationStyle="overFullScreen"
    >
      <View style={{ flex: 1 }}>
        {/* Animated backdrop */}
        <Animated.View 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            opacity: backdropAnimation,
          }}
        />
        
        {/* Modal content with animations */}
        <Animated.View
          style={{
            flex: 1,
            justifyContent: 'flex-end',
            transform: [
              { translateY: slideAnimation },
              { scale: scaleAnimation }
            ]
          }}
        >
          <View
            style={{
              backgroundColor: Colors.light.background,
              borderTopLeftRadius: DESIGN_TOKENS.radius.lg,
              borderTopRightRadius: DESIGN_TOKENS.radius.lg,
              paddingTop: DESIGN_TOKENS.spacing.md,
              paddingBottom: insets.bottom || DESIGN_TOKENS.spacing.lg,
              minHeight: '85%',
              maxHeight: '95%',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -8 },
              shadowOpacity: 0.25,
              shadowRadius: 20,
              elevation: 12,
            }}
          >
            {/* Drag handle */}
            <View style={{
              width: 40,
              height: 4,
              backgroundColor: Colors.light.border,
              borderRadius: 2,
              alignSelf: 'center',
              marginVertical: DESIGN_TOKENS.spacing.sm,
            }} />

            {/* Header */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: DESIGN_TOKENS.spacing.lg,
              paddingBottom: DESIGN_TOKENS.spacing.md,
            }}>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: DESIGN_TOKENS.spacing.sm,
              }}>
                {state.step !== 'method' && (
                  <Pressable
                    onPress={() => updateState({ step: 'method' })}
                    style={{
                      backgroundColor: Colors.light.backgroundTertiary,
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: DESIGN_TOKENS.spacing.sm,
                    }}
                  >
                    <Ionicons name="chevron-back" size={20} color={Colors.light.text} />
                  </Pressable>
                )}
                
                <View style={{
                  backgroundColor: Colors.light.primary + '20',
                  padding: 8,
                  borderRadius: 12,
                }}>
                  <Ionicons name="card" size={24} color={Colors.light.primary} />
                </View>
                
                <View>
                  <Text style={{
                    color: Colors.light.text,
                    fontSize: DESIGN_TOKENS.typography.title.fontSize,
                    fontWeight: '700',
                  }}>
                    {state.step === 'method' && 'Payment Method'}
                    {state.step === 'card' && 'Card Details'}
                    {state.step === 'cash' && 'Cash Payment'}
                    {state.step === 'processing' && 'Processing...'}
                    {state.step === 'success' && 'Payment Complete'}
                  </Text>
                  <Text style={{
                    color: Colors.light.textSecondary,
                    fontSize: DESIGN_TOKENS.typography.caption.fontSize,
                  }}>
                    Job #{job.id || 'N/A'} • {job.payment?.currency || 'AUD'} {job.payment?.amountToBePaid || '0.00'}
                  </Text>
                </View>
              </View>
              
              <Pressable
                onPress={handleClose}
                disabled={state.isProcessing}
                style={{
                  backgroundColor: Colors.light.backgroundTertiary,
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  justifyContent: 'center',
                  alignItems: 'center',
                  opacity: state.isProcessing ? 0.5 : 1,
                }}
              >
                <Ionicons name="close" size={20} color={Colors.light.textSecondary} />
              </Pressable>
            </View>

            {/* Content */}
            <ScrollView 
              style={{ flex: 1 }}
              contentContainerStyle={{ 
                padding: DESIGN_TOKENS.spacing.lg,
                gap: DESIGN_TOKENS.spacing.lg,
              }}
              showsVerticalScrollIndicator={false}
            >
              {state.step === 'method' && <MethodSelection />}
              {state.step === 'card' && <CardPayment />}
              {state.step === 'cash' && <CashPayment />}
              {state.step === 'processing' && <ProcessingView />}
              {state.step === 'success' && <SuccessView />}
            </ScrollView>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );

  // Internal components with interactive mock card
  function MethodSelection() {
    return (
      <VStack gap="lg">
        {/* Summary */}
        <View style={{
          backgroundColor: Colors.light.backgroundSecondary,
          padding: DESIGN_TOKENS.spacing.lg,
          borderRadius: DESIGN_TOKENS.radius.lg,
        }}>
          <Text style={{
            fontSize: DESIGN_TOKENS.typography.subtitle.fontSize,
            fontWeight: '600',
            color: Colors.light.text,
            marginBottom: DESIGN_TOKENS.spacing.md,
          }}>
            Payment Summary
          </Text>
          
          <HStack justify="space-between" style={{ marginBottom: DESIGN_TOKENS.spacing.sm }}>
            <Text style={{ color: Colors.light.textSecondary }}>Subtotal</Text>
            <Text style={{ fontWeight: '600' }}>{job.payment?.currency || 'AUD'} {job.payment?.taxe?.amountWithoutTax || '0.00'}</Text>
          </HStack>
          
          <HStack justify="space-between" style={{ marginBottom: DESIGN_TOKENS.spacing.sm }}>
            <Text style={{ color: Colors.light.textSecondary }}>GST ({job.payment?.taxe?.gstRate || 10}%)</Text>
            <Text style={{ fontWeight: '600' }}>{job.payment?.currency || 'AUD'} {job.payment?.taxe?.gst || '0.00'}</Text>
          </HStack>
          
          <View style={{ height: 1, backgroundColor: Colors.light.border, marginVertical: DESIGN_TOKENS.spacing.sm }} />
          
          <HStack justify="space-between">
            <Text style={{ fontSize: DESIGN_TOKENS.typography.subtitle.fontSize, fontWeight: '600' }}>Total</Text>
            <Text style={{ 
              fontSize: DESIGN_TOKENS.typography.subtitle.fontSize, 
              fontWeight: '700',
              color: Colors.light.primary,
            }}>
              {job.payment?.currency || 'AUD'} {job.payment?.amountToBePaid || '0.00'}
            </Text>
          </HStack>
        </View>

        {/* Payment Methods */}
        <VStack gap="md">
          <Text style={{
            fontSize: DESIGN_TOKENS.typography.subtitle.fontSize,
            fontWeight: '600',
            color: Colors.light.text,
          }}>
            Choose Payment Method
          </Text>
          
          <Pressable
            onPress={() => updateState({ selectedMethod: 'card', step: 'card' })}
            style={({ pressed }) => ({
              backgroundColor: pressed ? Colors.light.backgroundSecondary : 'white',
              padding: DESIGN_TOKENS.spacing.lg,
              borderRadius: DESIGN_TOKENS.radius.lg,
              borderWidth: 2,
              borderColor: Colors.light.border,
              shadowColor: Colors.light.shadow,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 2,
            })}
          >
            <HStack gap="md" align="center">
              <View style={{
                backgroundColor: Colors.light.primary + '20',
                padding: DESIGN_TOKENS.spacing.sm,
                borderRadius: DESIGN_TOKENS.radius.sm,
              }}>
                <Ionicons name="card" size={24} color={Colors.light.primary} />
              </View>
              <VStack gap="xs" style={{ flex: 1 }}>
                <Text style={{ 
                  fontSize: DESIGN_TOKENS.typography.body.fontSize,
                  fontWeight: '600',
                  color: Colors.light.text,
                }}>
                  Credit/Debit Card
                </Text>
                <Text style={{ 
                  fontSize: DESIGN_TOKENS.typography.caption.fontSize,
                  color: Colors.light.textSecondary,
                }}>
                  Visa, Mastercard, American Express
                </Text>
              </VStack>
              <Ionicons name="chevron-forward" size={20} color={Colors.light.textSecondary} />
            </HStack>
          </Pressable>
          
          <Pressable
            onPress={() => updateState({ selectedMethod: 'cash', step: 'cash' })}
            style={({ pressed }) => ({
              backgroundColor: pressed ? Colors.light.backgroundSecondary : 'white',
              padding: DESIGN_TOKENS.spacing.lg,
              borderRadius: DESIGN_TOKENS.radius.lg,
              borderWidth: 2,
              borderColor: Colors.light.border,
              shadowColor: Colors.light.shadow,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 2,
            })}
          >
            <HStack gap="md" align="center">
              <View style={{
                backgroundColor: Colors.light.success + '20',
                padding: DESIGN_TOKENS.spacing.sm,
                borderRadius: DESIGN_TOKENS.radius.sm,
              }}>
                <Ionicons name="cash" size={24} color={Colors.light.success} />
              </View>
              <VStack gap="xs" style={{ flex: 1 }}>
                <Text style={{ 
                  fontSize: DESIGN_TOKENS.typography.body.fontSize,
                  fontWeight: '600',
                  color: Colors.light.text,
                }}>
                  Cash Payment
                </Text>
                <Text style={{ 
                  fontSize: DESIGN_TOKENS.typography.caption.fontSize,
                  color: Colors.light.textSecondary,
                }}>
                  Pay in person with cash
                </Text>
              </VStack>
              <Ionicons name="chevron-forward" size={20} color={Colors.light.textSecondary} />
            </HStack>
          </Pressable>
        </VStack>
      </VStack>
    );
  }

  function CardPayment() {
    return (
      <VStack gap="lg">
        {/* Saved Cards */}
        {job.payment?.savedCards && Array.isArray(job.payment.savedCards) && job.payment.savedCards.length > 0 && (
          <VStack gap="md">
            <Text style={{
              fontSize: DESIGN_TOKENS.typography.subtitle.fontSize,
              fontWeight: '600',
              color: Colors.light.text,
            }}>
              Saved Cards
            </Text>
            
            {job.payment.savedCards.map((card) => (
              card && card.id && card.cardNumber ? (
                <SavedCardItem key={card.id} card={card} />
              ) : null
            ))}
          </VStack>
        )}

        {/* New Card Form with mock card */}
        <VStack gap="md">
          <Text style={{
            fontSize: DESIGN_TOKENS.typography.subtitle.fontSize,
            fontWeight: '600',
            color: Colors.light.text,
          }}>
            {job.payment.savedCards?.length ? 'Or Add New Card' : 'Card Information'}
          </Text>
          
          {/* Interactive mock card */}
          <CreditCardPreview />
          
          {/* Form Fields */}
          <CardForm 
            initialCard={state.newCard}
            onCardChange={handleCardUpdate}
            onValidationChange={handleValidationUpdate}
          />
        </VStack>

        {/* Pay Button - Enhanced visibility - ALWAYS VISIBLE */}
        <View style={{
          marginTop: DESIGN_TOKENS.spacing.xl,
          marginBottom: DESIGN_TOKENS.spacing.lg,
          backgroundColor: 'white',
          borderRadius: 20,
          padding: DESIGN_TOKENS.spacing.md,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}>
          
          {/* Informations de validation */}
          <VStack gap="sm" style={{ marginBottom: DESIGN_TOKENS.spacing.md }}>
            <Text style={{
              fontSize: DESIGN_TOKENS.typography.subtitle.fontSize,
              fontWeight: '600',
              color: Colors.light.text,
              textAlign: 'center',
            }}>
              Payment Validation
            </Text>
            
            {/* Required fields status */}
            <VStack gap="xs">
              <HStack gap="sm" align="center" justify="space-between">
                <Text style={{ color: Colors.light.textSecondary }}>Card Number</Text>
                <Ionicons 
                  name={state.newCard.number ? "checkmark-circle" : "ellipse-outline"} 
                  size={16} 
                  color={state.newCard.number ? Colors.light.success : Colors.light.textSecondary} 
                />
              </HStack>
              <HStack gap="sm" align="center" justify="space-between">
                <Text style={{ color: Colors.light.textSecondary }}>Expiry Date</Text>
                <Ionicons 
                  name={state.newCard.expiry ? "checkmark-circle" : "ellipse-outline"} 
                  size={16} 
                  color={state.newCard.expiry ? Colors.light.success : Colors.light.textSecondary} 
                />
              </HStack>
              <HStack gap="sm" align="center" justify="space-between">
                <Text style={{ color: Colors.light.textSecondary }}>CVV</Text>
                <Ionicons 
                  name={state.newCard.cvv ? "checkmark-circle" : "ellipse-outline"} 
                  size={16} 
                  color={state.newCard.cvv ? Colors.light.success : Colors.light.textSecondary} 
                />
              </HStack>
            </VStack>
          </VStack>

          {/* Bouton de paiement */}
          <Pressable
            onPress={handlePayment}
            disabled={!state.newCard.number || !state.newCard.expiry || !state.newCard.cvv}
            style={({ pressed }) => {
              const isComplete = state.newCard.number && state.newCard.expiry && state.newCard.cvv;
              return {
                backgroundColor: !isComplete
                  ? Colors.light.backgroundSecondary
                  : pressed 
                  ? '#0066cc'
                  : Colors.light.primary,
                paddingVertical: DESIGN_TOKENS.spacing.lg,
                paddingHorizontal: DESIGN_TOKENS.spacing.xl,
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 60,
                borderWidth: !isComplete ? 2 : 0,
                borderColor: !isComplete ? Colors.light.border : 'transparent',
                shadowColor: isComplete ? Colors.light.primary : 'transparent',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: isComplete ? 6 : 0,
                transform: pressed && isComplete ? [{ scale: 0.98 }] : [{ scale: 1 }],
              };
            }}
          >
            <HStack gap="md" align="center">
              <View style={{
                backgroundColor: (state.newCard.number && state.newCard.expiry && state.newCard.cvv) 
                  ? 'rgba(255,255,255,0.2)' 
                  : Colors.light.backgroundTertiary,
                padding: 10,
                borderRadius: 25,
              }}>
                <Ionicons 
                  name={
                    (state.newCard.number && state.newCard.expiry && state.newCard.cvv) 
                      ? "lock-closed" 
                      : "lock-open"
                  } 
                  size={24} 
                  color={
                    (state.newCard.number && state.newCard.expiry && state.newCard.cvv) 
                      ? "white" 
                      : Colors.light.textSecondary
                  } 
                />
              </View>
              <VStack gap="xs" align="center">
                <Text style={{
                  color: (state.newCard.number && state.newCard.expiry && state.newCard.cvv) 
                    ? 'white' 
                    : Colors.light.textSecondary,
                  fontSize: DESIGN_TOKENS.typography.title.fontSize,
                  fontWeight: '700',
                  textAlign: 'center',
                }}>
                  {(state.newCard.number && state.newCard.expiry && state.newCard.cvv) 
                    ? `Pay ${job.payment?.currency || 'AUD'} ${job.payment?.amountToBePaid || '0.00'}`
                    : 'Complete Card Details'
                  }
                </Text>
                <Text style={{
                  color: (state.newCard.number && state.newCard.expiry && state.newCard.cvv) 
                    ? 'rgba(255,255,255,0.9)' 
                    : Colors.light.textSecondary,
                  fontSize: DESIGN_TOKENS.typography.caption.fontSize,
                  fontWeight: '500',
                  textAlign: 'center',
                }}>
                  {(state.newCard.number && state.newCard.expiry && state.newCard.cvv) 
                    ? 'Secure payment via encrypted connection'
                    : 'Fill all required fields to continue'
                  }
                </Text>
              </VStack>
            </HStack>
          </Pressable>
        </View>
      </VStack>
    );
  }

  function CashPayment() {
    return (
      <VStack gap="lg">
        {/* Cash Payment Info */}
        <VStack gap="md">
          <Text style={{
            fontSize: DESIGN_TOKENS.typography.subtitle.fontSize,
            fontWeight: '600',
            color: Colors.light.text,
          }}>
            Cash Payment Details
          </Text>
          
          <View style={{
            backgroundColor: Colors.light.backgroundSecondary,
            padding: DESIGN_TOKENS.spacing.lg,
            borderRadius: DESIGN_TOKENS.radius.lg,
          }}>
            <VStack gap="sm">
              <HStack gap="sm" align="center">
                <Ionicons name="information-circle" size={20} color={Colors.light.primary} />
                <Text style={{
                  fontSize: DESIGN_TOKENS.typography.body.fontSize,
                  fontWeight: '600',
                  color: Colors.light.text,
                }}>
                  Payment Instructions
                </Text>
              </HStack>
              <Text style={{
                fontSize: DESIGN_TOKENS.typography.body.fontSize,
                color: Colors.light.textSecondary,
                lineHeight: 22,
              }}>
                Please prepare the exact amount in cash. Payment will be collected upon service completion.
              </Text>
            </VStack>
          </View>
        </VStack>

        {/* Amount Input */}
        <VStack gap="md">
          <Text style={{
            fontSize: DESIGN_TOKENS.typography.subtitle.fontSize,
            fontWeight: '600',
            color: Colors.light.text,
          }}>
            Confirm Amount
          </Text>
          
          <View>
            <Text style={{
              fontSize: DESIGN_TOKENS.typography.caption.fontSize,
              color: Colors.light.textSecondary,
              marginBottom: DESIGN_TOKENS.spacing.xs,
            }}>
              Cash Amount ({job.payment?.currency || 'AUD'})
            </Text>
            <TextInput
              style={{
                backgroundColor: 'white',
                borderWidth: 2,
                borderColor: Colors.light.border,
                borderRadius: DESIGN_TOKENS.radius.md,
                padding: DESIGN_TOKENS.spacing.md,
                fontSize: DESIGN_TOKENS.typography.body.fontSize,
                textAlign: 'right',
              }}
              placeholder={job.payment?.amountToBePaid || '0.00'}
              keyboardType="numeric"
              value={state.cashAmount}
              onChangeText={(text) => updateState({ 
                cashAmount: text
              })}
            />
          </View>
        </VStack>

        {/* Confirm Button */}
        <View style={{
          marginTop: DESIGN_TOKENS.spacing.lg,
          marginBottom: DESIGN_TOKENS.spacing.md,
        }}>
          <Pressable
            onPress={handlePayment}
            disabled={!state.cashAmount || parseFloat(state.cashAmount) < parseFloat(job.payment?.amountToBePaid || '0')}
            style={({ pressed }) => ({
              backgroundColor: (!state.cashAmount || parseFloat(state.cashAmount) < parseFloat(job.payment?.amountToBePaid || '0'))
                ? Colors.light.backgroundTertiary
                : pressed 
                ? '#0d8a4a'
                : Colors.light.success,
              paddingVertical: DESIGN_TOKENS.spacing.lg,
              paddingHorizontal: DESIGN_TOKENS.spacing.xl,
              borderRadius: 16,
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 56,
              shadowColor: (!state.cashAmount || parseFloat(state.cashAmount) < parseFloat(job.payment?.amountToBePaid || '0'))
                ? 'transparent' 
                : Colors.light.success,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: (!state.cashAmount || parseFloat(state.cashAmount) < parseFloat(job.payment?.amountToBePaid || '0')) ? 0 : 6,
              opacity: (!state.cashAmount || parseFloat(state.cashAmount) < parseFloat(job.payment?.amountToBePaid || '0')) ? 0.5 : 1,
              transform: pressed ? [{ scale: 0.98 }] : [{ scale: 1 }],
            })}
          >
            <HStack gap="md" align="center">
              <View style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                padding: 8,
                borderRadius: 20,
              }}>
                <Ionicons name="cash" size={20} color="white" />
              </View>
              <VStack gap="xs" align="center">
                <Text style={{
                  color: 'white',
                  fontSize: DESIGN_TOKENS.typography.subtitle.fontSize,
                  fontWeight: '700',
                  textAlign: 'center',
                }}>
                  Confirm Cash Payment
                </Text>
                <Text style={{
                  color: 'rgba(255,255,255,0.9)',
                  fontSize: DESIGN_TOKENS.typography.caption.fontSize,
                  fontWeight: '500',
                  textAlign: 'center',
                }}>
                  Payment collected on completion
                </Text>
              </VStack>
            </HStack>
          </Pressable>
        </View>
        
        {/* Note */}
        <View style={{
          backgroundColor: Colors.light.warning + '20',
          padding: DESIGN_TOKENS.spacing.md,
          borderRadius: DESIGN_TOKENS.radius.md,
          borderLeftWidth: 4,
          borderLeftColor: Colors.light.warning,
        }}>
          <HStack gap="sm" align="flex-start">
            <Ionicons name="warning" size={16} color={Colors.light.warning} style={{ marginTop: 2 }} />
            <Text style={{
              fontSize: DESIGN_TOKENS.typography.caption.fontSize,
              color: Colors.light.textSecondary,
              flex: 1,
              lineHeight: 18,
            }}>
              Cash payments are collected in person. Please ensure you have the exact amount ready when the service is completed.
            </Text>
          </HStack>
        </View>
      </VStack>
    );
  }

  function CreditCardPreview() {
    const cardType = cardValidation.cardType;
    
    // Couleurs par type de carte
    const cardColors: Record<string, [string, string]> = {
      visa: ['#1e3c72', '#2a5298'],
      mastercard: ['#eb4d4b', '#6c5ce7'],
      amex: ['#2d3436', '#636e72'],
      discover: ['#ff7675', '#fd79a8'],
      unknown: ['#74b9ff', '#0984e3']
    };
    
    // Logos/noms par type
    const cardNames = {
      visa: 'VISA',
      mastercard: 'Mastercard',
      amex: 'AMEX',
      discover: 'Discover',
      unknown: 'CARD'
    };
    
    // Icons by card type
    const cardIcons = {
      visa: 'card',
      mastercard: 'card',
      amex: 'card',
      discover: 'card',
      unknown: 'card'
    };
    
    return (
      <>
      <View style={{
        height: 200,
        borderRadius: 16,
        overflow: 'hidden',
        marginVertical: DESIGN_TOKENS.spacing.md,
        shadowColor: cardValidation.number.isValid && state.newCard.number.length > 0
          ? '#00b894' 
          : cardValidation.number.message !== 'Number required' && !cardValidation.number.isValid
            ? '#e74c3c'
            : '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: cardValidation.number.isValid && state.newCard.number.length > 0
          ? 0.4
          : cardValidation.number.message !== 'Number required' && !cardValidation.number.isValid
            ? 0.3
            : 0.15,
        shadowRadius: 12,
        elevation: 8,
      }}>
        <LinearGradient
          colors={cardColors[cardType]}
          style={{
            flex: 1,
            padding: 20,
            justifyContent: 'space-between',
          }}
        >
          {/* Card Top */}
          <HStack justify="space-between" align="center">
            <Text style={{
              color: 'white',
              fontSize: 16,
              fontWeight: '600',
              opacity: 0.9,
            }}>
              {cardNames[cardType as keyof typeof cardNames]}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {state.newCard.number.length > 0 && (
                <Ionicons 
                  name={cardValidation.number.isValid ? "checkmark-circle" : "close-circle"} 
                  size={20} 
                  color={cardValidation.number.isValid ? "#00b894" : "#e74c3c"} 
                  style={{ marginRight: 8 }} 
                />
              )}
              <Ionicons name="card" size={20} color="white" style={{ opacity: 0.7 }} />
            </View>
          </HStack>

          {/* Card Number */}
          <Text style={{
            color: 'white',
            fontSize: 22,
            fontWeight: '600',
            letterSpacing: 2,
          }}>
            {formatCardNumber(state.newCard.number) || '•••• •••• •••• ••••'}
          </Text>

          {/* Card Bottom */}
          <HStack justify="space-between">
            <VStack>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10 }}>CARDHOLDER</Text>
              <Text style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>
                {state.newCard.name || 'YOUR NAME'}
              </Text>
            </VStack>
            <VStack>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10 }}>EXPIRES</Text>
              <Text style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>
                {state.newCard.expiry || 'MM/YY'}
              </Text>
            </VStack>
          </HStack>
        </LinearGradient>
      </View>
      
      {/* Modern validation bubble with animation */}
      {state.newCard.number.length > 0 && (
        <Animated.View style={{
          alignSelf: 'center',
          marginTop: 12,
          paddingHorizontal: 16,
          paddingVertical: 8,
          backgroundColor: cardValidation.number.isValid ? '#00b894' : '#e74c3c',
          borderRadius: 20,
          shadowColor: cardValidation.number.isValid ? '#00b894' : '#e74c3c',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 5,
          transform: [{ scale: 1 }],
          opacity: 1,
        }}>
          <Text style={{
            color: 'white',
            fontSize: 13,
            fontWeight: '600',
            textAlign: 'center',
          }}>
            {cardValidation.number.isValid ? 
              `✓ ${cardNames[cardType as keyof typeof cardNames]} Valide` : 
              `${cardValidation.number.message}`
            }
          </Text>
        </Animated.View>
      )}
    </>
    );
  }

  function SavedCardItem({ card }: { card: SavedCard }) {
    if (!card || !card.cardNumber || !card.cardHolderName || !card.expiryDate) {
      return null;
    }

    return (
      <Pressable
        onPress={() => {
          // If the card is already selected, deselect it
          if (state.selectedCard?.id === card.id) {
            updateState({ 
              selectedCard: null,
              newCard: { number: '', expiry: '', cvv: '', name: '' }
            });
          } else {
            // Otherwise select it and prefill the fields
            updateState({ 
              selectedCard: card,
              newCard: {
                number: card.cardNumber.replace(/\s/g, ''),
                expiry: card.expiryDate,
                cvv: '',  // Never prefill CVV for security reasons
                name: card.cardHolderName
              }
            });
          }
        }}
        style={({ pressed }) => ({
          backgroundColor: state.selectedCard?.id === card.id 
            ? Colors.light.primary + '10' 
            : pressed 
            ? Colors.light.backgroundSecondary 
            : 'white',
          padding: DESIGN_TOKENS.spacing.lg,
          borderRadius: DESIGN_TOKENS.radius.lg,
          borderWidth: 2,
          borderColor: state.selectedCard?.id === card.id ? Colors.light.primary : Colors.light.border,
        })}
      >
        <HStack gap="md" align="center">
          <View style={{
            backgroundColor: (card.cardType || getCardType(card.cardNumber)) === 'visa' ? '#1e3c72' : '#ff6b6b',
            padding: DESIGN_TOKENS.spacing.sm,
            borderRadius: DESIGN_TOKENS.radius.sm,
          }}>
            <Ionicons name="card" size={20} color="white" />
          </View>
          <VStack gap="xs" style={{ flex: 1 }}>
            <Text style={{ fontWeight: '600' }}>
              {(card.cardType || getCardType(card.cardNumber || '')).toUpperCase()} ••{card.cardNumber?.slice(-4) || '****'}
            </Text>
            <Text style={{ 
              fontSize: DESIGN_TOKENS.typography.caption.fontSize,
              color: Colors.light.textSecondary,
            }}>
              {card.cardHolderName} • Expires {card.expiryDate}
            </Text>
          </VStack>
          {state.selectedCard?.id === card.id ? (
            <VStack align="center" gap="xs">
              <Ionicons name="checkmark-circle" size={24} color={Colors.light.primary} />
              <Text style={{ 
                fontSize: 10, 
                color: Colors.light.textSecondary,
                textAlign: 'center' 
              }}>
                Tap to deselect
              </Text>
            </VStack>
          ) : (
            <Ionicons name="radio-button-off" size={24} color={Colors.light.border} />
          )}
        </HStack>
      </Pressable>
    );
  }

  function ProcessingView() {
    return (
      <VStack gap="lg" align="center" style={{ paddingVertical: DESIGN_TOKENS.spacing.xl }}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
        <VStack gap="sm" align="center">
          <Text style={{
            fontSize: DESIGN_TOKENS.typography.title.fontSize,
            fontWeight: '600',
            color: Colors.light.text,
          }}>
            Processing Payment...
          </Text>
          <Text style={{
            fontSize: DESIGN_TOKENS.typography.body.fontSize,
            color: Colors.light.textSecondary,
            textAlign: 'center',
          }}>
            Please don't close this window while we process your payment.
          </Text>
        </VStack>
      </VStack>
    );
  }

  function SuccessView() {
    return (
      <VStack gap="lg" align="center" style={{ paddingVertical: DESIGN_TOKENS.spacing.xl }}>
        <View style={{
          backgroundColor: Colors.light.success + '20',
          padding: DESIGN_TOKENS.spacing.lg,
          borderRadius: 50,
        }}>
          <Ionicons name="checkmark" size={48} color={Colors.light.success} />
        </View>
        
        <VStack gap="sm" align="center">
          <Text style={{
            fontSize: DESIGN_TOKENS.typography.title.fontSize,
            fontWeight: '700',
            color: Colors.light.text,
          }}>
            Payment Successful!
          </Text>
          <Text style={{
            fontSize: DESIGN_TOKENS.typography.body.fontSize,
            color: Colors.light.textSecondary,
            textAlign: 'center',
          }}>
            Your payment has been processed successfully. You will receive a confirmation email shortly.
          </Text>
        </VStack>
      </VStack>
    );
  }
};

export default PaymentWindow;