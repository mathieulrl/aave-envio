/*
 * Please refer to https://docs.envio.dev for a thorough guide on all Envio indexer features
 */
import { AGnoEURe } from "generated";

// Only Position tracking remains

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
  // Proportional principal withdrawal logic
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
  // Increase balances
  const newDepositedBalance = position.depositedBalance + event.params.value;
  const updatedPosition = {
    ...position,
    depositedBalance: newDepositedBalance,
    lastBalance: position.lastBalance + event.params.value,
    updatedAt: now,
  };
  context.Position.set(updatedPosition);
});
