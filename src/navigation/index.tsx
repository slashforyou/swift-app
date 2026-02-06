import {
    NavigationContainer,
    NavigationContainerRef,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React, { useEffect, useRef } from "react";
import { testController } from "../services/testController";
import { lazyScreen } from "../utils/lazyLoading";

// Critical screens - loaded immediately
import ConnectionScreen from "../screens/connection";
import HomeScreen from "../screens/home";

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
const BusinessOwnerRegistration = lazyScreen(
  () => import("../screens/registration/BusinessOwnerRegistration"),
);
const SubscribeMailVerification = lazyScreen(
  () => import("../screens/connectionScreens/subscribeMailVerification"),
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

const Stack = createNativeStackNavigator();

export default function Navigation() {
  const navigationRef = useRef<NavigationContainerRef<any>>(null);

  useEffect(() => {
    // Provide navigation reference to test controller
    if (navigationRef.current) {
      testController.setNavigation(navigationRef.current as any);

      if (__DEV__) {
        // TEMP_DISABLED: console.log('🧭 Navigation reference set in TestController');
      }
    }
  }, []);

  return (
    <NavigationContainer ref={navigationRef}>
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
          name="BusinessOwnerRegistration"
          component={BusinessOwnerRegistration}
          options={{ gestureEnabled: false }}
        />
        <Stack.Screen
          name="SubscribeMailVerification"
          component={SubscribeMailVerification}
        />
        <Stack.Screen name="Home" component={HomeScreen} />
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}
