#!/bin/zsh
set -e

cd -- "${0:A:h}"
export PATH="$PATH:/opt/homebrew/bin:/usr/local/bin"

if ! command -v node >/dev/null || ! command -v npm >/dev/null; then
  print -u2 'Install Node.js with npm, then double-click this launcher again.'
  exit 1
fi

if [[ ! -x node_modules/.bin/vite ]]; then
  npm ci
fi

exec npm run dev -- --host 127.0.0.1 --open
