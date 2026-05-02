/**
 * Patch calendarDays.js — exclure les jobs archivés/supprimés de toutes les requêtes
 * 
 * Ajoute AND j.status NOT IN ('archived', 'deleted') à chaque clause WHERE
 * pour les 3 niveaux de détail (JOUR, MOIS, ANNÉE) × 2 rôles (Manager, Employee).
 * 
 * Usage: node patch_calendar_archived.js
 */

const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'endPoints/calendarDays.js');

let content = fs.readFileSync(FILE, 'utf8');
const original = content;

// Remplace 1: JOUR Manager — WHERE inline sur ligne du LEFT JOIN
// Pattern: ) WHERE (j.contractee_company_id = ? OR j.contractor_company_id = ?)\n      AND (
content = content.replace(
  ') WHERE (j.contractee_company_id = ? OR j.contractor_company_id = ?)\n                      AND (',
  ') WHERE (j.contractee_company_id = ? OR j.contractor_company_id = ?)\n                      AND j.status NOT IN (\'archived\', \'deleted\')\n                      AND ('
);

// Remplace 2 & 3: MOIS + ANNÉE Manager — WHERE standard multi-ligne
// Pattern: WHERE (j.contractee_company_id = ? OR j.contractor_company_id = ?)\n      AND (
const managerPattern = /WHERE \(j\.contractee_company_id = \? OR j\.contractor_company_id = \?\)\n(\s+)AND \(/g;
content = content.replace(managerPattern, (match, spaces) => {
  return `WHERE (j.contractee_company_id = ? OR j.contractor_company_id = ?)\n${spaces}AND j.status NOT IN ('archived', 'deleted')\n${spaces}AND (`;
});

// Remplace 4, 5, 6: Employee (tous niveaux) — WHERE ju.user_id = ? AND (
const employeePattern = /WHERE ju\.user_id = \?\n(\s+)AND \(/g;
content = content.replace(employeePattern, (match, spaces) => {
  return `WHERE ju.user_id = ?\n${spaces}AND j.status NOT IN ('archived', 'deleted')\n${spaces}AND (`;
});

if (content === original) {
  console.error('❌ Aucune modification apportée — patterns non trouvés. Vérifier le fichier.');
  process.exit(1);
}

// Compter les occurrences ajoutées
const count = (content.match(/NOT IN \('archived', 'deleted'\)/g) || []).length;
console.log(`✅ ${count} filtres ajoutés dans calendarDays.js`);

fs.writeFileSync(FILE, content, 'utf8');
console.log('✅ calendarDays.js mis à jour');
