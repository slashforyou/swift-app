import * as Network from "expo-network";
import { useEffect, useRef, useState } from "react";

export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean;
  networkType: string | null;
}

const POLL_INTERVAL = 5000;

async function fetchNetworkStatus(): Promise<NetworkStatus> {
  try {
    const state = await Network.getNetworkStateAsync();
    return {
      isConnected: state.isConnected ?? false,
      isInternetReachable: state.isInternetReachable ?? false,
      networkType: state.type ?? null,
    };
  } catch {
    // Fail open — assume connected to avoid false offline banners
    return { isConnected: true, isInternetReachable: true, networkType: null };
  }
}

export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>({
    isConnected: true,
    isInternetReachable: true,
    networkType: null,
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetchNetworkStatus().then(setStatus);

    intervalRef.current = setInterval(() => {
      fetchNetworkStatus().then(setStatus);
    }, POLL_INTERVAL);

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return status;
}

export default useNetworkStatus;
