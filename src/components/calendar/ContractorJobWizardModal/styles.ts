import { StyleSheet } from "react-native";
import { DESIGN_TOKENS } from "../../../constants/Styles";

type Colors = {
  background: string;
  backgroundSecondary: string;
  border: string;
  primary: string;
  text: string;
  textSecondary: string;
  info: string;
  success: string;
  error: string;
  warning: string;
  buttonPrimaryText: string;
  [key: string]: string;
};

export const createStyles = (colors: Colors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.55)",
      justifyContent: "flex-end",
    },
    sheet: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: "92%",
      minHeight: "82%",
    },
    handle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      alignSelf: "center",
      marginTop: 12,
      marginBottom: 8,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: DESIGN_TOKENS.spacing.lg,
      paddingVertical: DESIGN_TOKENS.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerLeft: {
      flex: 1,
    },
    stepLabel: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.primary,
      textTransform: "uppercase",
      letterSpacing: 0.8,
      marginBottom: 2,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.text,
    },
    closeButton: {
      padding: 8,
    },
    scrollContent: {
      paddingHorizontal: DESIGN_TOKENS.spacing.lg,
      paddingTop: DESIGN_TOKENS.spacing.lg,
      paddingBottom: DESIGN_TOKENS.spacing.xl,
    },

    // Company badge
    companyBadge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.info + "18",
      borderRadius: DESIGN_TOKENS.radius.md,
      padding: DESIGN_TOKENS.spacing.md,
      marginBottom: DESIGN_TOKENS.spacing.lg,
      borderLeftWidth: 3,
      borderLeftColor: colors.info,
    },
    companyBadgeText: {
      marginLeft: DESIGN_TOKENS.spacing.sm,
      flex: 1,
    },
    companyLabel: {
      fontSize: 11,
      color: colors.info,
      fontWeight: "600",
      textTransform: "uppercase",
    },
    companyName: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.text,
    },

    // Info rows
    infoCard: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: DESIGN_TOKENS.radius.md,
      padding: DESIGN_TOKENS.spacing.md,
      marginBottom: DESIGN_TOKENS.spacing.md,
    },
    infoRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: DESIGN_TOKENS.spacing.sm,
    },
    infoIcon: {
      marginRight: DESIGN_TOKENS.spacing.sm,
      marginTop: 1,
    },
    infoLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 2,
    },
    infoValue: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
    },

    // Status badge
    statusRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: DESIGN_TOKENS.spacing.lg,
    },
    statusBadge: {
      paddingHorizontal: DESIGN_TOKENS.spacing.md,
      paddingVertical: DESIGN_TOKENS.spacing.xs,
      borderRadius: DESIGN_TOKENS.radius.full,
      marginRight: DESIGN_TOKENS.spacing.sm,
    },
    statusText: {
      fontSize: 12,
      fontWeight: "700",
    },

    // Decision buttons
    decisionContainer: {
      marginTop: DESIGN_TOKENS.spacing.lg,
    },
    decisionTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      marginBottom: DESIGN_TOKENS.spacing.md,
      textAlign: "center",
    },
    decisionRow: {
      flexDirection: "row",
      gap: DESIGN_TOKENS.spacing.md,
    },
    acceptBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.success + "20",
      borderWidth: 1.5,
      borderColor: colors.success,
      borderRadius: DESIGN_TOKENS.radius.lg,
      paddingVertical: DESIGN_TOKENS.spacing.md,
      gap: 8,
    },
    declineBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.error + "12",
      borderWidth: 1.5,
      borderColor: colors.error + "80",
      borderRadius: DESIGN_TOKENS.radius.lg,
      paddingVertical: DESIGN_TOKENS.spacing.md,
      gap: 8,
    },
    acceptBtnText: {
      color: colors.success,
      fontSize: 15,
      fontWeight: "700",
    },
    declineBtnText: {
      color: colors.error,
      fontSize: 15,
      fontWeight: "700",
    },

    // Staff picker
    searchInput: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: DESIGN_TOKENS.radius.md,
      paddingHorizontal: DESIGN_TOKENS.spacing.md,
      paddingVertical: 10,
      fontSize: 14,
      color: colors.text,
      marginBottom: DESIGN_TOKENS.spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    staffItem: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.backgroundSecondary,
      borderRadius: DESIGN_TOKENS.radius.md,
      padding: DESIGN_TOKENS.spacing.md,
      marginBottom: DESIGN_TOKENS.spacing.sm,
      borderWidth: 1.5,
    },
    staffAvatar: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: colors.primary + "20",
      alignItems: "center",
      justifyContent: "center",
      marginRight: DESIGN_TOKENS.spacing.md,
    },
    staffAvatarText: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.primary,
    },
    staffInfo: {
      flex: 1,
    },
    staffName: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
    },
    staffRole: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    staffCheck: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      alignItems: "center",
      justifyContent: "center",
    },
    emptyStaff: {
      alignItems: "center",
      paddingVertical: DESIGN_TOKENS.spacing.xl,
    },
    emptyStaffText: {
      color: colors.textSecondary,
      marginTop: DESIGN_TOKENS.spacing.sm,
      fontSize: 14,
    },

    // Text input for decline reason
    reasonInput: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: DESIGN_TOKENS.radius.md,
      padding: DESIGN_TOKENS.spacing.md,
      fontSize: 14,
      color: colors.text,
      minHeight: 120,
      textAlignVertical: "top",
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: DESIGN_TOKENS.spacing.lg,
    },

    // Bottom action bar
    actionBar: {
      flexDirection: "row",
      paddingHorizontal: DESIGN_TOKENS.spacing.lg,
      paddingTop: DESIGN_TOKENS.spacing.md,
      paddingBottom: DESIGN_TOKENS.spacing.lg,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      gap: DESIGN_TOKENS.spacing.md,
    },
    primaryActionBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primary,
      borderRadius: DESIGN_TOKENS.radius.lg,
      paddingVertical: DESIGN_TOKENS.spacing.md,
      gap: 8,
    },
    primaryActionBtnText: {
      color: colors.buttonPrimaryText,
      fontSize: 15,
      fontWeight: "700",
    },
    secondaryActionBtn: {
      paddingHorizontal: DESIGN_TOKENS.spacing.lg,
      paddingVertical: DESIGN_TOKENS.spacing.md,
      borderRadius: DESIGN_TOKENS.radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    secondaryActionBtnText: {
      color: colors.textSecondary,
      fontSize: 14,
      fontWeight: "600",
    },
    dangerActionBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.error,
      borderRadius: DESIGN_TOKENS.radius.lg,
      paddingVertical: DESIGN_TOKENS.spacing.md,
      gap: 8,
    },
    dangerActionBtnText: {
      color: "#fff",
      fontSize: 15,
      fontWeight: "700",
    },

    // Success/Declined screens
    resultContainer: {
      alignItems: "center",
      paddingVertical: DESIGN_TOKENS.spacing.xl * 2,
      paddingHorizontal: DESIGN_TOKENS.spacing.xl,
    },
    resultIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: DESIGN_TOKENS.spacing.lg,
    },
    resultTitle: {
      fontSize: 22,
      fontWeight: "700",
      color: colors.text,
      textAlign: "center",
      marginBottom: DESIGN_TOKENS.spacing.sm,
    },
    resultSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: 20,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.textSecondary,
      marginBottom: DESIGN_TOKENS.spacing.sm,
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
  });
