#!/usr/bin/env bash
set -Eeuo pipefail

REPO_URL="${IOT_REPO_URL:-https://github.com/Materialist-x/IOT.git}"
BRANCH="${IOT_BRANCH:-main}"
APP_DIR="${IOT_APP_DIR:-/opt/iot}"
RAW_URL="${IOT_CTL_RAW_URL:-https://raw.githubusercontent.com/Materialist-x/IOT/main/scripts/iotctl.sh}"
COMPOSE_DIR="$APP_DIR/V8"
COMPOSE_FILE="$COMPOSE_DIR/docker-compose.yml"
BIN_PATH="/usr/local/bin/iotctl"

SUDO=""
if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
  if ! command -v sudo >/dev/null 2>&1; then
    echo "This script needs root privileges. Please install sudo or run as root." >&2
    exit 1
  fi
  SUDO="sudo"
fi

log() {
  printf '\033[1;32m[iotctl]\033[0m %s\n' "$*"
}

warn() {
  printf '\033[1;33m[iotctl]\033[0m %s\n' "$*" >&2
}

die() {
  printf '\033[1;31m[iotctl]\033[0m %s\n' "$*" >&2
  exit 1
}

compose() {
  $SUDO docker compose -f "$COMPOSE_FILE" "$@"
}

install_core_packages() {
  local missing=()
  command -v git >/dev/null 2>&1 || missing+=("git")
  command -v curl >/dev/null 2>&1 || missing+=("curl")
  command -v openssl >/dev/null 2>&1 || missing+=("openssl")

  if [[ "${#missing[@]}" -eq 0 ]]; then
    return
  fi

  log "Installing required packages: ${missing[*]}"
  if command -v apt-get >/dev/null 2>&1; then
    $SUDO apt-get update
    $SUDO apt-get install -y ca-certificates "${missing[@]}"
  elif command -v dnf >/dev/null 2>&1; then
    $SUDO dnf install -y ca-certificates "${missing[@]}"
  elif command -v yum >/dev/null 2>&1; then
    $SUDO yum install -y ca-certificates "${missing[@]}"
  else
    die "Unsupported Linux distribution. Please install git, curl, openssl, and Docker manually."
  fi
}

install_docker() {
  if command -v docker >/dev/null 2>&1; then
    if ! $SUDO docker info >/dev/null 2>&1; then
      log "Starting Docker service"
      $SUDO systemctl enable --now docker >/dev/null 2>&1 || true
    fi
  else
    log "Installing Docker Engine with the official convenience script"
    curl -fsSL https://get.docker.com -o /tmp/get-docker.sh
    $SUDO sh /tmp/get-docker.sh
    $SUDO systemctl enable --now docker >/dev/null 2>&1 || true
  fi

  $SUDO docker compose version >/dev/null 2>&1 || die "Docker Compose plugin is unavailable after Docker installation."
}

install_self() {
  log "Installing iotctl command to $BIN_PATH"
  curl -fsSL "$RAW_URL" -o /tmp/iotctl.sh
  $SUDO install -m 0755 /tmp/iotctl.sh "$BIN_PATH"
}

clone_or_update_repo() {
  if [[ -d "$APP_DIR/.git" ]]; then
    log "Updating repository in $APP_DIR"
    $SUDO git -C "$APP_DIR" fetch origin "$BRANCH"
    $SUDO git -C "$APP_DIR" checkout "$BRANCH"
    $SUDO git -C "$APP_DIR" pull --ff-only origin "$BRANCH"
  else
    log "Cloning $REPO_URL to $APP_DIR"
    $SUDO mkdir -p "$(dirname "$APP_DIR")"
    $SUDO git clone --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
  fi
}

random_secret() {
  openssl rand -hex 32 2>/dev/null || date +%s%N | sha256sum | awk '{print $1}'
}

write_env_if_missing() {
  local env_file="$COMPOSE_DIR/.env"
  if [[ -f "$env_file" ]]; then
    return
  fi

  log "Creating $env_file"
  cat > "$env_file" <<EOF
JWT_SECRET=$(random_secret)
POSTGRES_PASSWORD=v8_password
RABBITMQ_DEFAULT_PASS=v8_password
INFLUX_PASSWORD=v8_password_123
INFLUX_TOKEN=v8-influx-token
EMQX_DASHBOARD_PASSWORD=v8_mqtt_password
EOF
}

deploy_stack() {
  [[ -f "$COMPOSE_FILE" ]] || die "Compose file not found: $COMPOSE_FILE"
  write_env_if_missing
  log "Building and starting Docker Compose stack"
  compose up -d --build --remove-orphans
  log "Deployment complete"
  print_urls
}

print_urls() {
  local host
  host="$(hostname -I 2>/dev/null | awk '{print $1}')"
  [[ -n "$host" ]] || host="<vm-ip>"
  cat <<EOF

Open:
  Frontend:        http://$host:3000
  Gateway API:     http://$host:8080/health
  RabbitMQ UI:     http://$host:15672  (v8 / v8_password)
  EMQX UI:         http://$host:18083  (admin / v8_mqtt_password)
  InfluxDB:        http://$host:8086

Update later:
  sudo iotctl update

EOF
}

cmd_deploy() {
  install_core_packages
  install_docker
  install_self
  clone_or_update_repo
  deploy_stack
}

cmd_update() {
  install_core_packages
  install_docker
  install_self
  clone_or_update_repo
  deploy_stack
}

cmd_status() {
  [[ -f "$COMPOSE_FILE" ]] || die "Compose file not found: $COMPOSE_FILE"
  compose ps
}

cmd_logs() {
  [[ -f "$COMPOSE_FILE" ]] || die "Compose file not found: $COMPOSE_FILE"
  compose logs -f --tail=200 "${@:2}"
}

cmd_restart() {
  [[ -f "$COMPOSE_FILE" ]] || die "Compose file not found: $COMPOSE_FILE"
  compose restart "${@:2}"
}

cmd_down() {
  [[ -f "$COMPOSE_FILE" ]] || die "Compose file not found: $COMPOSE_FILE"
  compose down
}

cmd_help() {
  cat <<EOF
iotctl deploy     Install dependencies, clone repo, and start the stack.
iotctl update     Pull latest code and rebuild/restart the stack.
iotctl status     Show container status.
iotctl logs       Follow logs for all services.
iotctl logs NAME  Follow logs for one service.
iotctl restart    Restart all services.
iotctl down       Stop the stack.

Environment overrides:
  IOT_REPO_URL=$REPO_URL
  IOT_BRANCH=$BRANCH
  IOT_APP_DIR=$APP_DIR
EOF
}

case "${1:-deploy}" in
  deploy) cmd_deploy ;;
  update) cmd_update ;;
  status) cmd_status ;;
  logs) cmd_logs "$@" ;;
  restart) cmd_restart "$@" ;;
  down) cmd_down ;;
  help|-h|--help) cmd_help ;;
  *) warn "Unknown command: $1"; cmd_help; exit 2 ;;
esac
