/*
 * Please refer to https://docs.envio.dev for a thorough guide on all Envio indexer features
 */
import { AGnoEURe } from "generated";
import { Address, createPublicClient, http, parseAbi } from 'viem';
import { gnosis } from "viem/chains"

const client = createPublicClient({
  chain: gnosis,
  transport: http(`https://gnosis-mainnet.g.alchemy.com/v2/1fqSceu8e-9NRkK2zZmmkXWt02D0ChPX`) 
});

const AEURE_ADDRESS = '0xEdBC7449a9b594CA4E053D9737EC5Dc4CbCcBfb2';
const AEURE_ABI = parseAbi([
  'function balanceOf(address) view returns (uint256)'
]);

async function fetchOnChainBalance(wallet: Address, blockNumber: bigint) {
  return await client.readContract({
    address: AEURE_ADDRESS,
    abi: AEURE_ABI,
    functionName: 'balanceOf',
    args: [wallet],
    blockNumber
  }) as bigint;
}

// --- Helper functions ---

function getPeriodStart(timestamp: number, period: "day" | "week" | "month"): string {
  const date = new Date(timestamp * 1000);
  if (period === "day") {
    return date.toISOString().slice(0, 10); // "YYYY-MM-DD"
  }
  if (period === "week") {
    // ISO week: get Monday of the week
    const d = new Date(date);
    const day = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() - day + 1);
    return d.toISOString().slice(0, 10);
  }
  if (period === "month") {
    return date.toISOString().slice(0, 7); // "YYYY-MM"
  }
  return "";
}

async function updatePerformance(
  walletAddress: string,
  earningsDelta: bigint,
  timestamp: number,
  context: any
) {
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
}

async function applyWithdrawal(position: any, amount: bigint, now: string, blockNumber: bigint) {
  // Fetch real on-chain balance at the event's block
  const actualBalance = await fetchOnChainBalance(position.walletAddress, blockNumber);
  // Proportional principal withdrawal logic (to dissociate principal investment from earnings)
  const lastBalanceBefore = position.lastBalance;
  let principalWithdrawn = BigInt(0);
  if (lastBalanceBefore > BigInt(0) && position.depositedBalance > BigInt(0)) {
    principalWithdrawn = (position.depositedBalance * amount) / lastBalanceBefore;
    if (principalWithdrawn > position.depositedBalance) {
      principalWithdrawn = position.depositedBalance;
    }
  }
  const newDepositedBalance = position.depositedBalance - principalWithdrawn;
  return {
    ...position,
    depositedBalance: newDepositedBalance < BigInt(0) ? BigInt(0) : newDepositedBalance,
    lastBalance: actualBalance,
    updatedAt: now,
  };
}

async function applyDeposit(position: any, amount: bigint, now: string, blockNumber: bigint) {
  // Fetch real on-chain balance at the event's block
  const actualBalance = await fetchOnChainBalance(position.walletAddress, blockNumber);
  const newDepositedBalance = position.depositedBalance + amount;
  return {
    ...position,
    depositedBalance: newDepositedBalance,
    lastBalance: actualBalance,
    updatedAt: now,
  };
}

async function updateDailySnapshot(
  position: any,
  earnedWithdrawn: bigint,
  timestamp: number,
  context: any
) {
  const date = new Date(timestamp * 1000).toISOString().slice(0, 10); // "YYYY-MM-DD"
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
}

// --- Event Handlers ---

AGnoEURe.Burn.handler(async ({ event, context }) => {
  const positionId = event.params.from;
  let position = await context.Position.get(positionId);
  const now = event.block.timestamp.toString();
  if (!position) {
    // TODO: generate error (should not happen)
    position = {
      id: positionId,
      chainId: event.chainId,
      token: "aEURe",
      walletAddress: event.params.from,
      depositedBalance: BigInt(0),
      lastBalance: BigInt(0),
      createdAt: now,
      updatedAt: now,
    };
  }
  const prevEarnings = BigInt(position.lastBalance) - BigInt(position.depositedBalance);
  const blockNumber = BigInt(event.block.number);
  const updatedPosition = await applyWithdrawal(position, event.params.value, now, blockNumber);
  context.Position.set(updatedPosition);
  const earnings = BigInt(updatedPosition.lastBalance) - BigInt(updatedPosition.depositedBalance);
  const earningsDelta = earnings - prevEarnings;
  await updatePerformance(positionId, earningsDelta, event.block.timestamp, context);
  const earningsWithdrawn = prevEarnings - earnings; // earnings retirés lors du burn
  await updateDailySnapshot(updatedPosition, earningsWithdrawn, event.block.timestamp, context);
});

AGnoEURe.Mint.handler(async ({ event, context }) => {
  const positionId = event.params.onBehalfOf;
  let position = await context.Position.get(positionId);
  const now = event.block.timestamp.toString();
  if (!position) {
    position = {
      id: positionId,
      chainId: event.chainId,
      token: "aEURe",
      walletAddress: event.params.onBehalfOf,
      depositedBalance: BigInt(0),
      lastBalance: BigInt(0),
      createdAt: now,
      updatedAt: now,
    };
  }
  const prevEarnings = BigInt(position.lastBalance) - BigInt(position.depositedBalance);
  const blockNumber = BigInt(event.block.number);
  const updatedPosition = await applyDeposit(position, event.params.value, now, blockNumber);
  context.Position.set(updatedPosition);
  const earnings = BigInt(updatedPosition.lastBalance) - BigInt(updatedPosition.depositedBalance);
  const earningsDelta = earnings - prevEarnings;
  await updatePerformance(positionId, earningsDelta, event.block.timestamp, context);
  await updateDailySnapshot(updatedPosition, 0n, event.block.timestamp, context);
});

// Handle transfers: update both sender and receiver positions
AGnoEURe.Transfer.handler(async ({ event, context }) => {
  // Guard: skip if this transfer is part of a Mint (from zero address) or Burn (to zero address)
  if (
    event.params.from === "0x0000000000000000000000000000000000000000" ||
    event.params.to === "0x0000000000000000000000000000000000000000"
  ) {
    // This is a Mint or Burn, do not process as a transfer
    return;
  }
  const now = event.block.timestamp.toString();
  const amount = event.params.value;
  const blockNumber = BigInt(event.block.number);

  // --- Sender: decrease balances proportionally (like Burn) ---
  const senderId = event.params.from;
  let sender = await context.Position.get(senderId);  //name it senderPosition
  if (!sender) { 
    sender = {
      id: senderId,
      chainId: event.chainId,
      token: "aEURe",
      walletAddress: senderId,
      depositedBalance: BigInt(0),
      lastBalance: BigInt(0),
      createdAt: now,
      updatedAt: now,
    };
  }
  const senderPrevEarnings = BigInt(sender.lastBalance) - BigInt(sender.depositedBalance);
  const updatedSender = await applyWithdrawal(sender, amount, now, blockNumber);
  context.Position.set(updatedSender);
  const senderEarnings = BigInt(updatedSender.lastBalance) - BigInt(updatedSender.depositedBalance);
  const senderEarningsDelta = senderEarnings - senderPrevEarnings;
  await updatePerformance(senderId, senderEarningsDelta, event.block.timestamp, context);
  const senderEarningsWithdrawn = senderPrevEarnings - senderEarnings;
  await updateDailySnapshot(updatedSender, senderEarningsWithdrawn, event.block.timestamp, context);

  // --- Receiver: increase lastBalance, depositedBalance unchanged ---
  const receiverId = event.params.to;
  let receiver = await context.Position.get(receiverId);
  if (!receiver) {
    receiver = {
      id: receiverId,
      chainId: event.chainId,
      token: "aEURe",
      walletAddress: receiverId,
      depositedBalance: BigInt(0),
      lastBalance: BigInt(0),
      createdAt: now,
      updatedAt: now,
    };
  }
  const receiverPrevEarnings = BigInt(receiver.lastBalance) - BigInt(receiver.depositedBalance);
  // For receiver, only lastBalance increases (not a deposit)
  const updatedReceiver = {
    ...receiver,
    lastBalance: await fetchOnChainBalance( receiverId as Address, blockNumber),
     // depositedBalance unchanged // TODO : increment deposit
    updatedAt: now,
  };
  context.Position.set(updatedReceiver);
  const receiverEarnings = BigInt(updatedReceiver.lastBalance) - BigInt(updatedReceiver.depositedBalance);
  const receiverEarningsDelta = receiverEarnings - receiverPrevEarnings;
  await updatePerformance(receiverId, receiverEarningsDelta, event.block.timestamp, context);
  await updateDailySnapshot(updatedReceiver, 0n, event.block.timestamp, context);
});
//query walletAddress not positionId
//look positionPerformance performancePeriod

//earned par jour, semaine, mois
//revoir code algo pour c

//entite positionPerformance
// id le type de péride (2025-07-10)
// redirige tous les evenements d'une journée
// combien j'ai fait de gains sur une journée
// position sur 3 jours -> bucket de 3 jours 

// commencer daily à bucketiser

// call contract at block.timestamp??



// daily journée hier
// weekly 7 derniers jours glissant
// monthly 30 derniers jours




// query {
//   PositionSnapshot(
//     where: {
//       walletAddress: { _eq: "0x5fe43A5e98235EA9a80749190E02CF6A9e99Fd2E" }
//       date: { _gte: "2025-07-10" }
//     }
//     order_by: { date: asc }
//   ) {
//       id
//       positionId
//       walletAddress
//       date
//       depositedBalance
//       lastBalance
//       earnedWithdrawn
//      createdAt
//   }
// }


//   query {
//     Position_by_pk(id: "0x5fe43A5e98235EA9a80749190E02CF6A9e99Fd2E") {
//       id
//       walletAddress
//       chainId
//       token
//       depositedBalance
//       lastBalance
//       createdAt
//       updatedAt
//       db_write_timestamp
//     }
//   }



// 431573220849228825
// 863146441698457648
// 99999962846390070


// PositionPerformance(
//   where: { walletAddress: { _eq: $wallet }, period: { _eq: $period } }
//   order_by: { periodStart: desc }
// ) {
//   period
//   periodStart
//   earned
//   createdAt
//   updatedAt
// }
