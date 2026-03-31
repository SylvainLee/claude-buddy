# Buddy Standalone

Minimal standalone demo extracted from the hidden `BUDDY` feature in Claude Code.

## Run

```bash
node buddy-standalone/main.ts help
node buddy-standalone/main.ts hatch alice
node buddy-standalone/main.ts inspect alice
node buddy-standalone/main.ts animate alice
```

## Commands

- `hatch [userId]`: render a companion card
- `lookup <userId>`: render the same deterministic companion again
- `inspect <userId>`: print the underlying deterministic data as JSON
- `animate [userId]`: show the idle animation loop
- `gallery`: print all species
- `gacha [count]`: roll multiple companions

This demo keeps the deterministic companion generation and sprite rendering model,
but does not depend on the full Claude Code app, React, Ink, or Bun.

## Browser Demo

Open [index.html](/Users/lihao/Projects/claude-code/buddy-standalone/index.html) in a browser to use the static visual demo.

Or run a simple preview server:

```bash
cd buddy-standalone
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

## Publish As Its Own GitHub Repo

This directory is now self-contained. You can turn `buddy-standalone/` into a separate repository without carrying the large leaked `src/` tree.

Suggested flow:

```bash
cd buddy-standalone
git init
git add .
git commit -m "Initial Buddy standalone demo"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

## Deploy To Vercel

This directory includes its own [vercel.json](/Users/lihao/Projects/claude-code/buddy-standalone/vercel.json), so if you deploy `buddy-standalone/` as the repo root, visiting `/` will open the Buddy page directly.

Recommended Vercel settings:

- Framework preset: `Other`
- Root directory: repository root
- Build command: leave empty
- Output directory: leave empty

If you import the GitHub repo in Vercel, no build step is required.
