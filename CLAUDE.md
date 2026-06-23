# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

The project uses `pnpm` as the package manager (provisioned via Node's built-in
corepack — the version is pinned by the `packageManager` field in `package.json`).
Key commands:

- `pnpm dev` - Start development server (uses Refine CLI)
- `pnpm build` - Build for production (runs TypeScript compilation + Refine build)
- `pnpm start` - Start production server
- `pnpm exec tsc --noEmit` - Type checking (no explicit typecheck script)
- `pnpm exec eslint src` - Lint TypeScript files (flat config in `eslint.config.js`; `--ext` was removed in the flat-config migration)

> Project-wide pnpm settings (dependency `overrides`, native build-script policy)
> live in `pnpm-workspace.yaml` — pnpm 10+ no longer reads the `pnpm` field of
> `package.json`.

## Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # shadcn/ui components (sonner, tooltip, etc.)
│   ├── layout/         # Layout components (header, menu)
│   ├── scoring/        # Form scoring UI components
│   ├── breadcrumb/     # Navigation breadcrumbs
│   └── theme-toggle.tsx # Theme switching component
├── pages/              # Application pages
│   ├── ics-forms/      # ICS forms list and detail pages
│   ├── admin-users/    # Admin user management
│   └── login/          # Authentication page
├── providers/          # React context providers
│   ├── authProvider.ts # SIWE authentication provider
│   ├── dataProvider.ts # Refine data provider
│   ├── themeProvider.tsx # Dark/light theme provider
│   └── wagmiConfig.ts  # Wagmi wallet configuration
├── hooks/              # Custom React hooks
│   └── useTableFilters.ts # Advanced table filtering hook
├── types/              # TypeScript type definitions
│   └── api.ts          # OpenAPI generated types
├── config/             # Configuration files
│   ├── scoringConfig.tsx # ICS scoring criteria
│   └── tableConfig.ts  # Table configuration for filters and sorting
├── utils/              # Utility functions
│   ├── csvExport.ts    # CSV export functionality
│   ├── scoring.ts      # Scoring calculations
│   ├── rejectionSuggestions.ts # Form rejection helpers
│   └── networkUtils.ts # Network switching utilities
├── lib/                # Utility libraries
│   └── utils.ts        # Common utility functions
└── assets/             # Static assets
    └── icons/ics-scores/ # Scoring criteria icons
```

## Technology Stack

This is a **CSM ICS Admin Panel** built with Refine framework for managing Individual Customer Staker form submissions. Key technologies:

- **Refine Core** - Main framework providing data fetching, routing, authentication
- **SIWE (Sign-In with Ethereum)** - Web3 authentication using Ethereum wallets with network detection
- **Wagmi + Viem** - Ethereum wallet connection, interaction, and network switching
- **React Router v7** - Client-side routing with HashRouter for GitHub Pages compatibility
- **Vite** - Build tool and dev server
- **TypeScript** - Type checking (strict mode enabled)
- **Tailwind CSS** - Styling framework
- **shadcn/ui** - Preferred UI component library (pre-configured)
- **Sonner** - Toast notification system for user feedback
- **React Query** - Server state management
- **Custom Hooks** - Advanced table filtering and data management

## API Integration

### Backend API
- **Base URL**: `http://localhost:3003`
- **Authentication**: JWT tokens via SIWE (Sign-In with Ethereum)
- **Admin endpoints**: `/admin/auth/*` and `/admin/ics-forms/*`

### API Schema Summary
- `POST /admin/auth/signin` - SIWE authentication
- `GET /admin/auth/verify` - JWT verification
- `GET /admin/ics-forms` - Paginated forms list with filters
- `GET /admin/ics-forms/{id}` - Form detail
- `PATCH /admin/ics-forms/{id}` - Update form review

## Architecture Overview

### Application Structure
- `src/App.tsx` - Main application with Wagmi/React Query providers
- `src/authProvider.ts` - SIWE-based authentication provider
- `src/providers/` - Custom data provider and Wagmi configuration
- `src/types/api.ts` - TypeScript interfaces from OpenAPI schema
- `src/pages/ics-forms/` - Forms list and detail/review pages
- `src/components/` - Layout and menu components

### Authentication Flow (SIWE)
1. User connects Ethereum wallet (MetaMask, WalletConnect, etc.)
2. App detects current network and switches to required network if necessary
3. App generates SIWE message for signing
4. User signs message with their wallet
5. Backend validates signature and returns JWT
6. JWT stored and used for API authentication

### Form Review Workflow
1. **Forms List** (`/`) - Paginated table with advanced filters and search
2. **Form Detail** (`/forms/:id`) - Review individual form submissions
3. **Scoring System** - 17 criteria with point-based scoring and visual feedback
4. **Status Management** - REVIEW/APPROVED/REJECTED with comments and toast notifications
5. **Real-time Updates** - Changes saved via API with immediate feedback

### Data Flow
- **Forms List**: Fetches paginated data with advanced filters (status, address, dates)
- **Form Detail**: Loads individual form with scores/comments
- **Review Updates**: PATCH requests to update status, scores, comments
- **Authentication**: JWT tokens in Authorization headers
- **Network Management**: Automatic network detection and switching

### Table Configuration System
- **Dynamic Filters**: `src/config/tableConfig.ts` defines filterable fields by resource
- **Custom Hook**: `src/hooks/useTableFilters.ts` manages filter state and API integration
- **Filter Types**: Support for text, select, boolean, and date range filters
- **API Integration**: Filter parameters mapped directly to backend API expectations

### Network Management
- **Multi-Network Support**: Ethereum Mainnet (Chain ID: 1) and Hoodi (Chain ID: 560048)
- **Automatic Detection**: `src/utils/networkUtils.ts` handles network validation
- **Switching Logic**: Prompts users to switch networks when required
- **Error Handling**: Toast notifications for network-related issues

## Component Patterns

### Design System (READ BEFORE TOUCHING ANY UI)

`src/components/ui/` **is the design system** and the single import surface is the
barrel `@/components/ui`. It has three layers: a **token layer**
(`tone.ts` — the one source of status color semantics — plus `App.css`), the
**shadcn primitives**, and **composed components** extracted from repeated
patterns. Feature code (everything else under `src`) must **compose the library,
never reinvent or bypass it**.

- **No color bypass.** Raw Tailwind palette classes (`bg-emerald-500`,
  `text-red-600`, `border-amber-500/25`) and arbitrary colors (`bg-[#…]`) are
  **forbidden in feature code** and fail ESLint (`design-system/no-raw-palette`).
  Status color comes only from the tone maps (`toneSoft`, `toneIcon`, `toneTint`,
  `toneBorder`, `toneSolid`, `toneGhostHover`, `toneIndicator`) or a component.
  Palette lives **only** in `src/components/ui/**`; if the tone vocabulary lacks
  something, extend `tone.ts` — don't inline.
- **Reuse, don't re-roll.** Use `Panel`, `PageHeader`, `EmptyState`,
  `LoadingState`, `SearchInput`, `SegmentedControl`, `SortableHeader`/`ColumnLabel`,
  `TableSkeleton`, `DataPagination`, `Field`, `AddressDisplay`, `StatusPill`,
  `SoftBadge`, `StatusBadge`/`DetailStatusBadge`/`IcsStatusBadge`, and `notify`
  (never a direct `toast.*`). New repeated visual patterns go **into the library**
  (palette allowed there), get exported from the barrel, and are added to the
  showcase.
- **Showcase:** the public route `/#/design-system` (`src/pages/design-system/`)
  renders every token and component in light + dark — use it to verify changes.
- **Review:** before merging UI, follow the `design-system-review` skill
  (`.claude/skills/design-system-review/`).
- shadcn primitives still live in `src/components/ui/` (new-york style, zinc base,
  CSS variables); add new ones there.

### Key Components
- **Login Page** - Wallet connection, network detection, and SIWE authentication
- **IcsFormsList** - Data table with advanced filtering, sorting, and pagination
- **IcsFormDetail** - Form review interface with scoring and toast feedback
- **Layout** - Header with user info, network status, and logout
- **StatusBadge** - Visual status indicators
- **Theme Toggle** - Dark/light mode switching with persistence
- **Toast System** - User feedback via Sonner notifications

### Scoring System
17 scoring criteria with visual icons and point values:
- **EthStaker Lists** - Solo staker verification
- **StakeCat Lists** - Community staker verification
- **Obol Techne Credentials** - DVT operator certification
- **CSM Testnet/Mainnet** - Community staking participation
- **SDVT Testnet/Mainnet** - Distributed validator participation
- **SSV Network** - SSV operator experience
- **Discord Verification** - Community engagement
- **Twitter/X Verification** - Social presence
- **Aragon Voting** - Governance participation
- **Snapshot Voting** - Off-chain governance
- **GitPOAP** - Developer contributions
- **Galxe Credentials** - Web3 activity verification
- **Proof of Humanity** - Human verification
- **Worldcoin Verification** - Identity verification
- **Circles UBI** - Social verification
- **High Signal Community** - Reputation signals

Each criterion has configurable point values and can include sub-criteria for detailed scoring.

## Environment Configuration

### Required Environment Variables
Copy `.env.example` to `.env` and configure:

```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:3003

# Blockchain Configuration
VITE_CHAIN_ID=1

# WalletConnect Configuration (optional)
VITE_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id

# Application Configuration
VITE_APP_NAME=CSM ICS Admin Panel
VITE_APP_VERSION=0.1.0
VITE_SIWE_DOMAIN=localhost:5173
VITE_SIWE_STATEMENT=Sign in to CSM ICS Admin Panel

# Development Configuration
VITE_DEBUG_MODE=true
```

### Environment Files
- `.env` - Local development
- `.env.production` - Production deployment
- `.env.example` - Template with documentation

## Development Notes

- Backend must be running at configured `VITE_API_BASE_URL`
- Wallet connection required for authentication with network validation
- Admin role determines access (VIEWER\REVIEWER/SUPERVISOR)
- All API responses follow OpenAPI schema in `types/api.ts`
- Multi-network support: Ethereum Mainnet and Hoodi testnet
- TailwindCSS for consistent styling with dark/light theme support
- Error handling includes automatic logout on 401/403 and network error management
- Environment variables provide TypeScript definitions in `vite-env.d.ts`
- Advanced table filtering system with configurable filters per resource
- CSV export functionality for form data
- Real-time form status updates and scoring with toast notifications
- Comprehensive form validation and rejection suggestions
- Mobile-responsive design using Tailwind CSS
- Icon-based scoring interface with visual feedback
- Toast notifications with Sonner for comprehensive user feedback
- HashRouter configuration for GitHub Pages deployment compatibility
- Custom hooks for table filtering and state management

## Deployment

### GitHub Pages
The application includes automated GitHub Pages deployment via GitHub Actions:
- Triggers on pushes to `main` branch
- Uses Node.js 24 with pnpm (via corepack) for building
- Builds the project with `pnpm build`
- Deploys to GitHub Pages using HashRouter for proper routing
- Workflow file: `.github/workflows/deploy.yml`
- Deployment artifact created from `./dist` directory

## Additional Features

- **Theme Toggle** - Dark/light mode with system preference detection
- **CSV Export** - Export form data and scores to CSV format
- **Advanced Filtering** - Filter forms by status, address, scores
- **Pagination** - Efficient data loading with page navigation
- **Real-time Updates** - Live status changes and score updates
- **Rejection Helpers** - Pre-defined rejection reasons and suggestions
- **Responsive Design** - Mobile-first approach with Tailwind CSS
- **Error Handling** - Comprehensive error states and user feedback
- **Toast Notifications** - Sonner-based toast system for user feedback
- **Tooltips** - Address and UI element tooltips for enhanced UX
- **Type Safety** - Full TypeScript coverage with strict mode
- **Performance** - Optimized with React Query caching and pagination
