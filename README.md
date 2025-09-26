# Interview Helper Support Portal

A lightweight React + Express application that collects interview prep questions and persists them in a support queue for the coaching team.

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the support API (persists requests to a JSON queue by default):

   ```bash
   npm run dev:server
   ```

3. In another terminal, start the React front-end:

   ```bash
   VITE_SUPPORT_API_URL=http://localhost:4000/support npm run dev
   ```

   The app will be available at <http://localhost:5173>.

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `VITE_SUPPORT_API_URL` | ✅ (front-end) | Absolute URL the browser should use when posting form submissions. Example: `http://localhost:4000/support`. |
| `SUPPORT_QUEUE_FILE` | Optional (API) | Path to the JSON file used to persist submissions. Defaults to `data/support-queue.json`. |
| `PORT` | Optional (API) | Port the Express server listens on. Defaults to `4000`. |

The repository includes a `.gitignore` entry for `data/*.json` so persisted queue files are not committed.

## Tests

Run the unit test suite (components, services, and API routes):

```bash
npm test
```

Type-check the project:

```bash
npm run lint
```

Run the Playwright smoke test (ensures the full stack works end-to-end). Install browsers once before the first run with `npx playwright install --with-deps`.

```bash
npm run test:e2e
```

## API persistence

The Express API accepts validated POST requests at `/support`, assigns a UUID, and appends each submission to the configured queue file. This keeps an auditable record that can be synced with a CRM or ticketing system. A `/health` endpoint is provided for monitoring.
