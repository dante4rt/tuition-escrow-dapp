import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

import "@rainbow-me/rainbowkit/styles.css";
import { getDefaultConfig, RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { sepolia } from "wagmi/chains";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";

import "./index.css";

const VITE_WALLETCONNECT_PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;

if (!VITE_WALLETCONNECT_PROJECT_ID) {
  console.warn("VITE_WALLETCONNECT_PROJECT_ID is not set. WalletConnect will not work.");
}

const config = getDefaultConfig({
  appName: "Tuition Escrow dApp",
  projectId: VITE_WALLETCONNECT_PROJECT_ID || "YOUR_PROJECT_ID",
  chains: [sepolia],
  ssr: false,
});

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: "#0ea5e9",
            accentColorForeground: "white",
            borderRadius: "medium",
            fontStack: "system",
          })}
          modalSize="compact"
        >
          <App />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
);
