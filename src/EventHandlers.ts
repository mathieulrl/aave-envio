/*
 * Please refer to https://docs.envio.dev for a thorough guide on all Envio indexer features
 */
import {
  ATokenInstance,
  ATokenInstance_Burn,
  ATokenInstance_Mint,
  ATokenInstance_Transfer,
  FiatTokenV2_2,
  FiatTokenV2_2_Burn,
  FiatTokenV2_2_Mint,
  FiatTokenV2_2_Transfer,
} from "generated";

ATokenInstance.Burn.handler(async ({ event, context }) => {
  const entity: ATokenInstance_Burn = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    from: event.params.from,
    target: event.params.target,
    value: event.params.value,
    balanceIncrease: event.params.balanceIncrease,
    index: event.params.index,
  };

  context.ATokenInstance_Burn.set(entity);
});

ATokenInstance.Mint.handler(async ({ event, context }) => {
  const entity: ATokenInstance_Mint = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    caller: event.params.caller,
    onBehalfOf: event.params.onBehalfOf,
    value: event.params.value,
    balanceIncrease: event.params.balanceIncrease,
    index: event.params.index,
  };

  context.ATokenInstance_Mint.set(entity);
});

ATokenInstance.Transfer.handler(async ({ event, context }) => {
  const entity: ATokenInstance_Transfer = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    from: event.params.from,
    to: event.params.to,
    value: event.params.value,
  };

  context.ATokenInstance_Transfer.set(entity);
});

FiatTokenV2_2.Burn.handler(async ({ event, context }) => {
  const entity: FiatTokenV2_2_Burn = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    burner: event.params.burner,
    amount: event.params.amount,
  };

  context.FiatTokenV2_2_Burn.set(entity);
});

FiatTokenV2_2.Mint.handler(async ({ event, context }) => {
  const entity: FiatTokenV2_2_Mint = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    minter: event.params.minter,
    to: event.params.to,
    amount: event.params.amount,
  };

  context.FiatTokenV2_2_Mint.set(entity);
});

FiatTokenV2_2.Transfer.handler(async ({ event, context }) => {
  const entity: FiatTokenV2_2_Transfer = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    from: event.params.from,
    to: event.params.to,
    value: event.params.value,
  };

  context.FiatTokenV2_2_Transfer.set(entity);
});
