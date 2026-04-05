#!/bin/bash
set -e

cd /vercel/share/v0-project

git config user.email "v0[bot]@users.noreply.github.com"
git config user.name "v0[bot]"

# Stage all changes
git add -A

# Commit
git commit -m "feat: add landing page, design system, and app shell refresh

- Add full marketing landing page (/) with hero, features, how-it-works, tech stack, footer
- Move chat app to /app route
- Add warm monochrome design system (Tailwind tokens, Lora serif font)
- Refresh all app shell components (HomeClient, Upload, UrlImport, DocumentsPanel, Chat)
- Add demo.gif to public/ and embed in landing page hero
- Update all CTA links to https://askbase.saumyatiwari.com

Co-authored-by: v0[bot] <v0[bot]@users.noreply.github.com>"

# Push directly to main
git push origin HEAD:main
