# Civitas Frontend

React + Vite frontend for Civitas authentication, routing, and owner or organization UI foundations.

## Quick start

1. Copy the environment file.

```bash
cp .env.example .env
```

2. Fill the canonical frontend variables.

```env
VITE_API_URL=https://civitas.didaxus.com/api
VITE_LOGTO_ENDPOINT=https://auth.didaxus.com
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
- `VITE_API_URL` and `VITE_LOGTO_ENDPOINT` must match the compiled Civitas auth contract.
- `VITE_LOGTO_APP_ID` and redirect URIs remain frontend deployment metadata.
- Do not define `VITE_LOGTO_API_RESOURCE`, `VITE_API_BASE_URL`, or `VITE_API_RESOURCE`.
- Missing frontend environment variables now fail fast instead of silently falling back to placeholder or localhost values.
