/**
 * StripeAccountStatus - Affichage du statut du compte Stripe
 */

import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeProvider_Advanced';
import { Button, Card } from '../../design-system/components';
import { DESIGN_TOKENS } from '../../design-system/tokens';
import { formatDate, useLocalization } from '../../localization';
import type { StripeAccount, StripeRequirement } from '../../types/stripe';

interface StripeAccountStatusProps {
  account: StripeAccount;
  requirements?: StripeRequirement[];
  onRefresh?: () => void;
  onCompleteOnboarding?: () => void;
}

const StripeAccountStatus: React.FC<StripeAccountStatusProps> = ({
  account,
  requirements = [],
  onRefresh,
  onCompleteOnboarding,
}) => {
  const { colors } = useTheme();
  const { currentLanguage } = useLocalization();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete':
        return colors.success;
      case 'pending':
        return colors.warning;
      case 'restricted':
      case 'rejected':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'complete':
        return 'Compte vérifié';
      case 'pending':
        return 'Vérification en cours';
      case 'restricted':
        return 'Compte restreint';
      case 'rejected':
        return 'Compte rejeté';
      default:
        return 'Statut inconnu';
    }
  };

  const hasRequirements = requirements.length > 0;

  return (
    <Card style={{ padding: DESIGN_TOKENS.spacing.lg }}>
      <View style={{ marginBottom: DESIGN_TOKENS.spacing.lg }}>
        <Text style={{
          fontSize: DESIGN_TOKENS.typography.fontSize.lg,
          fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold,
          color: colors.text,
          marginBottom: DESIGN_TOKENS.spacing.sm,
        }}>
          Statut du compte Stripe
        </Text>
        
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <View>
            <Text style={{
              fontSize: DESIGN_TOKENS.typography.fontSize.md,
              color: getStatusColor(account.verification_status || 'pending'),
              fontWeight: DESIGN_TOKENS.typography.fontWeight.medium,
            }}>
              {getStatusText(account.verification_status || 'pending')}
            </Text>
            {account.business_type && (
              <Text style={{
                fontSize: DESIGN_TOKENS.typography.fontSize.sm,
                color: colors.textSecondary,
                marginTop: DESIGN_TOKENS.spacing.xs,
              }}>
                Type: {account.business_type}
              </Text>
            )}
          </View>
          
          {onRefresh && (
            <Button
              title="Actualiser"
              variant="outline"
              size="sm"
              onPress={onRefresh}
            />
          )}
        </View>
      </View>

      {hasRequirements && (
        <View style={{
          marginBottom: DESIGN_TOKENS.spacing.lg,
          padding: DESIGN_TOKENS.spacing.md,
          backgroundColor: colors.warningLight,
          borderRadius: DESIGN_TOKENS.radius.md,
        }}>
          <Text style={{
            fontSize: DESIGN_TOKENS.typography.fontSize.md,
            fontWeight: DESIGN_TOKENS.typography.fontWeight.medium,
            color: colors.warning,
            marginBottom: DESIGN_TOKENS.spacing.sm,
          }}>
            Actions requises ({requirements.length})
          </Text>
          
          {requirements.slice(0, 3).map((req, index) => (
            <Text
              key={req.description || `req-${index}`}
              style={{
                fontSize: DESIGN_TOKENS.typography.fontSize.sm,
                color: colors.text,
                marginBottom: DESIGN_TOKENS.spacing.xs,
              }}
            >
              • {req.description}
            </Text>
          ))}
          
          {requirements.length > 3 && (
            <Text style={{
              fontSize: DESIGN_TOKENS.typography.fontSize.sm,
              color: colors.textSecondary,
              fontStyle: 'italic',
            }}>
              +{requirements.length - 3} autres actions...
            </Text>
          )}
        </View>
      )}

      {(hasRequirements || account.verification_status !== 'complete') && onCompleteOnboarding && (
        <Button
          title={hasRequirements ? "Compléter les informations" : "Finaliser la vérification"}
          variant="primary"
          onPress={onCompleteOnboarding}
        />
      )}

      <View style={{
        marginTop: DESIGN_TOKENS.spacing.lg,
        paddingTop: DESIGN_TOKENS.spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.border,
      }}>
        <Text style={{
          fontSize: DESIGN_TOKENS.typography.fontSize.sm,
          color: colors.textSecondary,
          textAlign: 'center',
        }}>
          ID du compte: {account.id}
        </Text>
        {account.created && (
          <Text style={{
            fontSize: DESIGN_TOKENS.typography.fontSize.sm,
            color: colors.textSecondary,
            textAlign: 'center',
            marginTop: DESIGN_TOKENS.spacing.xs,
          }}>
            Créé le: {formatDate(new Date(account.created * 1000), currentLanguage)}
          </Text>
        )}
      </View>
    </Card>
  );
};

export default StripeAccountStatus;