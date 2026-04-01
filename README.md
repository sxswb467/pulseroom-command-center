# PulseRoom Command Center

A fancy and eye-catching portfolio demo built to showcase **Fastify**, **TypeScript**, and **JavaScript** without falling back to another boring CRUD tracker.

## Why this project works

- **Fastify** powers a typed backend API and a realtime Server-Sent Events stream.
- **TypeScript** handles backend route design, validation, and state modeling.
- **JavaScript** drives a rich, animated frontend with live updates and canvas chart rendering.
- The UI looks like a polished product surface instead of a tutorial exercise.

## Features

- Realtime command center dashboard
- Live metric updates via SSE
- Typed Fastify API routes
- Command submission with JSON schema validation
- Static frontend served directly by Fastify
- Canvas-based sparkline chart
- Glassmorphism, gradient, and motion-inspired styling

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:4180`.

## Useful files

- `src/server.ts` — Fastify server setup, static hosting, and SSE endpoint
- `src/routes/api.ts` — API routes and request validation
- `src/lib/store.ts` — typed state and live mutation logic
- `public/app.js` — frontend rendering and interactions in JavaScript
- `public/styles.css` — visual design system and layout styling

## Build

```bash
npm run build
npm start
```
