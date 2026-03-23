import React, { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import HeaderLogo from "../components/ui/HeaderLogo";
import RoundLanguageButton from "../components/ui/RoundLanguageButton";
import MascotLoading from "../components/ui/MascotLoading";
import { useCommonThemedStyles } from "../hooks/useCommonStyles";
import { useTranslation } from "../localization";
import { ensureSession } from "../utils/session";

import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

type RootStackParamList = {
  Home: undefined;
  Login: undefined;
  RegisterTypeSelection: undefined;
  Subscribe: undefined;
  Connection: undefined;
};

interface ConnectionScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList>;
}

const ConnectionScreen: React.FC<ConnectionScreenProps> = ({ navigation }) => {
  const { colors, styles } = useCommonThemedStyles();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TEMP_DISABLED: console.log("ConnectionScreen mounted, checking session...");

    const checkSession = async () => {
      try {
        setIsLoading(true);
        // TEMP_DISABLED: console.log("Checking user session...");
        const userLoggedIn = await ensureSession();
        if (userLoggedIn && userLoggedIn.authenticated === true) {
          navigation.navigate("Home");
        }
      } catch (error) {
        console.error("Error checking session:", error);
      } finally {
        setIsLoading(false);
      }
    };
    checkSession();
  }, [navigation]);

  if (isLoading) {
    return <MascotLoading text={t("common.loading")} />;
  }

  return (
    <SafeAreaView testID="connection-screen" style={styles.container}>
      <View
        style={{
          position: "absolute",
          top: 28,
          right: 32,
          zIndex: 10,
        }}
      >
        <RoundLanguageButton testID="connection-language-btn" />
      </View>
      <View testID="connection-content" style={styles.containerCentered}>
        {/* Logo Section */}
        <View
          style={{
            width: 200,
            height: 100,
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 30,
          }}
        >
          <HeaderLogo preset="md" variant="square" marginVertical={0} />
        </View>

        {/* Welcome Text */}
        <Text
          testID="connection-title-text"
          style={[styles.title, { marginBottom: 8, textAlign: "center" }]}
        >
          {t("auth.connection.title")}
        </Text>

        <Text
          testID="connection-subtitle-text"
          style={[
            styles.body,
            {
              color: colors.textSecondary,
              textAlign: "center",
              marginBottom: 40,
              paddingHorizontal: 20,
            },
          ]}
        >
          {t("auth.connection.subtitle")}
        </Text>

        {/* Action Buttons */}
        <View
          testID="connection-actions"
          style={{ width: "100%", paddingHorizontal: 20, gap: 16 }}
        >
          <Pressable
            testID="connection-login-btn"
            style={[styles.buttonPrimary, { width: "100%" }]}
            onPress={() => navigation.navigate("Login")}
          >
            <Text
              testID="connection-login-text"
              style={styles.buttonPrimaryText}
            >
              {t("auth.connection.loginButton")}
            </Text>
          </Pressable>

          <Pressable
            testID="connection-register-btn"
            style={[styles.buttonSecondary, { width: "100%" }]}
            onPress={() => navigation.navigate("RegisterTypeSelection")}
          >
            <Text
              testID="connection-register-text"
              style={styles.buttonSecondaryText}
            >
              {t("auth.connection.registerButton")}
            </Text>
          </Pressable>
        </View>

        {/* Features List */}
        <View style={{ marginTop: 40, width: "100%", paddingHorizontal: 20 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <View
              style={{
                backgroundColor: colors.success + "20",
                marginRight: 12,
                width: 32,
                height: 32,
                borderRadius: 16,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text style={{ color: colors.success, fontSize: 16 }}>✓</Text>
            </View>
            <Text style={[styles.body, { color: colors.textSecondary }]}>
              {t("auth.connection.features.planning")}
            </Text>
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <View
              style={{
                backgroundColor: colors.info + "20",
                marginRight: 12,
                width: 32,
                height: 32,
                borderRadius: 16,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text style={{ color: colors.info, fontSize: 16 }}>📱</Text>
            </View>
            <Text style={[styles.body, { color: colors.textSecondary }]}>
              {t("auth.connection.features.realtime")}
            </Text>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View
              style={{
                backgroundColor: colors.warning + "20",
                marginRight: 12,
                width: 32,
                height: 32,
                borderRadius: 16,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text style={{ color: colors.warning, fontSize: 16 }}>🚛</Text>
            </View>
            <Text style={[styles.body, { color: colors.textSecondary }]}>
              {t("auth.connection.features.management")}
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default ConnectionScreen;
