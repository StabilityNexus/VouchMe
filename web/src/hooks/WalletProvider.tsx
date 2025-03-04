"use client";
import React, { ReactNode, useState, useEffect } from "react";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { scrollSepolia } from "wagmi/chains";
import { publicConfig, enhancedConfig } from "@/utils/config";
import Navbar from "@/components/LandingPage/Navbar";
import "@rainbow-me/rainbowkit/styles.css";

const queryClient = new QueryClient();

const getInitialEnhancedConfig = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("useEnhancedConfig") === "true";
  }
  return false;
};

export function WalletProvider({ children }: { children: ReactNode }) {
  const [useEnhancedConfig, setUseEnhancedConfig] = useState(() =>
    getInitialEnhancedConfig()
  );

  // Effect to handle initialization
  useEffect(() => {
    const savedPreference =
      localStorage.getItem("useEnhancedConfig") === "true";
    if (savedPreference !== useEnhancedConfig) {
      setUseEnhancedConfig(savedPreference);
    }
  }, [useEnhancedConfig]);

  const toggleWalletConfig = () => {
    const newConfigState = !useEnhancedConfig;
    setUseEnhancedConfig(newConfigState);
    localStorage.setItem("useEnhancedConfig", newConfigState.toString());
  };

  // rendering with the current config
  const currentConfig = useEnhancedConfig ? enhancedConfig : publicConfig;

  return (
    <WagmiProvider config={currentConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          initialChain={scrollSepolia}
          theme={darkTheme({
            accentColor: "#4f46e5",
            accentColorForeground: "white",
            borderRadius: "medium",
            overlayBlur: "small",
          })}
        >
          {/* Navbar with Toggle Functionality */}
          <Navbar
            toggleWalletConfig={toggleWalletConfig}
            useEnhancedConfig={useEnhancedConfig}
          />
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
