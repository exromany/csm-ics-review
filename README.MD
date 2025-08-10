# CSM ICS Admin Panel

This is a **CSM ICS Admin Panel** built with [Refine](https://github.com/refinedev/refine) for managing Individual Customer Staker form submissions. The application provides a comprehensive review interface for CSM operators to evaluate, score, and manage ICS form submissions with advanced filtering, real-time updates, and CSV export capabilities.

## Technology Stack

- **Refine Core** - Main framework providing data fetching, routing, authentication
- **SIWE (Sign-In with Ethereum)** - Web3 authentication using Ethereum wallets
- **Wagmi + Viem** - Ethereum wallet connection and interaction
- **React Router v7** - Client-side routing
- **Vite** - Build tool and dev server
- **TypeScript** - Type checking (strict mode enabled)
- **Tailwind CSS** - Styling framework
- **shadcn/ui** - UI component library (preferred for new components)
- **React Query** - Server state management

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm package manager
- Backend API running at `http://localhost:3003`
- Ethereum wallet (MetaMask, WalletConnect, etc.)

### Installation

```bash
# Install dependencies
pnpm install

# Copy environment configuration
cp .env.example .env

# Start development server
pnpm dev
```

## Available Scripts

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Type checking
npx tsc --noEmit

# Lint TypeScript files
npx eslint src --ext .ts,.tsx

# Refine CLI commands
pnpm refine
```

## Features

### Core Functionality
- **Web3 Authentication** - SIWE (Sign-In with Ethereum) integration with wallet support
- **Form Review System** - 17-criteria scoring system with visual icons and point tracking
- **Admin Dashboard** - Forms list with advanced filtering, search, and pagination
- **Real-time Updates** - Live status and score updates with optimistic UI
- **CSV Export** - Export form data and scores for external analysis

### User Experience
- **Dark/Light Theme** - System preference detection with manual toggle
- **Responsive Design** - Mobile-first approach using Tailwind CSS
- **Intuitive Scoring** - Icon-based interface with progress indicators
- **Smart Filtering** - Filter by status, address, score ranges, and submission dates
- **Rejection Helpers** - Pre-defined rejection reasons and suggestion templates

### Technical Features
- **Type Safety** - Full TypeScript coverage with OpenAPI schema integration
- **Performance Optimized** - React Query caching and efficient pagination
- **Error Handling** - Comprehensive error states with user-friendly messages
- **Accessibility** - ARIA labels and keyboard navigation support

## Authentication

The application uses SIWE (Sign-In with Ethereum) for authentication:
1. Connect your Ethereum wallet
2. Sign the authentication message
3. Access the admin panel with your verified wallet

## Architecture

### Project Structure
```
src/
├── components/          # React components
│   ├── ui/             # shadcn/ui components
│   ├── layout/         # Layout components (header, menu)
│   ├── scoring/        # Form scoring UI components
│   └── breadcrumb/     # Navigation breadcrumbs
├── pages/              # Application pages
│   ├── ics-forms/      # ICS forms list and detail pages
│   ├── admin-users/    # Admin user management
│   └── login/          # Authentication page
├── providers/          # React context providers
├── types/              # TypeScript type definitions
├── config/             # Configuration files
├── utils/              # Utility functions
└── assets/             # Static assets and icons
```

### Development Guidelines

- **Backend API** - Must be running at `http://localhost:3003`
- **Code Style** - Follow existing patterns and use shadcn/ui components
- **Type Safety** - All API responses follow OpenAPI schema in `types/api.ts`
- **Environment** - Copy `.env.example` to `.env` and configure as needed
- **Documentation** - See `CLAUDE.md` for comprehensive development guidelines

### API Integration

The application integrates with a REST API providing:
- **Authentication endpoints** - `/admin/auth/*` for SIWE login/verification
- **Form management** - `/admin/ics-forms/*` for CRUD operations
- **Admin user management** - `/admin/users/*` for user administration

## Technologies & Resources

### Framework & Libraries
- **[Refine Documentation](https://refine.dev/docs)** - Main framework for data management
- **[React Router v7](https://reactrouter.com)** - Client-side routing
- **[Wagmi](https://wagmi.sh)** - Ethereum wallet connection
- **[Viem](https://viem.sh)** - Ethereum interactions
- **[React Query](https://tanstack.com/query)** - Server state management

### UI & Styling
- **[shadcn/ui Components](https://ui.shadcn.com)** - UI component library
- **[Tailwind CSS](https://tailwindcss.com)** - Utility-first CSS framework
- **[Radix UI](https://radix-ui.com)** - Headless UI primitives
- **[Lucide Icons](https://lucide.dev)** - Icon library

### Authentication & Web3
- **[SIWE Specification](https://eips.ethereum.org/EIPS/eip-4361)** - Sign-In with Ethereum standard
- **[WalletConnect](https://walletconnect.com)** - Multi-wallet support

### Development Tools
- **[Vite](https://vitejs.dev)** - Build tool and dev server
- **[TypeScript](https://typescriptlang.org)** - Type checking
- **[ESLint](https://eslint.org)** - Code linting

## Contributing

This project follows standard practices:

1. **Fork** the repository
2. **Create** a feature branch
3. **Make** your changes following the existing code style
4. **Test** your changes thoroughly
5. **Submit** a pull request with a clear description

For detailed development guidelines, see `CLAUDE.md`.

## License

MIT
