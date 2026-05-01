/**
 * MainTabNavigator
 *
 * UN SEUL Tab.Navigator conditionnel — les screens sont rendus
 * en fonction du account_type de l'utilisateur connecté.
 *
 * Owner    : Jobs · Team · Schedule · Business · Profile
 * Employee : My Jobs · Schedule · Profile
 * Contractor : Pending Requests · My Assignments · Profile
 *
 * Fallback (isLoading) : tabs Owner — safe par défaut.
 */
import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React from "react";

import { useTheme } from "../context/ThemeProvider";
import { useAccountType } from "../hooks/useAccountType";

// Owner screens
import HomeScreen from "../screens/home";
import ProfileScreen from "../screens/profile";
import TeamsManagementScreen from "../screens/settings/TeamsManagementScreen";
import BusinessNavigation from "./business";
import CalendarNavigation from "./calendar";

// Employee screens
import EmployeeScheduleScreen from "../screens/EmployeeScheduleScreen";

// Contractor screens
import MyAssignmentsScreen from "../screens/contractor/MyAssignmentsScreen";
import PendingRequestsScreen from "../screens/contractor/PendingRequestsScreen";

// ─── Types ──────────────────────────────────────────────────────────────────

type IconName = React.ComponentProps<typeof Ionicons>["name"];

interface TabIconProps {
  focused: boolean;
  color: string;
  size: number;
  focusedIcon: IconName;
  unfocusedIcon: IconName;
}

// ─── Icon helper ────────────────────────────────────────────────────────────

function makeTabIcon(focusedIcon: IconName, unfocusedIcon: IconName) {
  return ({ focused, color, size }: Omit<TabIconProps, "focusedIcon" | "unfocusedIcon">) => (
    <Ionicons
      name={focused ? focusedIcon : unfocusedIcon}
      size={size}
      color={color}
    />
  );
}

// ─── Navigator ──────────────────────────────────────────────────────────────

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
  const { colors } = useTheme();
  const { isContractor, isEmployee } = useAccountType();
  // isLoading → isContractor & isEmployee are both false → Owner tabs (safe fallback)

  const screenOptions = {
    headerShown: false,
    tabBarActiveTintColor: colors.primary,
    tabBarInactiveTintColor: colors.textSecondary,
    tabBarStyle: {
      backgroundColor: colors.backgroundTertiary,
      borderTopColor: colors.backgroundSecondary,
      borderTopWidth: 1,
    },
  };

  return (
    <Tab.Navigator screenOptions={screenOptions}>
      {isContractor ? (
        <>
          <Tab.Screen
            name="PendingRequests"
            component={PendingRequestsScreen}
            options={{
              title: "Requests",
              tabBarIcon: makeTabIcon("time", "time-outline"),
            }}
          />
          <Tab.Screen
            name="MyAssignments"
            component={MyAssignmentsScreen}
            options={{
              title: "My Jobs",
              tabBarIcon: makeTabIcon("checkmark-done", "checkmark-done-outline"),
            }}
          />
          <Tab.Screen
            name="Profile"
            component={ProfileScreen}
            options={{
              title: "Profile",
              tabBarIcon: makeTabIcon("person-circle", "person-circle-outline"),
            }}
          />
        </>
      ) : isEmployee ? (
        <>
          <Tab.Screen
            name="MyJobs"
            component={HomeScreen}
            options={{
              title: "My Jobs",
              tabBarIcon: makeTabIcon("hammer", "hammer-outline"),
            }}
          />
          <Tab.Screen
            name="EmployeeSchedule"
            component={EmployeeScheduleScreen}
            options={{
              title: "Schedule",
              tabBarIcon: makeTabIcon("calendar", "calendar-outline"),
            }}
          />
          <Tab.Screen
            name="Profile"
            component={ProfileScreen}
            options={{
              title: "Profile",
              tabBarIcon: makeTabIcon("person-circle", "person-circle-outline"),
            }}
          />
        </>
      ) : (
        // Owner — default & isLoading fallback
        <>
          <Tab.Screen
            name="Jobs"
            component={HomeScreen}
            options={{
              title: "Jobs",
              tabBarIcon: makeTabIcon("briefcase", "briefcase-outline"),
              tabBarStyle: { display: 'none' },
            }}
          />
          <Tab.Screen
            name="Team"
            component={TeamsManagementScreen}
            options={{
              title: "Team",
              tabBarIcon: makeTabIcon("people", "people-outline"),
            }}
          />
          <Tab.Screen
            name="Schedule"
            component={CalendarNavigation}
            options={{
              title: "Schedule",
              tabBarIcon: makeTabIcon("calendar", "calendar-outline"),
            }}
          />
          <Tab.Screen
            name="Business"
            component={BusinessNavigation}
            options={{
              title: "Business",
              tabBarIcon: makeTabIcon("business", "business-outline"),
            }}
          />
          <Tab.Screen
            name="Profile"
            component={ProfileScreen}
            options={{
              title: "Profile",
              tabBarIcon: makeTabIcon("person-circle", "person-circle-outline"),
            }}
          />
        </>
      )}
    </Tab.Navigator>
  );
}
