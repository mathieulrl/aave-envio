import { Address, createPublicClient, http, parseAbi } from 'viem';
import { gnosis } from "viem/chains";

export const client = createPublicClient({
  chain: gnosis,
  transport: http(`https://gnosis-mainnet.infura.io/v3/0ac3659c789149a49ab7b5c69d42dcb7`)
});

export const AEURE_ADDRESS = '0xEdBC7449a9b594CA4E053D9737EC5Dc4CbCcBfb2';
export const AEURE_ABI = parseAbi([
  'function balanceOf(address) view returns (uint256)'
]);

export const fetchOnChainBalance = async (wallet: Address, blockNumber: bigint) => {
  return await client.readContract({
    address: AEURE_ADDRESS,
    abi: AEURE_ABI,
    functionName: 'balanceOf',
    args: [wallet],
    blockNumber
  }) as bigint;
};

export const applyWithdrawal = async (position: any, amount: bigint, now: string, blockNumber: bigint) => {
  const actualBalance = await fetchOnChainBalance(position.walletAddress as Address, blockNumber);

  // Defensive: avoid division by zero
  if (position.lastBalance === 0n) {
    return {
      ...position,
      depositedBalance: position.depositedBalance,
      lastBalance: actualBalance,
      updatedAt: now,
    };
  }

  // Calculate percent withdrawn (in integer math, so use 100n as denominator)
  const calculatedPercent = (amount * 100n) / BigInt(position.lastBalance);
  const percentsWithdrawn = calculatedPercent < 100n ? calculatedPercent : 100n;

  // Compute earned withdrawn
  const totalEarned = BigInt(position.lastBalance) - BigInt(position.depositedBalance);
  const earnedWithdrawn = (totalEarned * percentsWithdrawn) / 100n;

  // Compute deposited withdrawn
  const depositedWithdrawn = amount - earnedWithdrawn;
  const calculatedRemainingDeposited = BigInt(position.depositedBalance) - depositedWithdrawn;
  const remainingDeposited = calculatedRemainingDeposited < 0n ? 0n : calculatedRemainingDeposited;

  // Compute new last balance
  const calculatedNewLastBalance = BigInt(position.lastBalance) - amount;
  const newLastBalance = calculatedNewLastBalance < 0n ? 0n : calculatedNewLastBalance;

  return {
    ...position,
    depositedBalance: remainingDeposited,
    lastBalance: actualBalance, // or newLastBalance if you want to use your own calculation
    updatedAt: now,
  };
};

export const applyDeposit = async (position: any, amount: bigint, now: string, blockNumber: bigint) => {
  const actualBalance = await fetchOnChainBalance(position.walletAddress as Address, blockNumber);
  const newDepositedBalance = position.depositedBalance + amount;
  return {
    ...position,
    depositedBalance: newDepositedBalance,
    lastBalance: actualBalance,
    updatedAt: now,
  };
};

export const getPeriodStart = (timestamp: number, period: "day" | "week" | "month"): string => {
  const date = new Date(timestamp * 1000);
  if (period === "day") {
    return date.toISOString().slice(0, 10); // "YYYY-MM-DD"
  }
  if (period === "week") {
    const d = new Date(date);
    const day = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() - day + 1);
    return d.toISOString().slice(0, 10);
  }
  if (period === "month") {
    return date.toISOString().slice(0, 7); // "YYYY-MM"
  }
  return "";
};

export const updatePerformance = async (
  walletAddress: string,
  earningsDelta: bigint,
  timestamp: number,
  context: any
) => {
  const periods: ("day" | "week" | "month")[] = ["day", "week", "month"];
  for (const period of periods) {
    const periodStart = getPeriodStart(timestamp, period);
    const id = `${periodStart}:${walletAddress}:${period}`;
    let perf = await context.PositionPerformance.get(id);
    const now = new Date(timestamp * 1000).toISOString();
    if (!perf) {
      perf = {
        id,
        walletAddress,
        period,
        periodStart,
        earned: BigInt(0),
        createdAt: now,
        updatedAt: now,
      };
    }
    perf = {
      ...perf,
      earned: perf.earned + earningsDelta,
      updatedAt: now,
    };
    context.PositionPerformance.set(perf);
  }
};

export const updateDailySnapshot = async (
  position: any,
  earnedWithdrawn: bigint,
  timestamp: number,
  context: any
) => {
  const date = new Date(timestamp * 1000).toISOString().slice(0, 10);
  const id = `${date}:${position.id}`;
  let snapshot = await context.PositionSnapshot.get(id);
  const now = new Date(timestamp * 1000).toISOString();
  if (!snapshot) {
    snapshot = {
      id,
      positionId: position.id,
      walletAddress: position.walletAddress,
      date,
      depositedBalance: position.depositedBalance,
      lastBalance: position.lastBalance,
      earnedWithdrawn: earnedWithdrawn,
      createdAt: now,
    };
  } else {
    snapshot = {
      ...snapshot,
      depositedBalance: position.depositedBalance,
      lastBalance: position.lastBalance,
      earnedWithdrawn: snapshot.earnedWithdrawn + earnedWithdrawn,
    };
  }
  context.PositionSnapshot.set(snapshot);
}; 