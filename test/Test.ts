import assert from "assert";
import { 
  TestHelpers,
  PolygonUSDC_Burn
} from "generated";
const { MockDb, PolygonUSDC } = TestHelpers;

describe("PolygonUSDC contract Burn event tests", () => {
  // Create mock db
  const mockDb = MockDb.createMockDb();

  // Creating mock for PolygonUSDC contract Burn event
  const event = PolygonUSDC.Burn.createMockEvent({/* It mocks event fields with default values. You can overwrite them if you need */});

  it("PolygonUSDC_Burn is created correctly", async () => {
    // Processing the event
    const mockDbUpdated = await PolygonUSDC.Burn.processEvent({
      event,
      mockDb,
    });

    // Getting the actual entity from the mock database
    let actualPolygonUSDCBurn = mockDbUpdated.entities.PolygonUSDC_Burn.get(
      `${event.chainId}_${event.block.number}_${event.logIndex}`
    );

    // Creating the expected entity
    const expectedPolygonUSDCBurn: PolygonUSDC_Burn = {
      id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
      burner: event.params.burner,
      amount: event.params.amount,
    };
    // Asserting that the entity in the mock database is the same as the expected entity
    assert.deepEqual(actualPolygonUSDCBurn, expectedPolygonUSDCBurn, "Actual PolygonUSDCBurn should be the same as the expectedPolygonUSDCBurn");
  });
});
