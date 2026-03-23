#!/usr/bin/env bash
# Push workspace to GitHub repo https://github.com/sunilv8892-sudo/rks-3.git
REMOTE_URL="https://github.com/sunilv8892-sudo/rks-3.git"

# Init if needed
if [ ! -d .git ]; then
  git init
fi

git add .

if ! git commit -m "Update site" 2>/dev/null; then
  echo "No changes to commit"
fi

# Ensure branch
git branch -M main 2>/dev/null || true

# Replace origin
git remote remove origin 2>/dev/null || true
git remote add origin "$REMOTE_URL"

# Push
if ! git push -u origin main; then
  echo "Push failed, attempting fetch + rebase"
  git fetch origin
  git pull --rebase origin main || true
  git push -u origin main
fi

echo "Done."