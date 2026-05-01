/**
 * Client Page - Format profil avec avatar, nom en avant et actions rapides
 * Conforme aux normes mobiles iOS/Android - Touch targets ≥44pt, 8pt grid
 */
import Ionicons from "@react-native-vector-icons/ionicons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AppState, Pressable, Text, View } from "react-native";
import SignatureSection from "../../components/jobDetails/sections/SignatureSection";
import { HStack, VStack } from "../../components/primitives/Stack";
import SigningBloc from "../../components/signingBloc";
import { Card } from "../../components/ui/Card";
import { DESIGN_TOKENS } from "../../constants/Styles";
import { useCommonThemedStyles } from "../../hooks/useCommonStyles";
import { useJobDetails } from "../../hooks/useJobDetails";
import { useLocalization } from "../../localization/useLocalization";
import { analytics } from "../../services/analytics";
import { ClientAPI, fetchClientById } from "../../services/clients";
import contactLink from "../../services/contactLink";
import { isLoggedIn } from "../../utils/auth";

interface JobClientProps {
  job: any;
  setJob: (job: any) => void;
}

// Avatar avec initiales
const ProfileAvatar: React.FC<{
  firstName?: string;
  lastName?: string;
  size?: number;
  colors: any;
}> = ({ firstName, lastName, size = 80, colors }) => {
  const initials =
    `${(firstName || "?")[0]}${(lastName || "")[0] || ""}`.toUpperCase();

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.tint,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          fontSize: size * 0.38,
          fontWeight: "700",
          color: "#FFFFFF",
          letterSpacing: 1,
        }}
      >
        {initials}
      </Text>
    </View>
  );
};

// Bouton d'action rapide (icône ronde)
const QuickActionButton: React.FC<{
  icon: string;
  label: string;
  onPress: () => void;
  colors: any;
}> = ({ icon, label, onPress, colors }) => (
  <Pressable
    onPress={onPress}
    hitSlop={DESIGN_TOKENS.touch.hitSlop}
    style={({ pressed }) => ({
      alignItems: "center",
      opacity: pressed ? 0.7 : 1,
    })}
    accessibilityRole="button"
    accessibilityLabel={label}
  >
    <View
      style={{
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.backgroundSecondary,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: DESIGN_TOKENS.spacing.xs,
      }}
    >
      <Ionicons name={icon as any} size={22} color={colors.tint} />
    </View>
    <Text
      style={{
        fontSize: 11,
        fontWeight: "500",
        color: colors.tint,
        textAlign: "center",
      }}
    >
      {label}
    </Text>
  </Pressable>
);

// Ligne d'info compacte pour les détails secondaires
const DetailRow: React.FC<{
  icon: string;
  value: string;
  colors: any;
}> = ({ icon, value, colors }) => (
  <HStack
    gap="sm"
    style={{
      alignItems: "center",
      paddingVertical: DESIGN_TOKENS.spacing.sm,
    }}
  >
    <Ionicons name={icon as any} size={18} color={colors.textSecondary} />
    <Text
      style={{
        fontSize: DESIGN_TOKENS.typography.body.fontSize,
        lineHeight: DESIGN_TOKENS.typography.body.lineHeight,
        color: colors.text,
        flex: 1,
      }}
    >
      {value}
    </Text>
  </HStack>
);

const JobClient: React.FC<JobClientProps> = ({ job, setJob }) => {
  const { colors } = useCommonThemedStyles();
  const { t } = useLocalization();
  const [extendedClientData, setExtendedClientData] =
    useState<ClientAPI | null>(null);
  const [isLoadingClient, setIsLoadingClient] = useState(false);
  const [isSigningVisible, setIsSigningVisible] = useState(false);
  const [lastContactAction, setLastContactAction] = useState<string | null>(null);

  // AppState listener — track return to app after call/sms/email
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active' && lastContactAction) {
        analytics.trackCustomEvent('app_returned_after_contact', 'user_action', { job_id: job?.id, action: lastContactAction });
        setLastContactAction(null);
      }
    });
    return () => subscription.remove();
  }, [lastContactAction, job?.id]);

  // ✅ Récupérer jobDetails du context pour avoir les données fraîches (notamment signature_blob)
  // NOTE: L'endpoint /job/:code/full attend un CODE (JOB-XXX), pas un ID numérique
  const jobCode = job?.code || job?.job?.code;
  const { jobDetails } = useJobDetails(jobCode);

  // ✅ SYNC: Synchroniser job state avec jobDetails.job (notamment signature_blob)
  useEffect(() => {
    if (jobDetails?.job) {
      //     hasSignatureInContext: !!jobDetails.job.signature_blob,
      //     hasSignatureInState: !!job?.signature_blob,
      //     signatureDate: jobDetails.job.signature_date
      // });

      // Merge pour garder modifications locales + ajouter données backend
      // ⚠️ L'API /full retourne le client dans jobDetails.client (sibling), PAS dans jobDetails.job
      // Si data.job.client est null, le spread écraserait job.client → les détails client disparaissent
      setJob((prev: any) => ({
        ...prev,
        ...jobDetails.job,
        // Préserver les données client embarquées (non retournées dans jobDetails.job)
        client: prev?.client,
        // Préserver certains champs locaux si nécessaire
        signatureDataUrl:
          prev?.signatureDataUrl || jobDetails.job.signature_blob,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    jobDetails?.job?.id,
    jobDetails?.job?.signature_blob,
    jobDetails?.job?.signature_date,
    setJob,
  ]);

  const handleSignContract = () => {
    setIsSigningVisible(true);
  };

  // Fonction pour charger les données client étendues depuis l'API
  const loadExtendedClientData = useCallback(async () => {
    if (!job?.client_id) {
      return;
    }

    try {
      setIsLoadingClient(true);
      const loggedIn = await isLoggedIn();

      if (loggedIn) {
        const result = await fetchClientById(job.client_id);
        setExtendedClientData(result);
      } else {
      }
    } catch (error: any) {
      // En cas d'erreur, on continue avec les données de base du job
    } finally {
      setIsLoadingClient(false);
    }
  }, [job?.client_id]);

  useEffect(() => {
    loadExtendedClientData();
  }, [loadExtendedClientData]);

  // ✅ FIX: Merger les deux sources intelligemment
  // extendedClientData peut être un objet non-null mais avec des champs null
  // → ne PAS utiliser || car un objet {} est truthy même si tous ses champs sont null
  const clientData = useMemo(() => {
    const base = job.client || {};
    const extended = extendedClientData;

    if (!extended) {
      return base;
    }

    // Merge: on garde les champs non-null de extended, sinon fallback sur base
    const merged = { ...base };
    for (const [key, value] of Object.entries(extended)) {
      if (value !== null && value !== undefined && value !== "") {
        (merged as any)[key] = value;
      }
    }


    return merged;
  }, [extendedClientData, job.client]);

  // Extraction robuste du prénom et nom
  // L'API peut retourner soit firstName/lastName séparés, soit un champ "name" combiné
  const getFirstName = (): string | undefined => {
    if (clientData?.firstName) return clientData.firstName;
    if (clientData?.name) {
      const parts = clientData.name.trim().split(" ");
      return parts[0];
    }
    return undefined;
  };

  const getLastName = (): string | undefined => {
    if (clientData?.lastName) return clientData.lastName;
    if (clientData?.name) {
      const parts = clientData.name.trim().split(" ");
      return parts.length > 1 ? parts.slice(1).join(" ") : undefined;
    }
    return undefined;
  };

  const firstName = getFirstName();
  const lastName = getLastName();
  const phone = clientData?.phone;
  const email = clientData?.email;
  const company = clientData?.company;
  const address = clientData?.address
    ? `${clientData.address.street}, ${clientData.address.city} ${clientData.address.zip}`
    : null;
  const notes = clientData?.notes;
  const fullName =
    [firstName, lastName].filter(Boolean).join(" ") ||
    t("jobDetails.client.notSpecified");

  // Actions disponibles
  const actions = useMemo(() => {
    const list: { icon: string; label: string; onPress: () => void }[] = [];
    if (phone) {
      list.push({
        icon: "call",
        label: t("jobDetails.client.call"),
        onPress: () => {
          analytics.trackCustomEvent('call_client', 'business', { job_id: job?.id });
          setLastContactAction('call');
          contactLink(phone, "tel");
        },
      });
      list.push({
        icon: "chatbubble",
        label: t("jobDetails.client.sms"),
        onPress: () => {
          analytics.trackCustomEvent('sms_client', 'business', { job_id: job?.id });
          setLastContactAction('sms');
          contactLink(phone, "sms");
        },
      });
    }
    if (email) {
      list.push({
        icon: "mail",
        label: t("jobDetails.client.emailAction"),
        onPress: () => {
          analytics.trackCustomEvent('email_client', 'business', { job_id: job?.id });
          setLastContactAction('email');
          contactLink(email, "mailto");
        },
      });
    }
    return list;
  }, [phone, email, t, job?.id]);

  // Détails secondaires (company, address, notes)
  const secondaryDetails = useMemo(() => {
    const items: { icon: string; value: string }[] = [];
    if (company) items.push({ icon: "business", value: company });
    if (address) items.push({ icon: "location", value: address });
    if (notes) items.push({ icon: "document-text", value: notes });
    return items;
  }, [company, address, notes]);

  // 🔍 DIAGNOSTIC

  return (
    <>
      <VStack testID="job-client-root" gap="lg">
        {/* ===== PROFILE CARD ===== */}
        <Card
          style={{ padding: DESIGN_TOKENS.spacing.xl, alignItems: "center" }}
        >
          {isLoadingClient ? (
            <VStack
              gap="md"
              style={{
                alignItems: "center",
                paddingVertical: DESIGN_TOKENS.spacing.xl,
              }}
            >
              {/* Skeleton avatar */}
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: colors.backgroundSecondary,
                }}
              />
              <View
                style={{
                  width: 140,
                  height: 20,
                  borderRadius: DESIGN_TOKENS.radius.sm,
                  backgroundColor: colors.backgroundSecondary,
                }}
              />
              <View
                style={{
                  width: 100,
                  height: 14,
                  borderRadius: DESIGN_TOKENS.radius.sm,
                  backgroundColor: colors.backgroundSecondary,
                }}
              />
            </VStack>
          ) : (
            <VStack gap="md" style={{ alignItems: "center", width: "100%" }}>
              {/* Avatar */}
              <ProfileAvatar
                firstName={firstName}
                lastName={lastName}
                size={80}
                colors={colors}
              />

              {/* Nom */}
              <VStack gap="xs" style={{ alignItems: "center" }}>
                <Text
                  style={{
                    fontSize: 22,
                    fontWeight: "700",
                    color: colors.text,
                    textAlign: "center",
                  }}
                >
                  {fullName}
                </Text>

                {/* Contact secondaire sous le nom */}
                {phone && phone !== "N/A" && (
                  <Text
                    style={{
                      fontSize: DESIGN_TOKENS.typography.body.fontSize,
                      color: colors.textSecondary,
                    }}
                  >
                    {phone}
                  </Text>
                )}
                {email && email !== "N/A" && (
                  <Text
                    style={{
                      fontSize: DESIGN_TOKENS.typography.caption.fontSize,
                      color: colors.textSecondary,
                    }}
                  >
                    {email}
                  </Text>
                )}
              </VStack>

              {/* Quick Actions */}
              {actions.length > 0 && (
                <HStack
                  gap="xl"
                  style={{
                    justifyContent: "center",
                    paddingTop: DESIGN_TOKENS.spacing.md,
                  }}
                >
                  {actions.map((action) => (
                    <QuickActionButton
                      key={action.icon}
                      icon={action.icon}
                      label={action.label}
                      onPress={action.onPress}
                      colors={colors}
                    />
                  ))}
                </HStack>
              )}
            </VStack>
          )}
        </Card>

        {/* ===== DETAILS SECONDAIRES ===== */}
        {secondaryDetails.length > 0 && (
          <Card
            style={{
              paddingHorizontal: DESIGN_TOKENS.spacing.lg,
              paddingVertical: DESIGN_TOKENS.spacing.md,
            }}
          >
            <VStack gap={0}>
              {secondaryDetails.map((detail, index) => (
                <React.Fragment key={detail.icon}>
                  <DetailRow
                    icon={detail.icon}
                    value={detail.value}
                    colors={colors}
                  />
                  {index < secondaryDetails.length - 1 && (
                    <View
                      style={{
                        height: 1,
                        backgroundColor: colors.border,
                        marginLeft: 30,
                      }}
                    />
                  )}
                </React.Fragment>
              ))}
            </VStack>
          </Card>
        )}

        {/* Signature + Contract section — unified component */}
        <SignatureSection job={job} onSignContract={handleSignContract} />
      </VStack>

      {/* Modal de signature */}
      {isSigningVisible && (
        <SigningBloc
          isVisible={isSigningVisible}
          setIsVisible={setIsSigningVisible}
          onSave={(signature: any) => {
          }}
          job={job}
          setJob={setJob}
        />
      )}
    </>
  );
};

export default JobClient;
