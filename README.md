# PulseRoom Command Center

PulseRoom Command Center is a real-time operations dashboard built with Fastify, TypeScript, and JavaScript. It provides a polished command-center interface for monitoring live metrics, reviewing activity, filtering operational signals, and issuing operator actions from a single screen.

The app is designed to make live system state easier to understand and act on. It combines streaming updates, clear health indicators, responsive data views, keyboard-friendly controls, and persisted dashboard preferences so users can quickly scan changes, focus on critical events, and work efficiently on both desktop and mobile.

## Project overview

I designed this project to demonstrate a few things at once:

- I can build a clean Fastify backend with typed routes and validation.
- I can model application state in TypeScript without overcomplicating the architecture.
- I can deliver a frontend in plain JavaScript that still feels dynamic, intentional, and well-crafted.
- I care about UI/UX details such as hierarchy, feedback, accessibility, keyboard flow, and visual identity.

The current UI uses a more editorial, serif-led direction inspired by a Rotman-style "Times New" presentation approach, while still behaving like a lightweight product dashboard.

## What the app does

PulseRoom Command Center renders a live dashboard with:

- streaming dashboard refreshes over Server-Sent Events
- metric cards with contextual annotations
- mission panels with health states and progress bars
- a live activity timeline with severity levels
- a canvas-based sparkline for momentum tracking
- an operator command form that injects new events into the stream
- filter controls for panels, activity, and chart range
- keyboard shortcuts for fast interaction
- server-backed view preferences so the selected dashboard state survives refreshes during local use

## Screenshots

### Desktop overview

![PulseRoom desktop overview](docs/screenshots/pulseroom-desktop.png)

A wide desktop view of the command center showing the editorial hero, metric layer, and the main operational surfaces.

### Filtered operator state

![PulseRoom filtered dashboard state](docs/screenshots/pulseroom-filtered.png)

A focused dashboard state that highlights the filter controls for panel health, activity severity, and the expanded chart range.

### Mobile responsive view

![PulseRoom mobile responsive layout](docs/screenshots/pulseroom-mobile.png)

A narrow-screen capture that shows how the layout stacks cleanly while keeping the dashboard readable and usable on mobile.

## Why I built it this way

I wanted this repo to feel like a small but complete product slice.

A lot of portfolio demos prove that the code runs, but they do not prove much about judgment. Here I tried to show judgment in a few different ways:

- I kept the backend small and readable instead of hiding simple behavior behind unnecessary abstraction.
- I used typed request validation so the API feels intentional.
- I made the frontend interactive without depending on a heavy framework, which keeps the implementation honest.
- I treated the UI as a product surface, not just a container for data.
- I added quality-of-life behavior such as empty states, busy states, filter persistence, shortcut support, and reset controls.

## Tech stack

- **Fastify** for the HTTP server and API routes
- **TypeScript** for backend modeling, route contracts, and state management
- **JavaScript** for the client-side rendering and interactions
- **Server-Sent Events** for the live dashboard stream
- **Canvas API** for sparkline rendering
- **Static asset hosting through Fastify** for a compact full-stack setup

## UX details I focused on

A big part of this project is the experience layer, not just the data layer.

Some of the UI/UX decisions I intentionally added:

- stronger visual hierarchy in the hero and section layout
- richer metric descriptions so the cards say something useful
- filter chips with visible active state
- live stream status and last-updated feedback
- resettable dashboard view state
- keyboard shortcuts for operator-style interaction
- accessible progress bars and aria-live feedback for form responses
- responsive layouts that remain usable on smaller screens

## Keyboard shortcuts

The dashboard supports a small operator-style shortcut set:

- `R` refresh the snapshot
- `/` focus the command label field
- `P` cycle panel health filters
- `A` cycle activity severity filters
- `[` move to a shorter chart range
- `]` move to a longer chart range
- `Esc` leave the focused input field

## API surface

The project exposes a small set of routes:

- `GET /api/health` returns a simple service health payload
- `GET /api/dashboard` returns the current dashboard snapshot
- `GET /api/preferences` returns saved dashboard view preferences for the current client id
- `PUT /api/preferences` updates saved dashboard view preferences
- `POST /api/commands` validates and logs an operator command
- `GET /api/stream` pushes live dashboard updates over SSE

## Local development

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Then open [http://localhost:4180](http://localhost:4180).

If you prefer running the compiled server directly:

```bash
npm run build
npm start
```

## Project structure

- `src/server.ts` — Fastify setup, static hosting, SSE endpoint, and fallback routing
- `src/routes/api.ts` — API routes, request validation, and preference endpoints
- `src/lib/store.ts` — typed dashboard state, mutation logic, and in-memory preference storage
- `public/index.html` — page structure and dashboard sections
- `public/app.js` — client-side rendering, filters, shortcuts, and persistence requests
- `public/styles.css` — design system, layout, responsive behavior, and typography

## What this project demonstrates

For me, this project is less about raw complexity and more about showing full-stack product thinking in a compact repo.

It demonstrates:

- backend fundamentals with a clean API surface
- live data delivery without unnecessary infrastructure
- UI craft beyond default dashboard templates
- practical interaction design and product polish
- the ability to turn a simple technical stack into a presentation-ready experience
