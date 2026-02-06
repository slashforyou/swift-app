/**
 * Script de test - Appel API pour voir les données réelles retournées
 * Usage:
 *   1. Récupérer votre token depuis l'app (ouvrez React Native Debugger)
 *   2. Exécutez: TOKEN="votre_token" node scripts/test-job-api.js
 *   OU éditez directement la variable TOKEN ci-dessous
 */

const API_URL = "https://altivo.fr/swift-app/";

// ⚠️ REMPLACER PAR VOTRE TOKEN OU UTILISER LA VARIABLE D'ENVIRONNEMENT
const TOKEN = process.env.TOKEN || "REMPLACER_PAR_VOTRE_TOKEN";

// Fonction pour faire un appel GET
async function testJobDetailsAPI(jobCode) {
  console.log(`\n🔍 Test de l'API pour le job: ${jobCode}\n`);

  const url = `${API_URL}v1/job/${jobCode}/full`;
  console.log(`📡 URL: ${url}\n`);

  try {
    const headers = {
      "Content-Type": "application/json",
    };

    // Ajouter le token si disponible
    if (TOKEN && TOKEN !== "REMPLACER_PAR_VOTRE_TOKEN") {
      headers["Authorization"] = `Bearer ${TOKEN}`;
      console.log("🔑 Token d'authentification inclus\n");
    } else {
      console.log("⚠️ PAS DE TOKEN - L'API retournera probablement 401\n");
      console.log("💡 Pour utiliser un token, éditez le script ou utilisez:");
      console.log('   TOKEN="votre_token" node scripts/test-job-api.js\n');
    }

    const response = await fetch(url, {
      method: "GET",
      headers,
    });

    console.log(`📊 Status: ${response.status} ${response.statusText}\n`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Erreur API:", errorText);
      return;
    }

    const data = await response.json();

    // Afficher la structure complète
    console.log("✅ Réponse complète:");
    console.log(JSON.stringify(data, null, 2));

    // Vérifier spécifiquement les données qui nous intéressent
    console.log("\n\n🔎 Vérification des données d'ownership:\n");

    if (data?.data?.job) {
      const job = data.data.job;

      console.log("✅ Champs présents:");
      console.log("  - job.id:", job.id);
      console.log("  - job.code:", job.code);
      console.log("  - job.status:", job.status);

      console.log("\n❓ Champs ownership recherchés:");
      console.log(
        "  - job.assignment_status:",
        job.assignment_status || "❌ MANQUANT",
      );
      console.log(
        "  - job.contractee:",
        job.contractee ? "✅ PRÉSENT" : "❌ MANQUANT",
      );
      console.log(
        "  - job.contractor:",
        job.contractor ? "✅ PRÉSENT" : "❌ MANQUANT",
      );
      console.log(
        "  - job.permissions:",
        job.permissions ? "✅ PRÉSENT" : "❌ MANQUANT",
      );

      if (job.contractee) {
        console.log("\n📦 Détails contractee:");
        console.log(JSON.stringify(job.contractee, null, 2));
      }

      if (job.contractor) {
        console.log("\n📦 Détails contractor:");
        console.log(JSON.stringify(job.contractor, null, 2));
      }

      if (job.permissions) {
        console.log("\n🔐 Permissions:");
        console.log(JSON.stringify(job.permissions, null, 2));
      }
    }
  } catch (error) {
    console.error("❌ Erreur:", error.message);
  }
}

// Test avec plusieurs job codes possibles
async function runTests() {
  // Exemples de job codes à tester (tu peux les remplacer par des vrais)
  const testJobCodes = [
    "JOB-TEST-20260124-947", // Exemple du code
    "#LM123", // Exemple de la doc
    "1", // ID simple
  ];

  console.log("🚀 Démarrage des tests API\n");
  console.log("================================================");

  for (const jobCode of testJobCodes) {
    await testJobDetailsAPI(jobCode);
    console.log("\n================================================\n");
  }
}

// Exécution
runTests().catch(console.error);
