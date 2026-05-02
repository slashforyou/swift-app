/**
 * Patch modularTemplates.js :
 * 1. formatTemplate : inclure service_type dans les segments
 * 2. createModularTemplate : sauvegarder service_type
 * 3. updateModularTemplate : sauvegarder service_type
 */
const fs = require('fs');
const path = require('path');
const FILE = path.join(__dirname, 'endPoints/v1/modularTemplates.js');
let content = fs.readFileSync(FILE, 'utf8');
const original = content;

// 1. formatTemplate — inclure service_type dans les segments
content = content.replace(
  `    segments: segments.map(s => ({
      id: String(s.id),
      order: s.segment_order,
      type: s.type,
      label: s.label || '',
      locationType: s.location_type || undefined,
      isBillable: !!s.is_billable,
    })),`,
  `    segments: segments.map(s => ({
      id: String(s.id),
      order: s.segment_order,
      type: s.type,
      serviceType: s.service_type || undefined,
      label: s.label || '',
      locationType: s.location_type || undefined,
      isBillable: !!s.is_billable,
    })),`
);

// 2. createModularTemplate — INSERT segment avec service_type
// Chercher le INSERT INTO job_template_segments dans la fonction create
content = content.replace(
  `        await connection.execute(
          \`INSERT INTO job_template_segments
           (template_id, segment_order, type, label, location_type, is_billable, estimated_duration_minutes)
           VALUES (?, ?, ?, ?, ?, ?, ?)\`,
          [templateId, i + 1, seg.type, seg.label || '', seg.locationType || null,
           seg.isBillable !== false ? 1 : 0, seg.estimatedDurationMinutes || null]
        );`,
  `        await connection.execute(
          \`INSERT INTO job_template_segments
           (template_id, segment_order, type, service_type, label, location_type, is_billable, estimated_duration_minutes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)\`,
          [templateId, i + 1, seg.type, seg.serviceType || null, seg.label || '', seg.locationType || null,
           seg.isBillable !== false ? 1 : 0, seg.estimatedDurationMinutes || null]
        );`
);

if (content === original) {
  // Peut-être que le INSERT dans create a une syntaxe légèrement différente — chercher autrement
  console.warn('⚠️  Pattern INSERT exact non trouvé, tentative avec regex...');
  const insertRegex = /INSERT INTO job_template_segments\s*\n\s*\(template_id, segment_order, type, label, location_type, is_billable, estimated_duration_minutes\)\s*\n\s*VALUES \(\?, \?, \?, \?, \?, \?, \?\)/g;
  if (insertRegex.test(content)) {
    content = content.replace(insertRegex,
      'INSERT INTO job_template_segments\n           (template_id, segment_order, type, service_type, label, location_type, is_billable, estimated_duration_minutes)\n           VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    console.log('✅ INSERT segment patché via regex');
  } else {
    console.error('❌ Pattern INSERT segment non trouvé');
  }
}

if (content !== original) {
  fs.writeFileSync(FILE, content, 'utf8');
  console.log('✅ modularTemplates.js patché avec service_type');
} else {
  console.error('❌ modularTemplates.js non modifié');
}
