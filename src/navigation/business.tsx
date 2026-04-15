/**
 * Business - Écran principal de gestion business
 * Architecture 4 onglets : Hub · Ressources · Config · Finances
 */
import Ionicons from "@react-native-vector-icons/ionicons";
import React, { useCallback, useState } from "react";
import { ScrollView, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BusinessTabMenu } from "../components/business";
import BusinessHeader from "../components/business/BusinessHeader";
import BusinessSubTabMenu from "../components/business/BusinessSubTabMenu";
import type { BusinessTab } from "../components/business/BusinessTabMenu";
import HeaderLogo from "../components/ui/HeaderLogo";
import HelpButton from "../components/ui/HelpButton";
import Toast from "../components/ui/toastNotification";
import { DESIGN_TOKENS } from "../constants/Styles";
import { useTheme } from "../context/ThemeProvider";
import { useLocalization } from "../localization/useLocalization";
import {
    PaymentsListScreen,
    PayoutsScreen,
    RelationsScreen,
    StaffCrewScreen,
    StripeSettingsScreen,
    TrucksScreen,
} from "../screens/business";
import BusinessHubOverview from "../screens/business/BusinessHubOverview";
import BusinessInfoPage from "../screens/business/BusinessInfoPage";
import ContainerLayoutScreen from "../screens/business/ContainerLayoutScreen";
import ContractsScreen from "../screens/business/ContractsScreen";
import EditStorageLotModal from "../screens/business/EditStorageLotModal";
import InterContractorBillingScreen from "../screens/business/InterContractorBillingScreen";
import JobTemplatesPanel from "../screens/business/JobTemplatesPanel";
import MonthlyInvoicesScreen from "../screens/business/MonthlyInvoicesScreen";
import StorageLotDetailScreen from "../screens/business/StorageLotDetail";
import StorageScreen from "../screens/business/StorageScreen";
import StorageUnitDetailScreen from "../screens/business/StorageUnitDetailScreen";
import StripePaymentsTab from "../screens/business/StripePaymentsTab";
import { useAuthCheck } from "../utils/checkAuth";

// ── Mapping ancien → nouveau pour la rétro-compatibilité ──
const TAB_MAPPING: Record<string, { tab: BusinessTab; subTab?: string; drillDown?: string }> = {
  BusinessInfo: { tab: "Hub", drillDown: "BusinessInfo" },
  StaffCrew: { tab: "Resources", subTab: "staff" },
  Trucks: { tab: "Resources", subTab: "vehicles" },
  JobsBilling: { tab: "Finances", subTab: "payments" },
  Relations: { tab: "Resources", subTab: "partners" },
  JobTemplates: { tab: "Config", subTab: "templates" },
  Contracts: { tab: "Config", subTab: "clauses" },
  Billing: { tab: "Finances", subTab: "billing" },
  Payments: { tab: "Finances", subTab: "payments" },
  Invoices: { tab: "Finances", subTab: "invoices" },
};

// Types et interfaces
interface BusinessProps {
  route?: any;
  navigation: any;
}

interface ToastState {
  message: string;
  type: "info" | "success" | "error";
  status: boolean;
}

// Hook personnalisé pour les toasts
const useToast = () => {
  const [toastDetails, setToastDetails] = useState<ToastState>({
    message: "",
    type: "info",
    status: false,
  });

  const showToast = (message: string, type: "info" | "success" | "error") => {
    setToastDetails({ message, type, status: true });
    setTimeout(() => {
      setToastDetails({ message: "", type: "info", status: false });
    }, 3000);
  };

  return { toastDetails, showToast };
};

// ── Sous-tab configs ──
const Business: React.FC<BusinessProps> = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { toastDetails, showToast } = useToast();
  const { colors } = useTheme();
  const { t } = useLocalization();

  const RESOURCES_TABS = React.useMemo(() => [
    { id: "staff", label: t("businessHub.subTabs.staff") },
    { id: "vehicles", label: t("businessHub.subTabs.vehicles") },
    { id: "partners", label: t("businessHub.subTabs.partners") },
    { id: "storage", label: t("businessHub.subTabs.storage") },
  ], [t]);
  const CONFIG_TABS = React.useMemo(() => [
    { id: "templates", label: t("businessHub.subTabs.templates") },
    { id: "clauses", label: t("businessHub.subTabs.clauses") },
  ], [t]);
  const FINANCES_TABS = React.useMemo(() => [
    { id: "payments", label: t("businessHub.subTabs.payments") },
    { id: "billing", label: t("businessHub.subTabs.billing") },
    { id: "invoices", label: t("businessHub.subTabs.invoicesTab") },
  ], [t]);

  const { isLoading: authLoading, LoadingComponent } = useAuthCheck(
    navigation,
    t("common.checkingAuth"),
  );

  // ── Résolution initialTab (rétro-compatibilité) ──
  const rawInitialTab = route?.params?.initialTab;
  const mapped = rawInitialTab ? TAB_MAPPING[rawInitialTab] : undefined;

  const [activeTab, setActiveTab] = useState<BusinessTab>(mapped?.tab || "Hub");
  const [resourcesSubTab, setResourcesSubTab] = useState(mapped?.tab === "Resources" ? (mapped?.subTab || "staff") : "staff");
  const [configSubTab, setConfigSubTab] = useState(mapped?.tab === "Config" ? (mapped?.subTab || "templates") : "templates");
  const [financesSubTab, setFinancesSubTab] = useState(mapped?.tab === "Finances" ? (mapped?.subTab || "payments") : "payments");
  const [drillDownScreen, setDrillDownScreen] = useState<string | null>(mapped?.drillDown || null);
  const [searchQuery, setSearchQuery] = useState("");
  const [storageLotId, setStorageLotId] = useState<number | null>(null);
  const [storageUnitId, setStorageUnitId] = useState<number | null>(null);
  const [storageView, setStorageView] = useState<"list" | "lotDetail" | "unitDetail" | "layout">("list");
  const [showEditLot, setShowEditLot] = useState(false);
  const [editLotData, setEditLotData] = useState<any>(null);

  // ── Handlers ──
  const handleTabPress = useCallback((tabId: BusinessTab) => {
    setActiveTab(tabId);
    setDrillDownScreen(null);
    setSearchQuery("");
  }, []);

  const handleNavigateTab = useCallback((tab: BusinessTab, subTab?: string) => {
    setActiveTab(tab);
    setDrillDownScreen(null);
    setSearchQuery("");
    if (subTab) {
      if (tab === "Resources") setResourcesSubTab(subTab);
      if (tab === "Config") setConfigSubTab(subTab);
      if (tab === "Finances") setFinancesSubTab(subTab);
    }
  }, []);

  const handleDrillDown = useCallback((screen: string) => {
    setDrillDownScreen(screen);
  }, []);

  const handleDrillBack = useCallback(() => {
    setDrillDownScreen(null);
  }, []);

  // Navigation object pour les écrans Stripe drill-down
  const stripeNavigation = {
    navigate: (screenName: string) => setDrillDownScreen(screenName),
    goBack: handleDrillBack,
  };

  // ── Titre ──
  const getPanelTitle = (): string => {
    if (drillDownScreen) {
      switch (drillDownScreen) {
        case "BusinessInfo": return t("businessHub.drillDown.companyProfile");
        case "JobTemplates": return t("businessHub.drillDown.jobTemplates");
        case "Contracts": return t("businessHub.drillDown.contracts");
        case "Reports": return t("businessHub.drillDown.reports");
        case "PaymentsList": return t("businessHub.drillDown.paymentsReceived");
        case "Payouts": return t("businessHub.drillDown.payouts");
        case "StripeSettings": return t("businessHub.drillDown.stripeSettings");
        default: return "Business";
      }
    }
    switch (activeTab) {
      case "Hub": return t("businessHub.tabs.hub");
      case "Resources": return t("businessHub.tabs.resources");
      case "Config": return t("businessHub.tabs.config");
      case "Finances": return t("businessHub.tabs.finances");
      default: return "Business";
    }
  };

  if (authLoading) {
    return LoadingComponent;
  }

  // ── Sub-tab menu rendu (collé en haut, hors du ScrollView) ──
  const renderSubTabMenu = () => {
    if (drillDownScreen) return null;
    switch (activeTab) {
      case "Resources":
        return (
          <BusinessSubTabMenu
            tabs={RESOURCES_TABS}
            activeTab={resourcesSubTab}
            onTabPress={(id) => { setResourcesSubTab(id); setSearchQuery(""); }}
          />
        );
      case "Config":
        return (
          <BusinessSubTabMenu
            tabs={CONFIG_TABS}
            activeTab={configSubTab}
            onTabPress={setConfigSubTab}
          />
        );
      case "Finances":
        return (
          <BusinessSubTabMenu
            tabs={FINANCES_TABS}
            activeTab={financesSubTab}
            onTabPress={setFinancesSubTab}
          />
        );
      default:
        return null;
    }
  };

  // ── Barre de recherche (Resources uniquement) ──
  const showSearch = !drillDownScreen && activeTab === "Resources";

  // ── Rendu du contenu principal (scroll) ──
  const renderContent = () => {
    // Drill-down screens (push/modal depuis le Hub ou Finances)
    if (drillDownScreen) {
      switch (drillDownScreen) {
        case "BusinessInfo":
          return <BusinessInfoPage />;
        case "JobTemplates":
          return <JobTemplatesPanel navigation={navigation} />;
        case "Contracts":
          return <ContractsScreen />;
        case "PaymentsList":
          return <PaymentsListScreen navigation={stripeNavigation} />;
        case "Payouts":
          return <PayoutsScreen navigation={stripeNavigation} />;
        case "StripeSettings":
          return <StripeSettingsScreen navigation={stripeNavigation} />;
        default:
          return null;
      }
    }

    switch (activeTab) {
      case "Hub":
        return (
          <BusinessHubOverview
            onNavigateTab={handleNavigateTab}
            onDrillDown={handleDrillDown}
          />
        );

      case "Resources":
        if (resourcesSubTab === "storage") {
          if (storageView === "layout" && storageLotId) {
            // Need to fetch lot data for layout — use a placeholder approach
            return (
              <ContainerLayoutScreen
                lotId={storageLotId}
                initialUnits={[]}
                onBack={() => setStorageView("lotDetail")}
                onChanged={() => {}}
              />
            );
          }
          if (storageView === "unitDetail" && storageUnitId) {
            return (
              <StorageUnitDetailScreen
                unitId={storageUnitId}
                onBack={() => {
                  setStorageUnitId(null);
                  setStorageView("list");
                }}
                onOpenLot={(id) => {
                  setStorageLotId(id);
                  setStorageView("lotDetail");
                }}
              />
            );
          }
          if (storageView === "lotDetail" && storageLotId) {
            return (
              <>
                <StorageLotDetailScreen
                  lotId={storageLotId}
                  onBack={() => {
                    setStorageLotId(null);
                    setStorageView("list");
                  }}
                  onOpenLayout={() => setStorageView("layout")}
                  onEditLot={() => setShowEditLot(true)}
                />
                <EditStorageLotModal
                  visible={showEditLot}
                  lot={editLotData}
                  onClose={() => setShowEditLot(false)}
                  onUpdated={() => {
                    setShowEditLot(false);
                  }}
                />
              </>
            );
          }
        }
        return (
          <>
            {resourcesSubTab === "staff" && <StaffCrewScreen />}
            {resourcesSubTab === "vehicles" && <TrucksScreen />}
            {resourcesSubTab === "partners" && <RelationsScreen />}
            {resourcesSubTab === "storage" && (
              <StorageScreen
                onOpenLot={(id) => {
                  setStorageLotId(id);
                  setStorageView("lotDetail");
                }}
                onOpenUnit={(id) => {
                  setStorageUnitId(id);
                  setStorageView("unitDetail");
                }}
              />
            )}
          </>
        );

      case "Config":
        return (
          <>
            {configSubTab === "templates" && (
              <JobTemplatesPanel navigation={navigation} />
            )}
            {configSubTab === "clauses" && <ContractsScreen />}
          </>
        );

      case "Finances":
        return (
          <>
            {financesSubTab === "payments" && (
              <StripePaymentsTab
                onNavigateStripeScreen={handleDrillDown}
                mainNavigation={navigation}
              />
            )}
            {financesSubTab === "billing" && <InterContractorBillingScreen />}
            {financesSubTab === "invoices" && <MonthlyInvoicesScreen />}
          </>
        );

      default:
        return null;
    }
  };

  return (
    <View
      testID="business-screen"
      style={{
        backgroundColor: colors.background,
        width: "100%",
        height: "100%",
        flex: 1,
      }}
    >
      {/* Logo + Header masqués en drill-down (les écrans drill-down ont leur propre header) */}
      {!drillDownScreen && (
        <>
          <View style={{ alignItems: "center", paddingTop: insets.top }}>
            <HeaderLogo preset="sm" variant="rectangle" marginVertical={2} />
          </View>
          <BusinessHeader
            title={getPanelTitle()}
            rightComponent={<HelpButton size={40} />}
            navigation={navigation}
            showBackButton={true}
            skipSafeAreaTop={true}
          />
        </>
      )}

      {/* Sub-tab menu collé en haut (hors du ScrollView) */}
      {renderSubTabMenu()}

      {/* Barre de recherche (Resources) */}
      {showSearch && (
        <View style={{
          paddingHorizontal: DESIGN_TOKENS.spacing.lg,
          paddingTop: DESIGN_TOKENS.spacing.sm,
          paddingBottom: DESIGN_TOKENS.spacing.sm,
          backgroundColor: colors.background,
        }}>
          <View style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colors.backgroundSecondary,
            borderRadius: DESIGN_TOKENS.radius.md,
            borderWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: DESIGN_TOKENS.spacing.sm,
            height: 40,
          }}>
            <Ionicons name="search" size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
            <TextInput
              placeholder={t("common.search") + "..."}
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={{
                flex: 1,
                fontSize: 14,
                color: colors.text,
                paddingVertical: 0,
              }}
            />
          </View>
        </View>
      )}

      {/* Drill-down screens rendus en pleine page (hors ScrollView) */}
      {drillDownScreen ? (
        <View style={{ flex: 1 }}>
          {renderContent()}
        </View>
      ) : (
      /* ScrollView principal */
      <ScrollView
        testID="business-content-scroll"
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: DESIGN_TOKENS.spacing.md,
          paddingBottom: 60 + insets.bottom + DESIGN_TOKENS.spacing.lg,
          paddingHorizontal: DESIGN_TOKENS.spacing.lg,
        }}
      >
        {renderContent()}
      </ScrollView>
      )}

      {/* Business Tab Menu fixé en bas — masqué en drill-down */}
      {!drillDownScreen && (
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: colors.backgroundSecondary,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            zIndex: 10,
          }}
        >
          <BusinessTabMenu
            activeTab={activeTab}
            onTabPress={handleTabPress}
          />
        </View>
      )}

      {/* Toast au-dessus de tout */}
      <View
        style={{
          position: "absolute",
          top: 100,
          left: DESIGN_TOKENS.spacing.lg,
          right: DESIGN_TOKENS.spacing.lg,
          zIndex: 20,
          pointerEvents: "none",
        }}
      >
        <Toast
          message={toastDetails.message}
          type={toastDetails.type}
          status={toastDetails.status}
        />
      </View>
    </View>
  );
};

export default Business;
