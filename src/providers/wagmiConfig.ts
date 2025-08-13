import { createPublicClient, http } from "viem";
import { hoodi } from "viem/chains";
import { createConfig, mainnet } from "wagmi";
import { InjectedConnector } from "wagmi/connectors/injected";
import { MetaMaskConnector } from "wagmi/connectors/metaMask";
import { WalletConnectConnector } from "wagmi/connectors/walletConnect";

// Get required chain ID from environment
const requiredChainId = parseInt(import.meta.env.VITE_CHAIN_ID || "1");
const requiredChain = requiredChainId === 560048 ? hoodi : mainnet;

const chains = [requiredChain, mainnet, hoodi];
const publicClient = createPublicClient({
  chain: requiredChain,
  transport: http(),
});

const walletConnectProjectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;

export const config = createConfig({
  autoConnect: true,
  connectors: [
    new MetaMaskConnector({ chains }),
    new InjectedConnector({
      chains,
      options: {
        name: "Injected",
        shimDisconnect: true,
      },
    }),
    ...(walletConnectProjectId
      ? [
          new WalletConnectConnector({
            chains,
            options: {
              projectId: walletConnectProjectId,
            },
          }),
        ]
      : []),
  ],
  publicClient,
});

export { chains, requiredChain, requiredChainId };
