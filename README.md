# CareerTracker

Small personal project to track career notes and stats. This repo contains a Vite + React frontend and a minimal Express API using MySQL for storage.

**Prerequisites**
- Node.js (>=16)
- MySQL server running locally

**Quickstart**

1. Install dependencies

```bash
npm install
```

2. Copy environment template and update credentials

```bash
cp .env.example .env
# edit .env and set DB_USER/DB_PASS/DB_NAME
```

3. Create the database (script will create DB if missing)

```bash
node create-db.js
```

4. Start the API server

```bash
npm start
# or: node server.js
```

5. Run the frontend (dev)

```bash
npm run dev
```

**API**
- `GET /notes` — list notes
- `POST /notes` — create note; JSON body: `{ "text": "..." }`

**Notes**
- Do not commit `.env` or `node_modules` (see `.gitignore`).
- If you change DB credentials, update `.env` then re-run `node create-db.js` if needed.
