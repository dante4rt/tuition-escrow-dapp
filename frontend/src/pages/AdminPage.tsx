import { useAccount } from "wagmi";
import { ShieldAlert } from "lucide-react";
import React, { useContext } from "react";
import { AdminPaymentList } from "../components/AdminPaymentList";
import { AppAdminContext } from "../App";

export const AdminPage: React.FC = () => {
  const { isConnected, address: connectedAddress } = useAccount();
  const { isAdmin, isLoadingAdminStatus } = useContext(AppAdminContext);

  if (isLoadingAdminStatus) {
    return (
      <div className="text-center py-20">
        <p className="text-xl text-slate-300">Verifying Admin Status...</p>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="text-center bg-slate-800 p-8 rounded-xl shadow-2xl max-w-md mx-auto">
        <ShieldAlert size={48} className="mx-auto text-amber-400 mb-4" />
        <h2 className="text-2xl font-semibold text-slate-100 mb-2">Admin Access Required</h2>
        <p className="text-slate-400">Please connect your wallet to access the admin panel.</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="text-center bg-slate-800 p-8 rounded-xl shadow-2xl max-w-md mx-auto">
        <ShieldAlert size={48} className="mx-auto text-red-500 mb-4" />
        <h2 className="text-2xl font-semibold text-slate-100 mb-2">Access Denied</h2>
        <p className="text-slate-400">
          You are not authorized to view this page. This panel is for administrators only.
        </p>
        <p className="text-xs text-slate-500 mt-4">Connected: {connectedAddress}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-emerald-400 sm:text-5xl">
          Admin Dashboard
        </h1>
        <p className="mt-4 text-lg leading-8 text-slate-300">
          Manage pending tuition payments. Release funds to universities or issue refunds.
        </p>
      </header>
      <AdminPaymentList />
    </div>
  );
};
