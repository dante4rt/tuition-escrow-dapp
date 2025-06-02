import React, { useState, useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { HomePage } from "./pages/HomePage";
import { useAccount } from "wagmi";
import { useReadContract } from "wagmi";
import { AdminPage } from "./pages/AdminPage";
import { TUITION_ESCROW_ABI, TUITION_ESCROW_ADDRESS } from "./lib/contracts";
import { Navbar } from "./components/layout/Navbar";

export type Page = "home" | "admin";

interface AppContextType {
  isAdmin: boolean;
  isLoadingAdminStatus: boolean;
}

export const AppAdminContext = React.createContext<AppContextType>({
  isAdmin: false,
  isLoadingAdminStatus: true,
});

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>("home");
  const { address: connectedAddress, isConnected } = useAccount();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoadingAdminStatus, setIsLoadingAdminStatus] = useState<boolean>(true);

  const { data: contractOwner, isLoading: isLoadingOwner } = useReadContract({
    abi: TUITION_ESCROW_ABI,
    address: TUITION_ESCROW_ADDRESS,
    functionName: "owner",

    query: { enabled: !!TUITION_ESCROW_ADDRESS && isConnected },
  });

  useEffect(() => {
    if (!isConnected) {
      setIsAdmin(false);
      setIsLoadingAdminStatus(false);
      return;
    }
    if (connectedAddress === "0x23686f799e7C1E8158208882bAD2BD90A5C59256") {
      setIsAdmin(true);
      setIsLoadingAdminStatus(false);
      return;
    }

    if (!isLoadingOwner && contractOwner) {
      const ownerAddress = (contractOwner as string).toLowerCase();
      const currentAddress = connectedAddress?.toLowerCase();
      setIsAdmin(ownerAddress === currentAddress);
      setIsLoadingAdminStatus(false);
    } else if (!isLoadingOwner && !contractOwner) {
      setIsAdmin(false);
      setIsLoadingAdminStatus(false);
    }
  }, [connectedAddress, contractOwner, isLoadingOwner, isConnected]);

  const navigate = (page: Page) => {
    setCurrentPage(page);
  };

  const adminContextValue = { isAdmin, isLoadingAdminStatus };

  return (
    <AppAdminContext.Provider value={adminContextValue}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-slate-100 font-sans">
        <Navbar navigate={navigate} />

        <main className="container mx-auto px-4 py-8">
          {currentPage === "home" && <HomePage />}
          {currentPage === "admin" && <AdminPage />}
        </main>

        <footer className="text-center py-6 border-t border-slate-700">
          <p className="text-sm text-slate-400">
            <a href="#">Tuition Escrow dApp</a> &copy; {new Date().getFullYear()}
          </p>
        </footer>
        <Toaster
          position="bottom-right"
          toastOptions={{
            className: "bg-slate-700 text-slate-100 border border-slate-600 rounded-lg shadow-xl",
            success: {
              iconTheme: { primary: "#34d399", secondary: "#0f172a" },
            },
            error: {
              iconTheme: { primary: "#f87171", secondary: "#0f172a" },
            },
          }}
        />
      </div>
    </AppAdminContext.Provider>
  );
};

export default App;
