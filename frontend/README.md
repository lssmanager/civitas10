# Civitas Frontend

React + Vite frontend for Civitas authentication, routing, and owner or organization UI foundations.

## Quick start

1. Copy the environment file.

```bash
cp .env.example .env
```

2. Fill the canonical frontend variables.

```env
VITE_LOGTO_APP_ID=h4xwfa8s6cuj5blhzplga
VITE_APP_REDIRECT_URI=https://civitas.didaxus.com/callback
VITE_APP_SIGNOUT_REDIRECT_URI=https://civitas.didaxus.com
```

3. Install dependencies.

```bash
npm install
```

4. Start the dev server.

```bash
npm run dev
```

## Notes

- Frontend consumes only `VITE_*` variables.
- Auth issuer, Logto API resource, and public API URL come from the compiled Civitas auth contract.
- Frontend env is limited to SPA app ID and redirect metadata.
- Do not define `VITE_LOGTO_API_RESOURCE`, `VITE_LOGTO_ENDPOINT`, or `VITE_API_URL`.
- Missing frontend environment variables now fail fast instead of silently falling back to placeholder or localhost values.
