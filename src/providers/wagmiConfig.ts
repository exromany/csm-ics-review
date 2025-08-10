import { createConfig, mainnet } from "wagmi";
import { createPublicClient, http } from "viem";
import { MetaMaskConnector } from "wagmi/connectors/metaMask";
import { InjectedConnector } from "wagmi/connectors/injected";
import { WalletConnectConnector } from "wagmi/connectors/walletConnect";

const chains = [mainnet];
const publicClient = createPublicClient({
  chain: mainnet,
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

export { chains };
