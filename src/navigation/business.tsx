/**
 * Business - Écran principal de gestion business
 * Architecture identique à JobDetails avec système de tabs internes
 */
import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BusinessTabMenu } from '../components/business';
import BusinessHeader from '../components/business/BusinessHeader';
import LanguageButton from '../components/calendar/LanguageButton';
import Toast from '../components/ui/toastNotification';
import { DESIGN_TOKENS } from '../constants/Styles';
import { useTheme } from '../context/ThemeProvider';
import { useLocalization } from '../localization/useLocalization';
import { JobsBillingScreen, StaffCrewScreen, TrucksScreen } from '../screens/business';
import BusinessInfoPage from '../screens/business/BusinessInfoPage';
import { useAuthCheck } from '../utils/checkAuth';

// Types et interfaces
interface BusinessProps {
    route?: any;
    navigation: any;
}

interface ToastState {
    message: string;
    type: 'info' | 'success' | 'error';
    status: boolean;
}

// Hook personnalisé pour les toasts
const useToast = () => {
    const [toastDetails, setToastDetails] = useState<ToastState>({
        message: '',
        type: 'info',
        status: false,
    });

    const showToast = (message: string, type: 'info' | 'success' | 'error') => {
        setToastDetails({ message, type, status: true });
        setTimeout(() => {
            setToastDetails({ message: '', type: 'info', status: false });
        }, 3000);
    };

    return { toastDetails, showToast };
};

const Business: React.FC<BusinessProps> = ({ route, navigation }) => {
    const insets = useSafeAreaInsets();
    const { toastDetails, showToast } = useToast();
    const { isLoading: authLoading, LoadingComponent } = useAuthCheck(navigation);
    const { colors } = useTheme();
    const { t } = useLocalization();
    
    const [businessPanel, setBusinessPanel] = useState('BusinessInfo');
    // businessPanel: 'BusinessInfo', 'StaffCrew', 'Trucks', 'JobsBilling'

    // Handler pour TabMenu
    const handleTabPress = (tabId: string) => {
        setBusinessPanel(tabId);
    };

    // Titres des panneaux
    const getPanelTitle = () => {
        switch (businessPanel) {
            case 'BusinessInfo': return t('business.navigation.businessInfo');
            case 'StaffCrew': return t('business.navigation.staffCrew');
            case 'Trucks': return t('business.navigation.trucks');
            case 'JobsBilling': return t('business.navigation.jobsBilling');
            default: return t('business.navigation.businessInfo');
        }
    };

    // Gestion des états de chargement
    if (authLoading) {
        return LoadingComponent;
    }

    return (
        <View style={{
            backgroundColor: colors.background,
            width: '100%',
            height: '100%',
            flex: 1,
        }}>
            {/* Header Business avec navigation et langue */}
            <BusinessHeader
                title={getPanelTitle()}
                rightComponent={<LanguageButton />}
                navigation={navigation}
            />
            
            {/* ScrollView principal */}
            <ScrollView
                style={{ flex: 1 }}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                    paddingTop: DESIGN_TOKENS.spacing.lg,
                    paddingBottom: 60 + insets.bottom + DESIGN_TOKENS.spacing.lg, // BusinessTabMenu + Safe area + espacement
                    paddingHorizontal: DESIGN_TOKENS.spacing.lg,
                }}
            >
                {businessPanel === 'BusinessInfo' && <BusinessInfoPage />}
                {businessPanel === 'StaffCrew' && <StaffCrewScreen />}
                {businessPanel === 'Trucks' && <TrucksScreen />}
                {businessPanel === 'JobsBilling' && <JobsBillingScreen />}
            </ScrollView>
            
            {/* Business Tab Menu fixé en bas */}
            <View style={{ 
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: colors.backgroundSecondary,
                borderTopWidth: 1,
                borderTopColor: colors.border,
                zIndex: 10,
            }}>
                <BusinessTabMenu
                    activeTab={businessPanel}
                    onTabPress={handleTabPress}
                />
            </View>
            
            {/* Toast au-dessus de tout */}
            <View style={{
                position: 'absolute',
                top: 100, // Position fixe sous le header
                left: DESIGN_TOKENS.spacing.lg,
                right: DESIGN_TOKENS.spacing.lg,
                zIndex: 20,
                pointerEvents: 'none',
            }}>
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