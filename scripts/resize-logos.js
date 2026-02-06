/**
 * Script de redimensionnement des logos pour Expo
 *
 * Tailles générées :
 * - 1024x1024 : Icônes principales (iOS, Android, Splash)
 * - 512x512 : Taille intermédiaire
 * - 432x432 : Android Adaptive Icon (recommandé)
 * - 192x192 : Icônes petites tailles
 *
 * Usage: node scripts/resize-logos.js
 */

const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

// Chemins
const ASSETS_DIR = path.join(__dirname, "../assets/images");

// Configurations de redimensionnement
const SIZES = {
  xlarge: 1024, // Icône principale (recommandé par Apple/Expo)
  large: 512, // Taille intermédiaire
  adaptive: 432, // Android Adaptive Icon (spécifique)
  medium: 192, // Petites icônes
};

// Types de logos à traiter
const LOGO_TYPES = [
  { base: "logo", name: "Logo seul" },
  { base: "logo-nom", name: "Logo + Nom" },
  { base: "logo-rectangle", name: "Logo Rectangle" },
  { base: "logo-dark", name: "Logo seul (dark)" },
  { base: "logo-nom-dark", name: "Logo + Nom (dark)" },
  { base: "logo-rectangle-dark", name: "Logo Rectangle (dark)" },
];

/**
 * Redimensionne une image vers une taille spécifique
 */
async function resizeImage(inputPath, outputPath, size) {
  try {
    await sharp(inputPath)
      .resize(size, size, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 }, // Fond transparent
      })
      .png({ quality: 100, compressionLevel: 9 })
      .toFile(outputPath);

    console.log(`✅ ${path.basename(outputPath)} créé (${size}x${size})`);
    return true;
  } catch (error) {
    console.error(
      `❌ Erreur avec ${path.basename(inputPath)}: ${error.message}`,
    );
    return false;
  }
}

/**
 * Trouve le fichier source le plus grand disponible
 */
function findLargestSource(baseName) {
  const possibleSizes = [1024, 512, 192];

  for (const size of possibleSizes) {
    const filePath = path.join(ASSETS_DIR, `${baseName}-${size}.png`);
    if (fs.existsSync(filePath)) {
      return { path: filePath, size };
    }
  }

  // Essayer sans suffixe de taille (fichiers originaux)
  const originalPath = path.join(ASSETS_DIR, `${baseName}.png`);
  if (fs.existsSync(originalPath)) {
    return { path: originalPath, size: null };
  }

  return null;
}

/**
 * Traite un type de logo
 */
async function processLogoType(logoType) {
  console.log(`\n📸 Traitement: ${logoType.name} (${logoType.base})`);

  // Trouver la source la plus grande
  const source = findLargestSource(logoType.base);

  if (!source) {
    console.log(`⚠️  Aucun fichier source trouvé pour ${logoType.base}`);
    return;
  }

  console.log(
    `   Source: ${path.basename(source.path)} ${source.size ? `(${source.size}px)` : "(original)"}`,
  );

  // Générer toutes les tailles
  const promises = [];

  for (const [sizeName, sizeValue] of Object.entries(SIZES)) {
    // Skip si on redimensionne vers une taille identique ou plus grande que la source
    if (source.size && sizeValue >= source.size) {
      console.log(`   ⏭️  ${sizeValue}px : déjà existant ou trop grand`);
      continue;
    }

    const outputPath = path.join(
      ASSETS_DIR,
      `${logoType.base}-${sizeValue}.png`,
    );

    // Skip si le fichier existe déjà
    if (fs.existsSync(outputPath)) {
      console.log(`   ✓  ${sizeValue}px : existe déjà`);
      continue;
    }

    promises.push(resizeImage(source.path, outputPath, sizeValue));
  }

  if (promises.length > 0) {
    await Promise.all(promises);
  } else {
    console.log(`   ℹ️  Toutes les tailles existent déjà`);
  }
}

/**
 * Fonction principale
 */
async function main() {
  console.log("🎨 Script de redimensionnement des logos Cobbr\n");
  console.log("📁 Dossier:", ASSETS_DIR);
  console.log("🎯 Tailles cibles:", Object.values(SIZES).join("px, ") + "px\n");
  console.log("─".repeat(60));

  // Vérifier que sharp est installé
  try {
    require.resolve("sharp");
  } catch (e) {
    console.error('\n❌ ERREUR: Le package "sharp" n\'est pas installé!');
    console.error("📦 Installez-le avec: npm install --save-dev sharp\n");
    process.exit(1);
  }

  // Traiter chaque type de logo
  let totalProcessed = 0;
  for (const logoType of LOGO_TYPES) {
    await processLogoType(logoType);
    totalProcessed++;
  }

  console.log("\n" + "─".repeat(60));
  console.log(`\n✨ Terminé! ${totalProcessed} types de logos traités.`);
  console.log("\n📋 Prochaines étapes:");
  console.log("   1. Vérifiez les images générées dans assets/images/");
  console.log(
    "   2. Mettez à jour app.json avec les nouvelles tailles (1024px)",
  );
  console.log("   3. Lancez: npx expo prebuild --clean");
  console.log("   4. Testez avec: npx expo run:android ou npx expo run:ios\n");
}

// Exécution
main().catch((error) => {
  console.error("\n❌ Erreur fatale:", error);
  process.exit(1);
});
