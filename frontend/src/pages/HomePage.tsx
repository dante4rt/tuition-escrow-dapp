import { useAccount } from "wagmi";
import { DepositForm } from "../components/DepositForm";

export const HomePage: React.FC = () => {
  const { isConnected } = useAccount();

  return (
    <div className="space-y-8">
      <header className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-sky-400 sm:text-5xl">
          Secure Tuition & Donation Payments
        </h1>
        <p className="mt-4 text-lg leading-8 text-slate-300">
          Deposit USDC safely. Funds are held in escrow and released by an administrator.
        </p>
      </header>

      {isConnected ? (
        <DepositForm />
      ) : (
        <div className="text-center bg-slate-800 p-8 rounded-xl shadow-2xl">
          <h2 className="text-2xl font-semibold text-slate-100 mb-4">Connect Your Wallet</h2>
          <p className="text-slate-400 mb-6">
            Please connect your Web3 wallet to proceed with a deposit.
          </p>
        </div>
      )}
    </div>
  );
};
