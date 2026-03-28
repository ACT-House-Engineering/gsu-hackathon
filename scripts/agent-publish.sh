#!/usr/bin/env sh
set -eu

if [ "$#" -lt 1 ]; then
  echo "Usage: bun git:publish -- \"<conventional-commit-message>\"" >&2
  exit 1
fi

message="$1"
branch="$(git branch --show-current)"

if [ "$branch" != "main" ]; then
  echo "Refusing publish from branch '$branch'. Switch to 'main' first." >&2
  exit 1
fi

if ! printf '%s' "$message" | grep -Eq '^(feat|fix|refactor|docs|chore|test|ci)(\([^)]+\))?: .+'; then
  echo "Commit message must use Conventional Commit format." >&2
  exit 1
fi

if git diff --staged --quiet; then
  echo "No staged changes found. Stage the intended files before publishing." >&2
  exit 1
fi

git commit -m "$message"
git push origin main
