# Minecraft Civilization Server

A full-stack modern website for managing a Minecraft Civilization Server.

## Features

- **Town Creation & Management** – Create, manage, and grow your civilization
- **War Declarations** – Declare wars, track conflicts, manage alliances
- **Espionage Reporting** – Submit and track spy missions and intel reports
- **Trade & Stores** – Player-driven marketplace and town stores
- **Legal Disputes & Trials** – Court system for resolving disputes
- **Clan Management** – Manage members, roles, and town upgrades

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript + Prisma ORM
- **Database**: SQLite (easily swappable to PostgreSQL)
- **Auth**: JWT-based authentication
- **Deployment**: Docker + docker-compose

## Quick Start

```bash
# Install all dependencies
npm run setup

# Start development (both server & client)
npm run dev

# Or run individually
npm run dev:server   # Backend on :3001
npm run dev:client   # Frontend on :5173
```

## Production Build

```bash
npm run build
npm start
```

## Docker Deployment

```bash
docker-compose up --build -d
```

## Environment Variables

Create `server/.env`:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-super-secret-key-change-in-production"
PORT=3001
NODE_ENV=development
```

## Project Structure

```
├── client/                # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── services/      # API service layer
│   │   ├── types/         # TypeScript types
│   │   └── utils/         # Utility functions
│   └── ...
├── server/                # Express backend
│   ├── src/
│   │   ├── routes/        # API routes
│   │   ├── middleware/     # Express middleware
│   │   ├── services/      # Business logic
│   │   └── utils/         # Utility functions
│   ├── prisma/            # Database schema & migrations
│   └── ...
├── docker-compose.yml
└── README.md
```

## API Endpoints

| Module      | Endpoint             | Description              |
|-------------|----------------------|--------------------------|
| Auth        | POST /api/auth/*     | Register, login, profile |
| Towns       | /api/towns/*         | CRUD + members           |
| Wars        | /api/wars/*          | Declarations & status    |
| Espionage   | /api/espionage/*     | Spy reports & missions   |
| Trade       | /api/trade/*         | Marketplace & stores     |
| Legal       | /api/legal/*         | Disputes & trials        |
| Players     | /api/players/*       | Player management        |
