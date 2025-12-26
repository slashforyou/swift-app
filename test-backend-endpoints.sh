#!/bin/bash
# Script de test des endpoints backend Swift-App
# À exécuter sur le serveur ou localement avec accès à l'API

# Configuration
BASE_URL="https://altivo.fr/swift-app/v1"
JOB_ID="2"
TOKEN="YOUR_AUTH_TOKEN_HERE"  # À remplacer par un vrai token

echo "=========================================="
echo "🔍 TESTS ENDPOINTS BACKEND SWIFT-APP"
echo "=========================================="
echo ""
echo "Base URL: $BASE_URL"
echo "Job ID: $JOB_ID"
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Timer Start
echo "=========================================="
echo "TEST 1: POST /job/$JOB_ID/start"
echo "=========================================="
echo ""
echo "Expected: 200 OK with job started"
echo "Actual:"
echo ""

response=$(curl -X POST "$BASE_URL/job/$JOB_ID/start" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -w "\nHTTP_STATUS:%{http_code}" \
  -s)

http_status=$(echo "$response" | grep "HTTP_STATUS" | cut -d':' -f2)
body=$(echo "$response" | grep -v "HTTP_STATUS")

echo "Status: $http_status"
echo "Body: $body"
echo ""

if [ "$http_status" == "200" ]; then
  echo -e "${GREEN}✅ TEST 1 PASSED${NC}"
else
  echo -e "${RED}❌ TEST 1 FAILED${NC}"
  echo "Expected: 200"
  echo "Got: $http_status"
  
  if echo "$body" | grep -q "pool.execute is not a function"; then
    echo -e "${YELLOW}🔍 DIAGNOSTIC: pool.execute error détecté${NC}"
    echo "Solution: Vérifier si mysql2 est installé ou remplacer execute() par query()"
  fi
fi
echo ""
echo ""

# Test 2: Step Update to 3
echo "=========================================="
echo "TEST 2: POST /job/$JOB_ID/advance-step (step 3)"
echo "=========================================="
echo ""
echo "Expected: 200 OK with current_step=3"
echo "Actual:"
echo ""

response=$(curl -X POST "$BASE_URL/job/$JOB_ID/advance-step" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"current_step": 3, "notes": "Test step 3"}' \
  -w "\nHTTP_STATUS:%{http_code}" \
  -s)

http_status=$(echo "$response" | grep "HTTP_STATUS" | cut -d':' -f2)
body=$(echo "$response" | grep -v "HTTP_STATUS")

echo "Status: $http_status"
echo "Body: $body"
echo ""

if [ "$http_status" == "200" ]; then
  echo -e "${GREEN}✅ TEST 2 PASSED${NC}"
else
  echo -e "${RED}❌ TEST 2 FAILED${NC}"
  echo "Expected: 200"
  echo "Got: $http_status"
  
  if echo "$body" | grep -q "Invalid step number"; then
    echo -e "${YELLOW}🔍 DIAGNOSTIC: Validation step incorrecte${NC}"
    echo "Le step 3 est dans le range 1-5 mais le backend le refuse"
    echo "Solution: Vérifier la validation dans le handler advance-step"
  fi
fi
echo ""
echo ""

# Test 3: Step Update to 4
echo "=========================================="
echo "TEST 3: POST /job/$JOB_ID/advance-step (step 4)"
echo "=========================================="
echo ""
echo "Expected: 200 OK with current_step=4"
echo "Actual:"
echo ""

response=$(curl -X POST "$BASE_URL/job/$JOB_ID/advance-step" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"current_step": 4, "notes": "Test step 4"}' \
  -w "\nHTTP_STATUS:%{http_code}" \
  -s)

http_status=$(echo "$response" | grep "HTTP_STATUS" | cut -d':' -f2)
body=$(echo "$response" | grep -v "HTTP_STATUS")

echo "Status: $http_status"
echo "Body: $body"
echo ""

if [ "$http_status" == "200" ]; then
  echo -e "${GREEN}✅ TEST 3 PASSED${NC}"
else
  echo -e "${RED}❌ TEST 3 FAILED${NC}"
fi
echo ""
echo ""

# Test 4: Complete Job
echo "=========================================="
echo "TEST 4: POST /job/$JOB_ID/complete"
echo "=========================================="
echo ""
echo "Expected: 200 OK with current_step preserved (should be 4 or 5, NOT 99)"
echo "Actual:"
echo ""

response=$(curl -X POST "$BASE_URL/job/$JOB_ID/complete" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -w "\nHTTP_STATUS:%{http_code}" \
  -s)

http_status=$(echo "$response" | grep "HTTP_STATUS" | cut -d':' -f2)
body=$(echo "$response" | grep -v "HTTP_STATUS")

echo "Status: $http_status"
echo "Body: $body"
echo ""

if [ "$http_status" == "200" ]; then
  if echo "$body" | grep -q '"current_step":99'; then
    echo -e "${YELLOW}⚠️  TEST 4 PARTIALLY PASSED${NC}"
    echo "Status 200 OK but current_step is 99 instead of preserving real step"
    echo -e "${YELLOW}🔍 DIAGNOSTIC: Backend écrase current_step avec 99${NC}"
    echo "Solution: Ne pas modifier current_step lors de la completion"
  else
    echo -e "${GREEN}✅ TEST 4 PASSED${NC}"
  fi
else
  echo -e "${RED}❌ TEST 4 FAILED${NC}"
fi
echo ""
echo ""

# Test 5: Get Job to verify state
echo "=========================================="
echo "TEST 5: GET /job/$JOB_ID (verify state)"
echo "=========================================="
echo ""

response=$(curl -X GET "$BASE_URL/job/$JOB_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -w "\nHTTP_STATUS:%{http_code}" \
  -s)

http_status=$(echo "$response" | grep "HTTP_STATUS" | cut -d':' -f2)
body=$(echo "$response" | grep -v "HTTP_STATUS")

echo "Status: $http_status"
echo "Current state:"
echo "$body" | grep -E "(current_step|status|timer_started_at)" || echo "$body"
echo ""
echo ""

# Summary
echo "=========================================="
echo "📊 RÉSUMÉ DES TESTS"
echo "=========================================="
echo ""
echo "Problèmes détectés:"
echo ""
echo "1. POST /job/:id/start → Erreur 500 'pool.execute is not a function'"
echo "   Fix: Installer mysql2 OU remplacer pool.execute() par pool.query()"
echo ""
echo "2. POST /job/:id/advance-step → Erreur 400 'Invalid step number' pour step 3"
echo "   Fix: Vérifier validation, accepter current_step entre 1 et 5"
echo ""
echo "3. POST /job/:id/complete → Retourne 200 mais current_step = 99"
echo "   Fix: Préserver current_step réel, ne pas le remplacer par 99"
echo ""
echo "=========================================="
echo "📋 PROCHAINES ÉTAPES"
echo "=========================================="
echo ""
echo "1. Vérifier les logs backend: pm2 logs swift-app"
echo "2. Vérifier la config DB: cat backend/config/database.js"
echo "3. Chercher pool.execute: grep -rn 'pool.execute' backend/"
echo "4. Chercher advance-step handler: grep -rn 'advance-step' backend/routes/"
echo "5. Vérifier l'état en DB: SELECT * FROM jobs WHERE id = $JOB_ID;"
echo ""
