import React, { useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useTheme } from '../../context/ThemeProvider_Advanced';
import { Button } from '../../design-system/components';
import { DESIGN_TOKENS } from '../../design-system/tokens';
import { useLocalization } from '../../localization/useLocalization';

interface StripeOnboardingWebViewProps {
  url: string;
  onComplete: () => void;
  onError: (error: string) => void;
  onClose: () => void;
}

const StripeOnboardingWebView: React.FC<StripeOnboardingWebViewProps> = ({
  url,
  onComplete,
  onError,
  onClose,
}) => {
  const { colors } = useTheme();
  const { t } = useLocalization();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleNavigationStateChange = (navState: any) => {
    if (navState.url.includes('success') || navState.url.includes('complete')) {
      onComplete();
    } else if (navState.url.includes('error') || navState.url.includes('cancel')) {
      onError(t('payment.stripeOnboarding.onboardingInterrupted'));
    }
  };

  const handleLoadEnd = () => {
    setLoading(false);
  };

  const handleError = () => {
    setLoading(false);
    setError(t('payment.stripeOnboarding.loadError'));
  };

  if (error) {
    return (
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: DESIGN_TOKENS.spacing.xl,
        backgroundColor: colors.background,
      }}>
        <Text style={{
          fontSize: DESIGN_TOKENS.typography.fontSize.lg,
          color: colors.error,
          textAlign: 'center',
          marginBottom: DESIGN_TOKENS.spacing.lg,
        }}>
          {error}
        </Text>
        <Button
          title={t('payment.stripeOnboarding.retry')}
          variant="primary"
          onPress={() => {
            setError(null);
            setLoading(true);
          }}
        />
        <Button
          title={t('payment.stripeOnboarding.close')}
          variant="secondary"
          onPress={onClose}
          style={{ marginTop: DESIGN_TOKENS.spacing.md }}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {loading && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.background,
          zIndex: 1000,
        }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{
            marginTop: DESIGN_TOKENS.spacing.md,
            color: colors.textSecondary,
            textAlign: 'center',
          }}>
            {t('payment.stripeOnboarding.loading')}
          </Text>
        </View>
      )}
      
      <WebView
        source={{ uri: url }}
        onNavigationStateChange={handleNavigationStateChange}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        style={{ flex: 1 }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={false}
      />
    </View>
  );
};

export default StripeOnboardingWebView;