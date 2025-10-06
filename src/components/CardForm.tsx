/**
 * CardForm - Solution ultime avec TextInput non contrôlés
 * Évite complètement les re-renders pour résoudre le problème de focus
 */

import React, { useRef, useCallback, useEffect } from 'react';
import { View, Text, TextInput } from 'react-native';
import { Colors } from '../constants/Colors';

interface CardFormProps {
  initialCard: { number: string; expiry: string; cvv: string; name: string };
  onCardChange: (card: { number: string; expiry: string; cvv: string; name: string }) => void;
  onValidationChange?: (validation: {
    cardType: string;
    isNumberValid: boolean;
    isExpiryValid: boolean;
    isCvvValid: boolean;
    numberMessage: string;
  }) => void;
}

const CardForm: React.FC<CardFormProps> = ({ initialCard, onCardChange, onValidationChange }) => {
  // Refs pour les TextInput
  const cardNumberRef = useRef<TextInput>(null);
  const expiryRef = useRef<TextInput>(null);
  const cvvRef = useRef<TextInput>(null);
  const nameRef = useRef<TextInput>(null);

  // Valeurs actuelles dans des refs (pas de state)
  const currentValues = useRef({
    number: initialCard.number || '',
    expiry: initialCard.expiry || '',
    cvv: initialCard.cvv || '',
    name: initialCard.name || ''
  });



  // Synchroniser avec initialCard quand il change (carte sélectionnée)
  useEffect(() => {
    const formatted = {
      number: formatCardNumber(initialCard.number || ''),
      expiry: formatExpiry(initialCard.expiry || ''),
      cvv: initialCard.cvv || '',
      name: initialCard.name || ''
    };

    // Mettre à jour les refs
    currentValues.current = {
      number: initialCard.number || '',
      expiry: initialCard.expiry || '',
      cvv: initialCard.cvv || '',
      name: initialCard.name || ''
    };

    // Mettre à jour les TextInput visuellement
    if (cardNumberRef.current) {
      cardNumberRef.current.setNativeProps({ text: formatted.number });
    }
    if (expiryRef.current) {
      expiryRef.current.setNativeProps({ text: formatted.expiry });
    }
    if (cvvRef.current) {
      cvvRef.current.setNativeProps({ text: formatted.cvv });
    }
    if (nameRef.current) {
      nameRef.current.setNativeProps({ text: formatted.name });
    }
  }, [initialCard]);

  // Fonction pour formater le numéro de carte
  const formatCardNumber = (text: string): string => {
    const cleaned = text.replace(/\s/g, '');
    const match = cleaned.match(/\d{1,4}/g);
    return match ? match.join(' ').substr(0, 19) : '';
  };

  // Fonction pour formater la date d'expiration
  const formatExpiry = (text: string): string => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.substr(0, 2) + (cleaned.length > 2 ? '/' + cleaned.substr(2, 2) : '');
    }
    return cleaned;
  };

  // Fonctions de validation locales (pas de setState)
  const getCardType = (number: string): string => {
    const cleanNumber = number.replace(/\s/g, '');
    if (/^4/.test(cleanNumber)) return 'visa';
    if (/^5[1-5]/.test(cleanNumber)) return 'mastercard';
    if (/^3[47]/.test(cleanNumber)) return 'amex';
    if (/^6/.test(cleanNumber)) return 'discover';
    return 'unknown';
  };

  const validateCardNumber = (number: string): { isValid: boolean; message: string } => {
    const cleanNumber = number.replace(/\s/g, '');
    if (cleanNumber.length === 0) return { isValid: false, message: 'Numéro requis' };
    if (cleanNumber.length < 13) return { isValid: false, message: 'Numéro trop court' };
    if (cleanNumber.length > 19) return { isValid: false, message: 'Numéro trop long' };
    return { isValid: true, message: 'Valide' };
  };

  const validateExpiry = (expiry: string): boolean => {
    const cleanExpiry = expiry.replace(/\D/g, '');
    if (cleanExpiry.length !== 4) return false;
    const month = parseInt(cleanExpiry.slice(0, 2), 10);
    const year = parseInt('20' + cleanExpiry.slice(2), 10);
    if (month < 1 || month > 12) return false;
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    return !(year < currentYear || (year === currentYear && month < currentMonth));
  };

  const validateCvv = (cvv: string, cardType: string): boolean => {
    const expectedLength = cardType === 'amex' ? 4 : 3;
    return cvv.length === expectedLength;
  };

  // Notifier le parent des changements
  const notifyParent = useCallback(() => {
    onCardChange({
      number: currentValues.current.number,
      expiry: currentValues.current.expiry,
      cvv: currentValues.current.cvv,
      name: currentValues.current.name
    });
  }, [onCardChange]);

  // Validation locale sans état
  const checkValidationAndNotify = useCallback(() => {
    const cardType = getCardType(currentValues.current.number);
    const numberValidation = validateCardNumber(currentValues.current.number);
    const isExpiryValid = validateExpiry(currentValues.current.expiry);
    const isCvvValid = validateCvv(currentValues.current.cvv, cardType);

    // Notifier la validation seulement si le callback existe
    if (onValidationChange) {
      onValidationChange({
        cardType,
        isNumberValid: numberValidation.isValid,
        isExpiryValid,
        isCvvValid,
        numberMessage: numberValidation.message,
      });
    }
  }, [onValidationChange]);



  // Handlers sans state - utilisent directement les refs
  const handleCardNumberChange = useCallback((text: string) => {
    const cleanText = text.replace(/\s/g, '');
    currentValues.current.number = cleanText;
    
    // Formater et afficher dans le champ
    const formatted = formatCardNumber(cleanText);
    if (cardNumberRef.current) {
      cardNumberRef.current.setNativeProps({ text: formatted });
    }
    
    // PAS de notification pendant la frappe !
  }, []);

  // Handlers onBlur pour notifier seulement à la fin
  const handleCardNumberBlur = useCallback(() => {
    notifyParent();
    checkValidationAndNotify();
  }, [notifyParent, checkValidationAndNotify]);

  const handleExpiryChange = useCallback((text: string) => {
    const cleanText = text.replace(/\D/g, '');
    currentValues.current.expiry = cleanText;
    
    // Formater et afficher
    const formatted = formatExpiry(cleanText);
    if (expiryRef.current) {
      expiryRef.current.setNativeProps({ text: formatted });
    }
  }, []);

  const handleCvvChange = useCallback((text: string) => {
    const cleanText = text.replace(/\D/g, '');
    currentValues.current.cvv = cleanText;
  }, []);

  const handleNameChange = useCallback((text: string) => {
    currentValues.current.name = text;
  }, []);

  // Handlers onBlur unifiés
  const handleFieldBlur = useCallback(() => {
    notifyParent();
    checkValidationAndNotify();
  }, [notifyParent, checkValidationAndNotify]);

  return (
    <View style={{ gap: 16, padding: 16, backgroundColor: 'white', borderRadius: 8 }}>
      {/* Numéro de carte */}
      <View>
        <Text style={{ fontSize: 12, color: Colors.light.textSecondary, marginBottom: 8 }}>
          Numéro de carte
        </Text>
        <TextInput
          ref={cardNumberRef}
          style={{
            backgroundColor: '#f8f9fa',
            borderWidth: 1,
            borderColor: Colors.light.border,
            borderRadius: 8,
            padding: 12,
            fontSize: 16,
          }}
          placeholder="1234 5678 9012 3456"
          keyboardType="numeric"
          maxLength={19}
          defaultValue={formatCardNumber(initialCard.number)}
          onChangeText={handleCardNumberChange}
          onBlur={handleCardNumberBlur}
          autoCorrect={false}
          autoComplete="off"
        />
      </View>

      {/* Date d'expiration et CVV */}
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 12, color: Colors.light.textSecondary, marginBottom: 8 }}>
            Expiration
          </Text>
          <TextInput
            ref={expiryRef}
            style={{
              backgroundColor: '#f8f9fa',
              borderWidth: 1,
              borderColor: Colors.light.border,
              borderRadius: 8,
              padding: 12,
              fontSize: 16,
            }}
            placeholder="MM/YY"
            keyboardType="numeric"
            maxLength={5}
            defaultValue={formatExpiry(initialCard.expiry)}
            onChangeText={handleExpiryChange}
            onBlur={handleFieldBlur}
            autoCorrect={false}
            autoComplete="off"
          />
        </View>
        
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 12, color: Colors.light.textSecondary, marginBottom: 8 }}>
            CVV
          </Text>
          <TextInput
            ref={cvvRef}
            style={{
              backgroundColor: '#f8f9fa',
              borderWidth: 1,
              borderColor: Colors.light.border,
              borderRadius: 8,
              padding: 12,
              fontSize: 16,
            }}
            placeholder="123"
            keyboardType="numeric"
            maxLength={4}
            secureTextEntry={true}
            defaultValue={initialCard.cvv}
            onChangeText={handleCvvChange}
            onBlur={handleFieldBlur}
            autoCorrect={false}
            autoComplete="off"
          />
        </View>
      </View>

      {/* Nom du porteur */}
      <View>
        <Text style={{ fontSize: 12, color: Colors.light.textSecondary, marginBottom: 8 }}>
          Nom du porteur
        </Text>
        <TextInput
          ref={nameRef}
          style={{
            backgroundColor: '#f8f9fa',
            borderWidth: 1,
            borderColor: Colors.light.border,
            borderRadius: 8,
            padding: 12,
            fontSize: 16,
          }}
          placeholder="Jean Dupont"
          autoCapitalize="words"
          defaultValue={initialCard.name}
          onChangeText={handleNameChange}
          onBlur={handleFieldBlur}
          autoCorrect={false}
          autoComplete="off"
        />
      </View>
    </View>
  );
};

export default CardForm;