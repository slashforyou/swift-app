import {
    NavigationContainer,
    NavigationContainerRef,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as Notifications from "expo-notifications";
import React, { useEffect, useRef } from "react";
import { analytics } from "../services/analytics";
import { navigationContainerRef } from "../services/navRef";
import { testController } from "../services/testController";
import { lazyScreen } from "../utils/lazyLoading";

// Critical screens - loaded immediately
import ConnectionScreen from "../screens/connection";
import MainTabNavigator from "./MainTabNavigator";

// Deep linking configuration
const linking = {
  prefixes: ["cobbr://", "https://cobbr.com.au"],
  config: {
    screens: {
      Home: "home",
      JobDetails: "job/:id",
      Business: "business",
      Calendar: "calendar",
      Profile: "profile",
      StripeOnboarding: "stripe-onboarding",
      JobTemplateEditor: "business/templates/edit",
      JobTimeBreakdown: "job/time-breakdown",      ReviewForm: "review",    },
  },
};

// Secondary screens - lazy loaded for faster initial load
const LoginScreen = lazyScreen(
  () => import("../screens/connectionScreens/login"),
);
const RegisterTypeSelection = lazyScreen(
  () => import("../screens/connectionScreens/registerTypeSelection"),
);
const SubscribeScreen = lazyScreen(
  () => import("../screens/connectionScreens/subscribe"),
);
const SubscribeMailVerification = lazyScreen(
  () => import("../screens/connectionScreens/subscribeMailVerification"),
);
const ForgotPasswordScreen = lazyScreen(
  () => import("../screens/connectionScreens/forgotPassword"),
);
const JobDetails = lazyScreen(() => import("../screens/jobDetails"));
const Profile = lazyScreen(() => import("../screens/profile"));
const Parameters = lazyScreen(() => import("../screens/parameters"));
const BusinessNavigation = lazyScreen(() => import("./business"));
const CalendarNavigation = lazyScreen(() => import("./calendar"));
const StripeOnboardingStack = lazyScreen(
  () => import("./StripeOnboardingStack"),
);

// Settings screens
const RolesManagement = lazyScreen(
  () => import("../screens/settings/RolesManagementScreen"),
);
const TeamsManagement = lazyScreen(
  () => import("../screens/settings/TeamsManagementScreen"),
);

// Gamification screens
const Leaderboard = lazyScreen(() => import("../screens/leaderboard"));
const Badges = lazyScreen(() => import("../screens/badges"));
const XpHistory = lazyScreen(() => import("../screens/xpHistory"));
const GamificationV2Screen = lazyScreen(() => import("../screens/GamificationV2Screen"));
const QuestsScreen = lazyScreen(() => import("../screens/QuestsScreen"));
const EmployeeDashboard = lazyScreen(
  () => import("../screens/EmployeeDashboardScreen"),
);
const ManagerDashboard = lazyScreen(
  () => import("../screens/ManagerDashboardScreen"),
);
const ReferralScreen = lazyScreen(() => import("../screens/ReferralScreen"));

// Support screens
const SupportInbox = lazyScreen(
  () => import("../screens/support/SupportInbox"),
);
const SupportConversation = lazyScreen(
  () => import("../screens/support/SupportConversation"),
);
const SupportNewConversation = lazyScreen(
  () => import("../screens/support/SupportNewConversation"),
);
const SupportFAQ = lazyScreen(
  () => import("../screens/support/SupportFAQ"),
);
const FeedbackForm = lazyScreen(
  () => import("../screens/support/FeedbackForm"),
);

// Subscription screen
const SubscriptionScreen = lazyScreen(
  () => import("../screens/SubscriptionScreen"),
);

// Modular job templates screens
const JobTemplateEditor = lazyScreen(
  () => import("../screens/business/JobTemplateEditor"),
);
const JobTimeBreakdownScreen = lazyScreen(
  () => import("../screens/job/JobTimeBreakdownScreen"),
);
const JobScorecardScreen = lazyScreen(
  () => import("../screens/JobScorecardScreen"),
);

// Onboarding screens
const CompleteProfileScreen = lazyScreen(
  () => import("../screens/CompleteProfileScreen"),
);

// Job detail sub-screens
const JobAttachmentsScreen = lazyScreen(
  () => import("../screens/JobDetailsScreens/attachments"),
);
const JobLinkedJobsScreen = lazyScreen(
  () => import("../screens/JobDetailsScreens/linkedJobs"),
);
const JobDifficultyScreen = lazyScreen(
  () => import("../screens/JobDetailsScreens/difficulty"),
);
const JobReviewScreen = lazyScreen(
  () => import("../screens/JobReviewScreen"),
);

// Employee screens
const EmployeeAvailabilityScreen = lazyScreen(
  () => import("../screens/EmployeeAvailabilityScreen"),
);
const EmployeeSkillsScreen = lazyScreen(
  () => import("../screens/EmployeeSkillsScreen"),
);
const EmployeeRatingsScreen = lazyScreen(
  () => import("../screens/EmployeeRatingsScreen"),
);
const WeeklyHoursScreen = lazyScreen(
  () => import("../screens/WeeklyHoursScreen"),
);

// Employee schedule screen
const EmployeeScheduleScreen = lazyScreen(
  () => import("../screens/EmployeeScheduleScreen"),
);

// Vehicle screens
const VehicleMileageScreen = lazyScreen(
  () => import("../screens/VehicleMileageScreen"),
);
const VehicleMaintenanceScreen = lazyScreen(
  () => import("../screens/VehicleMaintenanceScreen"),
);

// Quotes screens
const QuotesScreen = lazyScreen(
  () => import("../screens/QuotesScreen"),
);
const QuoteEditorScreen = lazyScreen(
  () => import("../screens/QuoteEditorScreen"),
);

// Revenue dashboard
const RevenueDashboardScreen = lazyScreen(
  () => import("../screens/RevenueDashboardScreen"),
);

// Public review form (accessible via deep link sans auth)
const ReviewFormScreen = lazyScreen(
  () => import("../screens/ReviewFormScreen"),
);

const Stack = createNativeStackNavigator();

export default function Navigation() {
  const navigationRef = useRef<NavigationContainerRef<any>>(null);
  const previousRouteNameRef = useRef<string | undefined>(undefined);
  const screenEnterTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    // Provide navigation reference to test controller
    if (navigationRef.current) {
      testController.setNavigation(navigationRef.current as any);

      if (__DEV__) {
      }
    }
  }, []);

  // Callback pour synchroniser le ref global (push notifications)
  const onReady = () => {
    if (navigationRef.current) {
      (navigationContainerRef as any).current = navigationRef.current;
      previousRouteNameRef.current =
        navigationRef.current.getCurrentRoute()?.name;

      // Cold start: app ouverte depuis une notification (app était tuée)
      // Instagram/Twitter pattern: getLastNotificationResponseAsync() donne la notif qui a lancé l'app
      Notifications.getLastNotificationResponseAsync().then((response) => {
        if (!response) return;
        const data = response.notification?.request?.content?.data;
        if (!data) return;
        const { type, job_id, screen } = data as any;
        if ((type === "new_job" || type === "job_reminder" || type === "job_updated") && job_id && screen === "JobDetails") {
          navigationRef.current?.navigate("JobDetails" as any, { jobId: job_id, from: "Home" });
        } else if (type === "payment_received") {
          navigationRef.current?.navigate("Business" as any, { initialTab: "Payments" });
        }
      }).catch(() => { /* ignore */ });
    }
  };

  const onStateChange = () => {
    const currentRoute = navigationRef.current?.getCurrentRoute();
    const currentRouteName = currentRoute?.name;
    const previousRouteName = previousRouteNameRef.current;
    const now = Date.now();

    if (currentRouteName !== previousRouteName) {
      // Track le temps passé sur l'écran précédent
      const timeOnPreviousScreen = now - screenEnterTimeRef.current;
      if (previousRouteName && timeOnPreviousScreen > 500) {
        analytics.trackScreenTime(previousRouteName, timeOnPreviousScreen);
      }

      // Track la vue du nouvel écran
      if (currentRouteName) {
        analytics.trackNavigation(currentRouteName, previousRouteName);
      }

      previousRouteNameRef.current = currentRouteName;
      screenEnterTimeRef.current = now;
    }
  };

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={onReady}
      onStateChange={onStateChange}
      linking={linking}
    >
      <Stack.Navigator
        initialRouteName="Connection"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Connection" component={ConnectionScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen
          name="RegisterTypeSelection"
          component={RegisterTypeSelection}
        />
        <Stack.Screen name="Subscribe" component={SubscribeScreen} />
        <Stack.Screen
          name="SubscribeMailVerification"
          component={SubscribeMailVerification}
        />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="Home" component={MainTabNavigator} />
        <Stack.Screen name="Calendar" component={CalendarNavigation} />
        <Stack.Screen name="Business" component={BusinessNavigation} />
        <Stack.Screen
          name="StripeOnboarding"
          component={StripeOnboardingStack}
          options={{
            gestureEnabled: false,
            animation: "slide_from_bottom",
          }}
        />
        <Stack.Screen name="JobDetails" component={JobDetails} />
        <Stack.Screen name="Profile" component={Profile} />
        <Stack.Screen name="Parameters" component={Parameters} />
        <Stack.Screen name="RolesManagement" component={RolesManagement} />
        <Stack.Screen name="TeamsManagement" component={TeamsManagement} />
        <Stack.Screen name="Leaderboard" component={Leaderboard} />
        <Stack.Screen name="Badges" component={Badges} />
        <Stack.Screen name="XpHistory" component={XpHistory} />
        <Stack.Screen name="GamificationV2" component={GamificationV2Screen} />
        <Stack.Screen name="Quests" component={QuestsScreen} />
        <Stack.Screen
          name="EmployeeDashboard"
          component={EmployeeDashboard}
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="ManagerDashboard"
          component={ManagerDashboard}
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="Referral"
          component={ReferralScreen}
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen name="SupportInbox" component={SupportInbox} />
        <Stack.Screen
          name="SupportConversation"
          component={SupportConversation as any}
        />
        <Stack.Screen
          name="SupportNewConversation"
          component={SupportNewConversation}
        />
        <Stack.Screen name="SupportFAQ" component={SupportFAQ} />
        <Stack.Screen name="FeedbackForm" component={FeedbackForm} />
        <Stack.Screen name="Subscription" component={SubscriptionScreen} />
        <Stack.Screen
          name="JobTemplateEditor"
          component={JobTemplateEditor}
          options={{ animation: "slide_from_bottom" }}
        />
        <Stack.Screen
          name="JobTimeBreakdown"
          component={JobTimeBreakdownScreen}
          options={{ animation: "slide_from_bottom" }}
        />
        <Stack.Screen
          name="CompleteProfile"
          component={CompleteProfileScreen}
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="JobScorecard"
          component={JobScorecardScreen}
          options={{ animation: "slide_from_right" }}
        />
        {/* Job detail sub-screens */}
        <Stack.Screen
          name="JobAttachments"
          component={JobAttachmentsScreen}
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="JobLinkedJobs"
          component={JobLinkedJobsScreen}
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="JobDifficulty"
          component={JobDifficultyScreen}
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="JobReview"
          component={JobReviewScreen}
          options={{ animation: "slide_from_right" }}
        />
        {/* Employee screens */}
        <Stack.Screen
          name="EmployeeAvailability"
          component={EmployeeAvailabilityScreen}
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="EmployeeSkills"
          component={EmployeeSkillsScreen}
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="EmployeeRatings"
          component={EmployeeRatingsScreen}
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="WeeklyHours"
          component={WeeklyHoursScreen}
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="EmployeeSchedule"
          component={EmployeeScheduleScreen}
          options={{ animation: "slide_from_right" }}
        />
        {/* Vehicle screens */}
        <Stack.Screen
          name="VehicleMileage"
          component={VehicleMileageScreen}
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="VehicleMaintenance"
          component={VehicleMaintenanceScreen}
          options={{ animation: "slide_from_right" }}
        />
        {/* Quotes screens */}
        <Stack.Screen
          name="Quotes"
          component={QuotesScreen}
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="QuoteEditor"
          component={QuoteEditorScreen}
          options={{ animation: "slide_from_bottom" }}
        />
        {/* Revenue dashboard */}
        <Stack.Screen
          name="RevenueDashboard"
          component={RevenueDashboardScreen}
          options={{ animation: "slide_from_right" }}
        />
        {/* Public review form */}
        <Stack.Screen
          name="ReviewForm"
          component={ReviewFormScreen}
          options={{ animation: "slide_from_bottom", headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
