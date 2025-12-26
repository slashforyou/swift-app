// utils/device.ts
import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Application from "expo-application";
import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";
import Constants from "expo-constants";

const SECURE_OPTS: SecureStore.SecureStoreOptions = Platform.select({
  ios:  { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY },
  android: {}, // EncryptedSharedPreferences par défaut
  default: {}
})!;

export async function getOrCreateLocalDeviceKey() {
  let key = await SecureStore.getItemAsync("device_key");
  if (!key) {
    // 32 octets aléatoires, encodés en hex
    key = Array.from(await Crypto.getRandomBytesAsync(32))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");
    await SecureStore.setItemAsync("device_key", key, SECURE_OPTS);
  }
  return key;
}

export async function collectDevicePayload() {
    // TEMP_DISABLED: console.log("Collecting device payload...");

  const localKey = await getOrCreateLocalDeviceKey();

  const fingerprintSource = JSON.stringify({
    brand: Device.brand,
    model: Device.modelName,
    os: Platform.OS,
    osVersion: Device.osVersion,
    appId: Application.applicationId,
    localKey, 
  });
  const fingerprint = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    fingerprintSource
  );

  const displayName =
    Device.deviceName ??
    Device.modelName ??
    `${Platform.OS} device`;

  const ua = `rn-expo/${Application.nativeApplicationVersion || "0"} (${Device.brand || ""} ${Device.modelName || ""}; ${Platform.OS}/${Device.osVersion || ""})`;

  return {
    name: displayName,
    platform: Platform.OS as "ios" | "android" | "web",
    ua,
    fingerprint,       // SHA-256 de l’empreinte
  };
}
