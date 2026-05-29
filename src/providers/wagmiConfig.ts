import { http } from "viem";
import { hoodi, mainnet } from "viem/chains";
import { createConfig } from "wagmi";
import { injected, metaMask, walletConnect } from "wagmi/connectors";
import { appConfig } from "../config/env";

const requiredChainId = appConfig.chainId;
const requiredChain = requiredChainId === 560048 ? hoodi : mainnet;

const chains = [requiredChain, mainnet, hoodi] as const;

const walletConnectProjectId = appConfig.walletConnectProjectId;

export const config = createConfig({
  chains,
  connectors: [
    metaMask(),
    injected({ shimDisconnect: true }),
    ...(walletConnectProjectId
      ? [walletConnect({ projectId: walletConnectProjectId })]
      : []),
  ],
  transports: {
    [mainnet.id]: http(),
    [hoodi.id]: http(),
  },
});

export { chains, requiredChain, requiredChainId };
