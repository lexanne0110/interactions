#!/bin/bash
cd "$(dirname "$0")"

echo "Starting Jiffy Interactions…"
echo ""

if [ ! -d "node_modules" ]; then
  echo "First run — installing dependencies (one time only)…"
  npm install || exit 1
  echo ""
fi

npm start
