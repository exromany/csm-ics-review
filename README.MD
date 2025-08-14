# CSM ICS Admin Panel

Admin panel for managing Individual Customer Staker form submissions with Web3 authentication and scoring.

## Quick Start

Prerequisites: Node.js 18+, pnpm, running backend at `http://localhost:3003`

```bash
pnpm install
cp .env.example .env
pnpm dev
```

## Key Features

- **Web3 Authentication** - Sign-In with Ethereum (SIWE)
- **Form Review** - 17-criteria scoring system with visual interface
- **Advanced Filtering** - Status, address, score, and date filters
- **CSV Export** - Export form data and scores
- **Real-time Updates** - Live status and score changes
- **Dark/Light Theme** - Responsive design

## Technology Stack

- **Refine** - Data management framework
- **React + TypeScript** - Frontend with strict typing
- **Wagmi/Viem** - Ethereum wallet integration
- **Tailwind CSS + shadcn/ui** - Styling and components
- **React Query** - Server state management

## Development

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
npx tsc --noEmit  # Type checking
npx eslint src --ext .ts,.tsx  # Linting
```

## Architecture

```text
src/
├── components/   # React components (UI, layout, scoring)
├── pages/        # Application pages (forms, admin, auth)
├── providers/    # Context providers (auth, data, theme)
├── types/        # TypeScript definitions
├── utils/        # Utility functions
└── config/       # Configuration files
```

## Authentication Flow

1. Connect Ethereum wallet
2. Sign SIWE message
3. Access admin panel with verified wallet

## Deployment

Automated GitHub Pages deployment on pushes to `main` branch.

For detailed development guidelines, see `CLAUDE.md`.
