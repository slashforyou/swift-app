import { useCallback } from "react";
import { Alert } from "react-native";
import { useTranslation } from "../localization";
import { useStripeConnection } from "./useStripeConnection";

/**
 * useStripeGate — Hard gate for payment actions.
 * Blocks sendInvoice / markAsPaid / chargeClient when Stripe is not active.
 * Shows a native Alert with CTA to setup payments.
 */
export function useStripeGate(navigation?: { navigate: (screen: string, params?: any) => void }) {
  const { status: stripeStatus, loading: stripeLoading } = useStripeConnection();
  const { t } = useTranslation();

  const isStripeReady = stripeStatus === "active";

  const guardStripeAction = useCallback(
    async <T>(action: () => Promise<T>): Promise<T | null> => {
      if (stripeLoading) return null;

      if (!isStripeReady) {
        Alert.alert(
          t("stripeGate.title") || "You're 1 step away from getting paid",
          t("stripeGate.message") || "Setup payments to send invoices and receive payments. It only takes 2 minutes.",
          [
            { text: t("common.cancel") || "Cancel", style: "cancel" },
            {
              text: t("stripeGate.cta") || "Setup payments (2 min)",
              onPress: () => {
                navigation?.navigate("Business", { initialTab: "JobsBilling" });
              },
            },
          ],
        );
        return null;
      }

      return action();
    },
    [isStripeReady, stripeLoading, navigation, t],
  );

  return { isStripeReady, stripeLoading, guardStripeAction };
}
