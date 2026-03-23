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
    console.log(
      "🔍 [JobCorrection] No server-correctable inconsistencies found",
    );
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
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("� [JobCorrection] DIAGNOSTIC START");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📋 Job ID (original):", jobId);
  console.log("📋 Job ID (numeric):", numericId);
  console.log("📋 Job Code:", request.jobCode || "N/A");
  console.log("🌐 API Base URL:", API_BASE_URL);
  console.log("📱 App Version:", request.appVersion);
  console.log("📱 Platform:", request.platform);
  console.log("📊 Inconsistencies Count:", serverCorrectableIssues.length);
  console.log(
    "📊 Inconsistencies Types:",
    serverCorrectableIssues.map((i) => i.type).join(", "),
  );

  try {
    const token = await getAuthToken();
    const url = `${API_BASE_URL}/job/${numericId}/fix-inconsistencies`;

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🔍 LOG 2: URL et Payload
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🎯 [JobCorrection] Full Endpoint URL:");
    console.log("   ", url);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("� [JobCorrection] Request Payload:");
    console.log(JSON.stringify(request, null, 2));
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(
      "🔑 [JobCorrection] Auth Token:",
      token ? `Present (${token.substring(0, 20)}...)` : "MISSING",
    );

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🔍 LOG 3: Avant Fetch
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const startTime = Date.now();
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("⏳ [JobCorrection] Sending POST request...");
    console.log("⏱️  Request started at:", new Date().toISOString());

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
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📡 [JobCorrection] Response Received");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📊 Status Code:", response.status, response.statusText);
    console.log("⏱️  Duration:", duration, "ms");
    console.log("⏱️  Response received at:", new Date().toISOString());
    console.log("📦 Response Headers:");

    // Log tous les headers (compatibilité React Native)
    const headers: any = {};
    if (response.headers) {
      if (typeof response.headers.forEach === "function") {
        response.headers.forEach((value: string, key: string) => {
          headers[key] = value;
          console.log(`   ${key}: ${value}`);
        });
      } else {
        // Fallback si forEach n'existe pas
        console.log("   (Headers object present but forEach not available)");
      }
    }

    if (!response.ok) {
      const errorText = await response.text();

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // 🔍 LOG 5: Error Response
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.error("❌ [JobCorrection] HTTP ERROR");
      console.error(
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
      );
      console.error("Status:", response.status, response.statusText);
      console.error("Error Body:", errorText);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

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
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📦 [JobCorrection] Raw Response Body:");
    console.log(responseText);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🔍 LOG 6: Parsed Data
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    let data: CorrectionResponse;
    try {
      data = JSON.parse(responseText);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("✅ [JobCorrection] JSON Parsed Successfully");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("📦 Parsed Response Object:");
      console.log(JSON.stringify(data, null, 2));
    } catch (parseError: any) {
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.error("❌ [JobCorrection] JSON PARSE ERROR");
      console.error(
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
      );
      console.error("Parse Error:", parseError.message);
      console.error(
        "Raw text (first 200 chars):",
        responseText.substring(0, 200),
      );
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      throw new Error(`Failed to parse JSON response: ${parseError.message}`);
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🔍 LOG 7: Analyse Détaillée des Corrections
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🔧 [JobCorrection] CORRECTIONS ANALYSIS");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📊 Response success:", data.success ? "✅ TRUE" : "❌ FALSE");
    console.log("📊 Response fixed:", data.fixed ? "✅ TRUE" : "❌ FALSE");
    console.log(
      "📊 Corrections array present:",
      Array.isArray(data.corrections) ? "✅ YES" : "❌ NO",
    );

    if (Array.isArray(data.corrections)) {
      console.log("📊 Corrections count:", data.corrections.length);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

      if (data.corrections.length === 0) {
        console.warn("⚠️  [JobCorrection] CORRECTIONS ARRAY IS EMPTY!");
        console.warn("⚠️  Backend returned 200 OK but no corrections applied.");
        console.warn("⚠️  This indicates:");
        console.warn(
          "    1. Backend may still have conditional checks (if statements)",
        );
        console.warn("    2. Or corrections were skipped for another reason");
        console.warn("    3. Or wrong endpoint was called");
      } else {
        // Analyser chaque correction
        data.corrections.forEach((correction, index) => {
          console.log(`\n🔧 Correction #${index + 1}:`);
          console.log("   Type:", correction.type || "N/A");
          console.log("   Applied:", correction.applied ? "✅ YES" : "❌ NO");
          console.log(
            "   Forced:",
            (correction as any).forced ? "✅ YES" : "⚠️  NO",
          );
          console.log("   Action:", correction.action || "N/A");
          console.log("   Timestamp:", correction.timestamp || "N/A");
          if (correction.error) {
            console.log("   Error:", correction.error);
          }
        });

        console.log(
          "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
        );
        console.log("📊 CORRECTIONS SUMMARY:");
        console.log(
          "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
        );

        const appliedCount = data.corrections.filter((c) => c.applied).length;
        const forcedCount = data.corrections.filter(
          (c) => (c as any).forced,
        ).length;
        const errorCount = data.corrections.filter((c) => c.error).length;

        console.log("   Total corrections:", data.corrections.length);
        console.log(
          "   Applied:",
          appliedCount,
          "/",
          data.corrections.length,
          appliedCount === data.corrections.length ? "✅" : "⚠️",
        );
        console.log(
          "   Forced:",
          forcedCount,
          "/",
          data.corrections.length,
          forcedCount > 0 ? "✅" : "⚠️",
        );
        console.log("   Errors:", errorCount, errorCount === 0 ? "✅" : "❌");

        if (appliedCount === 0) {
          console.log("\n❌❌❌ CRITICAL ISSUE ❌❌❌");
          console.log("NO CORRECTIONS WERE APPLIED!");
          console.log(
            "Backend returned corrections array but all have applied=false",
          );
          console.log("Possible causes:");
          console.log(
            "1. Backend code still has conditional checks (if statements)",
          );
          console.log("2. Database transaction failed");
          console.log("3. Wrong job ID or job not found");
          console.log("4. Permission issues");
        }

        if (forcedCount === 0 && appliedCount > 0) {
          console.log("\n⚠️⚠️⚠️ WARNING ⚠️⚠️⚠️");
          console.log(
            'Corrections were applied but WITHOUT the "forced" flag!',
          );
          console.log(
            "This means backend may not be using the latest corrected code.",
          );
          console.log("Expected: All corrections should have forced=true");
        }

        if (appliedCount > 0 && forcedCount > 0) {
          console.log("\n✅✅✅ SUCCESS ✅✅✅");
          console.log("Corrections were properly applied with forced flag!");
          console.log("Backend is using the corrected code.");
        }
      }
    } else {
      console.error("❌ [JobCorrection] Corrections is not an array!");
      console.error("Type:", typeof data.corrections);
      console.error("Value:", data.corrections);
    }

    // Log du job corrigé si présent
    if (data.job) {
      console.log(
        "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
      );
      console.log("📦 [JobCorrection] Corrected Job Data:");
      console.log(JSON.stringify(data.job, null, 2));
    }

    // Message et erreur éventuels
    if (data.message) {
      console.log("\n💬 [JobCorrection] Message:", data.message);
    }
    if (data.error) {
      console.error("\n❌ [JobCorrection] Error:", data.error);
    }

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🔍 [JobCorrection] DIAGNOSTIC END");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    // Ancien code de log simplifié (gardé pour compatibilité)
    if (data.success && data.fixed) {
      console.log("✅ [JobCorrection] Server fixed inconsistencies:", {
        correctionsCount: data.corrections.length,
        corrections: data.corrections.map((c) => c.action),
      });
    } else if (data.success && !data.fixed) {
      console.log(
        "ℹ️ [JobCorrection] Server analyzed but no corrections applied:",
        data.message,
      );
    } else {
      console.warn(
        "⚠️ [JobCorrection] Server could not fix inconsistencies:",
        data.error || data.message,
      );
    }

    return data;
  } catch (error: any) {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.error("❌ [JobCorrection] EXCEPTION CAUGHT");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.error("Error Type:", error.constructor.name);
    console.error("Error Message:", error.message);
    console.error("Error Stack:", error.stack);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🔍 [JobCorrection] DIAGNOSTIC END (WITH ERROR)");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

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
