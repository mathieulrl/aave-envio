/*
 * Please refer to https://docs.envio.dev for a thorough guide on all Envio indexer features
 */
import {
  PolygonUSDC,
  PolygonUSDC_Burn,
  PolygonUSDC_Mint,
  PolygonUSDC_Transfer,
  AGnoEURe,
  AGnoEURe_Burn,
  AGnoEURe_Mint,
  AGnoEURe_Transfer,
  AGnoUSDC,
  AGnoUSDC_Burn,
  AGnoUSDC_Mint,
  AGnoUSDC_Transfer,
} from "generated";

PolygonUSDC.Burn.handler(async ({ event, context }) => {
  const entity: PolygonUSDC_Burn = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    burner: event.params.burner,
    amount: event.params.amount,
  };

  context.PolygonUSDC_Burn.set(entity);
});

PolygonUSDC.Mint.handler(async ({ event, context }) => {
  const entity: PolygonUSDC_Mint = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    minter: event.params.minter,
    to: event.params.to,
    amount: event.params.amount,
  };

  context.PolygonUSDC_Mint.set(entity);
});

PolygonUSDC.Transfer.handler(async ({ event, context }) => {
  const entity: PolygonUSDC_Transfer = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    from: event.params.from,
    to: event.params.to,
    value: event.params.value,
  };

  context.PolygonUSDC_Transfer.set(entity);
});

AGnoEURe.Burn.handler(async ({ event, context }) => {
  const entity: AGnoEURe_Burn = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    from: event.params.from,
    target: event.params.target,
    value: event.params.value,
    balanceIncrease: event.params.balanceIncrease,
    index: event.params.index,
  };

  context.AGnoEURe_Burn.set(entity);
});

AGnoEURe.Mint.handler(async ({ event, context }) => {
  const entity: AGnoEURe_Mint = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    caller: event.params.caller,
    onBehalfOf: event.params.onBehalfOf,
    value: event.params.value,
    balanceIncrease: event.params.balanceIncrease,
    index: event.params.index,
  };

  context.AGnoEURe_Mint.set(entity);
});

AGnoEURe.Transfer.handler(async ({ event, context }) => {
  const entity: AGnoEURe_Transfer = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    from: event.params.from,
    to: event.params.to,
    value: event.params.value,
  };

  context.AGnoEURe_Transfer.set(entity);
});

AGnoUSDC.Burn.handler(async ({ event, context }) => {
  const entity: AGnoUSDC_Burn = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    from: event.params.from,
    target: event.params.target,
    value: event.params.value,
    balanceIncrease: event.params.balanceIncrease,
    index: event.params.index,
  };

  context.AGnoUSDC_Burn.set(entity);
});

AGnoUSDC.Mint.handler(async ({ event, context }) => {
  const entity: AGnoUSDC_Mint = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    caller: event.params.caller,
    onBehalfOf: event.params.onBehalfOf,
    value: event.params.value,
    balanceIncrease: event.params.balanceIncrease,
    index: event.params.index,
  };

  context.AGnoUSDC_Mint.set(entity);
});

AGnoUSDC.Transfer.handler(async ({ event, context }) => {
  const entity: AGnoUSDC_Transfer = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    from: event.params.from,
    to: event.params.to,
    value: event.params.value,
  };

  context.AGnoUSDC_Transfer.set(entity);
});
