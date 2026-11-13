#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
git pull --ff-only origin main
docker compose --profile host up -d --build
docker image prune -f
