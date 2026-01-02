/**
 * AnimatedInstantPayoutModal - Modal pour paiement instantané
 */

import React, { useState } from 'react';
import { Alert, Modal, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeProvider_Advanced';
import { Button, Card, Input } from '../../design-system/components';
import { DESIGN_TOKENS } from '../../design-system/tokens';
import { useLocalization, formatCurrency } from '../../localization';
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
  const { t, currentLanguage } = useLocalization();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [processing, setProcessing] = useState(false);

  const formatMaxAmount = () => {
    return formatCurrency(maxAmount, currentLanguage, currency.toUpperCase());
  };

  const handleConfirm = async () => {
    const amountValue = parseFloat(amount);
    
    if (!amountValue || amountValue <= 0) {
      Alert.alert(
        t('stripe.payouts.instantModal.error'),
        t('stripe.payouts.instantModal.invalidAmount')
      );
      return;
    }

    if (amountValue > maxAmount / 100) {
      Alert.alert(
        t('stripe.payouts.instantModal.error'),
        t('stripe.payouts.instantModal.amountExceedsMax', { max: formatMaxAmount() })
      );
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
    } catch (_error) {
      Alert.alert(
        t('stripe.payouts.instantModal.error'),
        t('stripe.payouts.instantModal.processingError')
      );
    } finally {
      setProcessing(false);
    }
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
            {t('stripe.payouts.instantModal.title')}
          </Text>

          <Text style={{
            fontSize: DESIGN_TOKENS.typography.fontSize.sm,
            color: colors.textSecondary,
            textAlign: 'center',
            marginBottom: DESIGN_TOKENS.spacing.lg,
          }}>
            {t('stripe.payouts.instantModal.maxAvailable', { max: formatMaxAmount() })}
          </Text>

          <Input
            label={t('stripe.payouts.instantModal.amountLabel')}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholder={t('stripe.payouts.instantModal.amountPlaceholder')}
            style={{ marginBottom: DESIGN_TOKENS.spacing.md }}
          />

          <Input
            label={t('stripe.payouts.instantModal.descriptionLabel')}
            value={description}
            onChangeText={setDescription}
            placeholder={t('stripe.payouts.instantModal.descriptionPlaceholder')}
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
              {t('stripe.payouts.instantModal.feesWarning')}
            </Text>
            <Text style={{
              fontSize: DESIGN_TOKENS.typography.fontSize.xs,
              color: colors.textSecondary,
              textAlign: 'center',
              marginTop: DESIGN_TOKENS.spacing.xs,
            }}>
              {t('stripe.payouts.instantModal.feesDetails')}
            </Text>
          </View>

          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            gap: DESIGN_TOKENS.spacing.md,
          }}>
            <Button
              title={t('stripe.payouts.instantModal.cancel')}
              variant="secondary"
              onPress={onClose}
              disabled={processing}
              style={{ flex: 1 }}
            />
            <Button
              title={processing ? t('stripe.payouts.instantModal.processing') : t('stripe.payouts.instantModal.confirm')}
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