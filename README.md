# Interview Pass AI

Interview Pass AI is a unified interview preparation workspace that runs in the browser and on a
Windows desktop app. It blends AI-assisted practice, coaching, salary insights, and recruiter
outreach into a single experience.

## Features

- **Get Started Guide** – Onboard quickly with guided walkthroughs and curated feature highlights.
- **Playground** – Experiment with tone and scenario-specific prompts, capture notes, and sync them
  with practice sessions.
- **Interview Question Bank** – Browse curated questions across behavioral, technical, and
  leadership tracks.
- **AI Salary Calculator** – Estimate salary ranges by role, experience level, and location tier.
- **Speak with Recruiters** – Connect with trusted recruiters and gather notes for follow-up.
- **AI Career Coach** – Receive tailored guidance toward promotions, pivots, or leadership growth.
- **AI Job Hunter (Beta)** – Enable early-access job streams tuned to your preferences.
- **AI Material Generator** – Generate resume bullets, cover letters, and thank-you notes.
- **Stealth Mode** – Run a local Electron desktop app that stays invisible during screen shares.
- **AI Resume Builder** – Organize highlights, get AI prompts, and preview export-ready resumes.
- **Preparation Hub** – Centralize practice plans, frameworks, and research briefs.
- **Mock Interview Studio** – Spin up targeted scenarios with adjustable difficulty.
- **Interview Copilot** – Activate real-time cues, note-taking, and confidence tracking.

## Getting Started (Web)

1. Install [Node.js 18+](https://nodejs.org/).
2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:5173](http://localhost:5173) in your browser.

5. Build for production:

   ```bash
   npm run build
   npm run preview
   ```

## Windows Desktop (Electron)

The Electron desktop build wraps the same Vite-powered UI so you can keep Interview Pass AI in a
floating window during calls.

1. On Windows, install Node.js 18+ and Git.
2. Clone this repository and install dependencies (`npm install`).
3. For a development desktop experience run:

   ```bash
   npm run electron-dev
   ```

   This starts the Vite dev server and launches Electron pointing to it.

4. To bundle the desktop app against the production build run:

   ```bash
   npm run electron
   ```

   This builds the web assets and opens Electron with the compiled files.

## Project Structure

```
├── electron/           # Electron main and preload scripts
├── src/                # React components and styling
├── index.html          # Vite entry point
├── package.json        # Scripts and dependencies
├── tsconfig*.json      # TypeScript configuration
└── vite.config.ts      # Vite configuration
```

## Scripts

- `npm run dev` – start Vite development server.
- `npm run build` – type-check and build production assets.
- `npm run preview` – preview the production build locally.
- `npm run electron-dev` – run Vite and Electron together for desktop development.
- `npm run electron` – build the web app and open it inside Electron.

## License

This project is provided as-is for demonstration purposes.
