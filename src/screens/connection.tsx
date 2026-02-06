import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Image,
    Pressable,
    Text,
    View,
    useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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
  const colorScheme = useColorScheme();
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
    return (
      <SafeAreaView style={styles.containerCentered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text
          style={[
            styles.body,
            { color: colors.textSecondary, marginTop: 16, textAlign: "center" },
          ]}
        >
          {t("common.loading")}
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.containerCentered}>
        {/* Logo Section */}
        <View
          style={{
            width: 200,
            height: 200,
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 30,
          }}
        >
          <Image
            source={
              colorScheme === "dark"
                ? require("../../assets/images/logo-nom-dark-512.png")
                : require("../../assets/images/logo-nom-512.png")
            }
            style={{
              width: 200,
              height: 200,
              resizeMode: "contain",
            }}
          />
        </View>

        {/* Welcome Text */}
        <Text style={[styles.title, { marginBottom: 8, textAlign: "center" }]}>
          {t("auth.connection.title")}
        </Text>

        <Text
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
        <View style={{ width: "100%", paddingHorizontal: 20, gap: 16 }}>
          <Pressable
            style={[styles.buttonPrimary, { width: "100%" }]}
            onPress={() => navigation.navigate("Login")}
          >
            <Text style={styles.buttonPrimaryText}>
              {t("auth.connection.loginButton")}
            </Text>
          </Pressable>

          <Pressable
            style={[styles.buttonSecondary, { width: "100%" }]}
            onPress={() => navigation.navigate("RegisterTypeSelection")}
          >
            <Text style={styles.buttonSecondaryText}>
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
