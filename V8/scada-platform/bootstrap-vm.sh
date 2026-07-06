#!/usr/bin/env bash
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/Materialist-x/-IoT.git}"
TARGET_DIR="${TARGET_DIR:-$HOME/-IoT}"
SCRIPT_SOURCE="${BASH_SOURCE[0]:-}"
REPO_ROOT=""
COMPOSE_DIR=""

if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_CMD=(docker-compose)
else
  echo "docker compose is required." >&2
  exit 1
fi

if ! command -v git >/dev/null 2>&1; then
  echo "git is required." >&2
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is required." >&2
  exit 1
fi

if [ -n "$SCRIPT_SOURCE" ] && [ -f "$SCRIPT_SOURCE" ]; then
  SCRIPT_DIR="$(cd "$(dirname "$SCRIPT_SOURCE")" && pwd)"
  if [ -f "$SCRIPT_DIR/docker-compose.yml" ] && [ -d "$SCRIPT_DIR/v7-backend" ] && [ -d "$SCRIPT_DIR/v8-frontend" ]; then
    COMPOSE_DIR="$SCRIPT_DIR"
  fi
  if [ -d "$SCRIPT_DIR/../.git" ]; then
    REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
  fi
fi

if [ -n "$REPO_ROOT" ]; then
  git -C "$REPO_ROOT" pull --ff-only
  COMPOSE_DIR="$REPO_ROOT/scada-platform"
elif [ -n "$COMPOSE_DIR" ]; then
  echo "Using local scada-platform snapshot at $COMPOSE_DIR"
else
  REPO_ROOT="$TARGET_DIR"
  if [ -d "$REPO_ROOT/.git" ]; then
    git -C "$REPO_ROOT" pull --ff-only
  elif [ -d "$REPO_ROOT" ] && [ -n "$(find "$REPO_ROOT" -mindepth 1 -maxdepth 1 2>/dev/null)" ]; then
    echo "Target directory already exists and is not a git repository: $REPO_ROOT" >&2
    echo "Either remove it, rename it, or run with a different TARGET_DIR." >&2
    exit 1
  else
    git clone "$REPO_URL" "$REPO_ROOT"
  fi
  COMPOSE_DIR="$REPO_ROOT/scada-platform"
fi

if [ ! -f "$COMPOSE_DIR/docker-compose.yml" ]; then
  echo "docker-compose.yml was not found under: $COMPOSE_DIR" >&2
  exit 1
fi

cd "$COMPOSE_DIR"
"${COMPOSE_CMD[@]}" up -d --build
"${COMPOSE_CMD[@]}" ps
