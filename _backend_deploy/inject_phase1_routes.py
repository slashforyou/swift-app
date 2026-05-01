#!/usr/bin/env python3
"""
inject_phase1_routes.py — Injection des routes Phase 1 dans index.js

Injecte le bloc de wiring pour les 6 nouveaux modules backend Phase 1 :
  - memberships
  - contractors
  - contractorProfile
  - jobContractors
  - clientInvoices
  - contractorPayables

Pattern : cherche le marqueur de fin des routes existantes (catchall 404 ou
commentaire sentinel), insère le bloc Phase 1 juste avant.

Usage : cd /srv/www/htdocs/swiftapp/server && python3 inject_phase1_routes.py
"""

import os
import sys

INDEX_PATH = os.path.join(os.path.dirname(__file__), "index.js")

PHASE1_BLOCK = """
// ──────────────────────────────────────────────────────────────────────────────
// PHASE 1 — Multi-account : memberships, contractors, billing, events
// Deploye le : voir _backend_deploy/noah_deploy_phase1.ps1
// ──────────────────────────────────────────────────────────────────────────────
const { loadUserContext }    = require('./middleware/loadUserContext');
const { requirePermission }  = require('./middleware/requirePermission');

// ── Memberships (equipe interne) ──────────────────────────────────────────────
const {
  listMemberships,
  inviteMember,
  updatePermissions,
  suspendMember,
} = require('./endPoints/v1/memberships/index');

app.get('/swift-app/v1/memberships',
  authenticateToken, loadUserContext,
  (req, res) => listMemberships(req, res));
app.post('/swift-app/v1/memberships/invite',
  authenticateToken, loadUserContext,
  (req, res) => inviteMember(req, res));
app.patch('/swift-app/v1/memberships/:id/permissions',
  authenticateToken, loadUserContext,
  (req, res) => updatePermissions(req, res));
app.delete('/swift-app/v1/memberships/:id',
  authenticateToken, loadUserContext,
  (req, res) => suspendMember(req, res));

// ── Contractors reseau ABN ────────────────────────────────────────────────────
const {
  listContractors,
  inviteContractor,
  updateContractorStatus,
} = require('./endPoints/v1/contractors/index');

app.get('/swift-app/v1/contractors',
  authenticateToken, loadUserContext,
  (req, res) => listContractors(req, res));
app.post('/swift-app/v1/contractors/invite',
  authenticateToken, loadUserContext,
  (req, res) => inviteContractor(req, res));
app.patch('/swift-app/v1/contractors/:id/status',
  authenticateToken, loadUserContext,
  (req, res) => updateContractorStatus(req, res));

// ── Profil contractor (self) ──────────────────────────────────────────────────
const {
  getContractorProfile,
  upsertContractorProfile,
} = require('./endPoints/v1/contractorProfile/index');

app.get('/swift-app/v1/contractor-profile',
  authenticateToken,
  (req, res) => getContractorProfile(req, res));
app.put('/swift-app/v1/contractor-profile',
  authenticateToken,
  (req, res) => upsertContractorProfile(req, res));

// ── Assignations job <-> contractor ──────────────────────────────────────────
const {
  assignContractor,
  respondToAssignment,
  listJobContractors,
} = require('./endPoints/v1/jobContractors/index');

// IMPORTANT : la route /respond doit etre declaree AVANT /:assignmentId
app.post('/swift-app/v1/jobs/:jobId/contractors/:assignmentId/respond',
  authenticateToken,
  (req, res) => respondToAssignment(req, res));
app.post('/swift-app/v1/jobs/:jobId/contractors',
  authenticateToken, loadUserContext,
  (req, res) => assignContractor(req, res));
app.get('/swift-app/v1/jobs/:jobId/contractors',
  authenticateToken, loadUserContext,
  (req, res) => listJobContractors(req, res));

// ── Facturation client (flux entrant) ────────────────────────────────────────
const {
  listClientInvoices,
  getClientInvoice,
  createClientInvoice,
  updateClientInvoice,
} = require('./endPoints/v1/clientInvoices/index');

app.get('/swift-app/v1/client-invoices',
  authenticateToken, loadUserContext,
  requirePermission('can_view_financials'),
  (req, res) => listClientInvoices(req, res));
app.get('/swift-app/v1/client-invoices/:id',
  authenticateToken, loadUserContext,
  requirePermission('can_view_financials'),
  (req, res) => getClientInvoice(req, res));
app.post('/swift-app/v1/client-invoices',
  authenticateToken, loadUserContext,
  requirePermission('can_collect_payment'),
  (req, res) => createClientInvoice(req, res));
app.patch('/swift-app/v1/client-invoices/:id',
  authenticateToken, loadUserContext,
  requirePermission('can_collect_payment'),
  (req, res) => updateClientInvoice(req, res));

// ── Payables contractor (flux sortant) ───────────────────────────────────────
const {
  listContractorPayables,
  createContractorPayable,
  markContractorPaid,
} = require('./endPoints/v1/contractorPayables/index');

app.get('/swift-app/v1/contractor-payables',
  authenticateToken, loadUserContext,
  requirePermission('can_view_financials'),
  (req, res) => listContractorPayables(req, res));
app.post('/swift-app/v1/contractor-payables',
  authenticateToken, loadUserContext,
  requirePermission('can_manage_stripe'),
  (req, res) => createContractorPayable(req, res));
app.patch('/swift-app/v1/contractor-payables/:id/paid',
  authenticateToken, loadUserContext,
  requirePermission('can_manage_stripe'),
  (req, res) => markContractorPaid(req, res));
// ── FIN PHASE 1 ──────────────────────────────────────────────────────────────
"""

# Marqueurs sentinelles (dans l'ordre de preference)
SENTINELS = [
    "// ── FIN PHASE 1 ──",           # idempotence : déjà injecté
    "// 404 catch",
    "app.use((req, res) => {",
    "app.use(function(req, res) {",
    "// catch all",
    "// catchall",
    "// Not found",
]


def main():
    if not os.path.exists(INDEX_PATH):
        print(f"ERREUR : {INDEX_PATH} introuvable.")
        sys.exit(1)

    with open(INDEX_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    # Idempotence : ne pas re-injecter si le bloc est deja present
    if "// FIN PHASE 1" in content or "endPoints/v1/memberships/index" in content:
        print("INFO : routes Phase 1 deja presentes dans index.js — rien a faire.")
        sys.exit(0)

    # Trouver le point d'injection
    insert_pos = None
    for sentinel in SENTINELS:
        idx = content.find(sentinel)
        if idx != -1:
            insert_pos = idx
            print(f"Sentinel trouve : '{sentinel}' a la position {idx}")
            break

    if insert_pos is None:
        # Fallback : injecter a la fin du fichier
        print("WARN : aucun sentinel trouve — injection en fin de fichier.")
        insert_pos = len(content)

    new_content = content[:insert_pos] + PHASE1_BLOCK + "\n" + content[insert_pos:]

    with open(INDEX_PATH, "w", encoding="utf-8") as f:
        f.write(new_content)

    print(f"OK : routes Phase 1 injectees dans {INDEX_PATH}")
    print(f"     {PHASE1_BLOCK.count('app.')} routes ajoutees.")


if __name__ == "__main__":
    main()
