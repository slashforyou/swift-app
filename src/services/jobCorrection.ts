/**
 * Job Correction Service
 *
 * Service pour envoyer les incohérences détectées au serveur
 * et recevoir les corrections automatiques
 */

import { API_URL } from "../config/environment";
import { JobInconsistency } from "../utils/jobValidation";

const API_BASE_URL = `${API_URL}v1`;

export interface CorrectionRequest {
  jobId: string | number;
  jobCode?: string;
  detectedAt: string;
  inconsistencies: JobInconsistency[];
  appVersion: string;
  platform: string;
}

export interface CorrectionDetail {
  type: string;
  applied: boolean;
  action: string;
  timestamp: string;
  error?: string;
}

export interface CorrectionResponse {
  success: boolean;
  fixed: boolean;
  corrections: CorrectionDetail[];
  job?: any; // Job corrigé
  error?: string;
  message?: string;
}

/**
 * Extraire l'ID numérique d'un job code
 * Exemples:
 * - "JOB-DEC-002" → "2"
 * - "2" → "2"
 * - "JOB-NERD-PENDING-042" → "42"
 */
function extractNumericId(jobCode: string): string {
  // Si déjà numérique, retourner tel quel
  if (/^\d+$/.test(jobCode)) {
    return jobCode;
  }

  // Extraire le dernier groupe de chiffres
  const match = jobCode.match(/(\d+)$/);
  if (match) {
    // Convertir en nombre puis string pour enlever les zéros de tête
    return String(parseInt(match[1], 10));
  }

  // Si aucun nombre trouvé, retourner tel quel (le serveur gérera l'erreur)
  return jobCode;
}

/**
 * Récupérer le token d'authentification
 */
async function getAuthToken(): Promise<string> {
  try {
    const AsyncStorage =
      require("@react-native-async-storage/async-storage").default;
    const token = await AsyncStorage.getItem("@auth_token");
    return token || "";
  } catch (error) {
    console.error("❌ [JobCorrection] Failed to get auth token:", error);
    return "";
  }
}

/**
 * Récupérer la version de l'app
 */
function getAppVersion(): string {
  try {
    const packageJson = require("../../package.json");
    return packageJson.version || "1.0.0";
  } catch (error) {
    return "1.0.0";
  }
}

/**
 * Récupérer la plateforme
 */
function getPlatform(): string {
  try {
    const { Platform } = require("react-native");
    return Platform.OS; // 'ios' ou 'android'
  } catch (error) {
    return "unknown";
  }
}

/**
 * Envoyer les incohérences au serveur pour correction automatique
 *
 * @param jobId - ID ou code du job
 * @param inconsistencies - Liste des incohérences détectées (filtrées sur serverCorrectable)
 * @returns Réponse du serveur avec les corrections appliquées et le job corrigé
 */
export async function requestServerCorrection(
  jobId: string | number,
  inconsistencies: JobInconsistency[],
): Promise<CorrectionResponse> {
  // Filtrer uniquement les incohérences corrigeables par le serveur
  const serverCorrectableIssues = inconsistencies.filter(
    (inc) => inc.serverCorrectable === true,
  );

  if (serverCorrectableIssues.length === 0) {
    return {
      success: true,
      fixed: false,
      corrections: [],
      message: "No server corrections needed",
    };
  }

  // Extraire l'ID numérique
  const numericId = extractNumericId(String(jobId));

  // Préparer la requête
  const request: CorrectionRequest = {
    jobId: numericId,
    jobCode:
      typeof jobId === "string" && jobId !== numericId ? jobId : undefined,
    detectedAt: new Date().toISOString(),
    inconsistencies: serverCorrectableIssues,
    appVersion: getAppVersion(),
    platform: getPlatform(),
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔍 LOG 1: Configuration et Contexte
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  try {
    const token = await getAuthToken();
    const url = `${API_BASE_URL}/job/${numericId}/fix-inconsistencies`;

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🔍 LOG 2: URL et Payload
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🔍 LOG 3: Avant Fetch
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const startTime = Date.now();

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        "X-Request-ID": `${Date.now()}-${Math.random().toString(36).substring(7)}`,
      },
      body: JSON.stringify(request),
    });

    const duration = Date.now() - startTime;

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🔍 LOG 4: Response Status et Headers
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    // Log tous les headers (compatibilité React Native)
    const headers: any = {};
    if (response.headers) {
      if (typeof response.headers.forEach === "function") {
        response.headers.forEach((value: string, key: string) => {
          headers[key] = value;
        });
      } else {
        // Fallback si forEach n'existe pas
      }
    }

    if (!response.ok) {
      const errorText = await response.text();

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // 🔍 LOG 5: Error Response
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      console.error("❌ [JobCorrection] HTTP ERROR");
      console.error(
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
      );
      console.error("Status:", response.status, response.statusText);
      console.error("Error Body:", errorText);

      return {
        success: false,
        fixed: false,
        corrections: [],
        error: `Server error: ${response.status} - ${errorText}`,
      };
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🔍 LOG 5: Raw Response Body
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const responseText = await response.text();

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🔍 LOG 6: Parsed Data
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    let data: CorrectionResponse;
    try {
      data = JSON.parse(responseText);
    } catch (parseError: any) {
      console.error("❌ [JobCorrection] JSON PARSE ERROR");
      console.error(
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
      );
      console.error("Parse Error:", parseError.message);
      console.error(
        "Raw text (first 200 chars):",
        responseText.substring(0, 200),
      );
      throw new Error(`Failed to parse JSON response: ${parseError.message}`);
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🔍 LOG 7: Analyse Détaillée des Corrections
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    if (Array.isArray(data.corrections)) {

      if (data.corrections.length === 0) {
      } else {
        // Analyser chaque correction
        data.corrections.forEach((correction, index) => {
          if (correction.error) {
          }
        });


        const appliedCount = data.corrections.filter((c) => c.applied).length;
        const forcedCount = data.corrections.filter(
          (c) => (c as any).forced,
        ).length;
        const errorCount = data.corrections.filter((c) => c.error).length;


        if (appliedCount === 0) {
        }

        if (forcedCount === 0 && appliedCount > 0) {
        }

        if (appliedCount > 0 && forcedCount > 0) {
        }
      }
    } else {
      console.error("❌ [JobCorrection] Corrections is not an array!");
      console.error("Type:", typeof data.corrections);
      console.error("Value:", data.corrections);
    }

    // Log du job corrigé si présent
    if (data.job) {
    }

    // Message et erreur éventuels
    if (data.message) {
    }
    if (data.error) {
      console.error("\n❌ [JobCorrection] Error:", data.error);
    }


    // Ancien code de log simplifié (gardé pour compatibilité)
    if (data.success && data.fixed) {
    } else if (data.success && !data.fixed) {
    } else {
    }

    return data;
  } catch (error: any) {
    console.error("❌ [JobCorrection] EXCEPTION CAUGHT");
    console.error("Error Type:", error.constructor.name);
    console.error("Error Message:", error.message);
    console.error("Error Stack:", error.stack);

    return {
      success: false,
      fixed: false,
      corrections: [],
      error: error.message || "Network error or server unreachable",
    };
  }
}

/**
 * Vérifier si une incohérence est corrigeable par le serveur
 */
export function isServerCorrectable(inconsistency: JobInconsistency): boolean {
  return (
    inconsistency.serverCorrectable === true && !!inconsistency.correctionType
  );
}

/**
 * Filtrer les incohérences corrigeables par le serveur
 */
export function filterServerCorrectableIssues(
  inconsistencies: JobInconsistency[],
): JobInconsistency[] {
  return inconsistencies.filter(isServerCorrectable);
}

/**
 * Formater les corrections pour affichage user-friendly
 */
export function formatCorrections(corrections: CorrectionDetail[]): string {
  if (corrections.length === 0) {
    return "Aucune correction appliquée";
  }

  return corrections
    .filter((c) => c.applied)
    .map((c) => `✓ ${c.action}`)
    .join("\n");
}
