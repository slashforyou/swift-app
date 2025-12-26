/**
 * AnimatedInstantPayoutModal - Modal pour paiement instantané
 */

import React, { useState } from 'react';
import { Alert, Modal, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeProvider_Advanced';
import { Button, Card, Input } from '../../design-system/components';
import { DESIGN_TOKENS } from '../../design-system/tokens';
import type { PayoutRequest } from '../../types/payouts';

interface AnimatedInstantPayoutModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (request: PayoutRequest) => Promise<void>;
  maxAmount: number;
  currency: string;
  loading?: boolean;
}

const AnimatedInstantPayoutModal: React.FC<AnimatedInstantPayoutModalProps> = ({
  visible,
  onClose,
  onConfirm,
  maxAmount,
  currency,
  loading = false,
}) => {
  const { colors } = useTheme();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleConfirm = async () => {
    const amountValue = parseFloat(amount);
    
    if (!amountValue || amountValue <= 0) {
      Alert.alert('Erreur', 'Veuillez saisir un montant valide');
      return;
    }

    if (amountValue > maxAmount / 100) {
      Alert.alert('Erreur', `Le montant ne peut pas dépasser ${(maxAmount / 100).toLocaleString('fr-FR', { style: 'currency', currency })}`);
      return;
    }

    try {
      setProcessing(true);
      await onConfirm({
        amount: Math.round(amountValue * 100), // Convert to cents
        currency: currency.toLowerCase(),
        method: 'instant',
        description: description || undefined,
      });
      setAmount('');
      setDescription('');
      onClose();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de traiter le paiement instantané');
    } finally {
      setProcessing(false);
    }
  };

  const formatMaxAmount = () => {
    return (maxAmount / 100).toLocaleString('fr-FR', {
      style: 'currency',
      currency: currency.toUpperCase(),
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: DESIGN_TOKENS.spacing.lg,
      }}>
        <Card padding="lg" style={{
          width: '100%',
          maxWidth: 400,
          backgroundColor: colors.background,
        }}>
          <Text style={{
            fontSize: DESIGN_TOKENS.typography.fontSize.xl,
            fontWeight: DESIGN_TOKENS.typography.fontWeight.bold,
            color: colors.text,
            textAlign: 'center',
            marginBottom: DESIGN_TOKENS.spacing.lg,
          }}>
            Paiement instantané
          </Text>

          <Text style={{
            fontSize: DESIGN_TOKENS.typography.fontSize.sm,
            color: colors.textSecondary,
            textAlign: 'center',
            marginBottom: DESIGN_TOKENS.spacing.lg,
          }}>
            Montant maximum disponible: {formatMaxAmount()}
          </Text>

          <Input
            label="Montant à transférer"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholder="0.00"
            style={{ marginBottom: DESIGN_TOKENS.spacing.md }}
          />

          <Input
            label="Description (optionnel)"
            value={description}
            onChangeText={setDescription}
            placeholder="Motif du virement"
            multiline
            numberOfLines={2}
            style={{ marginBottom: DESIGN_TOKENS.spacing.lg }}
          />

          <View style={{
            backgroundColor: colors.warningLight,
            padding: DESIGN_TOKENS.spacing.md,
            borderRadius: DESIGN_TOKENS.radius.md,
            marginBottom: DESIGN_TOKENS.spacing.lg,
          }}>
            <Text style={{
              fontSize: DESIGN_TOKENS.typography.fontSize.sm,
              color: colors.warning,
              textAlign: 'center',
              fontWeight: DESIGN_TOKENS.typography.fontWeight.medium,
            }}>
              ⚡ Les frais de paiement instantané s'appliquent
            </Text>
            <Text style={{
              fontSize: DESIGN_TOKENS.typography.fontSize.xs,
              color: colors.textSecondary,
              textAlign: 'center',
              marginTop: DESIGN_TOKENS.spacing.xs,
            }}>
              Frais: 1% du montant (min. 0.25€)
            </Text>
          </View>

          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            gap: DESIGN_TOKENS.spacing.md,
          }}>
            <Button
              title="Annuler"
              variant="secondary"
              onPress={onClose}
              disabled={processing}
              style={{ flex: 1 }}
            />
            <Button
              title={processing ? 'Traitement...' : 'Confirmer'}
              variant="primary"
              onPress={handleConfirm}
              disabled={processing || loading || !amount}
              style={{ flex: 1 }}
            />
          </View>
        </Card>
      </View>
    </Modal>
  );
};

export default AnimatedInstantPayoutModal;