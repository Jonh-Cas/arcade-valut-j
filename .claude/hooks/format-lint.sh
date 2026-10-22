#!/usr/bin/env bash
# PostToolUse hook: run Prettier and ESLint on the file Claude just wrote or edited.
# Exit 2 sends remaining ESLint errors back to Claude so it can fix them.

set -uo pipefail

file=$(jq -r '.tool_input.file_path // empty')
project_dir="${CLAUDE_PROJECT_DIR:-$(pwd)}"

[ -z "$file" ] && exit 0
[ -f "$file" ] || exit 0

case "$file" in
  "$project_dir"/*) ;;
  *) exit 0 ;;
esac

case "$file" in
  */node_modules/* | */.next/* | */.git/*) exit 0 ;;
esac

cd "$project_dir" || exit 0

npx --no-install prettier --write --ignore-unknown --log-level warn "$file" >&2

case "$file" in
  *.js | *.jsx | *.ts | *.tsx | *.mjs | *.cjs)
    if ! output=$(npx --no-install eslint --fix "$file" 2>&1); then
      echo "ESLint errors in $file:" >&2
      echo "$output" >&2
      exit 2
    fi
    ;;
esac

exit 0
