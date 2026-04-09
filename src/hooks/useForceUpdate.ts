import * as Updates from "expo-updates";
import { useCallback, useEffect, useState } from "react";
import { logInfo } from "../services/simpleSessionLogger";

export type UpdateStatus =
  | "idle"
  | "checking"
  | "downloading"
  | "ready"
  | "error"
  | "upToDate";

/**
 * Hook that checks for OTA updates on mount and forces reload when available.
 * Shows a blocking UI while the update is being downloaded.
 */
export function useForceUpdate() {
  const [status, setStatus] = useState<UpdateStatus>("idle");
  const [progress, setProgress] = useState<string>("");

  const checkAndUpdate = useCallback(async () => {
    // Skip in dev mode (expo-updates is not available in Expo Go / dev client)
    if (__DEV__ || !Updates.isEnabled) {
      setStatus("upToDate");
      return;
    }

    try {
      setStatus("checking");
      logInfo("Checking for OTA updates...", "ota-update");

      const update = await Updates.checkForUpdateAsync();

      if (!update.isAvailable) {
        logInfo("App is up to date", "ota-update");
        setStatus("upToDate");
        return;
      }

      // Update available — download it
      setStatus("downloading");
      setProgress("Downloading update...");
      logInfo("OTA update available, downloading...", "ota-update");

      const result = await Updates.fetchUpdateAsync();

      if (result.isNew) {
        setStatus("ready");
        logInfo("OTA update downloaded, reloading app...", "ota-update");

        // Small delay so the user sees the "ready" state before reload
        await new Promise((resolve) => setTimeout(resolve, 500));
        await Updates.reloadAsync();
      } else {
        setStatus("upToDate");
      }
    } catch (error) {
      logInfo(
        `OTA update check failed: ${error instanceof Error ? error.message : String(error)}`,
        "ota-update",
      );
      // Don't block the app if update check fails
      setStatus("upToDate");
    }
  }, []);

  useEffect(() => {
    checkAndUpdate();
  }, [checkAndUpdate]);

  return { status, progress };
}
