/**
 * Hook pour générer et envoyer des factures après paiement
 *
 * Ce hook encapsule la logique de génération de facture basée sur
 * le PricingService et l'envoi via l'API Stripe.
 */

import { useCallback } from "react";
import { Alert } from "react-native";
import { useJobTimerContext } from "../context/JobTimerProvider";
import { createStripeInvoice } from "../services/StripeService";
import type { Invoice } from "../services/pricing/PricingConfig";
import { PricingService } from "../services/pricing/PricingService";

export interface SendInvoiceOptions {
  job: any;
  sendByEmail?: boolean;
  onSuccess?: (invoice: Invoice) => void;
  onError?: (error: Error) => void;
}

export const useInvoice = () => {
  const { calculateCost, billableTime } = useJobTimerContext();

  /**
   * Génère les données de facture à partir d'un job
   */
  const generateInvoiceData = useCallback(
    (job: any): Invoice => {
      // Calculer le coût basé sur le temps facturable
      const costData = calculateCost(billableTime);

      // Générer la facture complète (la config de pricing est déjà dans costData)
      const invoice = PricingService.generateInvoice(
        job,
        costData,
        [], // additionalItems - peut être étendu plus tard
        0, // taxRate - GST/VAT peut être ajouté plus tard
      );

      return invoice;
    },
    [calculateCost, billableTime],
  );

  /**
   * Envoie une facture par email via Stripe
   */
  const sendInvoice = useCallback(
    async (options: SendInvoiceOptions) => {
      const { job, sendByEmail = true, onSuccess, onError } = options;

      try {
        // 1. Générer les données de facture
        const invoice = generateInvoiceData(job);

        if (!invoice.clientEmail) {
          throw new Error(
            "Email du client non trouvé. Impossible d'envoyer la facture.",
          );
        }

        // 2. Préparer les données pour l'API Stripe
        const lineItems = [
          {
            description: `Service - Job ${invoice.jobCode || invoice.jobId}`,
            quantity: 1,
            unit_amount: Math.round(invoice.total * 100), // Convertir en centimes
            currency: invoice.pricing.currency.toLowerCase(),
          },
        ];

        // Ajouter les détails dans la description
        const description = [
          `Job: ${job?.title || invoice.jobCode}`,
          `Heures facturables: ${invoice.pricing.billableHours.toFixed(2)}h`,
          invoice.pricing.travelCost > 0
            ? `Frais de déplacement: ${PricingService.formatCurrency(invoice.pricing.travelCost, invoice.pricing.currency)}`
            : null,
          invoice.pricing.callOutFee > 0
            ? `Frais de déplacement: ${PricingService.formatCurrency(invoice.pricing.callOutFee, invoice.pricing.currency)}`
            : null,
        ]
          .filter(Boolean)
          .join(" | ");

        // 3. Créer la facture Stripe
        const stripeInvoice = await createStripeInvoice({
          customer_email: invoice.clientEmail,
          customer_name: invoice.clientName,
          description,
          line_items: lineItems,
          metadata: {
            job_id: invoice.jobId,
            job_code: invoice.jobCode,
            payment_method: invoice.paymentMethod || "card",
          },
          collection_method: sendByEmail
            ? "send_invoice"
            : "charge_automatically",
          auto_advance: sendByEmail, // Auto-finaliser si envoi par email
        });

        console.log(
          "✅ [INVOICE] Facture créée et envoyée:",
          stripeInvoice.invoice_id,
        );

        // 4. Callback de succès
        if (onSuccess) {
          onSuccess({
            ...invoice,
            invoiceNumber: stripeInvoice.invoice_number,
          });
        }

        return stripeInvoice;
      } catch (error) {
        console.error("❌ [INVOICE] Erreur lors de l'envoi:", error);

        if (onError) {
          onError(error as Error);
        }

        throw error;
      }
    },
    [generateInvoiceData],
  );

  /**
   * Affiche un dialogue de confirmation avant d'envoyer la facture
   */
  const sendInvoiceWithConfirmation = useCallback(
    async (job: any, t: (key: string) => string) => {
      return new Promise<void>((resolve, reject) => {
        Alert.alert(
          t("payment.window.sendInvoiceConfirmTitle"),
          t("payment.window.sendInvoiceConfirmMessage"),
          [
            {
              text: t("payment.window.cancel"),
              style: "cancel",
              onPress: () => resolve(),
            },
            {
              text: t("payment.window.send"),
              onPress: async () => {
                try {
                  await sendInvoice({
                    job,
                    sendByEmail: true,
                    onSuccess: () => {
                      Alert.alert("✅", t("payment.window.invoiceSent"));
                      resolve();
                    },
                    onError: (error) => {
                      Alert.alert(
                        "Erreur",
                        `Impossible d'envoyer la facture: ${error.message}`,
                      );
                      reject(error);
                    },
                  });
                } catch (error) {
                  Alert.alert(
                    "Erreur",
                    `Impossible d'envoyer la facture: ${(error as Error).message}`,
                  );
                  reject(error);
                }
              },
            },
          ],
        );
      });
    },
    [sendInvoice],
  );

  return {
    generateInvoiceData,
    sendInvoice,
    sendInvoiceWithConfirmation,
  };
};
