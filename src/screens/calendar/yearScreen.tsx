// Modern year calendar screen with monthly job indicators, statistics, and enhanced UX

import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useState } from "react";
import {
  Animated,
  Dimensions,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import CalendarHeader from "../../components/calendar/CalendarHeader";
import MascotLoading from "../../components/ui/MascotLoading";
import { DESIGN_TOKENS } from "../../constants/Styles";
import { useCommonThemedStyles } from "../../hooks/useCommonStyles";
import { useTranslation } from "../../localization";

const YearCalendarScreen = ({ navigation, route }: any) => {
  const { colors, styles: commonStyles } = useCommonThemedStyles();
  const { t } = useTranslation();

  // States for modern UX
  const [isLoading, setIsLoading] = useState(false);
  const [animatedValue] = useState(new Animated.Value(1));

  const { year } = route.params || {};
  const selectedYear = year || new Date().getFullYear();
  const currentYear = new Date().getFullYear();

  const monthList = [
    t("calendar.months.january"),
    t("calendar.months.february"),
    t("calendar.months.march"),
    t("calendar.months.april"),
    t("calendar.months.may"),
    t("calendar.months.june"),
    t("calendar.months.july"),
    t("calendar.months.august"),
    t("calendar.months.september"),
    t("calendar.months.october"),
    t("calendar.months.november"),
    t("calendar.months.december"),
  ];

  // Responsive dimensions
  const screenWidth = Dimensions.get("window").width;
  const monthCaseSize =
    (screenWidth -
      DESIGN_TOKENS.spacing.lg * 2 -
      DESIGN_TOKENS.spacing.md * 2) /
    3;

  // Navigation functions
  const navigateToYear = useCallback(
    (direction: "prev" | "next") => {
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      const newYear =
        direction === "prev" ? selectedYear - 1 : selectedYear + 1;
      navigation.navigate("Year", { year: newYear });
    },
    [selectedYear, animatedValue, navigation],
  );

  // Pull to refresh functionality
  const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsLoading(false);
  }, []);

  // Component for monthly job indicator — removed (was using mock data)

  const useCustomStyles = () => {
    return StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: colors.background,
      },
      scrollContainer: {
        flexGrow: 1,
        paddingHorizontal: DESIGN_TOKENS.spacing.lg,
        paddingBottom: 100, // Marge pour menu Samsung
      },
      header: {
        backgroundColor: colors.background,
        paddingTop: 50,
        paddingBottom: DESIGN_TOKENS.spacing.md,
        paddingHorizontal: DESIGN_TOKENS.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      },
      headerTop: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: DESIGN_TOKENS.spacing.md,
      },
      leftButtons: {
        flexDirection: "row",
        alignItems: "center",
        gap: DESIGN_TOKENS.spacing.sm,
      },
      homeButton: {
        backgroundColor: colors.primary,
        borderRadius: DESIGN_TOKENS.radius.lg,
        padding: DESIGN_TOKENS.spacing.md,
        ...DESIGN_TOKENS.shadows.md,
      },
      backButton: {
        backgroundColor: colors.backgroundSecondary,
        borderRadius: DESIGN_TOKENS.radius.md,
        padding: DESIGN_TOKENS.spacing.sm,
        ...DESIGN_TOKENS.shadows.sm,
      },
      titleArea: {
        alignItems: "center",
        flex: 1,
      },
      statsContainer: {
        flexDirection: "row",
        justifyContent: "space-around",
        backgroundColor: colors.backgroundSecondary,
        borderRadius: DESIGN_TOKENS.radius.lg,
        padding: DESIGN_TOKENS.spacing.md,
        marginBottom: DESIGN_TOKENS.spacing.md,
        ...DESIGN_TOKENS.shadows.sm,
      },
      statItem: {
        alignItems: "center",
      },
      statValue: {
        fontSize: 24,
        fontWeight: "700",
        color: colors.text,
        marginBottom: 4,
      },
      statLabel: {
        fontSize: 12,
        color: colors.textSecondary,
        fontWeight: "500",
      },
      navigationContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: DESIGN_TOKENS.spacing.md,
        gap: DESIGN_TOKENS.spacing.sm,
      },
      navButton: {
        backgroundColor: colors.primary,
        borderRadius: DESIGN_TOKENS.radius.lg,
        padding: DESIGN_TOKENS.spacing.md,
        minWidth: 50,
        alignItems: "center",
        ...DESIGN_TOKENS.shadows.sm,
      },
      yearButton: {
        flex: 1,
        backgroundColor: colors.primary,
        borderRadius: DESIGN_TOKENS.radius.lg,
        padding: DESIGN_TOKENS.spacing.lg,
        alignItems: "center",
        ...DESIGN_TOKENS.shadows.md,
      },
      yearButtonText: {
        fontSize: 20,
        fontWeight: "600",
        color: colors.buttonPrimaryText,
      },
      yearButtonSubtext: {
        fontSize: 12,
        color: colors.buttonPrimaryText,
        opacity: 0.8,
        marginTop: 2,
      },
      monthsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        gap: DESIGN_TOKENS.spacing.md,
      },
      monthCard: {
        width: monthCaseSize,
        height: monthCaseSize,
        backgroundColor: colors.backgroundSecondary,
        borderRadius: DESIGN_TOKENS.radius.lg,
        padding: DESIGN_TOKENS.spacing.md,
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
        ...DESIGN_TOKENS.shadows.sm,
      },
      monthCardCurrent: {
        width: monthCaseSize,
        height: monthCaseSize,
        backgroundColor: colors.backgroundSecondary,
        borderRadius: DESIGN_TOKENS.radius.lg,
        padding: DESIGN_TOKENS.spacing.md,
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
        ...DESIGN_TOKENS.shadows.sm,
        borderWidth: 2,
        borderColor: colors.primary,
      },
      monthText: {
        fontSize: 14,
        fontWeight: "600",
        color: colors.text,
        textAlign: "center",
      },
      monthTextCurrent: {
        color: colors.primary,
        fontWeight: "700",
      },
    });
  };

  const customStyles = useCustomStyles();

  return (
    <View testID="calendar-year-screen" style={customStyles.container}>
      {/* Header unifié avec style Business - Position fixe en haut */}
      <CalendarHeader navigation={navigation} title={selectedYear.toString()} />

      <Animated.View
        style={[customStyles.header, { transform: [{ scale: animatedValue }] }]}
      >
        {/* Navigation entre années */}
        <View
          testID="calendar-year-navigation"
          style={customStyles.navigationContainer}
        >
          <Pressable
            testID="calendar-year-prev-btn"
            style={({ pressed }) => ({
              ...customStyles.navButton,
              opacity: pressed ? 0.8 : 1,
            })}
            onPress={() => navigateToYear("prev")}
          >
            <Ionicons
              name="chevron-back"
              size={20}
              color={colors.buttonPrimaryText}
            />
          </Pressable>

          <Pressable
            testID="calendar-year-picker-btn"
            style={({ pressed }) => ({
              ...customStyles.yearButton,
              opacity: pressed ? 0.95 : 1,
            })}
            onPress={() => navigation.navigate("MultipleYears")}
          >
            <Text
              testID="calendar-year-value-text"
              style={customStyles.yearButtonText}
            >
              {selectedYear}
            </Text>
            <Text
              testID="calendar-year-hint-text"
              style={customStyles.yearButtonSubtext}
            >
              Select Year
            </Text>
          </Pressable>

          <Pressable
            testID="calendar-year-next-btn"
            style={({ pressed }) => ({
              ...customStyles.navButton,
              opacity: pressed ? 0.8 : 1,
            })}
            onPress={() => navigateToYear("next")}
          >
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.buttonPrimaryText}
            />
          </Pressable>
        </View>
      </Animated.View>

      {/* Grille des mois avec pull-to-refresh */}
      <ScrollView
        testID="calendar-year-scroll"
        style={customStyles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {isLoading && <MascotLoading text={t("calendar.loading")} overlay />}

        <View
          testID="calendar-year-months-grid"
          style={customStyles.monthsGrid}
        >
          {monthList.map((month, i) => {
            const isCurrentMonth =
              selectedYear === currentYear && i === new Date().getMonth();

            return (
              <Pressable
                key={month}
                testID={`calendar-year-month-${i + 1}`}
                style={({ pressed }) => ({
                  ...(isCurrentMonth
                    ? customStyles.monthCardCurrent
                    : customStyles.monthCard),
                  opacity: pressed ? 0.8 : 1,
                })}
                onPress={() =>
                  navigation.navigate("Month", {
                    month: i + 1,
                    year: selectedYear,
                  })
                }
              >
                <Text
                  testID={`calendar-year-month-${i + 1}-text`}
                  style={
                    isCurrentMonth
                      ? customStyles.monthTextCurrent
                      : customStyles.monthText
                  }
                >
                  {month}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

export default YearCalendarScreen;
