#!/usr/bin/env bash
# call-codex.sh — Wrapper to invoke Codex with cyan-colored output
# Usage: ./scripts/call-codex.sh "Your review prompt here"

set -euo pipefail

CYAN='\033[0;36m'
BOLD_CYAN='\033[1;36m'
RESET='\033[0m'

if [ $# -eq 0 ]; then
  echo -e "${CYAN}Usage: $0 \"Your prompt here\"${RESET}"
  exit 1
fi

PROMPT="$1"

echo -e "${BOLD_CYAN}━━━ Codex Review ━━━${RESET}"
echo ""

codex exec "$PROMPT" 2>&1 | while IFS= read -r line; do
  echo -e "${CYAN}${line}${RESET}"
done

echo ""
echo -e "${BOLD_CYAN}━━━ End Codex Review ━━━${RESET}"
