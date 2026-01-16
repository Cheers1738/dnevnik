#!/usr/bin/env bash
set -euo pipefail

export LLM_STUB=${LLM_STUB:-1}

docker compose up -d --build
trap 'docker compose down -v' EXIT

for i in {1..30}; do
  if curl -fs http://localhost:4000/health > /dev/null; then
    break
  fi
  sleep 2
  if [ "$i" -eq 30 ]; then
    echo "API not healthy" >&2
    exit 1
  fi
done

response=$(curl -fs \
  -X POST http://localhost:4000/llm/generate \
  -H "Content-Type: application/json" \
  -d '{"messages":[],"mode":"support"}')

RESPONSE="$response" node <<'NODE'
const data = JSON.parse(process.env.RESPONSE);
if (!data.chapter_title || !data.chapter_text || !Array.isArray(data.quotes) || data.quotes.length !== 5) {
  console.error("Invalid artifact", data);
  process.exit(1);
}
console.log("Smoke ok");
NODE
