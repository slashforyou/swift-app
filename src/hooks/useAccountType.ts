import { useMemo } from "react";
import { AccountType } from "../services/user";
import { useUserProfile } from "./useUserProfile";

interface UseAccountTypeReturn {
  accountType: AccountType | null;
  isOwner: boolean;
  isEmployee: boolean;
  isContractor: boolean;
  isLoading: boolean;
}

/**
 * Retourne le type de compte de l'utilisateur connecté et des helpers boolean.
 * Source : profile.account_type exposé par le JWT via /v1/users/me.
 */
export function useAccountType(): UseAccountTypeReturn {
  const { profile, isLoading } = useUserProfile();

  return useMemo(() => {
    const accountType = profile?.account_type ?? null;
    return {
      accountType,
      isOwner: accountType === "business_owner",
      isEmployee: accountType === "employee",
      isContractor: accountType === "contractor",
      isLoading,
    };
  }, [profile?.account_type, isLoading]);
}
