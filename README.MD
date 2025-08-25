# CSM ICS Admin Panel

Admin panel for managing Individual Customer Staker form submissions with Web3 authentication and scoring.

## Quick Start

Prerequisites: Node.js 18+, yarn, running backend at `http://localhost:3003`

```bash
yarn install
cp .env.example .env
yarn dev
```

## Key Features

- **Web3 Authentication** - Sign-In with Ethereum (SIWE) with network detection
- **Form Review** - 17-criteria scoring system with visual interface
- **Advanced Filtering** - Dynamic table filters with custom hooks (status, address, date ranges)
- **Network Switching** - Automatic network detection and switching (Ethereum Mainnet/Hoodi)
- **CSV Export** - Export form data and scores
- **Real-time Updates** - Live status and score changes with toast notifications
- **Enhanced UX** - Toast notifications, tooltips, and improved error handling
- **Dark/Light Theme** - Responsive design with theme persistence

## Technology Stack

- **Refine** - Data management framework with built-in table filtering
- **React + TypeScript** - Frontend with strict typing
- **Wagmi/Viem** - Ethereum wallet integration with network switching
- **Tailwind CSS + shadcn/ui** - Styling and components
- **React Query** - Server state management
- **Sonner** - Toast notification system

## Development

```bash
yarn dev          # Start development server
yarn build        # Build for production
npx tsc --noEmit  # Type checking
npx eslint src --ext .ts,.tsx  # Linting
```

### Configuration

- **Network Support**: Ethereum Mainnet (Chain ID: 1) and Hoodi (Chain ID: 560048)
- **Environment**: Copy `.env.example` to `.env` and configure required variables

## Architecture

```text
src/
├── components/   # React components (UI, layout, scoring)
├── pages/        # Application pages (forms, admin, auth)
├── providers/    # Context providers (auth, data, theme)
├── hooks/        # Custom React hooks (table filtering)
├── types/        # TypeScript definitions
├── utils/        # Utility functions (CSV export, network switching)
└── config/       # Configuration files (scoring, table config)
```

## Authentication Flow

1. Connect Ethereum wallet (with automatic network detection)
2. Switch to required network if necessary
3. Sign SIWE message
4. Access admin panel with verified wallet and network

## Deployment

Automated GitHub Pages deployment on pushes to `main` branch.

For detailed development guidelines, see `CLAUDE.md`.
