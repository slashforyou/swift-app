/**
 * PaymentsDashboard - Dashboard principal pour la gestion des paiements
 * Interface modernisée avec métriques, graphiques et actions rapides
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, TouchableOpacity, View } from 'react-native';

// Design System
import { useTheme } from '../../../context/ThemeProvider';
import {
    Body,
    BodyLarge,
    BodySmall,
    Button,
    Card,
    Heading3,
    useDesignSystem
} from '../../../design-system/components';

// Hooks business
import { useStripePayments } from '../../../hooks/useStripe';

interface PaymentsDashboardProps {
  onRefresh?: () => void;
  refreshing?: boolean;
}

/**
 * Composant principal du dashboard paiements
 */
export const PaymentsDashboard: React.FC<PaymentsDashboardProps> = ({
  onRefresh,
  refreshing = false
}) => {
  const { colors } = useTheme();
  const { tokens } = useDesignSystem();
  
  // États locaux
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  
  // Hook paiements
  const {
    payments: recentPayments,
    loading,
    error,
    refresh: refreshData
  } = useStripePayments();

  // Mock temporaire pour balance et paymentStats
  const balance = { available: 0, pending: 0, currency: 'EUR' };
  const paymentStats = { total: 0, successful: 0, pending: 0 };

  const handleRefresh = useCallback(async () => {
    await refreshData();
    onRefresh?.();
  }, [refreshData, onRefresh]);

  if (loading && !balance) {
    return <PaymentsDashboardSkeleton />;
  }

  if (error) {
    return (
      <Card variant="elevated" style={{ margin: tokens.spacing.lg }}>
        <View style={{ 
          alignItems: 'center', 
          padding: tokens.spacing.xl 
        }}>
          <Ionicons 
            name="alert-circle-outline" 
            size={48} 
            color={colors.error} 
            style={{ marginBottom: tokens.spacing.md }}
          />
          <Body style={{ color: colors.error, textAlign: 'center' }}>
            Erreur lors du chargement du dashboard
          </Body>
          <Button
            title="Réessayer"
            variant="primary"
            onPress={handleRefresh}
            style={{ marginTop: tokens.spacing.lg }}
          />
        </View>
      </Card>
    );
  }

  return (
    <ScrollView
      refreshControl={
        <RefreshControl
          refreshing={refreshing || loading}
          onRefresh={handleRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Balance Card */}
      <BalanceCard 
        balance={balance}
        loading={loading}
      />

      {/* Quick Actions */}
      <QuickActionsCard />

      {/* Stats Overview */}
      <StatsOverviewCard 
        stats={paymentStats}
        selectedPeriod={selectedPeriod}
        onPeriodChange={setSelectedPeriod}
      />

      {/* Recent Payments */}
      <RecentPaymentsCard 
        payments={recentPayments}
        loading={loading}
      />
    </ScrollView>
  );
};

/**
 * Carte du solde disponible
 */
const BalanceCard: React.FC<{ balance: any; loading: boolean }> = ({ balance, loading }) => {
  const { colors } = useTheme();
  const { tokens } = useDesignSystem();

  return (
    <Card variant="elevated" style={{ 
      margin: tokens.spacing.lg,
      backgroundColor: colors.primary 
    }}>
      <View style={{ padding: tokens.spacing.lg }}>
        <BodySmall style={{ color: colors.background, opacity: 0.8 }}>
          Solde disponible
        </BodySmall>
        <BodyLarge style={{ 
          color: colors.background,
          fontSize: 32,
          fontWeight: 'bold',
          marginVertical: tokens.spacing.sm
        }}>
          {loading ? '---' : `${balance?.available || '0'} €`}
        </BodyLarge>
        <View style={{ 
          flexDirection: 'row', 
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <BodySmall style={{ color: colors.background, opacity: 0.8 }}>
            En attente: {loading ? '---' : `${balance?.pending || '0'} €`}
          </BodySmall>
          <TouchableOpacity>
            <Ionicons name="eye-outline" size={20} color={colors.background} />
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );
};

/**
 * Actions rapides
 */
const QuickActionsCard: React.FC = () => {
  const { tokens } = useDesignSystem();

  const actions = [
    { icon: 'card-outline', label: 'Nouveau paiement', action: 'payment' },
    { icon: 'document-text-outline', label: 'Créer facture', action: 'invoice' },
    { icon: 'cash-outline', label: 'Demander virement', action: 'payout' },
    { icon: 'analytics-outline', label: 'Voir rapports', action: 'reports' }
  ];

  return (
    <Card style={{ margin: tokens.spacing.lg }}>
      <View style={{ padding: tokens.spacing.lg }}>
        <Heading3 style={{ marginBottom: tokens.spacing.md }}>
          Actions rapides
        </Heading3>
        <View style={{ 
          flexDirection: 'row', 
          justifyContent: 'space-between' 
        }}>
          {actions.map((action, index) => (
            <QuickActionButton 
              key={action.action || `action-${index}`}
              icon={action.icon}
              label={action.label}
              onPress={() => console.log(`Action: ${action.action}`)}
            />
          ))}
        </View>
      </View>
    </Card>
  );
};

/**
 * Bouton d'action rapide
 */
const QuickActionButton: React.FC<{
  icon: string;
  label: string;
  onPress: () => void;
}> = ({ icon, label, onPress }) => {
  const { colors } = useTheme();
  const { tokens } = useDesignSystem();

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        alignItems: 'center',
        padding: tokens.spacing.sm,
        borderRadius: tokens.radius.md,
        minWidth: 70
      }}
    >
      <View style={{
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.backgroundSecondary,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: tokens.spacing.xs
      }}>
        <Ionicons 
          name={icon as any} 
          size={24} 
          color={colors.primary} 
        />
      </View>
      <BodySmall style={{ 
        textAlign: 'center',
        color: colors.textSecondary,
        fontSize: 11
      }}>
        {label}
      </BodySmall>
    </TouchableOpacity>
  );
};

/**
 * Vue d'ensemble des statistiques
 */
const StatsOverviewCard: React.FC<{
  stats: any;
  selectedPeriod: string;
  onPeriodChange: (period: string) => void;
}> = ({ stats, selectedPeriod, onPeriodChange }) => {
  const { tokens } = useDesignSystem();

  return (
    <Card style={{ margin: tokens.spacing.lg }}>
      <View style={{ padding: tokens.spacing.lg }}>
        <Heading3 style={{ marginBottom: tokens.spacing.md }}>
          Statistiques
        </Heading3>
        {/* Contenu des stats à implémenter */}
        <Body>Statistiques détaillées à venir...</Body>
      </View>
    </Card>
  );
};

/**
 * Paiements récents
 */
const RecentPaymentsCard: React.FC<{
  payments: any[];
  loading: boolean;
}> = ({ payments, loading }) => {
  const { tokens } = useDesignSystem();

  return (
    <Card style={{ margin: tokens.spacing.lg }}>
      <View style={{ padding: tokens.spacing.lg }}>
        <Heading3 style={{ marginBottom: tokens.spacing.md }}>
          Paiements récents
        </Heading3>
        {/* Liste des paiements à implémenter */}
        <Body>Liste des paiements récents à venir...</Body>
      </View>
    </Card>
  );
};

/**
 * Skeleton du dashboard
 */
export const PaymentsDashboardSkeleton: React.FC = () => {
  const { colors } = useTheme();
  const { tokens } = useDesignSystem();

  return (
    <View style={{ padding: tokens.spacing.lg }}>
      {Array.from({ length: 3 }).map((_, index) => (
        <View
          key={`skeleton-${index}`}
          style={{
            height: 120,
            backgroundColor: colors.backgroundSecondary,
            borderRadius: tokens.radius.md,
            marginBottom: tokens.spacing.md
          }}
        />
      ))}
    </View>
  );
};

export default PaymentsDashboard;