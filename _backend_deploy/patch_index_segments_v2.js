/**
 * Patch index.js :
 * 1. Déstructurer les nouveaux exports de jobSegments.js
 * 2. Ajouter les routes PATCH/DELETE/POST-add pour les segments
 */
const fs = require('fs');
const path = require('path');
const FILE = path.join(__dirname, 'index.js');
let content = fs.readFileSync(FILE, 'utf8');
const original = content;

// 1. Mettre à jour la destructuration des exports jobSegments
const oldDestructure = `const { initJobSegments, getJobSegments, startSegment, completeSegment, assignEmployeesToSegment, updateReturnTrip, getFlatRateOptions, updateFlatRateOptions } = require('./endPoints/v1/jobSegments');`;
const newDestructure = `const { initJobSegments, getJobSegments, startSegment, completeSegment, assignEmployeesToSegment, updateReturnTrip, getFlatRateOptions, updateFlatRateOptions, updateJobSegment, deleteJobSegment, addCustomSegment } = require('./endPoints/v1/jobSegments');`;

if (content.includes(oldDestructure)) {
  content = content.replace(oldDestructure, newDestructure);
  console.log('✅ Destructuration jobSegments mise à jour');
} else {
  // Chercher une version multi-ligne
  const multiLinePattern = /const \{[^}]*initJobSegments[^}]*\} = require\('\.\/endPoints\/v1\/jobSegments'\);/s;
  if (multiLinePattern.test(content)) {
    content = content.replace(multiLinePattern, newDestructure);
    console.log('✅ Destructuration jobSegments mise à jour (multi-ligne)');
  } else {
    console.warn('⚠️  Pattern destructuration jobSegments non trouvé');
  }
}

// 2. Ajouter les nouvelles routes après la dernière route existante des segments
const lastSegmentRoute = `app.put('/swift-app/v1/jobs/:id/segments/:segId/employees', authenticateToken, assignEmployeesToSegment);`;
const newRoutes = `app.put('/swift-app/v1/jobs/:id/segments/:segId/employees', authenticateToken, assignEmployeesToSegment);

// 🧩 Segment management — modify/delete future segments, add custom segment
app.patch('/swift-app/v1/jobs/:id/segments/:segId', authenticateToken, updateJobSegment);
app.delete('/swift-app/v1/jobs/:id/segments/:segId', authenticateToken, deleteJobSegment);
app.post('/swift-app/v1/jobs/:id/segments/add', authenticateToken, addCustomSegment);`;

if (content.includes(lastSegmentRoute) && !content.includes('app.patch(\'/swift-app/v1/jobs/:id/segments/:segId\'')) {
  content = content.replace(lastSegmentRoute, newRoutes);
  console.log('✅ Nouvelles routes segments ajoutées');
} else if (content.includes('app.patch(\'/swift-app/v1/jobs/:id/segments/:segId\'')) {
  console.log('ℹ️  Routes PATCH/DELETE segments déjà présentes');
} else {
  console.error('❌ Ancre lastSegmentRoute non trouvée');
}

if (content === original) {
  console.error('❌ index.js non modifié');
  process.exit(1);
}
fs.writeFileSync(FILE, content, 'utf8');
console.log('✅ index.js patché avec nouvelles routes segments');
