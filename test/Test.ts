import assert from "assert";
import { 
  TestHelpers,
  AGnoEURe_Burn
} from "generated";
const { MockDb, AGnoEURe } = TestHelpers;

describe("AGnoEURe contract Burn event tests", () => {
  // Create mock db
  const mockDb = MockDb.createMockDb();

  // Creating mock for AGnoEURe contract Burn event
  const event = AGnoEURe.Burn.createMockEvent({/* It mocks event fields with default values. You can overwrite them if you need */});

  it("AGnoEURe_Burn is created correctly", async () => {
    // Processing the event
    const mockDbUpdated = await AGnoEURe.Burn.processEvent({
      event,
      mockDb,
    });

    // Getting the actual entity from the mock database
    let actualAGnoEUReBurn = mockDbUpdated.entities.AGnoEURe_Burn.get(
      `${event.chainId}_${event.block.number}_${event.logIndex}`
    );

    // Creating the expected entity
    const expectedAGnoEUReBurn: AGnoEURe_Burn = {
      id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
      from: event.params.from,
      target: event.params.target,
      value: event.params.value,
      balanceIncrease: event.params.balanceIncrease,
      index: event.params.index,
    };
    // Asserting that the entity in the mock database is the same as the expected entity
    assert.deepEqual(actualAGnoEUReBurn, expectedAGnoEUReBurn, "Actual AGnoEUReBurn should be the same as the expectedAGnoEUReBurn");
  });
});
