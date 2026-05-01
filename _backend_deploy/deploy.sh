#!/usr/bin/env bash
# =============================================================================
# deploy.sh — Cobbr backend deployment script
#
# Usage  : bash deploy.sh
# Run on : sushinari — /srv/www/htdocs/swiftapp/server
#
# Steps  : 1. git pull origin main
#           2. npm install --production  (only if package.json changed)
#           3. Apply pending SQL migrations (tracked in _migrations table)
#           4. pm2 restart swiftapp
#           5. pm2 logs (last 20 lines) to confirm startup
#           6. Colored summary ✅ / ❌
#
# Requires: git, npm, mysql, pm2
# DB creds : read from .env (DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD)
# =============================================================================

set -euo pipefail

# ─── Config ──────────────────────────────────────────────────────────────────
DEPLOY_DIR="/srv/www/htdocs/swiftapp/server"
MIGRATIONS_DIR="${DEPLOY_DIR}/_backend_deploy/migrations"
PM2_APP="swiftapp"
ENV_FILE="${DEPLOY_DIR}/.env"

# ─── Colors ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# ─── Deploy state (used by print_summary) ────────────────────────────────────
STEP_GIT=false
STEP_NPM=false
STEP_MIGRATIONS=false
STEP_PM2=false
MIGRATIONS_APPLIED=()
DEPLOY_ERROR=""

# ─── Traps ───────────────────────────────────────────────────────────────────
# ERR fires on any non-zero command exit (thanks to set -e)
trap '_on_error $LINENO' ERR
# EXIT always fires — used to print the final summary
trap 'print_summary' EXIT

_on_error() {
  DEPLOY_ERROR="Command failed at line $1"
  # set -e will then exit the script, triggering the EXIT trap
}

# ─── Logging helpers ─────────────────────────────────────────────────────────
log()  { echo -e "${CYAN}[$(date '+%H:%M:%S')]${NC} $*"; }
ok()   { echo -e "${GREEN}[$(date '+%H:%M:%S')] ✓${NC} $*"; }
warn() { echo -e "${YELLOW}[$(date '+%H:%M:%S')] ⚠${NC} $*"; }
err()  { echo -e "${RED}[$(date '+%H:%M:%S')] ✗${NC} $*" >&2; }

# ─── Load DB credentials from .env ───────────────────────────────────────────
load_env() {
  if [[ ! -f "$ENV_FILE" ]]; then
    err ".env not found at $ENV_FILE"
    exit 1
  fi

  while IFS= read -r line || [[ -n "$line" ]]; do
    # Skip comments and blank lines
    [[ "$line" =~ ^[[:space:]]*# ]] && continue
    [[ -z "${line// }" ]] && continue

    key="${line%%=*}"
    value="${line#*=}"

    # Strip inline comments, surrounding quotes, whitespace
    value="${value%%#*}"
    value="${value%\"}" ; value="${value#\"}"
    value="${value%\'}" ; value="${value#\'}"
    value="$(echo "$value" | xargs 2>/dev/null || echo "$value")"

    case "$key" in
      DB_HOST|DB_PORT|DB_NAME|DB_USER|DB_PASSWORD)
        export "$key=$value"
        ;;
    esac
  done < "$ENV_FILE"

  # Apply defaults / validate
  DB_HOST="${DB_HOST:-localhost}"
  DB_PORT="${DB_PORT:-3306}"

  if [[ -z "${DB_NAME:-}" || -z "${DB_USER:-}" || -z "${DB_PASSWORD:-}" ]]; then
    err "Missing required DB vars in .env (DB_NAME, DB_USER, DB_PASSWORD)"
    exit 1
  fi
}

# ─── MySQL helper (credentials via temp file to avoid process-list exposure) ──
MYSQL_CNF=""

setup_mysql_cnf() {
  MYSQL_CNF=$(mktemp /tmp/.deploy_my_XXXXXX.cnf)
  chmod 600 "$MYSQL_CNF"
  printf "[client]\nhost=%s\nport=%s\nuser=%s\npassword=%s\n" \
    "$DB_HOST" "$DB_PORT" "$DB_USER" "$DB_PASSWORD" > "$MYSQL_CNF"
}

mysql_cmd() {
  mysql --defaults-extra-file="$MYSQL_CNF" "$DB_NAME" "$@"
}

cleanup_mysql_cnf() {
  [[ -n "$MYSQL_CNF" && -f "$MYSQL_CNF" ]] && rm -f "$MYSQL_CNF"
}

# ─── Ensure _migrations tracking table exists ────────────────────────────────
ensure_migrations_table() {
  mysql_cmd -e "
    CREATE TABLE IF NOT EXISTS _migrations (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      filename   VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMP   DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  " 2>/dev/null || {
    err "Cannot connect to MariaDB — check .env credentials"
    exit 1
  }
}

# =============================================================================
# Step 1 — git pull
# =============================================================================
step_git_pull() {
  log "Step 1/4 — git pull origin main"
  cd "$DEPLOY_DIR"
  git pull origin main
  STEP_GIT=true
  ok "git pull OK"
}

# =============================================================================
# Step 2 — npm install (only when package.json changed)
# =============================================================================
step_npm_install() {
  log "Step 2/4 — Checking package.json for changes"
  cd "$DEPLOY_DIR"

  # git diff returns the list of files changed between the previous HEAD and current HEAD
  if git diff HEAD@{1} HEAD --name-only 2>/dev/null | grep -q "^package\.json$"; then
    log "package.json changed — running npm install --production"
    npm install --production
    ok "npm install OK"
  else
    warn "package.json unchanged — skipping npm install"
  fi

  STEP_NPM=true
}

# =============================================================================
# Step 3 — SQL migrations
# =============================================================================
step_migrations() {
  log "Step 3/4 — Checking pending SQL migrations"

  if [[ ! -d "$MIGRATIONS_DIR" ]]; then
    warn "Migrations directory not found: $MIGRATIONS_DIR — skipping"
    STEP_MIGRATIONS=true
    return
  fi

  load_env
  setup_mysql_cnf
  ensure_migrations_table

  # Collect *.sql files sorted alphabetically (NNN_ prefix ensures order)
  mapfile -t sql_files < <(find "$MIGRATIONS_DIR" -maxdepth 1 -name "*.sql" -type f | sort)

  if [[ ${#sql_files[@]} -eq 0 ]]; then
    warn "No .sql files found in $MIGRATIONS_DIR"
    STEP_MIGRATIONS=true
    cleanup_mysql_cnf
    return
  fi

  applied_count=0
  skipped_count=0

  for filepath in "${sql_files[@]}"; do
    filename="$(basename "$filepath")"

    # Check if already tracked in _migrations
    already=$(mysql_cmd -sNe \
      "SELECT COUNT(*) FROM _migrations WHERE filename='${filename//\'/\\'}';" \
      2>/dev/null || echo "0")

    if [[ "$already" -gt 0 ]]; then
      skipped_count=$((skipped_count + 1))
      continue
    fi

    log "Applying migration: $filename"
    mysql_cmd < "$filepath"
    mysql_cmd -e "INSERT INTO _migrations (filename) VALUES ('${filename//\'/\\'}')"
    MIGRATIONS_APPLIED+=("$filename")
    applied_count=$((applied_count + 1))
    ok "Migration applied: $filename"
  done

  cleanup_mysql_cnf

  if [[ $applied_count -eq 0 ]]; then
    warn "No new migrations (${skipped_count} already applied)"
  else
    ok "${applied_count} migration(s) applied"
  fi

  STEP_MIGRATIONS=true
}

# =============================================================================
# Step 4 — PM2 restart + log check
# =============================================================================
step_pm2_restart() {
  log "Step 4/4 — Restarting PM2: $PM2_APP"
  pm2 restart "$PM2_APP"

  # Brief pause to let the process initialize
  sleep 2

  ok "PM2 restarted"
  log "Last 20 log lines:"
  echo -e "${YELLOW}─────────────────────────────────────────────────────────${NC}"
  pm2 logs "$PM2_APP" --lines 20 --nostream 2>/dev/null || true
  echo -e "${YELLOW}─────────────────────────────────────────────────────────${NC}"

  STEP_PM2=true
}

# =============================================================================
# Summary (always runs via EXIT trap)
# =============================================================================
print_summary() {
  # Clean up mysql cnf if script aborted mid-migration
  cleanup_mysql_cnf

  echo ""
  echo -e "${BOLD}═══════════════════════════════════════════════════════════${NC}"
  echo -e "${BOLD}  DEPLOY SUMMARY — $(date '+%Y-%m-%d %H:%M:%S')${NC}"
  echo -e "${BOLD}═══════════════════════════════════════════════════════════${NC}"

  [[ $STEP_GIT        == true ]] \
    && echo -e "  ${GREEN}✅  git pull${NC}" \
    || echo -e "  ${RED}❌  git pull${NC}"

  [[ $STEP_NPM        == true ]] \
    && echo -e "  ${GREEN}✅  npm install${NC}" \
    || echo -e "  ${RED}❌  npm install${NC}"

  [[ $STEP_MIGRATIONS == true ]] \
    && echo -e "  ${GREEN}✅  migrations${NC}" \
    || echo -e "  ${RED}❌  migrations${NC}"

  [[ $STEP_PM2        == true ]] \
    && echo -e "  ${GREEN}✅  pm2 restart${NC}" \
    || echo -e "  ${RED}❌  pm2 restart${NC}"

  # List applied migrations if any
  if [[ ${#MIGRATIONS_APPLIED[@]} -gt 0 ]]; then
    echo ""
    echo -e "  ${CYAN}Migrations applied (${#MIGRATIONS_APPLIED[@]}):${NC}"
    for m in "${MIGRATIONS_APPLIED[@]}"; do
      echo -e "    ${GREEN}→${NC} $m"
    done
  fi

  # Show error if deploy failed
  if [[ -n "$DEPLOY_ERROR" ]]; then
    echo ""
    echo -e "  ${RED}Error: $DEPLOY_ERROR${NC}"
    echo -e "${BOLD}═══════════════════════════════════════════════════════════${NC}"
    echo -e "  ${RED}${BOLD}💥 Deploy FAILED — see errors above${NC}"
    echo -e "${BOLD}═══════════════════════════════════════════════════════════${NC}"
    exit 1
  fi

  echo ""
  echo -e "  ${GREEN}${BOLD}🚀 Deploy complete — all systems go!${NC}"
  echo -e "${BOLD}═══════════════════════════════════════════════════════════${NC}"
}

# =============================================================================
# Main
# =============================================================================
main() {
  echo -e "${BOLD}${CYAN}"
  echo "  ╔═════════════════════════════════════════╗"
  echo "  ║      Cobbr Backend Deploy Script        ║"
  echo "  ║      $(date '+%Y-%m-%d %H:%M:%S')               ║"
  echo "  ╚═════════════════════════════════════════╝"
  echo -e "${NC}"

  step_git_pull
  step_npm_install
  step_migrations
  step_pm2_restart
}

main
