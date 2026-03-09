#!/usr/bin/env python3
"""
insert_march_test_jobs.py
Insère ~22 jobs de test sur mars 2026 dans la DB swiftapp.

Scénarios :
- Jobs B2B : autres companies proposent un job à Nerd-Test (contractor)
- Jobs internes : Nerd-Test crée et exécute ses propres jobs

Prérequis :
    pip install pymysql
"""

import pymysql

DB = dict(host="localhost", user="swiftapp_user",
          password="U%Xgxvc54EKUD39PcwNAYvuS", db="swiftapp", charset="utf8mb4")

# ─── Référentiels ─────────────────────────────────────────────────────────────

COMPANIES = {
    "nerd":   {"id": 1, "user": 24, "name": "Nerd-Test",         "email": "contact@nerd-test.com"},
    "front":  {"id": 2, "user": 15, "name": "Test Frontend",     "email": "frontend@test.com"},
    "onb":    {"id": 3, "user": 34, "name": "TestOnboarding",    "email": "test.onboarding@test.com"},
    "carmi":  {"id": 4, "user": 58, "name": "Carmichael Services","email": "joseph.carmichael@gmail.com"},
}

TRUCKS = {
    "T1": {"id": 1, "name": "Nerd-Test Truck Principal", "plate": "NT-001",  "cap": "30m³"},
    "T2": {"id": 2, "name": "Nerd-Test Truck Support",   "plate": "NT-002",  "cap": "20m³"},
    "T3": {"id": 3, "name": "Nerd-Test Van Rapide",      "plate": "NT-003",  "cap": "10m³"},
    "T4": {"id": 4, "name": "Nerd-Test Véhicule Secours","plate": "NT-SPARE","cap": "15m³"},
}

# ─── Définition des 22 jobs ───────────────────────────────────────────────────
# Chaque job : (code_suffix, date, h_start, h_end, creator_key, contractor_key_or_None,
#               assignment_status, contact_first, contact_last, contact_phone,
#               title_notes, priority, trucks_keys[], offsiders, addresses[], amount)
# addresses = [{"type", "street", "city", "state", "zip", "lat", "lng"}]

JOBS = [
    # ── 1 – Mar 10 – Test Frontend → Nerd-Test – Collins St déménagement ────
    {
        "code": "TST-MAR-001",
        "date_start": "2026-03-10 08:00:00", "date_end": "2026-03-10 14:00:00",
        "creator": "front", "contractor": "nerd",
        "assign_status": "accepted", "status": "accepted",
        "contact": ("Laura", "Bennett", "0412 345 678"),
        "notes": "Grand déménagement appartement – 3 pièces avec piano droit. Prévoir couvertures de protection.",
        "priority": "high",
        "trucks": ["T1"],
        "offsiders": 2,
        "amount": 1250.00,
        "addresses": [
            {"type": "pickup",  "street": "120 Collins St",      "city": "Melbourne",  "state": "VIC", "zip": "3000", "lat": -37.8134, "lng": 144.9621},
            {"type": "dropoff", "street": "45 Chapel St",        "city": "South Yarra","state": "VIC", "zip": "3141", "lat": -37.8386, "lng": 144.9934},
        ],
    },
    # ── 2 – Mar 11 – Nerd-Test interne – Livraison mobilier South Yarra ────
    {
        "code": "TST-MAR-002",
        "date_start": "2026-03-11 08:00:00", "date_end": "2026-03-11 11:00:00",
        "creator": "nerd", "contractor": None,
        "assign_status": "none", "status": "accepted",
        "contact": ("Michael", "Torres", "0421 987 654"),
        "notes": "Livraison mobilier de bureau – 8 cartons + 2 bureaux. Accès parking sous-sol.",
        "priority": "medium",
        "trucks": ["T3"],
        "offsiders": 0,
        "amount": 380.00,
        "addresses": [
            {"type": "pickup",  "street": "12 Spencer St",  "city": "Docklands",  "state": "VIC", "zip": "3008", "lat": -37.8195, "lng": 144.9524},
            {"type": "dropoff", "street": "87 Domain Rd",   "city": "South Yarra","state": "VIC", "zip": "3141", "lat": -37.8400, "lng": 144.9891},
        ],
    },
    # ── 3 – Mar 12 – Carmichael → Nerd-Test – Bureau Fitzroy ────────────────
    {
        "code": "TST-MAR-003",
        "date_start": "2026-03-12 07:30:00", "date_end": "2026-03-12 13:00:00",
        "creator": "carmi", "contractor": "nerd",
        "assign_status": "pending", "status": "pending",
        "contact": ("Sophie", "Carmichael", "0398 765 432"),
        "notes": "Déménagement bureau – 3 postes de travail, armoires métalliques. Code ascenseur : 4521.",
        "priority": "medium",
        "trucks": ["T2"],
        "offsiders": 1,
        "amount": 820.00,
        "addresses": [
            {"type": "pickup",  "street": "234 Johnston St",     "city": "Fitzroy",          "state": "VIC", "zip": "3065", "lat": -37.7980, "lng": 144.9780},
            {"type": "dropoff", "street": "56 Victoria Parade",  "city": "East Melbourne",   "state": "VIC", "zip": "3002", "lat": -37.8138, "lng": 144.9823},
        ],
    },
    # ── 4 – Mar 13 – Nerd-Test interne – Transport Docklands ────────────────
    {
        "code": "TST-MAR-004",
        "date_start": "2026-03-13 09:00:00", "date_end": "2026-03-13 12:00:00",
        "creator": "nerd", "contractor": None,
        "assign_status": "none", "status": "in_progress",
        "contact": ("Daniel", "Walsh", "0455 321 987"),
        "notes": "Transport équipement scénique depuis entrepôt. Client attend sur place à 9h30.",
        "priority": "high",
        "trucks": ["T2"],
        "offsiders": 1,
        "amount": 540.00,
        "addresses": [
            {"type": "pickup",  "street": "5 Stadium Circuit",   "city": "Melbourne",  "state": "VIC", "zip": "3000", "lat": -37.8231, "lng": 144.9481},
            {"type": "dropoff", "street": "23 Waterfront Way",   "city": "Docklands",  "state": "VIC", "zip": "3008", "lat": -37.8203, "lng": 144.9476},
        ],
    },
    # ── 5 – Mar 14 – TestOnboarding → Nerd-Test – Maison Collingwood ────────
    {
        "code": "TST-MAR-005",
        "date_start": "2026-03-14 07:00:00", "date_end": "2026-03-14 15:00:00",
        "creator": "onb", "contractor": "nerd",
        "assign_status": "accepted", "status": "accepted",
        "contact": ("Emma", "Richardson", "0487 654 321"),
        "notes": "Grand déménagement maison familiale 4 pièces. Lave-linge, frigo américain, canapé sectionnel. Protéger parquet clair à destination.",
        "priority": "high",
        "trucks": ["T1"],
        "offsiders": 2,
        "amount": 1580.00,
        "addresses": [
            {"type": "pickup",  "street": "78 Smith St",  "city": "Collingwood", "state": "VIC", "zip": "3066", "lat": -37.8030, "lng": 144.9886},
            {"type": "dropoff", "street": "34 Lygon St",  "city": "Carlton",     "state": "VIC", "zip": "3053", "lat": -37.7973, "lng": 144.9666},
        ],
    },
    # ── 6 – Mar 15 – Nerd-Test interne – Matériel Richmond ──────────────────
    {
        "code": "TST-MAR-006",
        "date_start": "2026-03-15 10:00:00", "date_end": "2026-03-15 12:30:00",
        "creator": "nerd", "contractor": None,
        "assign_status": "none", "status": "pending",
        "contact": ("Chris", "Nguyen", "0433 112 334"),
        "notes": "Transport racks métalliques et étagères – client de passage. Camion de secours suffit.",
        "priority": "low",
        "trucks": ["T4"],
        "offsiders": 0,
        "amount": 290.00,
        "addresses": [
            {"type": "pickup",  "street": "101 Bridge Rd", "city": "Richmond", "state": "VIC", "zip": "3121", "lat": -37.8231, "lng": 144.9985},
            {"type": "dropoff", "street": "45 Church St",  "city": "Richmond", "state": "VIC", "zip": "3121", "lat": -37.8237, "lng": 145.0001},
        ],
    },
    # ── 7 – Mar 15 – Test Frontend → Nerd-Test – Petit colis St Kilda ───────
    {
        "code": "TST-MAR-007",
        "date_start": "2026-03-15 13:00:00", "date_end": "2026-03-15 15:00:00",
        "creator": "front", "contractor": "nerd",
        "assign_status": "pending", "status": "pending",
        "contact": ("Zoe", "Parker", "0499 887 665"),
        "notes": "Livraison express 4 cartons + 1 vélo pliant. Pas besoin de camion – fourgonnette ou van léger.",
        "priority": "urgent",
        "trucks": [],  # no truck
        "offsiders": 1,
        "amount": 180.00,
        "addresses": [
            {"type": "pickup",  "street": "1 Fitzroy St",  "city": "St Kilda", "state": "VIC", "zip": "3182", "lat": -37.8674, "lng": 144.9742},
            {"type": "dropoff", "street": "22 Acland St",  "city": "St Kilda", "state": "VIC", "zip": "3182", "lat": -37.8681, "lng": 144.9751},
        ],
    },
    # ── 8 – Mar 17 – Carmichael → Nerd-Test – Villa Brighton ────────────────
    {
        "code": "TST-MAR-008",
        "date_start": "2026-03-17 08:00:00", "date_end": "2026-03-17 16:00:00",
        "creator": "carmi", "contractor": "nerd",
        "assign_status": "accepted", "status": "accepted",
        "contact": ("Patricia", "Holloway", "0388 456 123"),
        "notes": "Déménagement villa de luxe – objets d'art à emballer avec soin. Client exige rapport photo avant/après.",
        "priority": "high",
        "trucks": ["T1"],
        "offsiders": 2,
        "amount": 1920.00,
        "addresses": [
            {"type": "pickup",  "street": "15 Bay St",               "city": "Brighton",    "state": "VIC", "zip": "3186", "lat": -37.9185, "lng": 145.0008},
            {"type": "dropoff", "street": "88 Beaconsfield Parade",  "city": "Albert Park", "state": "VIC", "zip": "3206", "lat": -37.8498, "lng": 144.9571},
        ],
    },
    # ── 9 – Mar 18 – Nerd-Test interne – Collecte dons St Kilda ─────────────
    {
        "code": "TST-MAR-009",
        "date_start": "2026-03-18 07:00:00", "date_end": "2026-03-18 10:00:00",
        "creator": "nerd", "contractor": None,
        "assign_status": "none", "status": "accepted",
        "contact": ("Tom", "Buckley", "0412 001 002"),
        "notes": "Collecte matériel associatif. Prévoir sangles arrimage. 2 pickups d'adresses communautaires.",
        "priority": "medium",
        "trucks": ["T3"],
        "offsiders": 1,
        "amount": 320.00,
        "addresses": [
            {"type": "pickup",       "street": "60 Grey St",   "city": "St Kilda", "state": "VIC", "zip": "3182", "lat": -37.8661, "lng": 144.9767},
            {"type": "intermediate", "street": "14 Barkly St", "city": "St Kilda", "state": "VIC", "zip": "3182", "lat": -37.8692, "lng": 144.9787},
            {"type": "dropoff",      "street": "10 Acland St", "city": "St Kilda", "state": "VIC", "zip": "3182", "lat": -37.8679, "lng": 144.9748},
        ],
    },
    # ── 10 – Mar 18 – TestOnboarding → Nerd-Test – Équipement Hawthorn ──────
    {
        "code": "TST-MAR-010",
        "date_start": "2026-03-18 11:00:00", "date_end": "2026-03-18 14:00:00",
        "creator": "onb", "contractor": "nerd",
        "assign_status": "accepted", "status": "accepted",
        "contact": ("Rachel", "Kim", "0411 223 344"),
        "notes": "Livraison équipement IT entreprise – 15 cartons. Étage 3, ascenseur disponible.",
        "priority": "medium",
        "trucks": ["T2"],
        "offsiders": 0,
        "amount": 490.00,
        "addresses": [
            {"type": "pickup",  "street": "37 Glenferrie Rd", "city": "Hawthorn", "state": "VIC", "zip": "3122", "lat": -37.8222, "lng": 145.0332},
            {"type": "dropoff", "street": "120 Auburn Rd",    "city": "Hawthorn", "state": "VIC", "zip": "3122", "lat": -37.8253, "lng": 145.0424},
        ],
    },
    # ── 11 – Mar 19 – Carmichael → Nerd-Test – Entrepôt Port Melbourne ──────
    {
        "code": "TST-MAR-011",
        "date_start": "2026-03-19 07:00:00", "date_end": "2026-03-19 17:00:00",
        "creator": "carmi", "contractor": "nerd",
        "assign_status": "accepted", "status": "accepted",
        "contact": ("Greg", "Matthews", "0455 789 000"),
        "notes": "Déménagement complet entrepôt industriel. Volume important – 2 camions requis. Prévoir chariots élévateurs sur place.",
        "priority": "high",
        "trucks": ["T1", "T4"],  # deux camions
        "offsiders": 2,
        "amount": 2800.00,
        "addresses": [
            {"type": "pickup",  "street": "300 Lorimer St",      "city": "Port Melbourne", "state": "VIC", "zip": "3207", "lat": -37.8298, "lng": 144.9346},
            {"type": "dropoff", "street": "180 Williamstown Rd", "city": "Port Melbourne", "state": "VIC", "zip": "3207", "lat": -37.8351, "lng": 144.9188},
        ],
    },
    # ── 12 – Mar 20 – Nerd-Test interne – Urgente Prahran ───────────────────
    {
        "code": "TST-MAR-012",
        "date_start": "2026-03-20 09:00:00", "date_end": "2026-03-20 11:00:00",
        "creator": "nerd", "contractor": None,
        "assign_status": "none", "status": "pending",
        "contact": ("Lisa", "Huang", "0422 998 776"),
        "notes": "Livraison urgente mobilier boutique. Créneau strict – client ouvre à 10h.",
        "priority": "urgent",
        "trucks": ["T3"],
        "offsiders": 0,
        "amount": 260.00,
        "addresses": [
            {"type": "pickup",  "street": "50 Commercial Rd", "city": "Prahran", "state": "VIC", "zip": "3181", "lat": -37.8499, "lng": 144.9939},
            {"type": "dropoff", "street": "14 Chapel St",     "city": "Windsor", "state": "VIC", "zip": "3181", "lat": -37.8527, "lng": 144.9957},
        ],
    },
    # ── 13 – Mar 21 – Test Frontend → Nerd-Test – Étudiant Heidelberg ───────
    {
        "code": "TST-MAR-013",
        "date_start": "2026-03-21 08:30:00", "date_end": "2026-03-21 13:00:00",
        "creator": "front", "contractor": "nerd",
        "assign_status": "pending", "status": "pending",
        "contact": ("Nathan", "Dubois", "0477 345 900"),
        "notes": "Déménagement studio étudiant – affaires légères, vélo, table de ping-pong démontée.",
        "priority": "low",
        "trucks": ["T2"],
        "offsiders": 1,
        "amount": 620.00,
        "addresses": [
            {"type": "pickup",  "street": "55 Studley Park Rd", "city": "Kew",       "state": "VIC", "zip": "3101", "lat": -37.8094, "lng": 145.0284},
            {"type": "dropoff", "street": "120 Bell St",        "city": "Heidelberg","state": "VIC", "zip": "3084", "lat": -37.7538, "lng": 145.0612},
        ],
    },
    # ── 14 – Mar 22 – Nerd-Test interne – Meubles Oakleigh ──────────────────
    {
        "code": "TST-MAR-014",
        "date_start": "2026-03-22 08:00:00", "date_end": "2026-03-22 12:00:00",
        "creator": "nerd", "contractor": None,
        "assign_status": "none", "status": "accepted",
        "contact": ("Kevin", "Murphy", "0413 667 889"),
        "notes": "Transport collection meubles vintage. Protection renforcée obligatoire sur pièces antiques.",
        "priority": "high",
        "trucks": ["T1"],
        "offsiders": 1,
        "amount": 730.00,
        "addresses": [
            {"type": "pickup",  "street": "22 Huntingdale Rd", "city": "Oakleigh",  "state": "VIC", "zip": "3166", "lat": -37.8994, "lng": 145.0880},
            {"type": "dropoff", "street": "67 Warrigal Rd",    "city": "Moorabbin", "state": "VIC", "zip": "3189", "lat": -37.9332, "lng": 145.0558},
        ],
    },
    # ── 15 – Mar 23 – TestOnboarding → Nerd-Test – Entrepôt Dandenong ───────
    {
        "code": "TST-MAR-015",
        "date_start": "2026-03-23 09:00:00", "date_end": "2026-03-23 18:00:00",
        "creator": "onb", "contractor": "nerd",
        "assign_status": "pending", "status": "pending",
        "contact": ("Sandra", "Okonkwo", "0468 001 111"),
        "notes": "Grand volume entrepôt. Racks industriels 3m de haut. Accès quai de déchargement côté nord.",
        "priority": "high",
        "trucks": ["T1"],
        "offsiders": 2,
        "amount": 1750.00,
        "addresses": [
            {"type": "pickup",  "street": "15 Princes Hwy",   "city": "Dandenong", "state": "VIC", "zip": "3175", "lat": -37.9874, "lng": 145.2150},
            {"type": "dropoff", "street": "45 Cheltenham Rd", "city": "Dandenong", "state": "VIC", "zip": "3175", "lat": -37.9788, "lng": 145.2200},
        ],
    },
    # ── 16 – Mar 24 – Nerd-Test interne – Électroménager Moorabbin ──────────
    {
        "code": "TST-MAR-016",
        "date_start": "2026-03-24 10:00:00", "date_end": "2026-03-24 12:30:00",
        "creator": "nerd", "contractor": None,
        "assign_status": "none", "status": "pending",
        "contact": ("Julie", "Anderson", "0400 556 778"),
        "notes": "Livraison 3 appareils électroménager + installation partielle. Client au 2e étage sans ascenseur.",
        "priority": "medium",
        "trucks": ["T3"],
        "offsiders": 0,
        "amount": 310.00,
        "addresses": [
            {"type": "pickup",  "street": "10 Station St", "city": "Moorabbin", "state": "VIC", "zip": "3189", "lat": -37.9345, "lng": 145.0617},
            {"type": "dropoff", "street": "35 South Rd",   "city": "Moorabbin", "state": "VIC", "zip": "3189", "lat": -37.9367, "lng": 145.0592},
        ],
    },
    # ── 17 – Mar 25 – Carmichael → Nerd-Test – Maison Toorak ────────────────
    {
        "code": "TST-MAR-017",
        "date_start": "2026-03-25 07:30:00", "date_end": "2026-03-25 17:00:00",
        "creator": "carmi", "contractor": "nerd",
        "assign_status": "accepted", "status": "accepted",
        "contact": ("Victoria", "Lawson", "0399 234 567"),
        "notes": "Déménagement résidence principale haut de gamme. Emballage fourni par client. Piscine côté garage – attention accès étroit.",
        "priority": "high",
        "trucks": ["T1"],
        "offsiders": 2,
        "amount": 2100.00,
        "addresses": [
            {"type": "pickup",  "street": "45 Orrong Rd",  "city": "Toorak", "state": "VIC", "zip": "3142", "lat": -37.8478, "lng": 145.0169},
            {"type": "dropoff", "street": "22 Malvern Rd", "city": "Toorak", "state": "VIC", "zip": "3142", "lat": -37.8501, "lng": 145.0221},
        ],
    },
    # ── 18 – Mar 26 – Nerd-Test interne – Mobilier Northcote ────────────────
    {
        "code": "TST-MAR-018",
        "date_start": "2026-03-26 09:00:00", "date_end": "2026-03-26 13:00:00",
        "creator": "nerd", "contractor": None,
        "assign_status": "none", "status": "accepted",
        "contact": ("Sam", "Fitzgerald", "0444 010 203"),
        "notes": "Transport mobilier café hipster. Chaises vintages et tables en bois massif. Fragile.",
        "priority": "medium",
        "trucks": ["T2"],
        "offsiders": 1,
        "amount": 580.00,
        "addresses": [
            {"type": "pickup",  "street": "88 High St",        "city": "Northcote", "state": "VIC", "zip": "3070", "lat": -37.7754, "lng": 145.0016},
            {"type": "dropoff", "street": "150 Separation St", "city": "Northcote", "state": "VIC", "zip": "3070", "lat": -37.7688, "lng": 144.9975},
        ],
    },
    # ── 19 – Mar 28 – Test Frontend → Nerd-Test – Grand entrepôt Broadmeadows
    {
        "code": "TST-MAR-019",
        "date_start": "2026-03-28 07:00:00", "date_end": "2026-03-28 17:00:00",
        "creator": "front", "contractor": "nerd",
        "assign_status": "accepted", "status": "accepted",
        "contact": ("Frank", "Rossi", "0456 678 900"),
        "notes": "Déménagement entrepôt complet – stock boutique en ligne. 2 camions nécessaires. Coordonner chargement en parallèle.",
        "priority": "high",
        "trucks": ["T1", "T2"],  # deux camions
        "offsiders": 2,
        "amount": 3100.00,
        "addresses": [
            {"type": "pickup",  "street": "25 Dimboola Rd",         "city": "Broadmeadows", "state": "VIC", "zip": "3047", "lat": -37.6895, "lng": 144.9204},
            {"type": "dropoff", "street": "10 Broadmeadows Blvd",   "city": "Broadmeadows", "state": "VIC", "zip": "3047", "lat": -37.6913, "lng": 144.9222},
        ],
    },
    # ── 20 – Mar 29 – Nerd-Test interne – Piano Malvern ─────────────────────
    {
        "code": "TST-MAR-020",
        "date_start": "2026-03-29 08:00:00", "date_end": "2026-03-29 11:00:00",
        "creator": "nerd", "contractor": None,
        "assign_status": "none", "status": "accepted",
        "contact": ("Helen", "Fischer", "0488 123 456"),
        "notes": "Livraison piano à queue – emballage spécial requis. Escalier de 12 marches à destination. Prévoir sangles spéciales.",
        "priority": "high",
        "trucks": ["T4"],
        "offsiders": 1,
        "amount": 680.00,
        "addresses": [
            {"type": "pickup",  "street": "120 Glenferrie Rd", "city": "Malvern", "state": "VIC", "zip": "3144", "lat": -37.8563, "lng": 145.0329},
            {"type": "dropoff", "street": "55 High St",        "city": "Malvern", "state": "VIC", "zip": "3144", "lat": -37.8596, "lng": 145.0378},
        ],
    },
    # ── 21 – Mar 30 – TestOnboarding → Nerd-Test – Bureau Cremorne ──────────
    {
        "code": "TST-MAR-021",
        "date_start": "2026-03-30 09:00:00", "date_end": "2026-03-30 13:00:00",
        "creator": "onb", "contractor": "nerd",
        "assign_status": "pending", "status": "pending",
        "contact": ("Adam", "Fletcher", "0395 112 334"),
        "notes": "Déménagement bureau startup – iMacs, écrans et mobilier ergonomique. Accès véhicule 20m max.",
        "priority": "medium",
        "trucks": ["T2"],
        "offsiders": 0,
        "amount": 710.00,
        "addresses": [
            {"type": "pickup",  "street": "45 Church St", "city": "Cremorne", "state": "VIC", "zip": "3121", "lat": -37.8259, "lng": 144.9996},
            {"type": "dropoff", "street": "88 Swan St",   "city": "Richmond", "state": "VIC", "zip": "3121", "lat": -37.8243, "lng": 144.9981},
        ],
    },
    # ── 22 – Mar 31 – Nerd-Test interne – Archives Abbotsford ───────────────
    {
        "code": "TST-MAR-022",
        "date_start": "2026-03-31 08:00:00", "date_end": "2026-03-31 10:30:00",
        "creator": "nerd", "contractor": None,
        "assign_status": "none", "status": "pending",
        "contact": ("Irene", "Campbell", "0477 889 001"),
        "notes": "Transport archives papier – 80 boîtes classées. Confidentialité requise. Accès restreint entrepôt destination.",
        "priority": "medium",
        "trucks": ["T3"],
        "offsiders": 0,
        "amount": 360.00,
        "addresses": [
            {"type": "pickup",  "street": "30 Yarra St",        "city": "Abbotsford", "state": "VIC", "zip": "3067", "lat": -37.8033, "lng": 145.0012},
            {"type": "dropoff", "street": "100 Victoria Cres",  "city": "Abbotsford", "state": "VIC", "zip": "3067", "lat": -37.8055, "lng": 145.0034},
        ],
    },
]

# ─── Insertion ────────────────────────────────────────────────────────────────

def insert_jobs():
    conn = pymysql.connect(**DB)
    cur = conn.cursor()
    inserted = 0

    for j in JOBS:
        creator  = COMPANIES[j["creator"]]
        contractor = COMPANIES[j["contractor"]] if j["contractor"] else None

        contractee_co_id = creator["id"]
        contractor_co_id = contractor["id"] if contractor else None
        created_by_uid   = creator["user"]

        # Noms contractee / contractor pour champs texte
        contractee_name  = creator["name"]
        contractor_name  = contractor["name"] if contractor else None

        # Premier camion pour truck_name / truck_license_plate (champs plats)
        first_truck = TRUCKS[j["trucks"][0]] if j["trucks"] else None
        truck_name  = first_truck["name"]  if first_truck else None
        truck_plate = first_truck["plate"] if first_truck else None
        req_vehicle = 1 if j["trucks"] else 0

        # Vérifier si le code existe déjà
        cur.execute("SELECT id FROM jobs WHERE code = %s", (j["code"],))
        if cur.fetchone():
            print(f"  ⏭  {j['code']} déjà présent, ignoré.")
            continue

        # ── INSERT job ──────────────────────────────────────────────────────
        cur.execute("""
            INSERT INTO jobs (
                code, status, priority,
                contact_first_name, contact_last_name, contact_phone,
                notes,
                start_window_start, start_window_end,
                end_window_start,   end_window_end,
                timezone, estimated_duration,
                truck_name, truck_license_plate,
                required_vehicle, required_driver, required_offsider,
                contractee_company_id, contractor_company_id,
                contractee_name, contractor_name,
                assignment_status,
                staffing_status,
                created_by_user_id,
                amount_total, amount_without_tax, currency,
                depot_to_depot, hourly_rate
            ) VALUES (
                %s, %s, %s,
                %s, %s, %s,
                %s,
                %s, %s,
                %s, %s,
                %s, %s,
                %s, %s,
                %s, 1, %s,
                %s, %s,
                %s, %s,
                %s,
                'unassigned',
                %s,
                %s, %s, %s,
                0, 180.00
            )
        """, (
            j["code"], j["status"], j["priority"],
            j["contact"][0], j["contact"][1], j["contact"][2],
            j["notes"],
            j["date_start"], j["date_start"],           # start_window_start/end
            j["date_end"],   j["date_end"],              # end_window_start/end
            "Australia/Melbourne",
            int((
                __import__("datetime").datetime.strptime(j["date_end"], "%Y-%m-%d %H:%M:%S") -
                __import__("datetime").datetime.strptime(j["date_start"],"%Y-%m-%d %H:%M:%S")
            ).total_seconds() / 60),
            truck_name, truck_plate,
            req_vehicle, j["offsiders"],
            contractee_co_id, contractor_co_id,
            contractee_name, contractor_name,
            j["assign_status"],
            created_by_uid,
            j["amount"], round(j["amount"] / 1.1, 2), "AUD",
        ))
        job_id = cur.lastrowid
        inserted += 1

        # ── Adresses ────────────────────────────────────────────────────────
        for pos, addr in enumerate(j["addresses"], start=1):
            cur.execute("""
                INSERT INTO job_addresses (job_id, type, street, city, state, zip, latitude, longitude, position)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (job_id, addr["type"], addr["street"], addr["city"],
                  addr["state"], addr["zip"], addr.get("lat"), addr.get("lng"), pos))

        # ── Camions (job_trucks) ─────────────────────────────────────────────
        for idx, tk in enumerate(j["trucks"]):
            truck = TRUCKS[tk]
            role = "primary" if idx == 0 else "support"
            cur.execute("""
                INSERT INTO job_trucks (job_id, truck_id, role)
                VALUES (%s, %s, %s)
            """, (job_id, truck["id"], role))

        print(f"  ✅  #{job_id} {j['code']} | {j['creator']}→{j['contractor'] or 'internal'} | "
              f"{','.join(j['trucks']) or 'no truck'} | {j['offsiders']} offsider(s) | {j['status']}")

    conn.commit()
    cur.close()
    conn.close()
    print(f"\n✅ Terminé — {inserted} job(s) insérés.")

if __name__ == "__main__":
    import sys
    try:
        import pymysql
    except ImportError:
        print("Installation de pymysql…")
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "pymysql", "-q"])
        import pymysql  # noqa
    insert_jobs()
