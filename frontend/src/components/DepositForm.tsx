import React, { useState, useEffect } from "react";
import { ArrowRight, DollarSign, FileText, University } from "lucide-react";
import toast from "react-hot-toast";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import {
  TUITION_ESCROW_ABI,
  TUITION_ESCROW_ADDRESS,
  USDC_ABI,
  USDC_ADDRESS,
} from "../lib/contracts";
import { sepolia } from "viem/chains";

const universities = [
  {
    name: "Metropolis University",
    address: "0x6813Eb9362372EEF6200f3b1dbC3f819671cBA69" as `0x${string}`,
  },
  {
    name: "Gotham City College",
    address: "0x26330aa1a1b40224daa82d06ee1cd6788445137b" as `0x${string}`,
  },
  {
    name: "Starling City Institute",
    address: "0x501a9bc486f45f96fa0ddf8d1bc0174906477435" as `0x${string}`,
  },
];

const typedTuitionEscrowAddress = TUITION_ESCROW_ADDRESS as `0x${string}`;
const typedUsdcAddress = USDC_ADDRESS as `0x${string}`;

export const DepositForm: React.FC = () => {
  const { address: accountAddress, chain } = useAccount();
  const [usdcDecimals, setUsdcDecimals] = useState<number>(6);

  const {
    writeContractAsync,
    data: hash,
    error: writeError,
    isPending: isWritePending,
  } = useWriteContract();

  const [selectedUniversity, setSelectedUniversity] = useState<`0x${string}`>(
    universities[0]?.address || "0x"
  );

  const [amount, setAmount] = useState<string>("");
  const [invoiceRef, setInvoiceRef] = useState<string>("");
  const [currentStep, setCurrentStep] = useState<
    "idle" | "approving" | "depositing" | "waitingForTx"
  >("idle");

  const { data: fetchedUsdcDecimals } = useReadContract({
    abi: USDC_ABI,
    address: typedUsdcAddress,
    functionName: "decimals",
    query: { enabled: !!typedUsdcAddress && !!accountAddress },
  });

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: receiptError,
  } = useWaitForTransactionReceipt({ hash });

  const handleApprove = async () => {
    if (!accountAddress || !amount || !selectedUniversity) {
      toast.error("Please fill all fields and connect wallet.");
      return;
    }
    setCurrentStep("approving");
    toast.loading("Requesting USDC approval...", { id: "depositAction" });
    try {
      const amountInSmallestUnit = parseUnits(amount, usdcDecimals);
      await writeContractAsync({
        address: typedUsdcAddress,
        abi: USDC_ABI,
        functionName: "approve",
        args: [typedTuitionEscrowAddress, amountInSmallestUnit],
      });
    } catch (err: unknown) {
      let message = "Approval failed.";
      if (err && typeof err === "object") {
        if (
          "shortMessage" in err &&
          typeof (err as { shortMessage: string }).shortMessage === "string"
        ) {
          message = `Approval failed: ${(err as { shortMessage: string }).shortMessage}`;
        } else if ("message" in err && typeof (err as { message: string }).message === "string") {
          message = `Approval failed: ${(err as { message: string }).message}`;
        }
      }
      toast.error(message, { id: "depositAction" });
      setCurrentStep("idle");
    }
  };

  const handleDeposit = async () => {
    if (!accountAddress || !amount || !selectedUniversity || !invoiceRef) {
      toast.error("Missing information for deposit.");
      setCurrentStep("idle");
      return;
    }
    setCurrentStep("depositing");
    toast.loading("Depositing funds into escrow...", { id: "depositAction" });
    try {
      const amountInSmallestUnit = parseUnits(amount, usdcDecimals);
      await writeContractAsync({
        address: typedTuitionEscrowAddress,
        abi: TUITION_ESCROW_ABI,
        functionName: "depositTuition",
        args: [selectedUniversity, amountInSmallestUnit, invoiceRef],
      });
    } catch (err: unknown) {
      let message = "Deposit failed.";
      if (err && typeof err === "object") {
        if (
          "shortMessage" in err &&
          typeof (err as { shortMessage: string }).shortMessage === "string"
        ) {
          message = `Deposit failed: ${(err as { shortMessage: string }).shortMessage}`;
        } else if ("message" in err && typeof (err as { message: string }).message === "string") {
          message = `Deposit failed: ${(err as { message: string }).message}`;
        }
      }
      toast.error(message, { id: "depositAction" });
      setCurrentStep("idle");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleApprove();
  };

  const isSubmitting =
    isWritePending || isConfirming || currentStep === "approving" || currentStep === "depositing";

  useEffect(() => {
    if (fetchedUsdcDecimals) {
      setUsdcDecimals(Number(fetchedUsdcDecimals));
    }
  }, [fetchedUsdcDecimals]);

  useEffect(() => {
    if (isConfirmed) {
      toast.success(
        `Transaction confirmed! ${
          currentStep === "approving" ? "USDC Approved." : "Deposit Successful!"
        }`,
        { id: "depositAction" }
      );
      if (currentStep === "approving") {
        handleDeposit();
      } else if (currentStep === "depositing") {
        setCurrentStep("idle");
        setAmount("");
        setInvoiceRef("");
      }
    }
    if (receiptError) {
      toast.error(`Transaction failed: ${receiptError.message}`, {
        id: "depositAction",
      });
      setCurrentStep("idle");
    }
  }, [isConfirmed, receiptError, currentStep]);

  const USDCBalance: React.FC<{
    address: string;
    usdcAddress: `0x${string}`;
    usdcDecimals: number;
  }> = ({ address, usdcAddress, usdcDecimals }) => {
    const { data, isLoading, error } = useReadContract({
      abi: USDC_ABI,
      address: usdcAddress,
      functionName: "balanceOf",
      args: [address],
      query: { enabled: !!address && !!usdcAddress },
    });
    if (isLoading) return <div className="text-xs text-slate-400 mb-1">Balance: Loading...</div>;
    if (error) return <div className="text-xs text-red-400 mb-1">Balance: Error</div>;

    let formatted = "0";

    if (data) {
      const num = Number(formatUnits(data as bigint, usdcDecimals));
      formatted = num.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }

    return <div className="text-xs text-slate-400 mb-1">Balance: {formatted} USDC</div>;
  };

  const USDCBalanceButtons: React.FC<{
    usdcDecimals: number;
    usdcAddress: `0x${string}`;
    accountAddress: string;
    setAmount: (val: string) => void;
  }> = ({ usdcDecimals, usdcAddress, accountAddress, setAmount }) => {
    const { data, isLoading, error } = useReadContract({
      abi: USDC_ABI,
      address: usdcAddress,
      functionName: "balanceOf",
      args: [accountAddress],
      query: { enabled: !!accountAddress && !!usdcAddress },
    });
    if (isLoading || error || !data) return null;
    const balance = Number(formatUnits(data as bigint, usdcDecimals));
    const handleClick = (pct: number) => {
      const val = ((balance * pct) / 100).toFixed(2);
      setAmount(val);
    };
    return (
      <div className="flex gap-2 mt-2">
        {[25, 50, 75, 100].map((pct) => (
          <button
            key={pct}
            type="button"
            className="flex-1 cursor-pointer bg-slate-600 hover:bg-sky-500 text-xs text-slate-100 rounded-lg py-1 transition-colors duration-150"
            onClick={() => handleClick(pct)}
          >
            {pct}%
          </button>
        ))}
      </div>
    );
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-slate-800/80 backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-2xl space-y-6 max-w-xl mx-auto animate-fadeIn"
    >
      <h2 className="text-3xl font-bold text-center text-sky-400 tracking-tight">Make a Deposit</h2>

      <div>
        <label htmlFor="university" className="block text-sm font-semibold text-slate-300 mb-1">
          <University size={16} className="inline mr-2" /> Select University
        </label>
        <div className="relative">
          <select
            id="university"
            value={selectedUniversity}
            onChange={(e) => {
              const val = e.target.value;
              if (val && val.startsWith("0x") && val.length === 42) {
                setSelectedUniversity(val as `0x${string}`);
              }
            }}
            className="w-full bg-slate-700 border border-slate-600 text-slate-100 rounded-xl p-3 pr-10 appearance-none placeholder-slate-400 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all duration-200"
            required
            disabled={isSubmitting}
          >
            <option value="" disabled>
              -- Choose a university --
            </option>
            {universities.map((uni) => (
              <option key={uni.address} value={uni.address}>
                {uni.name} ({uni.address.slice(0, 6)}...{uni.address.slice(-4)})
              </option>
            ))}
          </select>

          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label htmlFor="amount" className="block text-sm font-semibold text-slate-300">
            <DollarSign size={16} className="inline mr-2" /> Amount (USDC)
          </label>
          {accountAddress && (
            <USDCBalance
              address={accountAddress}
              usdcAddress={typedUsdcAddress}
              usdcDecimals={usdcDecimals}
            />
          )}
        </div>
        <input
          type="number"
          id="amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="e.g., 1000"
          className="w-full bg-slate-700 border border-slate-600 text-slate-100 rounded-xl p-3 placeholder-slate-400 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all duration-200"
          min={usdcDecimals ? formatUnits(BigInt(1), usdcDecimals) : "0"}
          step="any"
          required
          disabled={isSubmitting}
        />

        {accountAddress && (
          <USDCBalanceButtons
            usdcDecimals={usdcDecimals}
            usdcAddress={typedUsdcAddress}
            accountAddress={accountAddress}
            setAmount={setAmount}
          />
        )}
      </div>

      <div>
        <label htmlFor="invoiceRef" className="block text-sm font-semibold text-slate-300 mb-1">
          <FileText size={16} className="inline mr-2" /> Invoice Reference
        </label>
        <input
          type="text"
          id="invoiceRef"
          value={invoiceRef}
          onChange={(e) => setInvoiceRef(e.target.value)}
          placeholder="e.g., INV-2024-001"
          className="w-full bg-slate-700 border border-slate-600 text-slate-100 rounded-xl p-3 placeholder-slate-400 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all duration-200"
          required
          disabled={isSubmitting}
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting || !accountAddress || !chain || chain.id !== sepolia.id}
        className="cursor-pointer w-full bg-sky-500 hover:bg-sky-600 disabled:bg-slate-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl transition-transform duration-150 ease-in-out transform hover:scale-[1.03] flex items-center justify-center gap-2 disabled:cursor-not-allowed"
      >
        {isSubmitting
          ? currentStep === "approving"
            ? "Approving..."
            : currentStep === "depositing"
            ? "Depositing..."
            : "Processing..."
          : "Approve & Deposit"}
        {!isSubmitting && <ArrowRight size={20} />}
      </button>

      {!accountAddress && (
        <p className="text-xs text-amber-400 text-center">
          Connect your wallet to enable deposits.
        </p>
      )}
      {accountAddress && chain && chain.id !== sepolia.id && (
        <p className="text-xs text-red-400 text-center">
          Please switch to Sepolia network to make a deposit.
        </p>
      )}
      {writeError && (
        <p className="text-xs text-red-400 text-center mt-2">
          Error: {writeError.message.substring(0, 100)}
        </p>
      )}
    </form>
  );
};
