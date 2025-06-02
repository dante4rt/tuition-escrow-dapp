import React, { useState, useEffect, useCallback } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  usePublicClient,
  useWatchContractEvent,
} from "wagmi";
import {
  TUITION_ESCROW_ABI,
  TUITION_ESCROW_ADDRESS,
  USDC_ABI,
  USDC_ADDRESS,
} from "../lib/contracts";
import { formatUnits, decodeEventLog, type Log, type AbiEvent } from "viem";
import { CheckCircle, XCircle, RefreshCw, AlertTriangle, Inbox } from "lucide-react";
import toast from "react-hot-toast";
import { sepolia } from "viem/chains";

const typedTuitionEscrowAbi = TUITION_ESCROW_ABI;
const typedTuitionEscrowAddress = TUITION_ESCROW_ADDRESS as `0x${string}`;

interface Payment {
  paymentId: string;
  payer: string;
  university: string;
  amount: string;
  invoiceRef: string;
  status: number;
  depositTimestamp: string;
  blockNumber?: bigint;
}

export const AdminPaymentList: React.FC = () => {
  const { address: accountAddress, chain } = useAccount();
  const publicClient = usePublicClient();

  const {
    writeContractAsync,
    data: actionHash,
    error: actionWriteError,
    isPending: isActionWritePending,
  } = useWriteContract();

  const [payments, setPayments] = useState<Map<string, Payment>>(new Map());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [processingPaymentId, setProcessingPaymentId] = useState<string | null>(null);
  const [usdcDecimals, setUsdcDecimals] = useState<number>(6);

  const {
    isLoading: isActionConfirming,
    isSuccess: isActionConfirmed,
    error: actionReceiptError,
  } = useWaitForTransactionReceipt({ hash: actionHash });

  const fetchPastEventsAndDetails = useCallback(async () => {
    if (!publicClient || !typedTuitionEscrowAddress) {
      setError("Public client or contract address not available.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const eventFragment = typedTuitionEscrowAbi.find(
        (item) => item.type === "event" && item.name === "PaymentDeposited"
      );
      if (!eventFragment) throw new Error("PaymentDeposited event not found in ABI");
      const depositLogs = await publicClient.getLogs({
        address: typedTuitionEscrowAddress,
        event: eventFragment as AbiEvent,
        fromBlock: BigInt(0),
        toBlock: "latest",
      });

      const newPaymentsMap = new Map<string, Payment>();

      for (const log of depositLogs) {
        const decodedLog = decodeEventLog({
          abi: typedTuitionEscrowAbi,
          data: log.data,
          topics: log.topics,
        });

        const args = decodedLog.args as unknown as Record<string, unknown>;
        if (!args || typeof args.paymentId !== "string") continue;

        const paymentId = args.paymentId;

        const paymentDetails = (await publicClient.readContract({
          address: typedTuitionEscrowAddress,
          abi: typedTuitionEscrowAbi,
          functionName: "getPaymentDetails",
          args: [paymentId],
        })) as Record<string, unknown>;

        if (
          paymentDetails &&
          typeof paymentDetails.payer === "string" &&
          paymentDetails.payer !== "0x0000000000000000000000000000000000000000"
        ) {
          newPaymentsMap.set(paymentId, {
            paymentId: paymentId,
            payer: paymentDetails.payer,
            university: paymentDetails.university as string,
            amount: formatUnits(paymentDetails.amount as bigint, usdcDecimals),
            invoiceRef: paymentDetails.invoiceRef as string,
            status: Number(paymentDetails.status),
            depositTimestamp: new Date(
              Number(paymentDetails.depositTimestamp as bigint) * 1000
            ).toLocaleString(),
            blockNumber: log.blockNumber,
          });
        }
      }
      setPayments(newPaymentsMap);
    } catch (err: unknown) {
      let message = "Failed to fetch payment history.";
      if (err && typeof err === "object") {
        if ("message" in err && typeof (err as { message: string }).message === "string") {
          message += " " + (err as { message: string }).message;
        }
      }
      console.error("Error fetching payments:", err);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [publicClient, usdcDecimals]);

  const handleAction = async (paymentId: string, action: "releasePayment" | "refundPayment") => {
    if (!accountAddress || !typedTuitionEscrowAddress) {
      toast.error("Admin account or contract address not available.");
      return;
    }
    setProcessingPaymentId(paymentId);
    const actionText = action === "releasePayment" ? "Releasing" : "Refunding";
    toast.loading(`${actionText} payment ${paymentId.substring(0, 10)}...`, { id: "adminAction" });

    try {
      await writeContractAsync({
        address: typedTuitionEscrowAddress,
        abi: typedTuitionEscrowAbi,
        functionName: action,
        args: [paymentId],
      });
    } catch (err: unknown) {
      let message = `${actionText} failed.`;
      if (err && typeof err === "object") {
        if (
          "shortMessage" in err &&
          typeof (err as { shortMessage: string }).shortMessage === "string"
        ) {
          message = `${actionText} failed: ${(err as { shortMessage: string }).shortMessage}`;
        } else if ("message" in err && typeof (err as { message: string }).message === "string") {
          message = `${actionText} failed: ${(err as { message: string }).message.substring(
            0,
            100
          )}`;
        }
      }
      console.error(`${actionText} failed:`, err);
      toast.error(message, { id: "adminAction" });
      setProcessingPaymentId(null);
    }
  };

  const getStatusPill = (status: number) => {
    switch (status) {
      case 0:
        return (
          <span className="px-3 py-1 text-xs font-semibold text-yellow-800 bg-yellow-200 rounded-full">
            Pending
          </span>
        );
      case 1:
        return (
          <span className="px-3 py-1 text-xs font-semibold text-green-800 bg-green-200 rounded-full">
            Released
          </span>
        );
      case 2:
        return (
          <span className="px-3 py-1 text-xs font-semibold text-red-800 bg-red-200 rounded-full">
            Refunded
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 text-xs font-semibold text-gray-800 bg-gray-200 rounded-full">
            Unknown
          </span>
        );
    }
  };

  const sortedPaymentsArray = Array.from(payments.values()).sort((a, b) => {
    if (a.status === 0 && b.status !== 0) return -1;
    if (a.status !== 0 && b.status === 0) return 1;

    return Number(b.blockNumber || BigInt(0)) - Number(a.blockNumber || BigInt(0));
  });

  useWatchContractEvent({
    address: typedTuitionEscrowAddress,
    abi: typedTuitionEscrowAbi,
    eventName: "PaymentDeposited",
    onLogs() {
      toast.success("New payment deposited! Refreshing list...");
      fetchPastEventsAndDetails();
    },
    onError(error) {
      console.error("Error watching PaymentDeposited events:", error);
    },
  });

  useWatchContractEvent({
    address: typedTuitionEscrowAddress,
    abi: typedTuitionEscrowAbi,
    eventName: "PaymentReleased",
    onLogs(logs: Log[]) {
      let paymentId: string | undefined = undefined;
      if (logs.length > 0) {
        try {
          const decoded = decodeEventLog({
            abi: typedTuitionEscrowAbi,
            data: logs[0].data,
            topics: logs[0].topics,
          });
          if (
            decoded.args &&
            typeof decoded.args === "object" &&
            !Array.isArray(decoded.args) &&
            "paymentId" in decoded.args &&
            typeof (decoded.args as { paymentId: unknown }).paymentId === "string"
          ) {
            paymentId = (decoded.args as { paymentId: string }).paymentId;
          }
        } catch {
          // ignore decoding errors
        }
      }
      toast.success(
        `Payment ${
          paymentId ? paymentId.substring(0, 10) + "..." : ""
        } released! Refreshing list...`
      );
      fetchPastEventsAndDetails();
    },
    onError(error) {
      console.error("Error watching PaymentReleased events:", error);
    },
  });

  useWatchContractEvent({
    address: typedTuitionEscrowAddress,
    abi: typedTuitionEscrowAbi,
    eventName: "PaymentRefunded",
    onLogs(logs: Log[]) {
      let paymentId: string | undefined = undefined;
      if (logs.length > 0) {
        try {
          const decoded = decodeEventLog({
            abi: typedTuitionEscrowAbi,
            data: logs[0].data,
            topics: logs[0].topics,
          });
          if (
            decoded.args &&
            typeof decoded.args === "object" &&
            !Array.isArray(decoded.args) &&
            "paymentId" in decoded.args &&
            typeof (decoded.args as { paymentId: unknown }).paymentId === "string"
          ) {
            paymentId = (decoded.args as { paymentId: string }).paymentId;
          }
        } catch {
          // ignore decoding errors
        }
      }
      toast.success(
        `Payment ${
          paymentId ? paymentId.substring(0, 10) + "..." : ""
        } refunded! Refreshing list...`
      );
      fetchPastEventsAndDetails();
    },
    onError(error) {
      console.error("Error watching PaymentRefunded events:", error);
    },
  });

  useEffect(() => {
    if (isActionConfirmed) {
      toast.success(`Action confirmed successfully!`, { id: "adminAction" });
      fetchPastEventsAndDetails();
      setProcessingPaymentId(null);
    }
    if (actionReceiptError) {
      toast.error(`Action failed: ${actionReceiptError.message.substring(0, 100)}`, {
        id: "adminAction",
      });
      setProcessingPaymentId(null);
    }
  }, [isActionConfirmed, actionReceiptError, fetchPastEventsAndDetails]);

  useEffect(() => {
    if (publicClient && typedTuitionEscrowAddress) {
      fetchPastEventsAndDetails();
    }
  }, [publicClient, fetchPastEventsAndDetails]);

  useEffect(() => {
    const fetchDecimals = async () => {
      if (!publicClient || !USDC_ADDRESS) return;
      try {
        const decimals = await publicClient.readContract({
          address: USDC_ADDRESS as `0x${string}`,
          abi: USDC_ABI,
          functionName: "decimals",
        });
        if (typeof decimals === "number") {
          setUsdcDecimals(decimals);
        }
      } catch (err) {
        console.warn("Failed to fetch USDC decimals, using default.", err);
        setUsdcDecimals(6);
      }
    };

    fetchDecimals();
  }, [publicClient]);

  if (isLoading && sortedPaymentsArray.length === 0) {
    return (
      <div className="text-center py-10">
        <RefreshCw className="animate-spin h-8 w-8 mx-auto text-sky-400" />{" "}
        <p className="mt-2 text-slate-300">Loading payments...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-center">
        <AlertTriangle className="inline h-5 w-5 mr-2" /> Error: {error}
        <button
          onClick={fetchPastEventsAndDetails}
          className="ml-4 text-sky-400 hover:text-sky-300 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!isLoading && sortedPaymentsArray.length === 0) {
    return (
      <div className="text-center py-10 text-slate-400">
        <Inbox size={48} className="mx-auto mb-4" />
        <p className="text-xl">No payments found.</p>
        <p>Deposited payments will appear here.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 shadow-2xl rounded-xl overflow-hidden">
      <div className="p-4 sm:p-6 flex justify-between items-center border-b border-slate-700">
        <h3 className="text-xl font-semibold text-slate-100">
          Payment Queue ({sortedPaymentsArray.length})
        </h3>
        <button
          onClick={fetchPastEventsAndDetails}
          disabled={isLoading || isActionWritePending || isActionConfirming}
          className="p-2 rounded-md hover:bg-slate-700 transition-colors text-slate-400 hover:text-sky-300 disabled:opacity-50"
          title="Refresh payments"
        >
          <RefreshCw
            size={20}
            className={
              isLoading || isActionWritePending || isActionConfirming ? "animate-spin" : ""
            }
          />
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-700">
          <thead className="bg-slate-800/50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider"
              >
                Payment ID
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider"
              >
                Payer
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider"
              >
                University
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider"
              >
                Amount (USDC)
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider"
              >
                Invoice Ref
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider"
              >
                Status
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider"
              >
                Deposited
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-slate-800 divide-y divide-slate-700">
            {sortedPaymentsArray.map((p) => (
              <tr key={p.paymentId} className="hover:bg-slate-700/30 transition-colors">
                <td
                  className="px-6 py-4 whitespace-nowrap text-sm text-slate-300"
                  title={p.paymentId}
                >
                  {p.paymentId.substring(0, 10)}...
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300" title={p.payer}>
                  {p.payer.substring(0, 6)}...{p.payer.substring(p.payer.length - 4)}
                </td>
                <td
                  className="px-6 py-4 whitespace-nowrap text-sm text-slate-300"
                  title={p.university}
                >
                  {p.university.substring(0, 6)}...{p.university.substring(p.university.length - 4)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{p.amount}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                  {p.invoiceRef}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{getStatusPill(p.status)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                  {p.depositTimestamp}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleAction(p.paymentId, "releasePayment")}
                      disabled={
                        isActionWritePending ||
                        isActionConfirming ||
                        processingPaymentId === p.paymentId ||
                        (chain && chain.id !== sepolia.id)
                      }
                      className="text-emerald-400 hover:text-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed p-2 rounded-md hover:bg-emerald-500/10 transition-colors flex items-center"
                      title="Release Payment"
                    >
                      <CheckCircle size={18} className="mr-1" /> Release
                    </button>

                    <button
                      onClick={() => handleAction(p.paymentId, "refundPayment")}
                      disabled={
                        isActionWritePending ||
                        isActionConfirming ||
                        processingPaymentId === p.paymentId ||
                        (chain && chain.id !== sepolia.id)
                      }
                      className="text-red-400 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed p-2 rounded-md hover:bg-red-500/10 transition-colors flex items-center"
                      title="Refund Payment"
                    >
                      <XCircle size={18} className="mr-1" /> Refund
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {actionWriteError && (
        <p className="text-xs text-red-400 text-center p-4">
          Error during transaction: {actionWriteError.message.substring(0, 100)}
        </p>
      )}
      {accountAddress && chain && chain.id !== sepolia.id && (
        <p className="text-xs text-red-400 text-center p-4">
          Please switch to Sepolia network to perform admin actions.
        </p>
      )}
    </div>
  );
};
