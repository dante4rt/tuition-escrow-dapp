import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ShieldCheck, Home } from "lucide-react";
import React, { useContext, useState } from "react";
import { AppAdminContext } from "../../lib/AppAdminContext";
import type { Page } from "../../App";

const CustomConnectButton = () => (
  <ConnectButton.Custom>
    {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
      const ready = mounted;
      const connected = ready && account && chain;
      const baseClasses =
        "w-full md:w-auto flex items-center justify-between gap-2 bg-slate-800 text-sky-400 hover:bg-sky-800/40 hover:text-sky-300 px-4 py-2 rounded-md text-sm font-medium border border-slate-700 transition-all duration-200 focus:ring-2 focus:ring-sky-500 cursor-pointer";

      return (
        <div className="flex w-full md:w-auto">
          {!connected ? (
            <button type="button" onClick={openConnectModal} className={baseClasses}>
              Connect Wallet
            </button>
          ) : chain.unsupported ? (
            <button
              type="button"
              onClick={openChainModal}
              className="w-full md:w-auto flex items-center justify-between gap-2 bg-red-600 text-white hover:bg-red-700 px-4 py-2 rounded-md text-sm font-medium border border-red-700 transition-all duration-200 focus:ring-2 focus:ring-red-400"
            >
              Wrong Network
            </button>
          ) : (
            <button type="button" onClick={openAccountModal} className={baseClasses}>
              <span className="truncate max-w-[120px]">{account.displayName}</span>
              {chain.hasIcon && chain.iconUrl && (
                <img
                  alt={chain.name ?? "Chain icon"}
                  src={chain.iconUrl}
                  className="w-5 h-5 rounded-full ml-1"
                />
              )}
            </button>
          )}
        </div>
      );
    }}
  </ConnectButton.Custom>
);

export const Navbar: React.FC<{ navigate: (page: Page) => void }> = ({ navigate }) => {
  const { isAdmin, isLoadingAdminStatus } = useContext(AppAdminContext);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-slate-950/80 backdrop-blur-lg border-b border-slate-800 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <span
              className="text-xl font-bold text-sky-400 cursor-pointer hover:text-sky-300 transition"
              onClick={() => navigate("home")}
            >
              TuitionEscrow
            </span>
          </div>

          <div className="hidden md:flex items-center gap-1">
            {!isLoadingAdminStatus && isAdmin && (
              <>
                <button
                  onClick={() => navigate("home")}
                  className="bg-transparent cursor-pointer text-slate-300 hover:bg-sky-800/40 hover:text-sky-300 px-4 py-2 rounded-md text-sm font-medium flex items-center transition-all duration-200"
                >
                  <Home size={18} className="mr-2" />
                  Payer Dashboard
                </button>

                <button
                  onClick={() => navigate("admin")}
                  className="bg-transparent cursor-pointer text-slate-300 hover:bg-sky-800/40 hover:text-sky-300 px-4 py-2 rounded-md text-sm font-medium flex items-center transition-all duration-200"
                >
                  <ShieldCheck size={18} className="mr-2" />
                  Admin Panel
                </button>
              </>
            )}

            <div className="ml-2">
              <CustomConnectButton />
            </div>
          </div>

          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="bg-slate-800 text-sky-400 focus:outline-none"
              aria-label="Toggle Menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden mt-2 space-y-2 pb-4">
            <button
              onClick={() => {
                navigate("home");
                setMenuOpen(false);
              }}
              className="block w-full text-left bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white px-3 py-2 text-sm font-medium rounded-md transition-colors border border-slate-700"
            >
              <Home size={18} className="inline-block mr-2" />
              Payer Dashboard
            </button>

            {!isLoadingAdminStatus && isAdmin && (
              <button
                onClick={() => {
                  navigate("admin");
                  setMenuOpen(false);
                }}
                className="block w-full text-left bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white px-3 py-2 text-sm font-medium rounded-md transition-colors border border-slate-700"
              >
                <ShieldCheck size={18} className="inline-block mr-2" />
                Admin Panel
              </button>
            )}

            <div>
              <CustomConnectButton />
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
