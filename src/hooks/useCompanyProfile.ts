/**
 * useCompanyProfile
 *
 * Récupère le profil de l'entreprise connectée, notamment le company_code.
 * GET /api/companies/me
 */
import { useCallback, useEffect, useState } from "react";
import { ServerData } from "../constants/ServerData";
import { useTheme } from "../context/ThemeProvider";
import { logger } from "../services/logger";
import { authenticatedFetch } from "../utils/auth";

const API = ServerData.serverUrl;

export interface CompanyProfile {
  id: number;
  name: string;
  company_code: string;
  abn?: string;
  email?: string;
  phone?: string;
  address?: string;
  logo_url?: string;
  primary_color?: string | null;
}

interface UseCompanyProfileResult {
  profile: CompanyProfile | null;
  companyCode: string | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useCompanyProfile(): UseCompanyProfileResult {
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setCompanyColor } = useTheme();

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authenticatedFetch(`${API}v1/companies/me`, {
        method: "GET",
      });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(
          json?.message ??
            `Failed to load company profile (${response.status})`,
        );
      }

      const data = json.data as CompanyProfile;
      setProfile(data);
      // Sync company brand color to theme
      if (data.primary_color) {
        setCompanyColor(data.primary_color);
      }
    } catch (e: any) {
      logger.warn("[useCompanyProfile] failed", e?.message);
      setError(e?.message ?? "Failed to load company profile");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return {
    profile,
    companyCode: profile?.company_code ?? null,
    isLoading,
    error,
    refresh: load,
  };
}
