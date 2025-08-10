/// <reference types="vite/client" />

interface ImportMetaEnv {
  // API Configuration
  readonly VITE_API_BASE_URL: string;

  // Blockchain Configuration
  readonly VITE_CHAIN_ID: string;

  // WalletConnect Configuration
  readonly VITE_WALLETCONNECT_PROJECT_ID: string;

  // Application Configuration
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_VERSION: string;

  // Authentication Configuration
  readonly VITE_SIWE_DOMAIN: string;
  readonly VITE_SIWE_STATEMENT: string;

  // Development Configuration
  readonly VITE_DEBUG_MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
