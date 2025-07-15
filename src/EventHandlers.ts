/*
 * Please refer to https://docs.envio.dev for a thorough guide on all Envio indexer features
 */
import { AGnoEURe } from "generated";
import { Address } from 'viem';
import {
  applyWithdrawal,
  applyDeposit,
  updatePerformance,
  updateDailySnapshot,
  fetchOnChainBalance
} from './positionHelpers';

// --- Event Handlers ---

AGnoEURe.Burn.handler(async ({ event, context }) => {
  const positionId = event.params.from;
  let position = await context.Position.get(positionId);
  const now = event.block.timestamp.toString();
  if (!position) {
    //generate error (should not happen)
    console.error(`Position not found for Burn event: ${positionId}`);
    return;
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
  let senderPosition = await context.Position.get(senderId);  //name it senderPosition
  if (!senderPosition) { 
    console.error(`Sender position not found for Transfer event: ${senderId}`);
    return; 
  }
  const senderPrevEarnings = BigInt(senderPosition.lastBalance) - BigInt(senderPosition.depositedBalance);
  const updatedSender = await applyWithdrawal(senderPosition, amount, now, blockNumber);
  context.Position.set(updatedSender);
  const senderEarnings = BigInt(updatedSender.lastBalance) - BigInt(updatedSender.depositedBalance);
  const senderEarningsDelta = senderEarnings - senderPrevEarnings;
  await updatePerformance(senderId, senderEarningsDelta, event.block.timestamp, context);
  const senderEarningsWithdrawn = senderPrevEarnings - senderEarnings;
  await updateDailySnapshot(updatedSender, senderEarningsWithdrawn, event.block.timestamp, context);

  // --- Receiver ---
  const receiverId = event.params.to;
  let receiverPosition = await context.Position.get(receiverId);
  if (!receiverPosition) {
    receiverPosition = {
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
  const receiverPrevEarnings = BigInt(receiverPosition.lastBalance) - BigInt(receiverPosition.depositedBalance);
  const updatedReceiver = {
    ...receiverPosition,
    lastBalance: await fetchOnChainBalance( receiverId as Address, blockNumber),
    depositedBalance: receiverPosition.depositedBalance + amount,
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
