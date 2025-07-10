/*
 * Please refer to https://docs.envio.dev for a thorough guide on all Envio indexer features
 */
import { AGnoEURe } from "generated";

AGnoEURe.Burn.handler(async ({ event, context }) => {
  const positionId = event.params.from;
  let position = await context.Position.get(positionId);
  const now = event.block.timestamp.toString();
  if (!position) {
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
  // Proportional principal withdrawal logic (to dissociate principal investment to earnings)
  const lastBalanceBefore = position.lastBalance;
  const amount = event.params.value;
  let principalWithdrawn = BigInt(0);
  if (lastBalanceBefore > BigInt(0) && position.depositedBalance > BigInt(0)) {
    principalWithdrawn = (position.depositedBalance * amount) / lastBalanceBefore;
    if (principalWithdrawn > position.depositedBalance) {
      principalWithdrawn = position.depositedBalance;
    }
  }
  const newDepositedBalance = position.depositedBalance - principalWithdrawn;
  const newLastBalance = lastBalanceBefore - amount;
  const updatedPosition = {
    ...position,
    depositedBalance: newDepositedBalance < BigInt(0) ? BigInt(0) : newDepositedBalance,
    lastBalance: newLastBalance < BigInt(0) ? BigInt(0) : newLastBalance,
    updatedAt: now,
  };
  context.Position.set(updatedPosition);
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

  const newDepositedBalance = position.depositedBalance + event.params.value;
  const updatedPosition = {
    ...position,
    depositedBalance: newDepositedBalance,
    lastBalance: position.lastBalance + event.params.value,
    updatedAt: now,
  };
  context.Position.set(updatedPosition);
});

// Handle transfers: update both sender and receiver positions
AGnoEURe.Transfer.handler(async ({ event, context }) => {
  const now = event.block.timestamp.toString();
  const amount = event.params.value;

  // --- Sender: decrease balances proportionally (like Burn) ---
  const senderId = event.params.from;
  let sender = await context.Position.get(senderId);
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
  const senderLastBalanceBefore = sender.lastBalance;
  let senderPrincipalWithdrawn = BigInt(0);
  if (senderLastBalanceBefore > BigInt(0) && sender.depositedBalance > BigInt(0)) {
    senderPrincipalWithdrawn = (sender.depositedBalance * amount) / senderLastBalanceBefore;
    if (senderPrincipalWithdrawn > sender.depositedBalance) {
      senderPrincipalWithdrawn = sender.depositedBalance;
    }
  }
  const senderNewDepositedBalance = sender.depositedBalance - senderPrincipalWithdrawn;
  const senderNewLastBalance = senderLastBalanceBefore - amount;
  const updatedSender = {
    ...sender,
    depositedBalance: senderNewDepositedBalance < BigInt(0) ? BigInt(0) : senderNewDepositedBalance,
    lastBalance: senderNewLastBalance < BigInt(0) ? BigInt(0) : senderNewLastBalance,
    updatedAt: now,
  };
  context.Position.set(updatedSender);

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
  const updatedReceiver = {
    ...receiver,
    lastBalance: receiver.lastBalance + amount,
    // depositedBalance unchanged
    updatedAt: now,
  };
  context.Position.set(updatedReceiver);
});
