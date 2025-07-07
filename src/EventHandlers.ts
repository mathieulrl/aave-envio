/*
 * Please refer to https://docs.envio.dev for a thorough guide on all Envio indexer features
 */
import {
  ATokenInstance,
  ATokenInstance_Burn,
  ATokenInstance_Mint,
  ATokenInstance_Transfer,
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
