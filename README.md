# New Eden Hub — Docker-ready connection tracker

A self-hosted dark-space connection dashboard inspired by the *information architecture* of public EVE wormhole connection trackers, but using original UI, styling, copy, and branding.

## Run

Requirements: Docker + Docker Compose.

```bash
docker compose up -d --build
```

Open `http://YOUR-SERVER-IP:8281/`.

## Pages

- `/` — connection dashboard with filters, live stats, and connection table.
- `/submit.html` — separate scout submission page.
- `/api/connections` — JSON connection feed.
- `/api/stats` — dashboard statistics.
- `POST /api/connections` — accepts new reports.

SQLite is stored in `./data/hub.db`, so data survives container recreation.

## Next steps for production

This starter deliberately uses local seeded data. You can add EVE SSO/ESI authentication, EVE static-data lookups, a moderation queue, user accounts, audit logs, and an EVE-Scout-compatible ingestion adapter without changing the frontend structure.


## Git / GitHub

This repository is structured to be committed directly to Git. The SQLite database file is intentionally ignored; runtime data stays in `./data`.

```bash
git init
git add .
git commit -m "Initial New Eden Hub"
git branch -M main
# create an empty GitHub repository, then:
git remote add origin https://github.com/YOUR-USER/YOUR-REPO.git
git push -u origin main
```

The Docker service listens on port **8281**.
